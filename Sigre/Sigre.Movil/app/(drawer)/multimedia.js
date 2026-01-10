import { useFocusEffect } from "@react-navigation/native";
// ✅ Importación 'legacy' para Expo FileSystem
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing"; 
import { useRouter } from "expo-router";
import { useCallback, useState, useEffect } from "react";
import JSZip from "jszip"; // 📦 LIBRERÍA ZIP

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

// Contextos y Hooks (Ajusta las rutas según tu proyecto)
import { useDatos } from "../../context/DatosContext";
import { useFeeder } from "../../hooks/useFeeder";
import { useFiles } from "../../hooks/useFiles";
import { useDeficiency } from "../../hooks/useDeficiency";

import AudioCard from "../../components/Multimedia/AudioCard";
import ModalAudio from "../../components/Multimedia/ModalAudio";
import ModalCamera from "../../components/Multimedia/ModalCamera";
import PhotoCard from "../../components/Multimedia/PhotoCard";

const PHOTO_SLOTS = ["Panorámica", "Frontal", "Izquierda", "Derecha", "Def1", "Def2"];
const APP_MEDIA_DIR = FileSystem.documentDirectory + "SigreMedios/";

export default function Multimedia() {
  // --- HOOKS ---
  const router = useRouter();
  const { selectedItem, selectedSed, selectedDeficiency } = useDatos();
  const { findFeederById } = useFeeder();
  const { saveArchivoLocal, fetchMediosByDeficienciaId } = useFiles();
  const { fetchDeficiencyByIdLocal } = useDeficiency();
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

  // --- ESTADO ---
  const [cameraModal, setCameraModal] = useState(false);
  const [audioModal, setAudioModal] = useState(false);
  const [loading, setLoading] = useState({ active: false, msg: "" });

  const [photos, setPhotos] = useState(Array(6).fill(null));
  const [audios, setAudios] = useState([]);
  const [deletedIds, setDeletedIds] = useState([]); 

  const [photoIndex, setPhotoIndex] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  // --- HELPER: Obtener Tipo y Código del Elemento ---
  const getElementoInfo = () => {
    if (selectedItem?.PostInterno) return { tipo: "Poste", codigo: selectedItem.PostCodigoNodo };
    // Verificamos varias propiedades por si acaso
    const vanoCode = selectedItem?.Vano_Codigo || selectedItem?.VanoCodigo;
    if (vanoCode) return { tipo: "Vano", codigo: vanoCode };
    
    return { tipo: "Elemento", codigo: "UNK" };
  };

  // --- INICIALIZACIÓN ---
  useEffect(() => {
    async function init() {
      const dirInfo = await FileSystem.getInfoAsync(APP_MEDIA_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(APP_MEDIA_DIR, { intermediates: true });
      }
    }
    init();
  }, []);

  // --- CARGA DE MEDIOS ---
  const loadMedios = async () => {
    if (!selectedDeficiency?.id) return;
    setLoading({ active: true, msg: "Cargando..." });
    setDeletedIds([]);

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
            audiosTmp.push({ uri: localUri, title: "Audio", id: m.ArchInterno, type: 0 });
          } else if (Number(m.ArchTipo) > 0 && Number(m.ArchTipo) <= 6) {
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
      console.error("Error cargando:", err);
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

  // --- BORRAR ---
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

  // ==========================================================
  // 📦 GENERACIÓN DE ZIP CON CARPETEO INTELIGENTE
  // ==========================================================
  const exportarFotosZip = async () => {
    const fotosValidas = photos.filter(p => p !== null);
    if (fotosValidas.length === 0) return Alert.alert("Sin fotos", "No hay fotos para exportar.");

    try {
      setLoading({ active: true, msg: "Creando estructura de carpetas..." });

      // 1. Obtener Datos para la Ruta
      // a) Alimentador
      let nombreAlimentador = "SIN_ALIM";
      if (selectedSed?.AlimInterno) {
        const feederObj = await findFeederById(selectedSed.AlimInterno);
        nombreAlimentador = feederObj?.ALIM_Etiqueta || feederObj?.alimEtiqueta || "ALIM_UNK";
      }

      // b) SED
      const codigoSed = selectedSed?.SedCodigo || "SIN_SED";

      // c) Elemento (Poste/Vano y Código)
      const { tipo, codigo } = getElementoInfo();
      const tipoCarpeta = tipo === "Vano" ? "Vano" : "Poste"; // Aseguramos nombre limpio

      // d) Deficiencia (TIPI_INTERNO o DefiInterno)
      // Usamos DefiInterno para que la carpeta sea única por reporte, o TIPI si prefieres agrupar por tipo.
      // Aquí uso DefiInterno como identificador del reporte actual.
      const codigoDeficiencia = selectedDeficiency?.DefiInterno || selectedDeficiency?.id || "DEF_UNK";

      // 2. Construir la Ruta Jerárquica
      // Pictures / Alimentador / SED / TipoElemento / CodigoElemento / CodigoDeficiencia
      const carpetaRuta = `Pictures/${nombreAlimentador}/${codigoSed}/${tipoCarpeta}/${codigo}/${codigoDeficiencia}`;

      // 3. Crear ZIP y Poblar
      const zip = new JSZip();
      const folder = zip.folder(carpetaRuta); // Crea toda la ruta interna

      setLoading({ active: true, msg: "Comprimiendo imágenes..." });

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (photo?.uri) {
          const base64 = await FileSystem.readAsStringAsync(photo.uri, { encoding: FileSystem.EncodingType.Base64 });
          // Nombre del archivo: TIPO_CODIGO_SLOT.jpg
          const nombreArchivo = `${tipo}_${codigo}_${PHOTO_SLOTS[i].replace(/\s/g, "")}.jpg`;
          
          folder.file(nombreArchivo, base64, { base64: true });
        }
      }

      // 4. Generar y Compartir
      const zipBase64 = await zip.generateAsync({ type: "base64" });
      const fileName = `Inspeccion_${codigo}_${codigoDeficiencia}.zip`;
      const zipUri = FileSystem.cacheDirectory + fileName;

      await FileSystem.writeAsStringAsync(zipUri, zipBase64, { encoding: FileSystem.EncodingType.Base64 });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(zipUri);
      } else {
        Alert.alert("Error", "No se puede compartir en este dispositivo");
      }

    } catch (error) {
      console.error("ZIP Error:", error);
      Alert.alert("Error", "Fallo al crear ZIP: " + error.message);
    } finally {
      setLoading({ active: false, msg: "" });
    }
  };

  // --- FINALIZAR (Solo Guardado Local) ---
  const finalizar = async () => {
    if (!selectedItem) return Alert.alert("Error", "No hay elemento seleccionado");

    try {
      setLoading({ active: true, msg: "Guardando..." });

      // Datos base
      const deficiencyData = await fetchDeficiencyByIdLocal(selectedDeficiency.id);
      const codTabla = deficiencyData?.DefiServerId ?? selectedDeficiency.id;
      const defiInterno = selectedDeficiency.DefiInterno || deficiencyData?.DefiInterno || 'NEW';
      const { tipo, codigo } = getElementoInfo();
      const filePrefix = `${tipo.charAt(0)}_${codigo}_DEF_${defiInterno}`;

      // Eliminar borrados
      for (const item of deletedIds) {
        await saveArchivoLocal({
          ArchInterno: item.id, ArchActivo: 0, ArchTipo: item.type, ArchCodTabla: codTabla, 
          ArchNombre: "DELETED", ArchTipoElemento: tipo === "Poste" ? "POST" : "VANO",
          ArchTabla: "Deficiencias"
        });
        try { await FileSystem.deleteAsync(item.path, { idempotent: true }); } catch (e) {}
      }

      // Guardar Fotos (Solo App Privada)
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (photo?.uri && !photo.id) {
          const fname = `${filePrefix}_IMG_${Date.now()}_${i}.jpg`;
          const destUri = APP_MEDIA_DIR + fname;
          await FileSystem.copyAsync({ from: photo.uri, to: destUri });
          await saveFileRecord({ filename: fname, slot: i + 1, isAudio: false, photoData: photo, codTablaOverride: codTabla });
        }
      }

      // Guardar Audios (Solo App Privada)
      for (let i = 0; i < audios.length; i++) {
        const audio = audios[i];
        if (audio?.uri && !audio.id) {
          const fname = `${filePrefix}_AUDIO_${Date.now()}_${i}.m4a`;
          const destUri = APP_MEDIA_DIR + fname;
          await FileSystem.copyAsync({ from: audio.uri, to: destUri });
          await saveFileRecord({ filename: fname, slot: 0, isAudio: true, codTablaOverride: codTabla });
        }
      }

      limpiarMultimedia();
      setLoading({ active: false, msg: "" });
      Alert.alert("Guardado", "Datos guardados localmente.", [{ text: "OK", onPress: () => router.replace("/inspection") }]);

    } catch (err) {
      setLoading({ active: false, msg: "" });
      Alert.alert("Error", err.message);
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
        
        {/* SECCION FOTOS + ZIP */}
        <View style={styles.section}>
          <View style={styles.headerRow}>
             <Text style={styles.title}>📸 Registro de Fotos</Text>
             {photos.some(p => p !== null) && (
                <TouchableOpacity style={styles.zipButton} onPress={exportarFotosZip}>
                  <Text style={styles.zipText}>📦 Crear ZIP Estructurado</Text>
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

        {/* SECCION AUDIOS (PRIVADOS) */}
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