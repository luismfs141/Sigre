import { useFocusEffect } from "@react-navigation/native";
// ✅ CORRECCIÓN EXPO SDK 52+: Usamos 'legacy'
import * as FileSystem from "expo-file-system/legacy";
// ✅ NUEVO: Para guardar en Galería Pública (Reportes)
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { useCallback, useContext, useState, useEffect } from "react";
import {
  Alert,
  BackHandler,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useDatos } from "../../context/DatosContext";
import { useFeeder } from "../../hooks/useFeeder";
import { useFiles } from "../../hooks/useFiles";
import { useDeficiency } from "../../hooks/useDeficiency";

import AudioCard from "../../components/Multimedia/AudioCard";
import ModalAudio from "../../components/Multimedia/ModalAudio";
import ModalCamera from "../../components/Multimedia/ModalCamera";
import PhotoCard from "../../components/Multimedia/PhotoCard";

/* ======================
   CONSTANTES
====================== */
const PHOTO_SLOTS = [
  "Panorámica",
  "Frontal",
  "Izquierda",
  "Derecha",
  "Def1",
  "Def2",
];

// 📁 CARPETA BASE (Privada y Offline de la App)
const APP_MEDIA_DIR = FileSystem.documentDirectory + "SigreMedios/";

export default function Multimedia() {
  const { selectedItem, selectedSed, selectedDeficiency } = useDatos();
  const { findFeederById } = useFeeder();
  const { saveArchivoLocal, fetchMediosByDeficienciaId, updateArchivoState } = useFiles();
  const { fetchDeficiencyByIdLocal } = useDeficiency();
  const router = useRouter();

  // Permisos de Galería
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

  // Estados UI
  const [cameraModal, setCameraModal] = useState(false);
  const [audioModal, setAudioModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  // Datos
  const [photos, setPhotos] = useState(Array(6).fill(null));
  const [audios, setAudios] = useState([]);
  
  // 🗑️ LISTA DE ELIMINADOS
  const [deletedIds, setDeletedIds] = useState([]);

  // Preview / Indices
  const [photoIndex, setPhotoIndex] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  /* ======================
     INIT / PERMISOS
  ====================== */
  useEffect(() => {
    async function init() {
      // 1. Crear carpeta interna si no existe
      const dirInfo = await FileSystem.getInfoAsync(APP_MEDIA_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(APP_MEDIA_DIR, { intermediates: true });
      }
      
      // 2. Pedir permiso para guardar en Galería (Reportes)
      if (!permissionResponse || permissionResponse.status !== 'granted') {
        await requestPermission();
      }
    }
    init();
  }, []);

  const limpiarMultimedia = () => {
    setPhotos(Array(6).fill(null));
    setAudios([]);
    setPreviewPhoto(null);
    setPhotoIndex(null);
    setCameraModal(false);
    setAudioModal(false);
    setDeletedIds([]);
  };

  /* ======================
     LOAD MEDIOS
  ====================== */
  const loadMedios = async () => {
    if (!selectedDeficiency?.id) return;

    setLoading(true);
    setLoadingMessage("Cargando...");
    setDeletedIds([]);

    try {
      const deficiencia = await fetchDeficiencyByIdLocal(selectedDeficiency.id);
      const deficienciaId = deficiencia.DefiServerId ?? deficiencia.DefiInterno;

      // 1. Consultamos BD Local
      const medios = await fetchMediosByDeficienciaId(deficienciaId);
      const activos = medios.filter(m => Number(m.ArchActivo) === 1);

      const photosTmp = Array(6).fill(null);
      const audiosTmp = [];

      // 2. Mapeamos según ArchTipo
      for (const m of activos) {
        const filename = m.ArchNombre.split("/").pop();
        const localUri = APP_MEDIA_DIR + filename;
        const fileInfo = await FileSystem.getInfoAsync(localUri);

        if (fileInfo.exists) {
          if (Number(m.ArchTipo) === 0) { // Audio
            audiosTmp.push({
              uri: localUri,
              title: "Audio",
              id: m.ArchInterno,
              type: 0 
            });
          } else if (Number(m.ArchTipo) > 0 && Number(m.ArchTipo) <= 6) { // Foto
            photosTmp[Number(m.ArchTipo) - 1] = {
              uri: localUri,
              latUtm: m.ArchLatitud,
              lonUtm: m.ArchLongitud,
              fechaISO: m.ArchFecha,
              id: m.ArchInterno,
              originalPath: localUri,
              type: Number(m.ArchTipo) 
            };
          }
        }
      }

      setPhotos(photosTmp);
      setAudios(audiosTmp);

    } catch (err) {
      console.error("Error cargando:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      if (activo) loadMedios();
      return () => { activo = false; limpiarMultimedia(); };
    }, [selectedDeficiency?.id])
  );

  /* ======================
     ACCIONES DE ELIMINACIÓN
  ====================== */
  const handleDeletePhoto = (index) => {
    const photo = photos[index];
    if (photo?.id) {
      setDeletedIds(prev => [...prev, { 
        id: photo.id, 
        path: photo.originalPath, 
        type: photo.type 
      }]);
    }
    setPhotos(prev => {
      const copy = [...prev];
      copy[index] = null;
      return copy;
    });
  };

  const handleDeleteAudio = (index) => {
    const audio = audios[index];
    if (audio?.id) {
      setDeletedIds(prev => [...prev, { 
        id: audio.id, 
        path: audio.uri, 
        type: audio.type 
      }]);
    }
    setAudios(prev => prev.filter((_, i) => i !== index));
  };

  /* ======================
     HELPER: GUARDAR EN GALERÍA
  ====================== */
  const guardarCopiaEnGaleria = async (uriLocal) => {
    try {
      if (permissionResponse?.status !== 'granted') return;

      const asset = await MediaLibrary.createAssetAsync(uriLocal);
      const album = await MediaLibrary.getAlbumAsync("SigreMovil");
      
      if (album == null) {
        await MediaLibrary.createAlbumAsync("SigreMovil", asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
    } catch (e) {
      console.log("Error guardando en galería pública:", e);
    }
  };

  /* ======================
     FINALIZAR (CON EXPORTACIÓN A GALERÍA)
  ====================== */
  const finalizar = async () => {
    if (!selectedItem) return Alert.alert("Error", "No hay elemento seleccionado");

    try {
      setLoading(true);
      setLoadingMessage("Guardando y Exportando...");

      // 1️⃣ DATOS PADRE (Para SQL Constraints)
      const deficiencyData = await fetchDeficiencyByIdLocal(selectedDeficiency.id);
      const codTabla = deficiencyData?.DefiServerId ?? selectedDeficiency.id;
      const { tipo, codigo } = getElementoInfo(); 

      // 2️⃣ PROCESAR ELIMINADOS EN BD (Soft Delete)
      for (const item of deletedIds) {
        // Marcamos como inactivo en BD, enviando todos los campos para evitar NOT NULL
        await saveArchivoLocal({
          ArchInterno: item.id,
          ArchActivo: 0,        
          ArchTipo: item.type,   
          ArchCodTabla: codTabla, 
          
          ArchNombre: "DELETED", 
          ArchTipoElemento: tipo === "Poste" ? "POST" : "VANO",
          ArchIdElemento: selectedDeficiency.elementId ?? 0,
          ArchTabla: "Deficiencias"
        });
        // Nota: No borramos físico, para evitar conflictos y mantener backup
      }

      // Prefijo base
      const filePrefix = `${tipo.charAt(0)}_${codigo}`;

      // 3️⃣ GUARDAR FOTOS NUEVAS
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        
        if (photo?.uri && !photo.id) {
          // Generamos nombre único con Timestamp
          const timestamp = Date.now();
          const filename = `${filePrefix}_IMG_${timestamp}_${i}.jpg`;
          const destUri = APP_MEDIA_DIR + filename;

          // A) Copiar a carpeta privada (Offline App)
          await FileSystem.copyAsync({ from: photo.uri, to: destUri });

          // B) ✅ EXPORTAR A GALERÍA PÚBLICA (Para USB/Reportes)
          await guardarCopiaEnGaleria(destUri);

          // C) Guardar en BD
          await saveFileRecord({
            filename,
            relativePath: "SigreMedios",
            slot: i + 1,
            isAudio: false,
            photoData: photo,
            codTablaOverride: codTabla
          });
        }
      }

      // 4️⃣ GUARDAR AUDIOS NUEVOS
      for (let i = 0; i < audios.length; i++) {
        const audio = audios[i];
        if (audio?.uri && !audio.id) {
          const timestamp = Date.now();
          const filename = `${filePrefix}_AUDIO_${timestamp}_${i}.m4a`;
          const destUri = APP_MEDIA_DIR + filename;

          await FileSystem.copyAsync({ from: audio.uri, to: destUri });

          await saveFileRecord({
            filename,
            relativePath: "SigreMedios",
            slot: 0,
            isAudio: true,
            codTablaOverride: codTabla
          });
        }
      }

      limpiarMultimedia();
      setLoading(false);
      Alert.alert(
        "Éxito", 
        "Datos guardados. Las fotos se han exportado al álbum 'SigreMovil'.", 
        [{ text: "OK", onPress: () => router.replace("/inspection") }]
      );

    } catch (err) {
      setLoading(false);
      Alert.alert("Error", "Error guardando: " + err.message);
      console.error(err);
    }
  };

  /* ======================
     HELPERS
  ====================== */
  const saveFileRecord = async ({ filename, relativePath, slot, isAudio, photoData, codTablaOverride }) => {
    const { tipo } = getElementoInfo();
    
    let finalCodTabla = codTablaOverride;
    if (!finalCodTabla) {
        const deficiency = await fetchDeficiencyByIdLocal(selectedDeficiency.id);
        finalCodTabla = deficiency?.DefiServerId ?? selectedDeficiency.id;
    }

    const archTipoFinal = isAudio ? 0 : (slot > 0 ? slot : 1);

    return await saveArchivoLocal({
      ArchInterno: null,
      ArchTipo: archTipoFinal,
      ArchTabla: "Deficiencias",
      ArchCodTabla: finalCodTabla,
      ArchNombre: `${relativePath}/${filename}`,
      ArchLatitud: photoData?.latUtm ?? null,
      ArchLongitud: photoData?.lonUtm ?? null,
      ArchFecha: photoData?.fechaISO ?? null,
      ArchTipoElemento: tipo.toUpperCase() === "POSTE" ? "POST" : "VANO",
      ArchIdElemento: selectedDeficiency.elementId,
      TipiInterno: selectedDeficiency?.typificationId ?? null,
      ArchActivo: 1,
    });
  };

  const getElementoInfo = () => {
    if (selectedItem?.PostInterno) {
        return { tipo: "Poste", codigo: selectedItem.PostCodigoNodo };
    }
    // Lógica Vano corregida
    if (selectedItem?.Vano_Codigo || selectedItem?.VanoCodigo) {
        return { 
            tipo: "Vano", 
            codigo: selectedItem.Vano_Codigo || selectedItem.VanoCodigo 
        };
    }
    return { tipo: "Elemento", codigo: "000" };
  };

  const handleCancelar = () => {
    Alert.alert(
      "Cancelar inspección",
      "¿Estás seguro de salir? Se perderán los cambios no guardados.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, salir",
          style: "destructive",
          onPress: () => {
            limpiarMultimedia();
            router.replace("/inspection");
          }
        }
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => { handleCancelar(); return true; };
      const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => sub.remove();
    }, [])
  );

  /* ======================
     RENDER UI
  ====================== */
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* FOTOS */}
        <View style={styles.section}>
          <Text style={styles.title}>📸 Registro de Fotos</Text>
          <View style={styles.grid}>
            {PHOTO_SLOTS.map((title, index) => (
              <PhotoCard
                key={index}
                title={title}
                uri={photos[index]?.uri}
                onPress={() => {
                  if (photos[index]?.uri) setPreviewPhoto(photos[index].uri);
                  else { setPhotoIndex(index); setCameraModal(true); }
                }}
                onDelete={() => handleDeletePhoto(index)}
              />
            ))}
          </View>
        </View>

        {/* AUDIOS */}
        <View style={styles.section}>
          <View style={styles.audioHeader}>
            <Text style={styles.title}>🎙️ Registro de Audio</Text>
            <TouchableOpacity style={styles.recButton} onPress={() => setAudioModal(true)}>
               <Text style={styles.recText}>● REC</Text>
            </TouchableOpacity>
          </View>
          {audios.map((audio, index) => (
            <AudioCard
              key={index}
              title={audio.title}
              uri={audio.uri}
              onDelete={() => handleDeleteAudio(index)}
            />
          ))}
          {audios.length === 0 && <Text style={styles.emptyText}>No hay audios grabados</Text>}
        </View>

      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelar}>
            <Text style={styles.cancelButtonText}>CANCELAR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.finishButton} onPress={finalizar}>
            <Text style={styles.finishText}>FINALIZAR</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MODALES */}
      <Modal visible={!!previewPhoto} transparent>
         <View style={styles.previewContainer}>
            <Image source={{ uri: previewPhoto }} style={styles.previewImage} />
            <TouchableOpacity style={styles.closePreview} onPress={() => setPreviewPhoto(null)}>
               <Text>Cerrar</Text>
            </TouchableOpacity>
         </View>
      </Modal>

      <ModalCamera
        visible={cameraModal}
        onClose={() => setCameraModal(false)}
        onPhoto={(photo) => {
           setPhotos(prev => {
              const copy = [...prev];
              copy[photoIndex] = photo;
              return copy;
           });
        }}
      />

      <ModalAudio
        visible={audioModal}
        onClose={() => setAudioModal(false)}
        onAudioRecorded={(uri) => {
           setAudios(prev => [...prev, { uri, title: `Audio ${prev.length + 1}` }]);
        }}
      />

      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <Text style={styles.loadingText}>{loadingMessage}</Text>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F6F6F6" },
  scrollContent: { paddingHorizontal: 12, paddingBottom: 100 },
  section: { backgroundColor: "#fff", padding: 14, borderRadius: 12, marginBottom: 10 },
  title: { fontSize: 18, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  audioHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  recButton: { backgroundColor: "#DC2626", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  recText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  emptyText: { color: "#999", fontStyle: "italic", textAlign: "center", marginTop: 5 },
  footer: {
    height: 90,
    paddingHorizontal: 12,
    justifyContent: "center",
    backgroundColor: "#F6F6F6",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5"
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#EF4444",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  finishButton: {
    flex: 1,
    backgroundColor: "#16A34A",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  finishText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  previewContainer: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  previewImage: { width: "100%", height: "80%", resizeMode: "contain" },
  closePreview: { marginTop: 20, padding: 10, backgroundColor: "#fff", borderRadius: 8 },
  loadingOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  loadingBox: { backgroundColor: "#fff", padding: 20, borderRadius: 12, minWidth: 220 },
  loadingText: { fontSize: 15, fontWeight: "600", textAlign: "center" },
});