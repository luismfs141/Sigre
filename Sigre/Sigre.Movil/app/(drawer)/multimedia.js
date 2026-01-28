import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, Alert, BackHandler, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// ✅ Importación para FileSystem (Legacy/Expo)
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import JSZip from "jszip";
import { useCallback, useEffect, useRef, useState } from "react";

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

import ViewShot from "react-native-view-shot";
import PhotoModal from "../../components/Modal/PhotoModal";

const PHOTO_SLOTS = ["Panorámica", "Frontal", "Izquierda", "Derecha", "Medidor", "Adicional"];

const PLACEHOLDER_PREFIX = "__PLACEHOLDER__";
const PLACEHOLDER_DIR = FileSystem.documentDirectory + "SIGRE.MOVIL/__PLACEHOLDERS__/";

// Nombre consistente para identificar placeholders (solo admin)
const buildPlaceholderFileName = (archRow) => {
  const id = archRow?.ArchInterno ?? "0";
  const tipo = archRow?.ArchTipo ?? "0";
  return `${PLACEHOLDER_PREFIX}ARCH_${id}_T${tipo}.jpg`;
};

const buildPlaceholderTargetUri = (archRow) => PLACEHOLDER_DIR + buildPlaceholderFileName(archRow);

// Texto a imprimir dentro del placeholder (se captura como imagen)
const buildPlaceholderLines = (archRow) => {
  if (!archRow) return [];
  // Orden sugerido (si la key no existe, se omite)
  const preferred = [
    "ArchInterno","ArchServerId","ArchTabla","ArchCodTabla","ArchTipo","ArchNombre",
    "ArchActivo","ArchPeso","ArchFech","ArchFecha","ArchLatitud","ArchLongitud",
    "ArchTipoElemento","ArchIdElemento","TipiInterno","EstadoOffLine"
  ];

  const lines = [];
  for (const k of preferred) {
    if (archRow[k] !== undefined) lines.push(`${k}: ${String(archRow[k])}`);
  }

  // Resto de campos (para asegurar "todos los campos")
  const used = new Set(preferred);
  for (const k of Object.keys(archRow)) {
    if (used.has(k)) continue;
    const v = archRow[k];
    if (v === undefined) continue;
    lines.push(`${k}: ${String(v)}`);
  }
  return lines;
};


// ==============================================================================
// HELPERS GLOBALES Y SANITIZACIÓN
// ==============================================================================

const safeSeg = (value, fallback = "UNK") => {
  const s = String(value ?? "").trim();
  const cleaned = s
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[\\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "")
    .trim();

  const out = cleaned.length ? cleaned : fallback;
  return out.toUpperCase().slice(0, 60);

};

const ensureDirExists = async (dir) => {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
};


// ==============================================================================
// HELPERS PARA EXPORTAR A GALERÍA PÚBLICA (SAF - ANDROID 10+)
// ==============================================================================
const SAF = FileSystem.StorageAccessFramework;
const KEY_PICTURES_DIR = "SIGRE_SAF_PICTURES_DIR";
const KEY_MUSIC_DIR = "SIGRE_SAF_MUSIC_DIR";

const safDisplayName = (uri) => {
  try {
    const dec = decodeURIComponent(uri);
    const afterDocument = dec.includes("/document/") ? dec.split("/document/")[1] : dec;
    const path = afterDocument.includes(":") ? afterDocument.split(":").slice(1).join(":") : afterDocument;
    const parts = path.split("/");
    return parts[parts.length - 1];
  } catch (e) {
    return "";
  }
};

const getOrRequestPublicDir = async (rootFolderName, storageKey) => {
  if (Platform.OS !== "android") return null;
  const saved = await AsyncStorage.getItem(storageKey);
  if (saved) return saved;

  try {
    const initialUri = SAF.getUriForDirectoryInRoot(rootFolderName);
    const perm = await SAF.requestDirectoryPermissionsAsync(initialUri);
    if (!perm.granted) return null;
    await AsyncStorage.setItem(storageKey, perm.directoryUri);
    return perm.directoryUri;
  } catch (e) {
    console.log("SAF Request cancelled or failed", e);
    return null;
  }
};

const ensureSafSubdir = async (parentUri, dirNameRaw) => {
  const dirName = safeSeg(dirNameRaw);
  try {
    const children = await SAF.readDirectoryAsync(parentUri);
    const existing = children.find((u) => safDisplayName(u) === dirName);
    if (existing) {
      return existing;
    } else {
      return await SAF.makeDirectoryAsync(parentUri, dirName);
    }
  } catch (e) {
    console.warn(`Error check SAF ${dirName}:`, e.message);
    return await SAF.makeDirectoryAsync(parentUri, dirName);
  }
};

const ensureSafPath = async (rootUri, segments) => {
  let current = rootUri;
  for (const seg of segments) {
    current = await ensureSafSubdir(current, seg);
  }
  return current;
};

const writeFileIntoSafDir = async ({ dirUri, fileName, mimeType, sourceFileUri }) => {
  const dot = fileName.lastIndexOf(".");
  const nameNoExt = dot > 0 ? fileName.slice(0, dot) : fileName;

  const base64 = await FileSystem.readAsStringAsync(sourceFileUri, {
    encoding: FileSystem.EncodingType.Base64
  });

  const safFileUri = await SAF.createFileAsync(dirUri, nameNoExt, mimeType);
  await FileSystem.writeAsStringAsync(safFileUri, base64, {
    encoding: FileSystem.EncodingType.Base64
  });
  return safFileUri;
};

// ==============================================================================
// HELPER PARA NOMBRE DE ARCHIVOS
// ==============================================================================

const pad2 = (n) => String(n).padStart(2, "0");

const getStampParts = (d = new Date()) => {
  const y = d.getFullYear();
  const mo = pad2(d.getMonth() + 1);
  const da = pad2(d.getDate());

  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  const ss = pad2(d.getSeconds());
  const cs = pad2(Math.floor(d.getMilliseconds() / 10)); // 00..99

  return { date: `${y}${mo}${da}`, time: `${hh}${mi}${ss}${cs}` };
};

// ✅ AHORA SÍ: debajo de getStampParts
const getUniqueStampParts = (offsetMs = 0) =>
  getStampParts(new Date(Date.now() + offsetMs));

const buildMediaName = ({ prefix, sed, codigo, def, suffix, ext, date, time }) => {
  const sSed = safeSeg(sed, "SINSED");
  const sCod = safeSeg(codigo, "UNK");
  const sDef = safeSeg(def, "SINDEF");
  return `${prefix}-${sSed}-${sCod}-${sDef}-${date}-${time}-${suffix}.${ext}`;
};


// ==============================================================================
// HELPER PARA ELIMINADOS
// ==============================================================================

const ROOT_MEDIA = "SIGRE.MOVIL/";
const ROOT_TRASH = "ELIMINADOS/";

const cleanUri = (u) => (u ? u.split("?")[0] : u);

const toTrashRelativePath = (oldRelativePath) => {
  if (!oldRelativePath) return null;
  if (oldRelativePath.startsWith(ROOT_MEDIA)) {
    return ROOT_TRASH + oldRelativePath.substring(ROOT_MEDIA.length);
  }
  // fallback: si viene sin SIGRE.MOVIL al inicio
  return ROOT_TRASH + oldRelativePath.replace(/^\/+/, "");
};

const getDirFromRelative = (relPath) => {
  const idx = relPath.lastIndexOf("/");
  return idx >= 0 ? relPath.substring(0, idx + 1) : "";
};
// ==============================================================================
// HELPERS 7004: correlativo por subcarpeta 7004/<N>/ (sin reutilizar)
// ==============================================================================

const extract7004IndexFromPath = (path) => {
  if (!path) return null;
  const p = String(path);

  // nuevo formato: .../7004/<n>/...
  let m = p.match(/(?:^|\/)7004\/(\d+)(?:\/|$)/);
  if (m) return parseInt(m[1], 10);

  // formato viejo: .../7004.<n>....
  m = p.match(/(?:^|\/)7004\.(\d+)(?:\.|\/|$)/);
  if (m) return parseInt(m[1], 10);

  return null;
};

const listNumericSubdirs = async (dirUri) => {
  try {
    const info = await FileSystem.getInfoAsync(dirUri);
    if (!info.exists || !info.isDirectory) return [];

    const children = await FileSystem.readDirectoryAsync(dirUri);
    return children
      .filter((name) => /^\d+$/.test(name))
      .map((name) => parseInt(name, 10))
      .filter((n) => Number.isFinite(n));
  } catch {
    return [];
  }
};

const listOld7004Folders = async (elementDirUri) => {
  // busca carpetas hijas tipo: 7004.<n>....
  try {
    const info = await FileSystem.getInfoAsync(elementDirUri);
    if (!info.exists || !info.isDirectory) return [];

    const children = await FileSystem.readDirectoryAsync(elementDirUri);
    const nums = [];

    for (const name of children) {
      const m = String(name).match(/^7004\.(\d+)(?:\.|$)/);
      if (m) nums.push(parseInt(m[1], 10));
    }

    return nums.filter((n) => Number.isFinite(n));
  } catch {
    return [];
  }
};

const getNext7004Correlativo = async (elementBaseRel) => {
  // elementBaseRel: "SIGRE.MOVIL/<alim>/<sed>/<tipo>/<cod>/"
  const afterRoot = elementBaseRel.startsWith(ROOT_MEDIA)
    ? elementBaseRel.slice(ROOT_MEDIA.length) // sin "SIGRE.MOVIL/"
    : elementBaseRel;

  const active7004Dir = FileSystem.documentDirectory + `${elementBaseRel}7004/`;
  const trash7004Dir = FileSystem.documentDirectory + `${ROOT_TRASH}${afterRoot}7004/`;

  // compatibilidad: carpetas viejas "7004.<n>..."
  const activeElementDir = FileSystem.documentDirectory + elementBaseRel;
  const trashElementDir = FileSystem.documentDirectory + `${ROOT_TRASH}${afterRoot}`;

  const nums = [
    ...(await listNumericSubdirs(active7004Dir)),
    ...(await listNumericSubdirs(trash7004Dir)),
    ...(await listOld7004Folders(activeElementDir)),
    ...(await listOld7004Folders(trashElementDir)),
  ];

  const max = nums.length ? Math.max(...nums) : 0;
  return max + 1;
};


// ==============================================================================
// COMPONENTE PRINCIPAL
// ==============================================================================
export default function Multimedia() {
  const router = useRouter();
  const replaceTargetRef = useRef(null);








  //const { selectedItem, selectedSed, selectedDeficiency, isAdmin = false } = useDatos();
const { 
  selectedItem, 
  selectedSed, 
  selectedDeficiency, 
  isAdmin = false,
  isInspector = false,
  profileId,
  profileName,
  loadingProfile,
  dbName,
  dbReady
} = useDatos();






  const { findFeederById } = useFeeder();
  const { saveArchivoLocal, fetchMediosByDeficienciaId, markArchivoAsDeleted } = useFiles();
  const { fetchDeficiencyByIdLocal } = useDeficiency();

  const [cameraModal, setCameraModal] = useState(false);
  const [audioModal, setAudioModal] = useState(false);
  const [loading, setLoading] = useState({ active: false, msg: "" });
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(null);

  const [photos, setPhotos] = useState(Array(6).fill(null));
  const [audios, setAudios] = useState([]);
  const [deletedIds, setDeletedIds] = useState([]);

  const [placeholderQueue, setPlaceholderQueue] = useState([]); // jobs de placeholders (solo admin)
  const [pendingOriginalSnapshot, setPendingOriginalSnapshot] = useState(false);
  const placeholderShotRef = useRef(null);

  const currentPlaceholderJob = placeholderQueue?.[0] ?? null;

  const [originalPhotos, setOriginalPhotos] = useState(Array(6).fill(null));
  const [originalAudios, setOriginalAudios] = useState([]);
  const [isDirty, setIsDirty] = useState(false);

  // para reemplazo de foto
  const [replaceTarget, setReplaceTarget] = useState(null); // { index, oldPhoto }
  const [previewIndex, setPreviewIndex] = useState(null);












useFocusEffect(
  useCallback(() => {
    console.log(
      `👤 [MULTIMEDIA PERFIL] dbReady=${dbReady} dbName=${dbName ?? "?"} loadingProfile=${loadingProfile} | profileId=${profileId ?? "null"} profileName=${profileName ?? "null"} | admin=${isAdmin} inspector=${isInspector}`
    );
  }, [dbReady, dbName, loadingProfile, profileId, profileName, isAdmin, isInspector])
);




















  // ==============================================================================
  // CARGA DE DATOS (CON CACHE BUSTING PARA LA UI)
  // ==============================================================================
  const loadMedios = async () => {
    if (!selectedDeficiency?.id) return;
    setLoading({ active: true, msg: "Cargando..." });
    setDeletedIds([]);

    try {
      const deficiencia = await fetchDeficiencyByIdLocal(selectedDeficiency.id);
      const idBusqueda = (deficiencia.DefiServerId && deficiencia.DefiServerId > 0)
        ? deficiencia.DefiServerId
        : deficiencia.DefiInterno;

      const medios = await fetchMediosByDeficienciaId(idBusqueda);
      const activos = medios.filter(m => Number(m.ArchActivo) === 1);

      const photosTmp = Array(6).fill(null);
      const audiosTmp = [];
      const placeholderJobs = []; // solo admin

      for (const m of activos) {
        const tipo = Number(m.ArchTipo);
        const isPhotoSlot = tipo > 0 && tipo <= 6;

        // -----------------------------
        // Resolver ruta local (privada) si aplica
        // -----------------------------
        let finalUri = null;

        if (m.ArchNombre && !m.ArchNombre.startsWith("file://")) {
          finalUri = FileSystem.documentDirectory + m.ArchNombre;
        }
        else if (m.ArchNombre && m.ArchNombre.includes("SIGRE.MOVIL")) {
          const parts = m.ArchNombre.split("SIGRE.MOVIL");
          if (parts.length > 1) finalUri = FileSystem.documentDirectory + "SIGRE.MOVIL" + parts[1];
        }

        let localExists = false;
        if (finalUri) {
          try {
            const fileInfo = await FileSystem.getInfoAsync(finalUri);
            localExists = !!fileInfo.exists;
          } catch { /* ignore */ }
        }

        // -----------------------------
        // AUDIO (tipo 0): solo si existe local
        // -----------------------------
        if (tipo === 0) {
          if (finalUri && localExists) {
            audiosTmp.push({ uri: finalUri, title: "Audio", id: m.ArchInterno, type: 0, originalPath: m.ArchNombre });
          }
          continue;
        }

        // -----------------------------
        // FOTOS (1..6): existe local -> normal
        // -----------------------------
        if (isPhotoSlot && finalUri && localExists) {
          const cacheBuster = `?t=${Date.now()}`;
          photosTmp[tipo - 1] = {
            uri: finalUri + cacheBuster,
            latUtm: m.ArchLatitud,
            lonUtm: m.ArchLongitud,
            fechaISO: m.ArchFecha,
            id: m.ArchInterno,
            originalPath: m.ArchNombre,
            type: tipo
          };
          continue;
        }

        // -----------------------------
        // ADMIN: si NO existe el archivo real local, crear/usar PLACEHOLDER informativo
        // - Solo aplica a fotos (1..6)
        // - Identificable por nombre que empieza con __PLACEHOLDER__
        // -----------------------------
        if (isAdmin && isPhotoSlot) {
          const targetUri = buildPlaceholderTargetUri(m);
          const cacheBuster = `?t=${Date.now()}`;

          photosTmp[tipo - 1] = {
            uri: targetUri + cacheBuster,        // se verá cuando el placeholder exista
            id: m.ArchInterno,                   // mantiene vínculo al registro SQLite
            originalPath: m.ArchNombre,          // path original del registro (para eliminar/reemplazar)
            type: tipo,
            isPlaceholder: true,
            placeholderUri: targetUri,
            latUtm: m.ArchLatitud,
            lonUtm: m.ArchLongitud,
            fechaISO: m.ArchFecha
          };

          try {
            const pInfo = await FileSystem.getInfoAsync(targetUri);
            if (!pInfo.exists) {
              placeholderJobs.push({
                key: String(m.ArchInterno),
                index: tipo - 1,
                arch: m,
                targetUri
              });
            }
          } catch {
            // si falla getInfo, igual intentamos generarlo
            placeholderJobs.push({
              key: String(m.ArchInterno),
              index: tipo - 1,
              arch: m,
              targetUri
            });
          }
        }
      }

      setPhotos(photosTmp);
      setAudios(audiosTmp);

      // snapshot original (para cancelar)
      // (si hay placeholders pendientes, se re-snapshotea al terminar la cola)
      setOriginalPhotos(photosTmp);
      setOriginalAudios(audiosTmp);

      setDeletedIds([]);
      setIsDirty(false);

      setPlaceholderQueue(placeholderJobs);
      setPendingOriginalSnapshot(placeholderJobs.length > 0);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading({ active: false, msg: "" });
    }
  };

  useFocusEffect(useCallback(() => {
    loadMedios();
    return () => {
      setPhotos(Array(6).fill(null));
      setAudios([]);
      setPreviewPhoto(null);
      setPhotoIndex(null);
      setCameraModal(false);
      setAudioModal(false);
      setDeletedIds([]);
      setPlaceholderQueue([]);
      setPendingOriginalSnapshot(false);
    };
  }, [selectedDeficiency?.id])
  );

  // ============================================================================
  // PLACEHOLDERS (SOLO ADMIN): generador secuencial con ViewShot
  // ============================================================================
  useEffect(() => {
    if (!currentPlaceholderJob) return;

    let cancelled = false;

    (async () => {
      try {
        await ensureDirExists(PLACEHOLDER_DIR);

        // Esperar a que el ViewShot renderice (muy importante)
        await new Promise(r => setTimeout(r, 50));

        const tmpUri = await placeholderShotRef.current?.capture?.({
          format: "jpg",
          quality: 0.9,
          result: "tmpfile"
        });

        if (cancelled || !tmpUri) return;

        // Si ya existe, no sobreescribir
        const info = await FileSystem.getInfoAsync(currentPlaceholderJob.targetUri);
        if (!info.exists) {
          await FileSystem.moveAsync({ from: tmpUri, to: currentPlaceholderJob.targetUri });
        } else {
          // si existe, limpiamos el tmp
          await FileSystem.deleteAsync(tmpUri, { idempotent: true });
        }

        const cacheBuster = `?t=${Date.now()}`;

        // Inyectar/actualizar el slot
        setPhotos(prev => {
          const c = [...prev];
          const idx = currentPlaceholderJob.index;

          c[idx] = {
            ...(c[idx] || {}),
            uri: currentPlaceholderJob.targetUri + cacheBuster,
            id: currentPlaceholderJob.arch.ArchInterno,
            originalPath: currentPlaceholderJob.arch.ArchNombre,
            type: Number(currentPlaceholderJob.arch.ArchTipo),
            isPlaceholder: true,
            placeholderUri: currentPlaceholderJob.targetUri,
            latUtm: currentPlaceholderJob.arch.ArchLatitud,
            lonUtm: currentPlaceholderJob.arch.ArchLongitud,
            fechaISO: currentPlaceholderJob.arch.ArchFecha
          };

          return c;
        });
      } catch (e) {
        console.warn("[PLACEHOLDER] error generando placeholder:", e?.message ?? e);
      } finally {
        if (!cancelled) {
          setPlaceholderQueue(prev => prev.slice(1));
        }
      }
    })();

    return () => { cancelled = true; };
  }, [currentPlaceholderJob?.key]);

  // Cuando termina la cola, re-snapshot para que "cancelar" no borre placeholders
  useEffect(() => {
    if (!pendingOriginalSnapshot) return;
    if ((placeholderQueue?.length ?? 0) > 0) return;

    setOriginalPhotos(photos);
    setOriginalAudios(audios);
    setPendingOriginalSnapshot(false);
    // OJO: no marcamos dirty
  }, [pendingOriginalSnapshot, placeholderQueue?.length]);

  const handleDeletePhoto = async (index) => {
    const photo = photos[index];
    if (!photo) return;

    // Si es EXISTENTE (tiene id) -> se marca para mover a ELIMINADOS al FINALIZAR
    if (photo?.id) {
      setDeletedIds(prev => [...prev, { id: photo.id, path: photo.originalPath, type: photo.type, sourceUri: photo?.isPlaceholder ? cleanUri(photo.uri) : undefined, isPlaceholder: !!photo?.isPlaceholder }]);
    } else {
      // Si es NUEVA (temporal) -> se borra temporal ahora (no llega a BD)
      try {
        const u = cleanUri(photo.uri);
        const info = await FileSystem.getInfoAsync(u);
        if (info.exists) await FileSystem.deleteAsync(u, { idempotent: true });
      } catch { }
    }

    setPhotos(prev => { const c = [...prev]; c[index] = null; return c; });
    setIsDirty(true);
  };

  const handleDeleteAudio = async (index) => {
    const audio = audios[index];
    if (!audio) return;

    if (audio?.id) {
      const relativePath = audio.uri.replace(FileSystem.documentDirectory, "");
      const cleanPath = relativePath.split("?")[0];
      setDeletedIds(prev => [...prev, { id: audio.id, path: cleanPath, type: 0 }]);
    } else {
      // temporal nuevo
      try {
        const u = cleanUri(audio.uri);
        const info = await FileSystem.getInfoAsync(u);
        if (info.exists) await FileSystem.deleteAsync(u, { idempotent: true });
      } catch { }
    }

    setAudios(prev => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const getElementoInfo = () => {
    if (selectedItem?.PostInterno) return { tipo: "Poste", codigo: selectedItem.PostCodigoNodo };
    const vanoCode = selectedItem?.Vano_Codigo || selectedItem?.VanoCodigo;
    if (vanoCode) return { tipo: "Vano", codigo: vanoCode };
    return { tipo: "Elemento", codigo: "UNK" };
  };

  const exportarFotosZip = async () => {
    const fotosValidas = photos.filter(p => p !== null);
    if (fotosValidas.length === 0) return Alert.alert("Sin fotos", "No hay nada para exportar.");
    try {
      setLoading({ active: true, msg: "Generando ZIP..." });
      const feeder = await findFeederById(selectedItem.AlimInterno);
      const { tipo, codigo } = getElementoInfo();
      const tipCodeZip = String(selectedDeficiency?.typificationCode ?? "");

      // Base por elemento
      const elementBaseRelZip =
        `SIGRE.MOVIL/${safeSeg(feeder.alimEtiqueta)}/${safeSeg(selectedSed?.SedCodigo, "SINSED")}/${tipo === "Vano" ? "VANO" : "POSTE"}/${safeSeg(codigo)}/`;

      let defZipFolder = safeSeg(tipCodeZip, "SINDEF"); // carpeta dentro del ZIP
      let defZipName = defZipFolder;                    // texto dentro del nombre del archivo

      if (tipCodeZip === "7004") {
        // si ya hay rutas existentes, se extrae el N; si no, se calcula el siguiente
        const anyPath =
          photos.find(p => p?.originalPath)?.originalPath ||
          deletedIds.find(d => d?.path)?.path;

        let corr = extract7004IndexFromPath(anyPath);

        if (corr == null) {
          corr = await getNext7004Correlativo(elementBaseRelZip);
        }

        defZipFolder = `7004/${corr}`;
        defZipName = `7004_${corr}`;

      }

      const folderPath = `${elementBaseRelZip}${defZipFolder}`;

      const zip = new JSZip();
      const folder = zip.folder(folderPath);
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (photo?.uri) {
          const cleanUri = photo.uri.split('?')[0];

          const { date, time } = getUniqueStampParts(i * 11); // <-- evita repetidos
          const fname = buildMediaName({
            prefix: "FOT",
            sed: selectedSed?.SedCodigo,
            codigo, // el código real del elemento
            def: defZipName,

            suffix: i + 1,       // <-- 1..6
            ext: "jpg",
            date,
            time
          });

          const b64 = await FileSystem.readAsStringAsync(cleanUri, { encoding: FileSystem.EncodingType.Base64 });
          folder.file(fname, b64, { base64: true });
        }
      }

      const zipBase64 = await zip.generateAsync({ type: "base64" });
      const fileName = `EVIDENCIA_${safeSeg(codigo)}.zip`;

      const zipUri = FileSystem.cacheDirectory + fileName;
      await FileSystem.writeAsStringAsync(zipUri, zipBase64, { encoding: FileSystem.EncodingType.Base64 });
      if (await Sharing.isAvailableAsync()) { await Sharing.shareAsync(zipUri); }
    } catch (e) { Alert.alert("Error", e.message); } finally { setLoading({ active: false, msg: "" }); }
  };

  // ==============================================================================
  // 5. GUARDAR DATOS
  // ==============================================================================
  const finalizar = async () => {
    if (!selectedItem) return Alert.alert("Error", "No hay elemento seleccionado");

    try {
      setLoading({ active: true, msg: "Guardando..." });

      const deficiencyData = await fetchDeficiencyByIdLocal(selectedDeficiency.id);
      const codTablaParaGuardar = (deficiencyData.DefiServerId && deficiencyData.DefiServerId > 0)
        ? deficiencyData.DefiServerId : deficiencyData.DefiInterno;
      const currentTipiInterno = selectedDeficiency.typificationId || 0;
      const currentElementId = selectedDeficiency.elementId || selectedItem.PostInterno || selectedItem.VanoInterno || 0;
      const { tipo, codigo } = getElementoInfo();
      const feeder = await findFeederById(selectedItem.AlimInterno);

      const sAlim = safeSeg(feeder.alimEtiqueta);
      const sSed = safeSeg(selectedSed?.SedCodigo, "SINSED");
      const sTipo = tipo === "Vano" ? "VANO" : "POSTE";

      const sCod = safeSeg(codigo);



      const tipCode = String(selectedDeficiency?.typificationCode ?? "");
      const is7004 = tipCode === "7004";

      // defFolderSegment = carpeta dentro del elemento (no-7004 es el código, 7004 se define luego)
      let defFolderSegment = safeSeg(tipCode, "SINDEF");

      // defNameSegment = lo que irá en el nombre del archivo (para 7004 será 7004.N)
      let defNameSegment = defFolderSegment;

      // Base por elemento (sin deficiencia)
      const elementBaseRel = `SIGRE.MOVIL/${sAlim}/${sSed}/${sTipo}/${sCod}/`;







      const hasNewPhotos = photos.some(p => p && !p.id);
      const hasNewAudios = audios.some(a => a && !a.id);
      const hasDeletedPhotos = deletedIds.some(d => d.type !== 0);
      const hasDeletedAudios = deletedIds.some(d => d.type === 0);

      // Solo crear carpetas SAF si realmente se usarán
      const needPictures = hasNewPhotos || hasDeletedPhotos;
      const needMusic = hasNewAudios || hasDeletedAudios;









      // 1. DETERMINAR RUTA (SIEMPRE CONFIG ACTUAL - SIN HERENCIA) ✅
let relativeFolderPath = null;

if (is7004) {
  const correlativo = await getNext7004Correlativo(elementBaseRel);
  defFolderSegment = `7004/${correlativo}`; // carpeta real
  defNameSegment = `7004_${correlativo}`;   // para nombre de archivo
  relativeFolderPath = `${elementBaseRel}${defFolderSegment}/`;
} else {
  // siempre usa el tip actual como carpeta
  defNameSegment = defFolderSegment;
  relativeFolderPath = `${elementBaseRel}${defFolderSegment}/`;
}

const carpetaBase = FileSystem.documentDirectory + relativeFolderPath;












      if (hasNewPhotos || hasNewAudios) {
        await ensureDirExists(carpetaBase);
      }

      // 2. SAF PÚBLICO
      let picturesTargetDir = null;
      let musicTargetDir = null;
      let picturesTrashDir = null;
      let musicTrashDir = null;

      try {
        const pathSegments = relativeFolderPath.split("/").filter(seg => seg.length > 0);

        // ✅ Solo Pictures si hay fotos nuevas o fotos eliminadas
        if (needPictures) {
          const picturesRoot = await getOrRequestPublicDir("Pictures", KEY_PICTURES_DIR);
          if (picturesRoot) {
            picturesTargetDir = await ensureSafPath(picturesRoot, pathSegments);

            if (hasDeletedPhotos) {
              const trashSegments = ["ELIMINADOS", ...pathSegments.slice(1)];
              picturesTrashDir = await ensureSafPath(picturesRoot, trashSegments);
            }
          }
        }

        // ✅ Solo Music si hay audios nuevos o audios eliminados
        if (needMusic) {
          const musicRoot = await getOrRequestPublicDir("Music", KEY_MUSIC_DIR);
          if (musicRoot) {
            musicTargetDir = await ensureSafPath(musicRoot, pathSegments);

            if (hasDeletedAudios) {
              const trashSegments = ["ELIMINADOS", ...pathSegments.slice(1)];
              musicTrashDir = await ensureSafPath(musicRoot, trashSegments);
            }
          }
        }
      } catch (e) {
        console.warn("SAF Error:", e.message);
      }

      // 3. ELIMINADOS -> mover a carpeta ELIMINADOS (sin borrar del disco)
      if (deletedIds.length > 0) {
        for (const item of deletedIds) {
          const oldRelativePath = item.path;
          const fileName = oldRelativePath.split("/").pop();

          const trashRelativePath = toTrashRelativePath(oldRelativePath);

          const oldUri = FileSystem.documentDirectory + oldRelativePath;
          const trashUri = FileSystem.documentDirectory + trashRelativePath;

          // ✅ Para placeholders (admin): el archivo local a mover/copiar NO es oldUri (porque no existe)
          const sourceLocalUri = item?.sourceUri ? cleanUri(item.sourceUri) : oldUri;

          // A) SAF (mover = copiar a ELIMINADOS y borrar original público)
          try {
            if (item.type !== 0 && picturesTargetDir && picturesTrashDir) {
              // copia al trash usando el archivo local (sourceLocalUri)
              await writeFileIntoSafDir({
                dirUri: picturesTrashDir,
                fileName,
                mimeType: "image/jpeg",
                sourceFileUri: sourceLocalUri
              });

              // borrar original público si existe
              const files = await SAF.readDirectoryAsync(picturesTargetDir);
              const oldSafFile = files.find(u => decodeURIComponent(u).includes(fileName));
              if (oldSafFile) await SAF.deleteAsync(oldSafFile);
            }

            if (item.type === 0 && musicTargetDir && musicTrashDir) {
              await writeFileIntoSafDir({
                dirUri: musicTrashDir,
                fileName,
                mimeType: "audio/mp4",
                sourceFileUri: sourceLocalUri
              });

              const files = await SAF.readDirectoryAsync(musicTargetDir);
              const oldSafFile = files.find(u => decodeURIComponent(u).includes(fileName));
              if (oldSafFile) await SAF.deleteAsync(oldSafFile);
            }
          } catch (e) {
            console.warn("SAF move-to-trash error:", e.message);
          }

          // B) mover local a ELIMINADOS
          try {
            const info = await FileSystem.getInfoAsync(sourceLocalUri);
            if (info.exists) {
              const trashDir = FileSystem.documentDirectory + getDirFromRelative(trashRelativePath);
              await ensureDirExists(trashDir);
              await FileSystem.moveAsync({ from: sourceLocalUri, to: trashUri });
            }


          } catch (e) {
            console.warn("Move local to ELIMINADOS error:", e.message);
          }
          await markArchivoAsDeleted(item.id, trashRelativePath);
        }
      }

      // 4. FOTOS NUEVAS
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (!photo || photo.id) continue;

        // Limpiamos cache buster si lo tuviera (para la copia)
        const cleanSrcUri = photo.uri.split('?')[0];

        const { date, time } = getUniqueStampParts(i * 11); // <-- evita repetidos
        const fname = buildMediaName({
          prefix: "FOT",
          sed: selectedSed?.SedCodigo,
          codigo,
          def: defNameSegment,

          suffix: i + 1,   // <-- 1..6
          ext: "jpg",
          date,
          time
        });

        const destUri = carpetaBase + fname;

        await FileSystem.copyAsync({ from: cleanSrcUri, to: destUri });

        if (picturesTargetDir) {
          await writeFileIntoSafDir({ dirUri: picturesTargetDir, fileName: fname, mimeType: "image/jpeg", sourceFileUri: destUri });
        }

        const pathParaBD = relativeFolderPath + fname;
        await saveFileRecord({
          filename: pathParaBD, slot: i + 1, isAudio: false, photoData: photo,
          codTablaReal: codTablaParaGuardar, elementId: currentElementId, tipiId: currentTipiInterno
        });
      }

      // 5. AUDIOS NUEVOS
      for (let i = 0; i < audios.length; i++) {
        const audio = audios[i];
        if (!audio || audio.id) continue;

        const cleanSrcUri = audio.uri.split('?')[0];
        const { date, time } = getUniqueStampParts(1000 + i * 11); // <-- offset para que no choque
        const fname = buildMediaName({
          prefix: "AUD",
          sed: selectedSed?.SedCodigo,
          codigo,
          def: defNameSegment,

          suffix: 0,       // <-- SIEMPRE 0
          ext: "m4a",
          date,
          time
        });


        const destUri = carpetaBase + fname;

        await FileSystem.copyAsync({ from: cleanSrcUri, to: destUri });

        if (musicTargetDir) {
          await writeFileIntoSafDir({ dirUri: musicTargetDir, fileName: fname, mimeType: "audio/mp4", sourceFileUri: destUri });
        }

        const pathParaBD = relativeFolderPath + fname;
        await saveFileRecord({
          filename: pathParaBD, slot: 0, isAudio: true, codTablaReal: codTablaParaGuardar,
          elementId: currentElementId, tipiId: currentTipiInterno
        });
      }

      setLoading({ active: false, msg: "" });
      Alert.alert("Éxito", "Guardado correctamente.", [{ text: "OK", onPress: () => router.replace("/inspection") }]);

    } catch (err) {
      setLoading({ active: false, msg: "" });
      Alert.alert("Error", err.message);
    }
  };

  const saveFileRecord = async ({ filename, slot, isAudio, photoData, codTablaReal, elementId, tipiId }) => {
    const { tipo } = getElementoInfo();
    return await saveArchivoLocal({
      ArchInterno: null, ArchTipo: isAudio ? 0 : slot, ArchTabla: "Deficiencias", ArchCodTabla: codTablaReal,
      ArchNombre: filename, ArchLatitud: photoData?.latUtm ?? null, ArchLongitud: photoData?.lonUtm ?? null,
      ArchFecha: photoData?.fechaISO ?? new Date().toISOString(), ArchTipoElemento: tipo === "Poste" ? "POST" : "VANO",
      ArchIdElemento: elementId, TipiInterno: tipiId, ArchActivo: 1, EstadoOffLine: 2,
    });
  };

  const discardChanges = async () => {
    // borrar temporales NUEVOS (sin id)
    const tempPhotoUris = photos
      .filter(p => p && !p.id && p.uri)
      .map(p => cleanUri(p.uri));

    const tempAudioUris = audios
      .filter(a => a && !a.id && a.uri)
      .map(a => cleanUri(a.uri));

    for (const u of [...tempPhotoUris, ...tempAudioUris]) {
      try {
        const info = await FileSystem.getInfoAsync(u);
        if (info.exists) await FileSystem.deleteAsync(u, { idempotent: true });
      } catch { }
    }

    // restaurar snapshot
    setPhotos(originalPhotos);
    setAudios(originalAudios);
    setDeletedIds([]);
    setIsDirty(false);
    setPreviewPhoto(null);
    setPreviewIndex(null);
    setReplaceTarget(null);
    setCameraModal(false);
    setAudioModal(false);
  };

  const onCancel = () => {
    if (!isDirty) return router.replace("/inspection");

    Alert.alert(
      "Descartar cambios",
      "Tienes cambios sin guardar. ¿Deseas descartarlos?",
      [
        { text: "Seguir editando", style: "cancel" },
        {
          text: "Descartar",
          style: "destructive",
          onPress: async () => {
            await discardChanges();
            router.replace("/inspection");
          }
        }
      ]
    );
  };

  const closePreview = () => {
    setPreviewPhoto(null);
    setPreviewIndex(null);
  };

  const closeCamera = (restorePreview = true) => {
    setCameraModal(false);

    const target = replaceTargetRef.current;

    // ✅ Si cerraste cámara SIN tomar foto (X/back) y estabas reemplazando,
    // entonces sí vuelve al preview anterior.
    if (restorePreview && target?.oldPhoto?.uri) {
      setPreviewIndex(target.index ?? null);
      setPreviewPhoto(target.oldPhoto.uri);
    }

    // limpiar modo reemplazo
    replaceTargetRef.current = null;
    setReplaceTarget(null);
    setPhotoIndex(null);
  };

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;

      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        // 1) Si estás en cámara -> cerrar cámara (X)
        if (cameraModal) {
          closeCamera();
          return true;
        }

        // 2) Si estás viendo preview -> cerrar preview
        if (previewPhoto) {
          closePreview();
          return true;
        }

        // 3) Si estás en Multimedia normal -> cancelar (con confirm si hay cambios)
        onCancel();
        return true;
      });

      return () => sub.remove();
    }, [cameraModal, previewPhoto, isDirty, replaceTarget])
  );

  const startReplacePhoto = (index) => {
    const oldPhoto = photos[index];
    if (!oldPhoto) return;

    const target = { index, oldPhoto };
    replaceTargetRef.current = target;   // ✅ ref (inmediato)
    setReplaceTarget(target);            // ✅ state (UI)
    setPhotoIndex(index);
    setCameraModal(true);
  };

  const onFinalize = () => {
    if (!isDirty) {
      return Alert.alert("Sin cambios", "No hay cambios para guardar.");
    }

    // Recordatorio: slots 1-4 obligatorios (solo aviso, no bloqueo)
    const requiredIdx = [0, 1, 2, 3];
    const missing = requiredIdx.filter((i) => !photos[i]);

    if (missing.length > 0) {
      const faltan = missing.map((i) => `• ${PHOTO_SLOTS[i]}`).join("\n");

      return Alert.alert(
        "Fotos obligatorias (recordatorio)",
        `Faltan estas fotos:\n\n${faltan}\n\nPuedes continuar igual.`,
        [
          {
            text: "Aceptar",
            onPress: () => finalizar()
          }
        ]
      );
    }

    finalizar();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* =========================================================================
          PLACEHOLDER RENDERER (SOLO ADMIN)
          - Render oculto fuera de pantalla
          - Se captura con ViewShot y se guarda como imagen real (jpg)
      ========================================================================= */}
      {!!currentPlaceholderJob && (
        <ViewShot
          ref={placeholderShotRef}
          options={{ format: "jpg", quality: 0.9 }}
          style={{
            position: "absolute",
            left: -10000,
            top: -10000,
          }}
        >
          <View style={{ width: 620, height: 450, backgroundColor: "#fff", padding: 18 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 10 }}>
              {PLACEHOLDER_PREFIX} FOTO NO DISPONIBLE EN ESTE DISPOSITIVO
            </Text>

            <Text style={{ fontSize: 14, marginBottom: 10 }}>
              Esta imagen fue generada automáticamente (ADMIN) para evitar {"\n"}
              validaciones erróneas cuando la BD descargada tiene un registro {"\n"}
              en Archivos pero el archivo físico no está en el equipo.
            </Text>

            <View style={{ flex: 1 }}>
              {buildPlaceholderLines(currentPlaceholderJob.arch).map((line, i) => (
                <Text key={`${currentPlaceholderJob.key}-${i}`} style={{ fontSize: 14 }}>
                  {line}
                </Text>
              ))}
            </View>
          </View>
        </ViewShot>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
                key={index}
                title={title}
                uri={photos[index]?.uri}
                onPress={() => {
                  if (photos[index]?.uri) {
                    setPreviewPhoto(photos[index].uri);
                    setPreviewIndex(index);
                  } else {
                    setReplaceTarget(null);
                    setPhotoIndex(index);
                    setCameraModal(true);
                  }
                }}

              />

            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.audioHeader}>
            <Text style={styles.title}>🎙️ Registro de Audio</Text>
            <TouchableOpacity style={styles.recButton} onPress={() => setAudioModal(true)}>
              <Text style={styles.recText}>● REC</Text>
            </TouchableOpacity>
          </View>
          {audios.map((audio, index) => (
            <View key={index} style={{ marginBottom: 8 }}>
              <AudioCard
                title={audio.title}
                uri={audio.uri}
                onDelete={() => handleDeleteAudio(index)}
              />
            </View>
          ))}
          {audios.length === 0 && <Text style={styles.emptyText}>No hay audios grabados</Text>}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>CANCELAR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.finishButton, !isDirty && styles.finishButtonDisabled]}
            onPress={onFinalize}
          >
            <Text style={[styles.finishText, !isDirty && styles.finishTextDisabled]}>
              FINALIZAR
            </Text>
          </TouchableOpacity>

        </View>
      </View>

      <ModalCamera
        visible={cameraModal}
        onClose={() => closeCamera(true)}
        onRequestClose={() => closeCamera(true)}

        onPhoto={async (p) => {
          // si es reemplazo, marca la anterior como eliminada (tu lógica ok)
          const target = replaceTargetRef.current;
          if (target?.oldPhoto) {
            const old = target.oldPhoto;

            if (old?.id) {
              setDeletedIds(prev => [...prev, { id: old.id, path: old.originalPath, type: old.type, sourceUri: old?.isPlaceholder ? cleanUri(old.uri) : undefined, isPlaceholder: !!old?.isPlaceholder }]);
            } else if (old?.uri) {
              try {
                const u = cleanUri(old.uri);
                const info = await FileSystem.getInfoAsync(u);
                if (info.exists) await FileSystem.deleteAsync(u, { idempotent: true });
              } catch { }
            }
          }

          // colocar nueva foto
          setPhotos(prev => {
            const c = [...prev];
            c[photoIndex] = p;
            return c;
          });

          setIsDirty(true);

          // ✅ IMPORTANTÍSIMO: cerrar preview y volver a multimedia
          setPreviewPhoto(null);
          setPreviewIndex(null);

          // ✅ cerrar cámara SIN restaurar preview viejo
          replaceTargetRef.current = null;
          setReplaceTarget(null);
          setPhotoIndex(null);
          setCameraModal(false);
        }}

      />
      <ModalAudio visible={audioModal} onClose={() => setAudioModal(false)}
        onAudioRecorded={(u) => {
          setAudios(prev => [...prev, { uri: u, title: `Nota ${prev.length + 1}` }]);
          setIsDirty(true);
        }}

      />
      <PhotoModal
        visible={!!previewPhoto}
        uri={previewPhoto}
        title={previewIndex != null ? PHOTO_SLOTS[previewIndex] : "Foto"}
        onClose={() => {
          setPreviewPhoto(null);
          setPreviewIndex(null);
        }}
        onReplace={() => {
          if (previewIndex == null) return;

          // cerrar preview
          setPreviewPhoto(null);

          // abrir cámara en modo reemplazo (tu función ya existe)
          startReplacePhoto(previewIndex);
        }}
        onDelete={async () => {
          if (previewIndex == null) return;
          // aquí se ejecuta SOLO si el usuario confirma
          await handleDeletePhoto(previewIndex);
          setPreviewPhoto(null);
          setPreviewIndex(null);
        }}
      />
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
  finishButtonDisabled: { backgroundColor: "#9CA3AF" },
  finishTextDisabled: { color: "#F3F4F6" },

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