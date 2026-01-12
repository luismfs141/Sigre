import { useFocusEffect } from "@react-navigation/native";
// ✅ Importación para FileSystem (Legacy/Expo)
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import JSZip from "jszip"; // 📦 LIBRERÍA PARA ZIP
import { useCallback, useEffect, useState } from "react";

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

  // Crear directorio inicial si no existe
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
  // 2. CARGA DE DATOS (LECTURA INTELIGENTE ONLINE/OFFLINE)
  // ==============================================================================
  const loadMedios = async () => {
    if (!selectedDeficiency?.id) return;
    setLoading({ active: true, msg: "Cargando..." });
    setDeletedIds([]); // Reiniciar cola de borrado al entrar

    try {
      // 1. Obtenemos la deficiencia actualizada desde la BD Local
      const deficiencia = await fetchDeficiencyByIdLocal(selectedDeficiency.id);
      
      // 2. LÓGICA DE IDENTIDAD DUAL (CRÍTICO):
      // Si DefiServerId existe y es mayor a 0, significa que ya se sincronizó -> Usamos ServerId.
      // Si no, estamos en modo Offline/Nuevo -> Usamos DefiInterno.
      const idBusqueda = (deficiencia.DefiServerId && deficiencia.DefiServerId > 0)
                         ? deficiencia.DefiServerId
                         : deficiencia.DefiInterno;

      console.log(`[Load] Buscando medios. ID Usado (ArchCodTabla): ${idBusqueda}`);

      // 3. Traemos TODOS los medios asociados a ese ID
      const medios = await fetchMediosByDeficienciaId(idBusqueda);
      
      // 4. Filtramos: Solo mostramos los que tengan ArchActivo en 1
      // (Esto evita que se muestren las fotos borradas anteriormente)
      const activos = medios.filter(m => Number(m.ArchActivo) === 1);

      const photosTmp = Array(6).fill(null);
      const audiosTmp = [];

      for (const m of activos) {
        const filename = m.ArchNombre.split("/").pop();
        const localUri = APP_MEDIA_DIR + filename;
        const fileInfo = await FileSystem.getInfoAsync(localUri);

        // Solo mostramos si el archivo físico realmente existe en el celular
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
      // Agregamos a la lista negra para procesar el Soft Delete al guardar
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
  // 4. EXPORTAR ZIP (Extraído para uso futuro)
  // ==============================================================================
  const exportarFotosZip = async () => {
    const fotosValidas = photos.filter(p => p !== null);
    if (fotosValidas.length === 0) return Alert.alert("Sin fotos", "No hay fotos para exportar.");

    try {
      setLoading({ active: true, msg: "Estructurando carpetas..." });

      let nombreAlimentador = "SIN_ALIM";
      if (selectedSed?.AlimInterno) {
        const feederObj = await findFeederById(selectedSed.AlimInterno);
        nombreAlimentador = feederObj?.ALIM_Etiqueta || feederObj?.alimEtiqueta || "ALIM_UNK";
      }
      const codigoSed = selectedSed?.SedCodigo || "SIN_SED";
      const { tipo, codigo } = getElementoInfo();
      const tipoCarpeta = tipo === "Vano" ? "Vano" : "Poste";
      
      // Intentamos usar el ID interno para el nombre de la carpeta
      const codigoDeficiencia = selectedDeficiency?.DefiInterno || selectedDeficiency?.id || "DEF_UNK";

      const carpetaRuta = `Pictures/${nombreAlimentador}/${codigoSed}/${tipoCarpeta}/${codigo}/${codigoDeficiencia}`;

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
  // 5. GUARDAR DATOS (LOGICA CORREGIDA ARCHACTIVO & IDs)
  // ==============================================================================
  const finalizar = async () => {
    if (!selectedItem) return Alert.alert("Error", "No hay elemento seleccionado");

    try {
      setLoading({ active: true, msg: "Guardando..." });

      // Obtener datos frescos de BD para determinar IDs
      const deficiencyData = await fetchDeficiencyByIdLocal(selectedDeficiency.id);
      
      if (!deficiencyData) throw new Error("No se encontró la deficiencia en BD local.");

      const { tipo, codigo } = getElementoInfo();
      // Nombre base para archivos físicos
      const filePrefix = `${tipo.charAt(0)}_${codigo}_DEF_${deficiencyData.DefiInterno}`;

      // --------------------------------------------------------------------------
      // PASO A: DETERMINAR ID DE ENLACE (Online vs Offline)
      // --------------------------------------------------------------------------
      let codTablaParaGuardar;
      if (deficiencyData.DefiServerId && deficiencyData.DefiServerId > 0) {
          codTablaParaGuardar = deficiencyData.DefiServerId; // CASO ONLINE
      } else {
          codTablaParaGuardar = deficiencyData.DefiInterno;  // CASO OFFLINE
      }

      // --------------------------------------------------------------------------
      // PASO B: PROCESAR ELIMINADOS (SOFT DELETE) - ¡CRÍTICO!
      // --------------------------------------------------------------------------
      for (const item of deletedIds) {
        console.log(`[Delete] Marcando como inactivo ID: ${item.id}`);
        
        await saveArchivoLocal({
          ArchInterno: item.id,      // ID del archivo a modificar
          
          // ESTOS DOS CAMPOS SON LA CLAVE:
          ArchActivo: 0,             // 0 explícito (Asegúrate que tu BD no lo convierta a 1)
          ArchNombre: "DELETED",     // Cambiamos nombre para confirmar que se editó
          
          EstadoOffLine: 1,          // 1 = Pendiente de Sincronizar (Update)
          
          // Mantenemos integridad referencial
          ArchCodTabla: codTablaParaGuardar,
          ArchTabla: "Deficiencias",
          ArchTipo: item.type,
          ArchTipoElemento: tipo === "Poste" ? "POST" : "VANO"
        });
      }

      // --------------------------------------------------------------------------
      // PASO C: GUARDAR FOTOS NUEVAS
      // --------------------------------------------------------------------------
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        // Solo guardamos si es nueva (no tiene ID asignado aún)
        if (photo?.uri && !photo.id) { 
          const fname = `${filePrefix}_IMG_${Date.now()}_${i}.jpg`;
          const destUri = APP_MEDIA_DIR + fname;
          
          // 1. Mover archivo a carpeta de la App
          await FileSystem.copyAsync({ from: photo.uri, to: destUri });
          
          // 2. Guardar registro en BD usando función auxiliar
          await saveFileRecord({ 
            filename: fname, 
            slot: i + 1, 
            isAudio: false, 
            photoData: photo,
            codTablaReal: codTablaParaGuardar // Pasamos el ID ya calculado
          });
        }
      }

      // --------------------------------------------------------------------------
      // PASO D: GUARDAR AUDIOS NUEVOS
      // --------------------------------------------------------------------------
      for (let i = 0; i < audios.length; i++) {
        const audio = audios[i];
        if (audio?.uri && !audio.id) {
          const fname = `${filePrefix}_AUDIO_${Date.now()}_${i}.m4a`;
          const destUri = APP_MEDIA_DIR + fname;
          
          await FileSystem.copyAsync({ from: audio.uri, to: destUri });
          
          await saveFileRecord({ 
            filename: fname, 
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
    
    // Aquí recibimos el 'codTablaReal' ya calculado en finalizar() para evitar recálculos
    // pero por seguridad, si viene null, lo recalculamos.
    let finalCodTabla = codTablaReal;
    if (!finalCodTabla) {
        const deficiencia = await fetchDeficiencyByIdLocal(selectedDeficiency.id);
        finalCodTabla = (deficiencia.DefiServerId && deficiencia.DefiServerId > 0) 
                        ? deficiencia.DefiServerId 
                        : deficiencia.DefiInterno;
    }

    console.log(photoData);
    return await saveArchivoLocal(
      {
      
      ArchInterno: null, // Null para que sea INSERT
      ArchTipo: isAudio ? 0 : (slot > 0 ? slot : 1), 
      ArchTabla: "Deficiencias", 
      
      ArchCodTabla: finalCodTabla, // <--- ID CORRECTO (SERVER O INTERNO)
      
      ArchNombre: `SigreMedios/${filename}`, 
      ArchLatitud: photoData?.latUtm ?? null, 
      ArchLongitud: photoData?.lonUtm ?? null, 
      ArchFecha: photoData?.fechaISO ?? null, 
      ArchTipoElemento: tipo.toUpperCase() === "POSTE" ? "POST" : "VANO",
      ArchIdElemento: selectedDeficiency.elementId, 
      
      ArchActivo: 1,      // Las nuevas nacen activas
      EstadoOffLine: 1    // Pendiente de Sincronizar (Insert)
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
             {/* Botón ZIP solo si hay fotos visibles */}
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