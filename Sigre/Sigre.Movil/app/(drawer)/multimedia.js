import { useFocusEffect } from "@react-navigation/native";
// ✅ Importación para FileSystem (ajustado a tu versión legacy)
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing"; 
import { useRouter } from "expo-router";
import { useCallback, useState, useEffect } from "react";
import JSZip from "jszip"; // 📦 LIBRERÍA PARA ZIP

import {
  Alert,
  BackHandler,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// --- TUS CONTEXTOS Y HOOKS ---
import { useDatos } from "../../context/DatosContext";
import { useFeeder } from "../../hooks/useFeeder";
import { useFiles } from "../../hooks/useFiles";
import { useDeficiency } from "../../hooks/useDeficiency";

// --- TUS COMPONENTES ---
import AudioCard from "../../components/Multimedia/AudioCard";
import ModalAudio from "../../components/Multimedia/ModalAudio";
import ModalCamera from "../../components/Multimedia/ModalCamera";
import PhotoCard from "../../components/Multimedia/PhotoCard";

const PHOTO_SLOTS = ["Panorámica", "Frontal", "Izquierda", "Derecha", "Def1", "Def2"];
const APP_MEDIA_DIR = FileSystem.documentDirectory + "SigreMedios/";

export default function Multimedia() {
  // ==============================================================================
  // 1. HOOKS E INICIALIZACIÓN
  // ==============================================================================
  const router = useRouter();
  const { selectedItem, selectedSed, selectedDeficiency } = useDatos();
  const { findFeederById } = useFeeder();
  const { saveArchivoLocal, fetchMediosByDeficienciaId } = useFiles();
  const { fetchDeficiencyByIdLocal } = useDeficiency();
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

  // Estados de Interfaz
  const [cameraModal, setCameraModal] = useState(false);
  const [audioModal, setAudioModal] = useState(false);
  const [loading, setLoading] = useState({ active: false, msg: "" });
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(null);

  // Estados de Datos
  const [photos, setPhotos] = useState(Array(6).fill(null));
  const [audios, setAudios] = useState([]);
  const [deletedIds, setDeletedIds] = useState([]); 

  // Crear directorio inicial
  useEffect(() => {
    async function init() {
      const dirInfo = await FileSystem.getInfoAsync(APP_MEDIA_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(APP_MEDIA_DIR, { intermediates: true });
      }
    }
    init();
  }, []);

  // ==============================================================================
  // 2. CARGA DE DATOS (READ)
  // ==============================================================================
  const loadMedios = async () => {
    if (!selectedDeficiency?.id) return;
    setLoading({ active: true, msg: "Cargando..." });
    setDeletedIds([]); // Reiniciar cola de borrado

    try {
      const deficiencia = await fetchDeficiencyByIdLocal(selectedDeficiency.id);
      const deficienciaId = deficiencia.DefiServerId ?? deficiencia.DefiInterno;

      const medios = await fetchMediosByDeficienciaId(deficienciaId);
      const activos = medios.filter(m => Number(m.ArchActivo) === 1);

      const photosTmp = Array(6).fill(null);
      const audiosTmp = [];

      for (const m of activos) {
        const filename = m.ArchNombre.split("/").pop();
        const localUri = APP_MEDIA_DIR + filename;
        const fileInfo = await FileSystem.getInfoAsync(localUri);

        if (fileInfo.exists) {
          if (Number(m.ArchTipo) === 0) {
            // Audio
            audiosTmp.push({ uri: localUri, title: "Audio", id: m.ArchInterno, type: 0 });
          } else if (Number(m.ArchTipo) > 0 && Number(m.ArchTipo) <= 6) {
            // Foto
            photosTmp[Number(m.ArchTipo) - 1] = {
              uri: localUri, latUtm: m.ArchLatitud, lonUtm: m.ArchLongitud, 
              fechaISO: m.ArchFecha, id: m.ArchInterno, originalPath: localUri, type: Number(m.ArchTipo)
            };
          }
        }
      }
      setPhotos(photosTmp);
      setAudios(audiosTmp);
    } catch (err) {
      console.error("Error cargando medios:", err);
    } finally {
      setLoading({ active: false, msg: "" });
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMedios();
      return () => limpiarMultimedia();
    }, [selectedDeficiency?.id])
  );

  // ==============================================================================
  // 3. GESTIÓN DE ESTADO (DELETE TEMPORAL)
  // ==============================================================================
  const limpiarMultimedia = () => {
    setPhotos(Array(6).fill(null));
    setAudios([]);
    setPreviewPhoto(null);
    setPhotoIndex(null);
    setCameraModal(false);
    setAudioModal(false);
    setDeletedIds([]);
    setLoading({ active: false, msg: "" });
  };

  const handleDeletePhoto = (index) => {
    const photo = photos[index];
    if (photo?.id) {
      setDeletedIds(prev => [...prev, { id: photo.id, path: photo.originalPath, type: photo.type }]);
    }
    setPhotos(prev => { const copy = [...prev]; copy[index] = null; return copy; });
  };

  const handleDeleteAudio = (index) => {
    const audio = audios[index];
    if (audio?.id) {
      setDeletedIds(prev => [...prev, { id: audio.id, path: audio.uri, type: audio.type }]);
    }
    setAudios(prev => prev.filter((_, i) => i !== index));
  };

  // Helper para saber qué elemento es (Poste o Vano)
  const getElementoInfo = () => {
    if (selectedItem?.PostInterno) return { tipo: "Poste", codigo: selectedItem.PostCodigoNodo };
    const vanoCode = selectedItem?.Vano_Codigo || selectedItem?.VanoCodigo;
    if (vanoCode) return { tipo: "Vano", codigo: vanoCode };
    return { tipo: "Elemento", codigo: "UNK" };
  };

  // ==============================================================================
  // 4. EXPORTAR ZIP CON ESTRUCTURA (REQUERIMIENTO 2 Y 3)
  // ==============================================================================
  const exportarFotosZip = async () => {
    const fotosValidas = photos.filter(p => p !== null);
    if (fotosValidas.length === 0) return Alert.alert("Sin fotos", "No hay fotos para exportar.");

    try {
      setLoading({ active: true, msg: "Estructurando carpetas..." });

      // A) Obtener Datos Jerárquicos
      let nombreAlimentador = "SIN_ALIM";
      if (selectedSed?.AlimInterno) {
        const feederObj = await findFeederById(selectedSed.AlimInterno);
        nombreAlimentador = feederObj?.ALIM_Etiqueta || feederObj?.alimEtiqueta || "ALIM_UNK";
      }
      const codigoSed = selectedSed?.SedCodigo || "SIN_SED";
      const { tipo, codigo } = getElementoInfo();
      const tipoCarpeta = tipo === "Vano" ? "Vano" : "Poste";
      const codigoDeficiencia = selectedDeficiency?.DefiInterno || selectedDeficiency?.id || "DEF_UNK";

      // B) Crear ruta: Pictures / Alim / Sed / Tipo / Elemento / Deficiencia
      const carpetaRuta = `Pictures/${nombreAlimentador}/${codigoSed}/${tipoCarpeta}/${codigo}/${codigoDeficiencia}`;

      // C) Generar ZIP
      const zip = new JSZip();
      const folder = zip.folder(carpetaRuta);

      setLoading({ active: true, msg: "Comprimiendo imágenes..." });

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (photo?.uri) {
          const base64 = await FileSystem.readAsStringAsync(photo.uri, { encoding: FileSystem.EncodingType.Base64 });
          const nombreArchivo = `${tipo}_${codigo}_${PHOTO_SLOTS[i].replace(/\s/g, "")}.jpg`;
          folder.file(nombreArchivo, base64, { base64: true });
        }
      }

      // D) Guardar y Compartir
      const zipBase64 = await zip.generateAsync({ type: "base64" });
      const fileName = `Evidencia_${codigo}_${codigoDeficiencia}.zip`;
      const zipUri = FileSystem.cacheDirectory + fileName;

      await FileSystem.writeAsStringAsync(zipUri, zipBase64, { encoding: FileSystem.EncodingType.Base64 });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(zipUri);
      } else {
        Alert.alert("Error", "Compartir no disponible");
      }

    } catch (error) {
      console.error("ZIP Error:", error);
      Alert.alert("Error", "Fallo al crear ZIP: " + error.message);
    } finally {
      setLoading({ active: false, msg: "" });
    }
  };

  // ==============================================================================
  // 5. GUARDAR DATOS (FINALIZAR + REQUERIMIENTO 4 SOFT DELETE)
  // ==============================================================================
  const finalizar = async () => {
    if (!selectedItem) return Alert.alert("Error", "No hay elemento seleccionado");

    try {
      setLoading({ active: true, msg: "Guardando..." });

      // Contexto base
      const deficiencyData = await fetchDeficiencyByIdLocal(selectedDeficiency.id);
      const codTabla = deficiencyData?.DefiServerId ?? selectedDeficiency.id;
      const defiInterno = selectedDeficiency.DefiInterno || deficiencyData?.DefiInterno || 'NEW';
      const { tipo, codigo } = getElementoInfo();
      const filePrefix = `${tipo.charAt(0)}_${codigo}_DEF_${defiInterno}`;

      // --- [SOFT DELETE] ---
      // Marcamos como inactivo en BD y ponemos nombre DELETED
      for (const item of deletedIds) {
        await saveArchivoLocal({
          ArchInterno: item.id,
          ArchActivo: 0,             // <--- Desactivar
          ArchNombre: "DELETED",     // <--- Renombrar
          
          // Datos obligatorios para integridad
          ArchTipo: item.type,
          ArchCodTabla: codTabla,
          ArchTipoElemento: tipo === "Poste" ? "POST" : "VANO",
          ArchTabla: "Deficiencias"
        });

        // Borrado físico local (opcional, para liberar espacio)
        try { await FileSystem.deleteAsync(item.path, { idempotent: true }); } catch (e) {}
      }

      // --- [GUARDAR FOTOS] (Privado) ---
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (photo?.uri && !photo.id) { // Solo nuevas
          const fname = `${filePrefix}_IMG_${Date.now()}_${i}.jpg`;
          const destUri = APP_MEDIA_DIR + fname;
          
          await FileSystem.copyAsync({ from: photo.uri, to: destUri });
          
          await saveFileRecord({ 
            filename: fname, slot: i + 1, isAudio: false, photoData: photo, codTablaOverride: codTabla 
          });
        }
      }

      // --- [GUARDAR AUDIOS] (Privado - Req 1) ---
      for (let i = 0; i < audios.length; i++) {
        const audio = audios[i];
        if (audio?.uri && !audio.id) { // Solo nuevos
          const fname = `${filePrefix}_AUDIO_${Date.now()}_${i}.m4a`;
          const destUri = APP_MEDIA_DIR + fname;
          
          await FileSystem.copyAsync({ from: audio.uri, to: destUri });
          
          await saveFileRecord({ 
            filename: fname, slot: 0, isAudio: true, codTablaOverride: codTabla 
          });
        }
      }

      limpiarMultimedia();
      setLoading({ active: false, msg: "" });
      Alert.alert("Guardado", "Datos guardados correctamente.", [{ text: "OK", onPress: () => router.replace("/inspection") }]);

    } catch (err) {
      setLoading({ active: false, msg: "" });
      Alert.alert("Error", err.message);
      console.error(err);
    }
  };

  const saveFileRecord = async ({ filename, slot, isAudio, photoData, codTablaOverride }) => {
    const { tipo } = getElementoInfo();
    let finalCodTabla = codTablaOverride ?? (await fetchDeficiencyByIdLocal(selectedDeficiency.id))?.DefiServerId ?? selectedDeficiency.id;
    return await saveArchivoLocal({
      ArchInterno: null, ArchTipo: isAudio ? 0 : (slot > 0 ? slot : 1), ArchTabla: "Deficiencias", ArchCodTabla: finalCodTabla,
      ArchNombre: `SigreMedios/${filename}`, ArchLatitud: photoData?.latUtm ?? null, ArchLongitud: photoData?.lonUtm ?? null, 
      ArchFecha: photoData?.fechaISO ?? null, ArchTipoElemento: tipo.toUpperCase() === "POSTE" ? "POST" : "VANO",
      ArchIdElemento: selectedDeficiency.elementId, ArchActivo: 1,
    });
  };

  // ==============================================================================
  // 6. RENDERIZADO (UI)
  // ==============================================================================
  const handleCancelar = () => {
    Alert.alert("Cancelar", "¿Salir sin guardar?", [
      { text: "No", style: "cancel" },
      { text: "Sí", style: "destructive", onPress: () => { limpiarMultimedia(); router.replace("/inspection"); } }
    ]);
  };

  useFocusEffect(useCallback(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => { handleCancelar(); return true; });
    return () => sub.remove();
  }, []));

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* FOTOS + BOTÓN ZIP */}
        <View style={styles.section}>
          <View style={styles.headerRow}>
             <Text style={styles.title}>📸 Registro de Fotos</Text>
             {/* El botón solo aparece si hay fotos */}
             {photos.some(p => p !== null) && (
                <TouchableOpacity style={styles.zipButton} onPress={exportarFotosZip}>
                  <Text style={styles.zipText}>📦 Exportar ZIP</Text>
                </TouchableOpacity>
             )}
          </View>
          <View style={styles.grid}>
            {PHOTO_SLOTS.map((title, index) => (
              <PhotoCard
                key={index} title={title} uri={photos[index]?.uri}
                onPress={() => photos[index]?.uri ? setPreviewPhoto(photos[index].uri) : (setPhotoIndex(index), setCameraModal(true))}
                onDelete={() => handleDeletePhoto(index)}
              />
            ))}
          </View>
        </View>

        {/* AUDIOS (SOLO PRIVADO, SIN EXPORTAR) */}
        <View style={styles.section}>
          <View style={styles.audioHeader}>
            <Text style={styles.title}>🎙️ Registro de Audio</Text>
            <TouchableOpacity style={styles.recButton} onPress={() => setAudioModal(true)}>
               <Text style={styles.recText}>● REC</Text>
            </TouchableOpacity>
          </View>
          {audios.map((audio, index) => (
            <View key={index} style={{ marginBottom: 8 }}>
              <AudioCard title={audio.title} uri={audio.uri} onDelete={() => handleDeleteAudio(index)} />
            </View>
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
      <ModalCamera visible={cameraModal} onClose={() => setCameraModal(false)}
        onPhoto={(p) => setPhotos(prev => { const c = [...prev]; c[photoIndex] = p; return c; })}
      />
      <ModalAudio visible={audioModal} onClose={() => setAudioModal(false)}
        onAudioRecorded={(u) => setAudios(prev => [...prev, { uri: u, title: `Nota ${prev.length + 1}` }])}
      />
      
      <Modal visible={!!previewPhoto} transparent>
         <View style={styles.previewContainer}>
            <Image source={{ uri: previewPhoto }} style={styles.previewImage} />
            <TouchableOpacity style={styles.closePreview} onPress={() => setPreviewPhoto(null)}>
               <Text style={{fontWeight: 'bold'}}>Cerrar</Text>
            </TouchableOpacity>
         </View>
      </Modal>

      <Modal visible={loading.active} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#16A34A" />
            <Text style={styles.loadingText}>{loading.msg}</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ==============================================================================
// 7. ESTILOS
// ==============================================================================
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F6F6F6" },
  scrollContent: { paddingHorizontal: 12, paddingBottom: 100 },
  section: { backgroundColor: "#fff", padding: 14, borderRadius: 12, marginBottom: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 18, fontWeight: "600" },
  
  // Botón ZIP
  zipButton: { backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  zipText: { color: 'white', fontWeight: 'bold', fontSize: 12 },

  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  
  audioHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  recButton: { backgroundColor: "#DC2626", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  recText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  emptyText: { color: "#999", fontStyle: "italic", textAlign: "center", marginTop: 5 },
  
  footer: { height: 90, paddingHorizontal: 12, justifyContent: "center", backgroundColor: "#F6F6F6", borderTopWidth: 1, borderTopColor: "#e5e5e5" },
  footerRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  cancelButton: { flex: 1, backgroundColor: "#EF4444", paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  cancelButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  finishButton: { flex: 1, backgroundColor: "#16A34A", paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  finishText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  
  previewContainer: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  previewImage: { width: "100%", height: "80%", resizeMode: "contain" },
  closePreview: { marginTop: 20, padding: 10, backgroundColor: "#fff", borderRadius: 8 },
  
  loadingOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  loadingBox: { backgroundColor: "#fff", padding: 20, borderRadius: 12, minWidth: 220, alignItems: 'center' },
  loadingText: { fontSize: 15, fontWeight: "600", textAlign: "center", marginTop: 10 },
});