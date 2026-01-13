import { useFocusEffect } from "@react-navigation/native";
// ✅ Importación para FileSystem (Legacy/Expo)
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import JSZip from "jszip"; // 📦 LIBRERÍA PARA ZIP
import { useCallback, useState } from "react";

import {
  ActivityIndicator,
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

// --- TUS CONTEXTOS Y HOOKS ---
import { useDatos } from "../../context/DatosContext";
import { useDeficiency } from "../../hooks/useDeficiency";
import { useFeeder } from "../../hooks/useFeeder";
import { useFiles } from "../../hooks/useFiles";

// --- TUS COMPONENTES ---
import AudioCard from "../../components/Multimedia/AudioCard";
import ModalAudio from "../../components/Multimedia/ModalAudio";
import ModalCamera from "../../components/Multimedia/ModalCamera";
import PhotoCard from "../../components/Multimedia/PhotoCard";

const PHOTO_SLOTS = ["Panorámica", "Frontal", "Izquierda", "Derecha", "Def1", "Def2"];

// ==============================================================================
// HELPERS PARA RUTAS Y CARPETAS
// ==============================================================================
const ensureDirExists = async (dir) => {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
};

const buildMediaPath = (
  nombreAlimentador,
  codigoSed,
  tipoCarpeta,
  codigo,
  codigoDeficiencia
) => {
  return (
    FileSystem.documentDirectory +
    `SigreMovil/${nombreAlimentador}/${codigoSed}/${tipoCarpeta}/${codigo}/${codigoDeficiencia}/`
  );
};

export default function Multimedia() {
  // ==============================================================================
  // 1. HOOKS E INICIALIZACIÓN
  // ==============================================================================
  const router = useRouter();
  const { selectedItem, selectedSed, selectedDeficiency } = useDatos();
  const { findFeederById } = useFeeder();
  const { saveArchivoLocal, fetchMediosByDeficienciaId } = useFiles();
  const { fetchDeficiencyByIdLocal } = useDeficiency();
  
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

  // ==============================================================================
  // 2. CARGA DE DATOS (LECTURA INTELIGENTE ONLINE/OFFLINE)
  // ==============================================================================
  const loadMedios = async () => {
    if (!selectedDeficiency?.id) return;
    setLoading({ active: true, msg: "Cargando..." });
    setDeletedIds([]); // Reiniciar cola de borrado al entrar

    try {
      const deficiencia = await fetchDeficiencyByIdLocal(selectedDeficiency.id);
      
      const idBusqueda = (deficiencia.DefiServerId && deficiencia.DefiServerId > 0)
                         ? deficiencia.DefiServerId
                         : deficiencia.DefiInterno;

      const medios = await fetchMediosByDeficienciaId(idBusqueda);
      const activos = medios.filter(m => Number(m.ArchActivo) === 1);

      const photosTmp = Array(6).fill(null);
      const audiosTmp = [];

      for (const m of activos) {
        // Ahora ArchNombre guarda: SigreMovil/.../archivo.jpg
        const localUri = FileSystem.documentDirectory + m.ArchNombre;
        const fileInfo = await FileSystem.getInfoAsync(localUri);

        if (fileInfo.exists) {
          if (Number(m.ArchTipo) === 0) {
            audiosTmp.push({ uri: localUri, title: "Audio", id: m.ArchInterno, type: 0 });
          } else if (Number(m.ArchTipo) > 0 && Number(m.ArchTipo) <= 6) {
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
  // 3. GESTIÓN DE ESTADO (UI)
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

  const getElementoInfo = () => {
    if (selectedItem?.PostInterno) return { tipo: "Poste", codigo: selectedItem.PostCodigoNodo };
    const vanoCode = selectedItem?.Vano_Codigo || selectedItem?.VanoCodigo;
    if (vanoCode) return { tipo: "Vano", codigo: vanoCode };
    return { tipo: "Elemento", codigo: "UNK" };
  };

  // ==============================================================================
  // 4. EXPORTAR ZIP
  // ==============================================================================
  const exportarFotosZip = async () => {
    const fotosValidas = photos.filter(p => p !== null);
    if (fotosValidas.length === 0) return Alert.alert("Sin fotos", "No hay fotos para exportar.");

    try {
      const feeder = await findFeederById(selectedItem.AlimInterno);
      setLoading({ active: true, msg: "Estructurando carpetas..." });

      let nombreAlimentador = feeder.alimEtiqueta;
      let codigoSed = selectedSed?.SedCodigo;
      const { tipo, codigo } = getElementoInfo();
      const tipoCarpeta = tipo === "Vano" ? "Vano" : "Poste";
      const codigoDeficiencia = selectedDeficiency?.typificationCode;

      const carpetaRuta = `SigreMovil/${nombreAlimentador}/${codigoSed}/${tipoCarpeta}/${codigo}/${codigoDeficiencia}`;

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
  // 5. GUARDAR DATOS
  // ==============================================================================
  const finalizar = async () => {
    if (!selectedItem) return Alert.alert("Error", "No hay elemento seleccionado");

    try {
      setLoading({ active: true, msg: "Guardando..." });

      const deficiencyData = await fetchDeficiencyByIdLocal(selectedDeficiency.id);
      if (!deficiencyData) throw new Error("No se encontró la deficiencia en BD local.");

      const { tipo, codigo } = getElementoInfo();

      let codTablaParaGuardar;
      if (deficiencyData.DefiServerId && deficiencyData.DefiServerId > 0) {
          codTablaParaGuardar = deficiencyData.DefiServerId;
      } else {
          codTablaParaGuardar = deficiencyData.DefiInterno;
      }

      // --------------------------------------------------------------------------
      // BORRADOS (SOFT DELETE)
      // --------------------------------------------------------------------------
      for (const item of deletedIds) {
        await saveArchivoLocal({
          ArchInterno: item.id,
          ArchActivo: 0,
          ArchNombre: "DELETED",
          EstadoOffLine: 1,
          ArchCodTabla: codTablaParaGuardar,
          ArchTabla: "Deficiencias",
          ArchTipo: item.type,
          ArchTipoElemento: tipo === "Poste" ? "POST" : "VANO"
        });
      }

      // --------------------------------------------------------------------------
      // DATOS PARA ESTRUCTURA
      // --------------------------------------------------------------------------
      const feeder = await findFeederById(selectedItem.AlimInterno);
      let nombreAlimentador = feeder.alimEtiqueta;
      let codigoSed = selectedSed?.SedCodigo;
      const tipoCarpeta = tipo === "Vano" ? "Vano" : "Poste";
      const codigoDeficiencia = selectedDeficiency?.typificationCode;

      const carpetaBase = buildMediaPath(
        nombreAlimentador,
        codigoSed,
        tipoCarpeta,
        codigo,
        codigoDeficiencia
      );

      await ensureDirExists(carpetaBase);

      // --------------------------------------------------------------------------
      // GUARDAR FOTOS
      // --------------------------------------------------------------------------
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (photo?.uri && !photo.id) {
          const fname = `${tipo}_${codigo}_${PHOTO_SLOTS[i].replace(/\s/g, "")}.jpg`;
          const destUri = carpetaBase + fname;

          await FileSystem.copyAsync({ from: photo.uri, to: destUri });

          const relativePath = `SigreMovil/${nombreAlimentador}/${codigoSed}/${tipoCarpeta}/${codigo}/${codigoDeficiencia}/${fname}`;

          await saveFileRecord({ 
            filename: relativePath, 
            slot: i + 1, 
            isAudio: false, 
            photoData: photo,
            codTablaReal: codTablaParaGuardar
          });
        }
      }

      // --------------------------------------------------------------------------
      // GUARDAR AUDIOS
      // --------------------------------------------------------------------------
      for (let i = 0; i < audios.length; i++) {
        const audio = audios[i];
        if (audio?.uri && !audio.id) {
          const fname = `${tipo}_${codigo}_AUDIO_${Date.now()}_${i}.m4a`;
          const destUri = carpetaBase + fname;

          await FileSystem.copyAsync({ from: audio.uri, to: destUri });

          const relativePath = `SigreMovil/${nombreAlimentador}/${codigoSed}/${tipoCarpeta}/${codigo}/${codigoDeficiencia}/${fname}`;

          await saveFileRecord({ 
            filename: relativePath, 
            slot: 0, 
            isAudio: true,
            codTablaReal: codTablaParaGuardar 
          });
        }
      }

      limpiarMultimedia();
      setLoading({ active: false, msg: "" });
      Alert.alert("Éxito", "Cambios guardados correctamente.", [{ text: "OK", onPress: () => router.replace("/inspection") }]);

    } catch (err) {
      setLoading({ active: false, msg: "" });
      Alert.alert("Error", err.message);
      console.error(err);
    }
  };

  // --- FUNCIÓN HELPER PARA INSERCIONES ---
  const saveFileRecord = async ({ filename, slot, isAudio, photoData, codTablaReal }) => {
    const { tipo } = getElementoInfo();
    
    let finalCodTabla = codTablaReal;
    if (!finalCodTabla) {
        const deficiencia = await fetchDeficiencyByIdLocal(selectedDeficiency.id);
        finalCodTabla = (deficiencia.DefiServerId && deficiencia.DefiServerId > 0) 
                        ? deficiencia.DefiServerId 
                        : deficiencia.DefiInterno;
    }

    return await saveArchivoLocal({
      ArchInterno: null,
      ArchTipo: isAudio ? 0 : (slot > 0 ? slot : 1), 
      ArchTabla: "Deficiencias", 
      ArchCodTabla: finalCodTabla,
      ArchNombre: filename, // ← ahora guardamos la ruta completa
      ArchLatitud: photoData?.latUtm ?? null, 
      ArchLongitud: photoData?.lonUtm ?? null, 
      ArchFecha: photoData?.fechaISO ?? null, 
      ArchTipoElemento: tipo.toUpperCase() === "POSTE" ? "POST" : "VANO",
      ArchIdElemento: selectedDeficiency.elementId, 
      ArchActivo: 1,
      EstadoOffLine: 1,
      TipiInterno: selectedDeficiency.typificationId,
    });
  };

  // ==============================================================================
  // 6. RENDER (UI)
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
        {/* SECCIÓN FOTOS */}
        <View style={styles.section}>
          <View style={styles.headerRow}>
             <Text style={styles.title}>📸 Registro de Fotos</Text>
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

        {/* SECCIÓN AUDIOS */}
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F6F6F6" },
  scrollContent: { paddingHorizontal: 12, paddingBottom: 100 },
  section: { backgroundColor: "#fff", padding: 14, borderRadius: 12, marginBottom: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 18, fontWeight: "600" },
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
