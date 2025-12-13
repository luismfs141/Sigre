import { useFocusEffect } from "@react-navigation/native";
import { useFeeder } from "../../hooks/useFeeder";

import { useCallback, useContext, useEffect, useState } from "react";

import { AuthContext } from "../../context/AuthContext";
import { useDatos } from "../../context/DatosContext";

// Opción A (recomendada)
import * as utm from "utm";

// y deja tu función igual:
function formatUtmFromLatLon(latitude, longitude) {
  try {
    const { easting, northing, zoneNum, zoneLetter } = utm.fromLatLon(
      latitude,
      longitude
    );
    return `UTM ${zoneNum}${zoneLetter} ${Math.round(easting)}E ${Math.round(
      northing
    )}N`;
  } catch (e) {
    //console.log("Error convirtiendo a UTM:", e);
    return "";
  }
}

// ⚙️ FileSystem (legacy para poder usar readAsStringAsync, deleteAsync, etc.)
import * as FS from "expo-file-system/legacy";
// SAF (carpeta pública Android) también desde legacy
import { StorageAccessFramework as SAF } from "expo-file-system/legacy";

import Slider from "@react-native-community/slider";
import { Alert } from "react-native";

import { Audio } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFiles } from "../../hooks/useFiles";


import { CameraView, useCameraPermissions } from "expo-camera";

import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import ImageViewer from "react-native-image-zoom-viewer";

// Config actual de ruta (luego lo harás dinámico con IDs reales)
const PATH_CONFIG = {
  proyecto: "ProyectoX",
  alimentador: "Alim01",
  subestacion: "Sub01",
  tipoElemento: "TipoElemento",
  elemento: "Elem01",
  deficiencia: "DEF001",
};

const SLOT_LABELS = [
  "Frontal",
  "P. derecho",
  "P. izquierdo",
  "Panorámico",
  "Medidor",
  "Adicional",
];

const REQUIRED_SLOTS = [0, 1, 2, 3]; // obligatorios

function buildRelativePath(tipoCarpeta, fileName) {
  const {
    proyecto,
    alimentador,
    subestacion,
    tipoElemento,
    elemento,
    deficiencia,
  } = PATH_CONFIG;

  const path = [
    "SIGRE",
    proyecto,
    alimentador,
    subestacion,
    tipoElemento,
    elemento,
    deficiencia,
    tipoCarpeta, // "Fotos" | "Audios"
    fileName,
  ].join("/");

  console.log(
    "[buildRelativePath] ",
    "\n  tipoCarpeta:",
    tipoCarpeta,
    "\n  fileName:",
    fileName,
    "\n  PATH_CONFIG:",
    {
      proyecto,
      alimentador,
      subestacion,
      tipoElemento,
      elemento,
      deficiencia,
    },
    "\n  => relativePath:",
    path
  );

  return path;
}

function buildRelativePathWithRoot(rootFolder, tipoCarpeta, fileName) {
  const {
    proyecto,
    alimentador,
    subestacion,
    tipoElemento,
    elemento,
    deficiencia,
  } = PATH_CONFIG;

  return [
    String(rootFolder), // "SIGRE" | "BORRADOS"
    String(proyecto),
    String(alimentador),
    String(subestacion),
    String(tipoElemento),
    String(elemento),
    String(deficiencia),
    String(tipoCarpeta), // "Fotos" | "Audios"
    String(fileName),
  ].join("/");
}


// Fecha para SQLite: "YYYY-MM-DD HH:mm:ss"
function formatDateTimeSQLite(date = new Date()) {
  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
}

// Timestamp: 20251206_145233123 (para nombres de archivo)
function formatFileTimestampMs() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const ms = String(now.getMilliseconds()).padStart(3, "0");
  return `${yyyy}${MM}${dd}_${hh}${mm}${ss}${ms}`;
}

// Extrae el timestamp del nombre de archivo: FOT-<timestamp>-<slot>.jpg o AUD-<timestamp>-<n>.m4a
function extractTimestampFromFileName(fileName) {
  if (!fileName) return null;
  const fotMatch = fileName.match(/^FOT-([^.-]+)-\d+\./i);
  if (fotMatch) return fotMatch[1];

  const audMatch = fileName.match(/^AUD-([^.-]+)-\d+\./i);
  if (audMatch) return audMatch[1];

  return null;
}

function formatWatermarkDate(date = new Date()) {
  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  // Solo fecha, sin hora
  return `${dd}/${MM}/${yyyy}`;
}

// Nombre bonito desde cualquier URI (file:// o content://)
function getFileName(uri) {
  if (!uri) return "";
  const decoded = decodeURIComponent(uri.split("?")[0]);
  const parts = decoded.split("/");
  return parts[parts.length - 1] || "";
}

// Obtener nombre de carpeta/archivo desde una SAF URI
function getNameFromSafUri(uri) {
  const decoded = decodeURIComponent(uri.split("?")[0]);
  const parts = decoded.split("/");
  const last = parts[parts.length - 1];
  const segments = last.split("/");
  return segments[segments.length - 1];
}

// Encuentra o crea subcarpeta dentro de parentUri
async function findOrCreateSubdir(parentUri, dirName) {
  try {
    const nameStr = String(dirName);
    const entries = await SAF.readDirectoryAsync(parentUri);
    for (const entryUri of entries) {
      const name = getNameFromSafUri(entryUri);
      if (name === nameStr) {
        return entryUri; // ya existe
      }
    }

    const newDirUri = await SAF.makeDirectoryAsync(parentUri, nameStr);
    return newDirUri;
  } catch (err) {
    //console.log("⚠️ Error leyendo/creando directorio SAF:", err);
    throw err;
  }
}

// Helper genérico para leer base64 desde file:// o content:// usando SIEMPRE FS
async function readFileAsBase64Generic(uri) {
  if (!uri) return "";
  try {
    return await FS.readAsStringAsync(uri, { encoding: "base64" });
  } catch (err) {
    console.log("⚠️ Error leyendo base64 genérico:", uri, err);
    throw err;
  }
}


// Pide (una sola vez) la carpeta raíz para SIGRE
async function getRootUri() {
  try {
    if (!SAF || !SAF.requestDirectoryPermissionsAsync) {
      Alert.alert(
        "No soportado",
        "StorageAccessFramework no está disponible en esta plataforma."
      );
      return null;
    }

    let uri = await AsyncStorage.getItem("SIGRE_ROOT_URI");
    if (!uri) {
      const perm = await SAF.requestDirectoryPermissionsAsync(null);
      if (!perm.granted) {
        return null;
      }
      uri = perm.directoryUri;
      await AsyncStorage.setItem("SIGRE_ROOT_URI", uri);
    }

    return uri;
  } catch (err) {
    //console.log("Error en getRootUri:", err);
    return null;
  }
}

// Crea estructura:
// [root]/<rootFolder>/Proyecto/Alim/Sub/TipoElemento/Elemento/DEF/{Fotos,Audios}
// rootFolder = "SIGRE" (activos) o "BORRADOS" (lógico borrado)

// ✅ Buscar subcarpeta SIN crearla
async function findSubdir(parentUri, dirName) {
  try {
    const nameStr = String(dirName);
    const entries = await SAF.readDirectoryAsync(parentUri);
    for (const entryUri of entries) {
      const name = getNameFromSafUri(entryUri);
      if (name === nameStr) return entryUri;
    }
    return null;
  } catch (err) {
    return null;
  }
}

// ✅ Caminar por una ruta SAF (crear o NO crear)
async function walkSafPath(rootUri, segments, create = false) {
  let currentUri = rootUri;
  for (const seg of segments) {
    currentUri = create
      ? await findOrCreateSubdir(currentUri, seg)
      : await findSubdir(currentUri, seg);

    if (!currentUri) return null; // si no existe y no creamos, aborta
  }
  return currentUri;
}

// ✅ URI de la carpeta de la deficiencia (SIN Fotos/Audios)
async function getDeficiencyBaseUri(rootUri, rootFolder = "SIGRE", create = false) {
  const { proyecto, alimentador, subestacion, tipoElemento, elemento, deficiencia } = PATH_CONFIG;

  const segments = [
    String(rootFolder),
    String(proyecto),
    String(alimentador),
    String(subestacion),
    String(tipoElemento),
    String(elemento),
    String(deficiencia),
  ];

  return await walkSafPath(rootUri, segments, create);
}

// ✅ URI de Fotos o Audios (crear solo si create=true)
async function getMediaDirUri(rootUri, rootFolder = "SIGRE", mediaName = "Fotos", create = false) {
  const baseUri = await getDeficiencyBaseUri(rootUri, rootFolder, create);
  if (!baseUri) return null;

  return create
    ? await findOrCreateSubdir(baseUri, mediaName)
    : await findSubdir(baseUri, mediaName);
}

// ✅ Leer directorio sin reventar
async function safeReadDirectory(uri) {
  if (!uri) return [];
  try {
    return await SAF.readDirectoryAsync(uri);
  } catch {
    return [];
  }
}

// ✅ Borrar archivo SAF (content://) o file://
async function safeDeleteUri(uri) {
  if (!uri) return;
  try {
    // si existe deleteAsync en SAF, úsalo primero
    if (uri.startsWith("content://") && SAF?.deleteAsync) {
      await SAF.deleteAsync(uri);
      return;
    }
  } catch { }

  try {
    await FS.deleteAsync(uri, { idempotent: true });
  } catch { }
}


// Buscar nombre libre: baseName.ext → baseName.ext, baseName (2).ext, ...
async function getUniqueSafFileUri(folderUri, baseNameWithExt, mimeType) {
  const dotIndex = baseNameWithExt.lastIndexOf(".");
  let main = baseNameWithExt;
  let ext = "";
  if (dotIndex !== -1) {
    main = baseNameWithExt.slice(0, dotIndex);
    ext = baseNameWithExt.slice(dotIndex);
  }

  let n = 1;
  while (true) {
    const suffix = n === 1 ? "" : ` (${n})`;
    const fileName = `${main}${suffix}${ext}`;
    try {
      const fileUri = await SAF.createFileAsync(folderUri, fileName, mimeType);
      return fileUri;
    } catch (err) {
      const msg = String(err || "");
      if (msg.includes("EEXIST") || msg.includes("Already") || msg.includes("exist")) {
        n += 1;
        continue;
      }
      throw err;
    }
  }
}

// Verifica que el GPS esté activo y con permisos
const ensureGpsReady = async () => {
  try {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      Alert.alert(
        "GPS desactivado",
        "Activa el GPS para poder registrar fotos y audios."
      );
      return false;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso de ubicación",
        "Debes otorgar permiso de ubicación para registrar fotos y audios."
      );
      return false;
    }

    return true;
  } catch (err) {
    //console.log("Error comprobando GPS:", err);
    Alert.alert("Error", "No se pudo comprobar el estado del GPS.");
    return false;
  }
};

export default function DeficiencyMediaScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const { getNextArchCodTabla, saveArchivoLocal, getArchivosByBasePath, markArchivoAsDeleted } =
    useFiles();

  const { findFeederById } = useFeeder();
  const [feederCode, setFeederCode] = useState("SIN_ALIM");

  // Archivos ya existentes en la DB para esta deficiencia
  const [initialPhotoRecords, setInitialPhotoRecords] = useState([]); // [{ ArchInterno, ArchTipo, ArchNombre, ArchCodTabla }]
  const [initialAudioRecords, setInitialAudioRecords] = useState([]); // idem para audios
  const [currentArchCodTabla, setCurrentArchCodTabla] = useState(null);

  const { selectedItem, selectedFeeder, selectedSed, feeders } = useDatos();

  if (selectedFeeder) {
    console.log("[DefMedia] selectedFeeder detalle:", {
      type: typeof selectedFeeder,
      id: selectedFeeder.id ?? null,
      name: selectedFeeder.name ?? null,
      alimEtiqueta: selectedFeeder.alimEtiqueta ?? null,
    });
  } else {
    console.log("[DefMedia] selectedFeeder = NULL en contexto");
  }

  const { user } = useContext(AuthContext);

  // Código de deficiencia desde params
  const { defCode } = useLocalSearchParams();

  // Código del elemento (poste, vano, sed)
  const elementCode =
    selectedItem?.PostCodigoNodo ||
    selectedItem?.VanoCodigo ||
    selectedItem?.SedCodigo ||
    "SIN_CODIGO";

  // Código de proyecto
  const projectCode = (() => {
    const p = user?.proyecto;
    if (p === 0) return "BT";
    if (p === 1) return "MT";
    return p !== undefined && p !== null ? String(p) : "SIN_PROYECTO";
  })();

  // Resolver nombre/código del alimentador
  useEffect(() => {
    const alimInt = selectedItem?.AlimInterno ?? null;

    console.log("[DefMedia] useEffect FEEDER resolve =>", {
      alimInt,
      selectedFeeder,
      selectedItemAlimEtiqueta: selectedItem?.AlimEtiqueta,
    });

    // 1️⃣ selectedFeeder del contexto
    if (selectedFeeder) {
      if (typeof selectedFeeder === "string") {
        console.log("[DefMedia] feederCode desde selectedFeeder (string):", selectedFeeder);
        setFeederCode(String(selectedFeeder));
        return;
      }

      const nameFromSelected =
        selectedFeeder.name ??
        selectedFeeder.AlimEtiqueta ??
        selectedFeeder.alimEtiqueta ??
        selectedFeeder.Descripcion ??
        selectedFeeder.descripcion ??
        null;

      if (nameFromSelected) {
        console.log("[DefMedia] feederCode desde selectedFeeder (obj):", nameFromSelected);
        setFeederCode(String(nameFromSelected));
        return;
      }
    }

    // 2️⃣ etiqueta directa
    if (selectedItem?.AlimEtiqueta) {
      console.log("[DefMedia] feederCode desde selectedItem.AlimEtiqueta:", selectedItem.AlimEtiqueta);
      setFeederCode(String(selectedItem.AlimEtiqueta));
      return;
    }

    // 3️⃣ buscar en DB por AlimInterno
    if (alimInt != null) {
      (async () => {
        console.log("[DefMedia] Buscando feeder por alimInt:", alimInt);
        const found = await findFeederById(alimInt);

        console.log("[DefMedia] resultado findFeederById:", found);

        if (found) {
          const alias =
            found.AlimEtiqueta ??
            found.alimEtiqueta ??
            found.Descripcion ??
            found.descripcion ??
            found.name ??
            alimInt;

          console.log("[DefMedia] feederCode final desde DB:", alias);
          setFeederCode(String(alias));
        } else {
          console.log(
            "[DefMedia] NO se encontró alimentador en DB, se usa solo id:",
            alimInt
          );
          setFeederCode(String(alimInt));
        }
      })();

      return;
    }

    console.log("[DefMedia] SIN_ALIM (no se pudo resolver alimentador)");
    setFeederCode("SIN_ALIM");
  }, [selectedFeeder, selectedItem, findFeederById]);

  // Código de SED
  const sedCode =
    typeof selectedSed === "string"
      ? selectedSed
      : selectedSed?.SedCodi ||
      selectedSed?.SedCodigo ||
      selectedItem?.SedCodi ||
      selectedItem?.SedCodigo ||
      "SIN_SED";

  console.log("[DefMedia] sedCode usado para carpeta:", {
    selectedSed,
    selectedItemSed: {
      SedInterno: selectedItem?.SedInterno,
      SedCodi: selectedItem?.SedCodi,
      SedCodigo: selectedItem?.SedCodigo,
    },
    sedCode,
  });

  // Tipo de elemento
  const tipoElemento =
    selectedItem?.PostCodigoNodo
      ? "Poste"
      : selectedItem?.VanoCodigo
        ? "Vano"
        : selectedItem?.SedCodigo
          ? "Subestacion"
          : "Desconocido";

  // Código de deficiencia
  const deficiencyCode = (defCode || "DEF_SIN_COD").toString();

  // Actualizamos PATH_CONFIG
  PATH_CONFIG.proyecto = projectCode;
  PATH_CONFIG.alimentador = feederCode;
  PATH_CONFIG.subestacion = sedCode;
  PATH_CONFIG.tipoElemento = tipoElemento;
  PATH_CONFIG.elemento = elementCode;
  PATH_CONFIG.deficiencia = deficiencyCode;

  // Ruta base solo para log
  const rutaBase = [
    "SIGRE",
    projectCode,
    feederCode,
    sedCode,
    tipoElemento,
    elementCode,
    deficiencyCode,
  ].join("/");
  console.log("[DefMedia] rutaBase:", rutaBase);

  // 📸 Fotos: 6 slots fijos
  const [photos, setPhotos] = useState(Array(6).fill(null));
  const [photoThumbs, setPhotoThumbs] = useState(Array(6).fill(null));
  const [photoMeta, setPhotoMeta] = useState(Array(6).fill(null));

  // 🎤 Audios
  const [audios, setAudios] = useState([]);
  const [audioProgress, setAudioProgress] = useState([]);
  const [audioMeta, setAudioMeta] = useState([]);

  // 📷 Cámara
  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraRef, setCameraRef] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  // 🎤 Grabación
  const [recording, setRecording] = useState(null);

  // 🔊 Reproducción
  const [sound, setSound] = useState(null);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  // 🔴 Indicador REC
  const [blink, setBlink] = useState(true);
  useEffect(() => {
    if (!recording) {
      setBlink(true);
      return;
    }
    const id = setInterval(() => setBlink((b) => !b), 500);
    return () => clearInterval(id);
  }, [recording]);


  // Modal fotos
  const [showModal, setShowModal] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const [currentSlotIndex, setCurrentSlotIndex] = useState(null); // 0..5
  const [captureMode, setCaptureMode] = useState(null); // "sequence" | "single"
  const [capturedPhoto, setCapturedPhoto] = useState(null); // { uri, meta }
  const [isPreview, setIsPreview] = useState(false);
  const [zoom, setZoom] = useState(0);

  const [initialSnapshot, setInitialSnapshot] = useState(null);

  const restoreInitialSnapshot = async () => {
    if (!initialSnapshot) return;

    setPhotos([...(initialSnapshot.photos ?? Array(6).fill(null))]);
    setPhotoThumbs([...(initialSnapshot.photoThumbs ?? Array(6).fill(null))]);
    setPhotoMeta([...(initialSnapshot.photoMeta ?? Array(6).fill(null))]);


    setAudios([...(initialSnapshot.audios ?? [])]);
    setAudioProgress([...(initialSnapshot.audioProgress ?? [])]);
    setAudioMeta([...(initialSnapshot.audioMeta ?? [])]);


    setCurrentArchCodTabla(initialSnapshot.archCodTabla ?? null);

    // limpia estados de cámara/visor por seguridad
    setShowModal(false);
    setCameraVisible(false);
    setCaptureMode(null);
    setCurrentSlotIndex(null);
    setCapturedPhoto(null);
    setIsPreview(false);
    setIsCameraReady(false);
    setIsTakingPhoto(false);
  };


  // ================================
  // HELPERS
  // ================================
  function findNextRequiredSlot(startIndex = 0, currentPhotos = photos) {
    for (let i = startIndex; i < REQUIRED_SLOTS.length; i++) {
      const idx = REQUIRED_SLOTS[i];
      if (!currentPhotos[idx]) {
        return idx;
      }
    }
    return null;
  }

  // ================================
  // CARGAR MEDIA (SIEMPRE QUE LA PANTALLA ENTRE EN FOCO)
  // ================================
  const loadExistingMedia = useCallback(async () => {
    if (!feederCode || feederCode === "SIN_ALIM") return;

    console.log("[DefMedia] 🔄 loadExistingMedia() RUN", {
      projectCode,
      feederCode,
      sedCode,
      tipoElemento,
      elementCode,
      deficiencyCode,
      t: new Date().toISOString(),
    });

    try {
      const rootUri = await getRootUri();
      if (!rootUri) return;

      // Directorios activos (SIGRE)
      const fotosUri = await getMediaDirUri(rootUri, "SIGRE", "Fotos", false);
      const audiosUri = await getMediaDirUri(rootUri, "SIGRE", "Audios", false);

      // Archivos físicos en las carpetas
      const photoUris = await safeReadDirectory(fotosUri);
      const audioUris = await safeReadDirectory(audiosUri);

      const baseRelative = [
        "SIGRE",
        PATH_CONFIG.proyecto,
        PATH_CONFIG.alimentador,
        PATH_CONFIG.subestacion,
        PATH_CONFIG.tipoElemento,
        PATH_CONFIG.elemento,
        PATH_CONFIG.deficiencia,
      ].join("/");

      const fotosPrefix = `${baseRelative}/Fotos/`;
      const audiosPrefix = `${baseRelative}/Audios/`;

      const dbPhotoRows = await getArchivosByBasePath(fotosPrefix);
      const dbAudioRows = await getArchivosByBasePath(audiosPrefix);

      console.log("[DefMedia] dbPhotoRows:", dbPhotoRows);
      console.log("[DefMedia] dbAudioRows:", dbAudioRows);

      const archCodFromDb =
        dbPhotoRows[0]?.ArchCodTabla ?? dbAudioRows[0]?.ArchCodTabla ?? null;

      setCurrentArchCodTabla(archCodFromDb != null ? Number(archCodFromDb) : null);

      let finalPhotos = Array(6).fill(null);
      let finalThumbs = Array(6).fill(null);
      let finalPhotoMeta = Array(6).fill(null);

      let finalAudios = [];
      let finalAudioMeta = [];
      let finalAudioProgress = [];

      // --- FOTOS ---
      if (dbPhotoRows && dbPhotoRows.length > 0) {
        const slots = Array(6).fill(null);
        const metaSlots = Array(6).fill(null);
        const thumbSlots = Array(6).fill(null);
        const initialPhotoRecs = [];

        for (const row of dbPhotoRows) {
          const slotNum = parseInt(row.ArchTipo, 10);
          if (!Number.isFinite(slotNum) || slotNum < 1 || slotNum > 6) continue;

          const fileName = row.ArchNombre.split("/").pop();
          const uri = photoUris.find((u) => getFileName(u) === fileName);

          if (!uri) continue;

          const ts = extractTimestampFromFileName(fileName);

          slots[slotNum - 1] = uri;
          metaSlots[slotNum - 1] = {
            latitude: row.ArchLatitud ?? null,
            longitude: row.ArchLongitud ?? null,
            archFech: row.ArchFecha ?? null,
            fileTimestamp: ts,
            archInterno: row.ArchInterno,
            originalRelativePath: row.ArchNombre,
            isExisting: true,
          };

          try {
            const base64 = await readFileAsBase64Generic(uri);
            thumbSlots[slotNum - 1] = `data:image/jpeg;base64,${base64}`;
          } catch {
            thumbSlots[slotNum - 1] = uri;
          }

          initialPhotoRecs.push({
            ArchInterno: row.ArchInterno,
            ArchTipo: row.ArchTipo,
            ArchNombre: row.ArchNombre,
            ArchCodTabla: row.ArchCodTabla,
          });
        }

        setPhotos(slots);
        setPhotoThumbs(thumbSlots);
        setPhotoMeta(metaSlots);
        setInitialPhotoRecords(initialPhotoRecs);

        finalPhotos = slots;
        finalThumbs = thumbSlots;
        finalPhotoMeta = metaSlots;
      } else {
        // fallback: leer desde carpeta si no hay DB
        const slots = Array(6).fill(null);

        for (const uri of photoUris) {
          const name = getFileName(uri);
          const match = name.match(/-(\d+)\.(jpg|jpeg|png)$/i);
          if (match) {
            const pos = parseInt(match[1], 10);
            if (pos >= 1 && pos <= 6 && !slots[pos - 1]) {
              slots[pos - 1] = uri;
              continue;
            }
          }
          const freeIndex = slots.findIndex((s) => !s);
          if (freeIndex !== -1) slots[freeIndex] = uri;
        }

        const thumbSlots = Array(6).fill(null);
        for (let i = 0; i < slots.length; i++) {
          const uri = slots[i];
          if (!uri) continue;
          try {
            const base64 = await readFileAsBase64Generic(uri);
            thumbSlots[i] = `data:image/jpeg;base64,${base64}`;
          } catch {
            thumbSlots[i] = uri;
          }
        }

        setPhotos(slots);
        setPhotoThumbs(thumbSlots);
        setPhotoMeta(Array(6).fill(null));
        setInitialPhotoRecords([]);

        finalPhotos = slots;
        finalThumbs = thumbSlots;
        finalPhotoMeta = Array(6).fill(null);
      }

      // --- AUDIOS (lo dejo igual que tu lógica actual) ---
      if (dbAudioRows && dbAudioRows.length > 0) {
        const audioList = [];
        const audioMetaList = [];
        const initialAudioRecs = [];

        for (const row of dbAudioRows) {
          const fileName = row.ArchNombre.split("/").pop();
          const uri = audioUris.find((u) => getFileName(u) === fileName);
          if (!uri) continue;

          const ts = extractTimestampFromFileName(fileName);

          audioList.push(uri);
          audioMetaList.push({
            latitude: row.ArchLatitud ?? null,
            longitude: row.ArchLongitud ?? null,
            archFech: row.ArchFecha ?? null,
            fileTimestamp: ts,
            archInterno: row.ArchInterno,
            originalRelativePath: row.ArchNombre,
            isExisting: true,
          });

          initialAudioRecs.push({
            ArchInterno: row.ArchInterno,
            ArchTipo: row.ArchTipo,
            ArchNombre: row.ArchNombre,
            ArchCodTabla: row.ArchCodTabla,
          });
        }

        setAudios(audioList);
        setAudioProgress(audioList.map(() => ({ position: 0, duration: 1 })));
        setAudioMeta(audioMetaList);
        setInitialAudioRecords(initialAudioRecs);

        finalAudios = audioList;
        finalAudioMeta = audioMetaList;
        finalAudioProgress = audioList.map(() => ({ position: 0, duration: 1 }));
      } else {
        setAudios(audioUris);
        setAudioProgress(audioUris.map(() => ({ position: 0, duration: 1 })));
        setAudioMeta(audioUris.map(() => null));
        setInitialAudioRecords([]);

        finalAudios = audioUris;
        finalAudioMeta = audioUris.map(() => null);
        finalAudioProgress = audioUris.map(() => ({ position: 0, duration: 1 }));
      }

      // ✅ snapshot SIEMPRE desde lo que está realmente en disco/DB
      setInitialSnapshot({
        photos: [...finalPhotos],
        photoThumbs: [...finalThumbs],
        photoMeta: [...finalPhotoMeta],
        audios: [...finalAudios],
        audioMeta: [...finalAudioMeta],
        audioProgress: [...finalAudioProgress],
        archCodTabla: archCodFromDb != null ? Number(archCodFromDb) : null,
      });
    } catch (err) {
      console.log("Error inicializando media:", err);
    }
  }, [
    projectCode,
    feederCode,
    sedCode,
    tipoElemento,
    elementCode,
    deficiencyCode,
    getArchivosByBasePath,
  ]);

  useFocusEffect(
    useCallback(() => {
      loadExistingMedia();
      return () => { };
    }, [loadExistingMedia])
  );


  // ================================
  // 📸 TOMAR FOTO
  // ================================
  const takePhoto = async () => {
    if (!cameraRef || currentSlotIndex === null) return;
    if (!isCameraReady || isTakingPhoto) {
      return;
    }

    setIsTakingPhoto(true);

    try {
      const gpsOk = await ensureGpsReady();
      if (!gpsOk) return;

      const position = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = position.coords || {};

      const result = await cameraRef.takePictureAsync({
        quality: 1,
        ratio: "16:9",
        skipProcessing: false,
      });

      const uri = result.uri;
      const ahora = new Date();
      const timestamp = formatFileTimestampMs();

      const meta = {
        utmText:
          latitude != null && longitude != null
            ? formatUtmFromLatLon(latitude, longitude)
            : "",
        fechaLegible: formatWatermarkDate(ahora),
        latitude: latitude || null,
        longitude: longitude || null,
        archFech: formatDateTimeSQLite(ahora),
        fileTimestamp: timestamp,
      };

      setCapturedPhoto({ uri, meta });
      setIsPreview(true);
    } catch (err) {
      Alert.alert("Error", "No se pudo capturar la foto. Inténtalo nuevamente.");
    } finally {
      setIsTakingPhoto(false);
    }
  };

  const retryCapture = () => {
    if (capturedPhoto?.uri) {
      FS.deleteAsync(capturedPhoto.uri, { idempotent: true }).catch(() => { });
    }
    setCapturedPhoto(null);
    setIsPreview(false);
  };

  const confirmCapturedPhoto = async () => {
    if (!capturedPhoto || currentSlotIndex === null) return;

    const srcUri = capturedPhoto.uri;
    let thumbUri = srcUri;

    try {
      if (srcUri.startsWith("file://")) {
        const base64 = await FS.readAsStringAsync(srcUri, {
          encoding: "base64",
        });
        thumbUri = `data:image/jpeg;base64,${base64}`;
      }
    } catch (err) {
      console.log("⚠️ Error generando thumbnail:", err);
    }

    setPhotos((prev) => {
      const copy = [...prev];
      copy[currentSlotIndex] = srcUri;
      return copy;
    });

    setPhotoThumbs((prev) => {
      const copy = [...prev];
      copy[currentSlotIndex] = thumbUri;
      return copy;
    });

    setPhotoMeta((prev) => {
      const copy = [...prev];
      copy[currentSlotIndex] = capturedPhoto.meta;
      return copy;
    });

    const nextStatePhotos = ((prev) => {
      const copy = [...prev];
      copy[currentSlotIndex] = srcUri;
      return copy;
    })(photos);

    setCapturedPhoto(null);
    setIsPreview(false);

    if (captureMode === "sequence") {
      const nextIndex = findNextRequiredSlot(
        REQUIRED_SLOTS.indexOf(currentSlotIndex) + 1,
        nextStatePhotos
      );
      if (nextIndex !== null) {
        setCurrentSlotIndex(nextIndex);
      } else {
        setCameraVisible(false);
        setCaptureMode(null);
        setCurrentSlotIndex(null);
      }
    } else {
      setCameraVisible(false);
      setCaptureMode(null);
      setCurrentSlotIndex(null);
    }
  };

  // ================================
  // 📷 MODAL FOTO
  // ================================
  const openPhoto = (index) => {
    setSelectedPhotoIndex(index);
    setShowModal(true);
  };

  const deletePhoto = async () => {
    const uri = photos[selectedPhotoIndex];
    const meta = photoMeta[selectedPhotoIndex];

    if (!meta || !meta.archInterno) {
      try {
        if (uri && uri.startsWith("file://")) {
          await FS.deleteAsync(uri, { idempotent: true });
        }
      } catch (err) {
        console.log("⚠️ Error borrando foto temporal:", err);
      }
    } else {
      console.log(
        "[DefMedia] Foto marcada para borrar (DB): ArchInterno=",
        meta.archInterno
      );
    }

    setPhotos((prev) => {
      const copy = [...prev];
      copy[selectedPhotoIndex] = null;
      return copy;
    });

    setPhotoMeta((prev) => {
      const copy = [...prev];
      copy[selectedPhotoIndex] = null;
      return copy;
    });

    setPhotoThumbs((prev) => {
      const copy = [...prev];
      copy[selectedPhotoIndex] = null;
      return copy;
    });

    setShowModal(false);
  };

  // ================================
  // 🎤 AUDIO (grabar)
  // ================================
  const startRecording = async () => {
    try {
      const gpsOk = await ensureGpsReady();
      if (!gpsOk) return;

      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setCurrentAudioIndex(null);
      }

      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
    } catch (err) {
      //console.log("Error al iniciar grabación:", err);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) return;

      let latitude = null;
      let longitude = null;
      try {
        const position = await Location.getCurrentPositionAsync({});
        latitude = position.coords?.latitude ?? null;
        longitude = position.coords?.longitude ?? null;
      } catch (err) { }

      const ahora = new Date();
      const timestamp = formatFileTimestampMs();

      setAudios((prev) => [...prev, uri]);
      setAudioProgress((prev) => [...prev, { position: 0, duration: 1 }]);

      setAudioMeta((prev) => [
        ...prev,
        {
          latitude,
          longitude,
          archFech: formatDateTimeSQLite(ahora),
          fileTimestamp: timestamp,
        },
      ]);

      setRecording(null);
    } catch (err) {
      //console.log("Error al detener grabación:", err);
    }
  };

  // ================================
  // 🔊 REPRODUCCIÓN
  // ================================
  const onPlaybackStatusUpdate = (status, index) => {
    if (!status || !status.isLoaded) return;

    setAudioProgress((prev) => {
      const updated = [...prev];
      updated[index] = {
        position: status.positionMillis || 0,
        duration: status.durationMillis || 1,
      };
      return updated;
    });

    if (status.didJustFinish) {
      setAudioProgress((prev) => {
        const updated = [...prev];
        updated[index] = {
          position: 0,
          duration: status.durationMillis || 1,
        };
        return updated;
      });
      setCurrentAudioIndex(null);
    }
  };

  const playAudio = async (uri, index) => {
    try {
      if (currentAudioIndex === index && sound && isPaused) {
        await sound.playAsync();
        setIsPaused(false);
        return;
      }

      if (currentAudioIndex === index && sound && !isPaused) {
        await sound.pauseAsync();
        setIsPaused(true);
        return;
      }

      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      // 👇 preparar URI reproducible (content:// → file:// temporal usando copyAsync)
      let playableUri = uri;
      if (uri && uri.startsWith("content://")) {
        try {
          const fileName = getFileName(uri) || `audio_${Date.now()}.m4a`;
          const tempUri = `${FS.cacheDirectory}${fileName}`;

          // copiamos directamente el binario, sin base64
          await FS.copyAsync({ from: uri, to: tempUri });

          playableUri = tempUri;
        } catch (copyErr) {
          console.log("⚠️ Error copiando audio para reproducir:", copyErr);
        }
      }


      const newSound = new Audio.Sound();
      await newSound.loadAsync(
        { uri: playableUri },
        {
          shouldPlay: true,
          positionMillis: audioProgress[index]?.position || 0,
        }
      );

      const status = await newSound.getStatusAsync();

      setAudioProgress((prev) => {
        const updated = [...prev];
        updated[index] = {
          position: audioProgress[index]?.position || 0,
          duration: status.durationMillis || 1,
        };
        return updated;
      });

      newSound.setOnPlaybackStatusUpdate((s) =>
        onPlaybackStatusUpdate(s, index)
      );

      setSound(newSound);
      setCurrentAudioIndex(index);
      setIsPaused(false);
    } catch (e) {
      //console.log("Error play:", e);
    }
  };

  const seekAudio = async (value, index) => {
    if (index !== currentAudioIndex) return;
    if (sound) {
      await sound.setPositionAsync(value);
    }
    setAudioProgress((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        position: value,
      };
      return updated;
    });
  };

  const formatTime = (ms) => {
    if (!ms || ms < 1000) return "00:00";
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // Nombre que se muestra para el audio (lo que pediste)
  const getAudioDisplayName = (index, uri) => {
    const meta = audioMeta[index];
    if (meta?.fileTimestamp) {
      return `AUD-${meta.fileTimestamp}-0.m4a`;
    }
    return getFileName(uri);
  };

  const deleteAudio = async (index) => {
    const uri = audios[index];
    const meta = audioMeta[index];

    if (!meta || !meta.archInterno) {
      try {
        if (uri && uri.startsWith("file://")) {
          await FS.deleteAsync(uri, { idempotent: true });
        }
      } catch (err) {
        console.log("⚠️ Error al eliminar audio temporal:", err);
      }
    } else {
      console.log(
        "[DefMedia] Audio marcado para borrar (DB): ArchInterno=",
        meta.archInterno
      );
    }

    setAudios((prev) => prev.filter((_, i) => i !== index));
    setAudioProgress((prev) => prev.filter((_, i) => i !== index));
    setAudioMeta((prev) => prev.filter((_, i) => i !== index));

    if (currentAudioIndex === index) {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }
      setCurrentAudioIndex(null);
      setSound(null);
    } else if (currentAudioIndex !== null && currentAudioIndex > index) {
      setCurrentAudioIndex(currentAudioIndex - 1);
    }
  };

  // ================================
  // 💾 GUARDAR
  // ================================
  const confirmStopRecording = async () => {
    if (!recording) return true;

    return new Promise((resolve) => {
      Alert.alert(
        "Grabación en curso",
        "Hay una grabación activa. ¿Deseas detenerla antes de salir?",
        [
          { text: "No", style: "cancel", onPress: () => resolve(false) },
          {
            text: "Sí, detener",
            onPress: async () => {
              await stopRecording();
              resolve(true);
            },
          },
        ]
      );
    });
  };

  const handleSave = async () => {
    const okRec = await confirmStopRecording();
    if (!okRec) return;

    const gpsOk = await ensureGpsReady();
    if (!gpsOk) return;

    try {
      const rootUri = await getRootUri();
      if (!rootUri) {
        Alert.alert("Error", "No se eligió carpeta raíz SIGRE.");
        return;
      }

      // ✅ Detectar QUÉ se va a escribir realmente
      const newPhotoItems = [];
      for (let i = 0; i < photos.length; i++) {
        const uri = photos[i];
        const meta = photoMeta[i];
        const isNew = uri && uri.startsWith("file://") && (!meta || !meta.archInterno);
        if (isNew) newPhotoItems.push({ index: i, uri, meta: meta || {} });
      }

      const newAudioItems = [];
      for (let i = 0; i < audios.length; i++) {
        const uri = audios[i];
        const meta = audioMeta[i];
        const isNew = uri && uri.startsWith("file://") && (!meta || !meta.archInterno);
        if (isNew) newAudioItems.push({ index: i, uri, meta: meta || {} });
      }

      const willWritePhotos = newPhotoItems.length > 0;
      const willWriteAudios = newAudioItems.length > 0;

      // ✅ Obtener URIs existentes SIN crear
      const fotosUriExisting = await getMediaDirUri(rootUri, "SIGRE", "Fotos", false);
      const audiosUriExisting = await getMediaDirUri(rootUri, "SIGRE", "Audios", false);

      // ✅ Crear SOLO si toca escribir
      const fotosUri = willWritePhotos
        ? (fotosUriExisting || await getMediaDirUri(rootUri, "SIGRE", "Fotos", true))
        : fotosUriExisting;

      const audiosUri = willWriteAudios
        ? (audiosUriExisting || await getMediaDirUri(rootUri, "SIGRE", "Audios", true))
        : audiosUriExisting;

      // ✅ Listado físico SOLO si la carpeta existe
      const photoUris = await safeReadDirectory(fotosUriExisting);
      const audioUris = await safeReadDirectory(audiosUriExisting);

      const position = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = position.coords || {};

      let archCodTabla = currentArchCodTabla;
      if (archCodTabla == null) {
        archCodTabla = await getNextArchCodTabla();
      }
      console.log("[DefMedia] handleSave ArchCodTabla usado:", archCodTabla);

      const keptArchInternos = new Set();

      // ==========================
      // 📸 FOTOS - guardar nuevas
      // ==========================
      if (willWritePhotos && !fotosUri) {
        throw new Error("No se pudo crear/obtener carpeta Fotos.");
      }

      for (const item of newPhotoItems) {
        const i = item.index;
        const srcUri = item.uri;
        const meta = item.meta;
        const slotSuffix = i + 1;

        const timestamp = meta.fileTimestamp || formatFileTimestampMs();
        const fileName = `FOT-${timestamp}-${slotSuffix}.jpg`;

        const destFileUri = await getUniqueSafFileUri(
          fotosUri,
          fileName,
          "image/jpeg"
        );

        const base64 = await readFileAsBase64Generic(srcUri);
        await SAF.writeAsStringAsync(destFileUri, base64, { encoding: "base64" });

        const relativePath = buildRelativePath("Fotos", fileName);
        const archFech = meta.archFech || formatDateTimeSQLite(new Date());

        await saveArchivoLocal({
          archTipo: slotSuffix,
          archTabla: "Deficiencias",
          archCodTabla,
          archNombre: relativePath,
          archLatit: meta.latitude ?? latitude ?? null,
          archLong: meta.longitude ?? longitude ?? null,
          archFech,
          archActiv: 1,
        });

        await safeDeleteUri(srcUri);
      }


      // ==========================
      // 🎤 AUDIOS - guardar nuevos (sin tocar si no hay nuevos)
      // ==========================
      if (willWriteAudios && !audiosUri) {
        throw new Error("No se pudo crear/obtener carpeta Audios.");
      }

      for (const item of newAudioItems) {
        const srcUri = item.uri;
        const meta = item.meta || {};

        const timestamp = meta.fileTimestamp || formatFileTimestampMs();
        const requestedName = `AUD-${timestamp}-0.m4a`;

        const destFileUri = await getUniqueSafFileUri(
          audiosUri,
          requestedName,
          "audio/mp4"
        );

        // ✅ nombre REAL (puede venir con " (2)")
        const realFileName = getNameFromSafUri(destFileUri);

        const base64 = await readFileAsBase64Generic(srcUri);
        await SAF.writeAsStringAsync(destFileUri, base64, { encoding: "base64" });

        const relativePath = buildRelativePathWithRoot("SIGRE", "Audios", realFileName);
        const archFech = meta.archFech || formatDateTimeSQLite(new Date());

        await saveArchivoLocal({
          archTipo: 0,
          archTabla: "Deficiencias",
          archCodTabla,
          archNombre: relativePath,
          archLatit: meta.latitude ?? latitude ?? null,
          archLong: meta.longitude ?? longitude ?? null,
          archFech,
          archActiv: 1,
        });

        await safeDeleteUri(srcUri);
      }


      // ==========================
      // ✅ Determinar qué EXISTENTES se mantienen
      // (en base a meta.archInterno actual)
      // ==========================
      for (let i = 0; i < photoMeta.length; i++) {
        const m = photoMeta[i];
        if (m?.archInterno) keptArchInternos.add(m.archInterno);
      }
      for (let i = 0; i < audioMeta.length; i++) {
        const m = audioMeta[i];
        if (m?.archInterno) keptArchInternos.add(m.archInterno);
      }

      // ==========================
      // 🗑️ BORRADOS (solo carpeta necesaria)
      // ==========================
      const toDeletePhotoRecords = initialPhotoRecords.filter(
        (r) => !keptArchInternos.has(r.ArchInterno)
      );
      const toDeleteAudioRecords = initialAudioRecords.filter(
        (r) => !keptArchInternos.has(r.ArchInterno)
      );

      console.log("[DefMedia] Fotos a borrar (DB):", toDeletePhotoRecords);
      console.log("[DefMedia] Audios a borrar (DB):", toDeleteAudioRecords);

      // --- Fotos borradas ---
      let borradosFotosUri = null;

      for (const rec of toDeletePhotoRecords) {
        const fileName = rec.ArchNombre.split("/").pop();
        const srcUri = photoUris.find((u) => getFileName(u) === fileName);
        const newRelative = rec.ArchNombre.replace(/^SIGRE/, "BORRADOS");

        // ✅ Solo crear BORRADOS/Fotos si hay archivo físico para mover
        if (srcUri) {
          if (!borradosFotosUri) {
            borradosFotosUri = await getMediaDirUri(rootUri, "BORRADOS", "Fotos", true);
          }

          try {
            const destFileUri = await getUniqueSafFileUri(
              borradosFotosUri,
              fileName,
              "image/jpeg"
            );

            const base64 = await readFileAsBase64Generic(srcUri);
            await SAF.writeAsStringAsync(destFileUri, base64, { encoding: "base64" });

            await safeDeleteUri(srcUri);
          } catch (err) {
            console.log("⚠️ Error moviendo foto a BORRADOS:", rec.ArchNombre, err);
          }
        } else {
          console.log("[DefMedia] Foto para BORRADOS sin archivo físico:", rec.ArchNombre);
        }

        await markArchivoAsDeleted(rec.ArchInterno, newRelative);
      }

      // --- Audios borrados ---
      let borradosAudiosUri = null;

      for (const rec of toDeleteAudioRecords) {
        const fileName = rec.ArchNombre.split("/").pop();
        const srcUri = audioUris.find((u) => getFileName(u) === fileName);

        let newRelative = rec.ArchNombre.replace(/^SIGRE/, "BORRADOS"); // fallback

        // ✅ Solo si hay archivo físico, lo movemos y actualizamos ruta REAL
        if (srcUri) {
          if (!borradosAudiosUri) {
            borradosAudiosUri = await getMediaDirUri(rootUri, "BORRADOS", "Audios", true);
          }

          try {
            const destFileUri = await getUniqueSafFileUri(
              borradosAudiosUri,
              fileName,
              "audio/mp4"
            );

            const realFileName = getNameFromSafUri(destFileUri);

            const base64 = await readFileAsBase64Generic(srcUri);
            await SAF.writeAsStringAsync(destFileUri, base64, { encoding: "base64" });

            await safeDeleteUri(srcUri);

            // ✅ DB debe reflejar el nombre REAL en BORRADOS
            newRelative = buildRelativePathWithRoot("BORRADOS", "Audios", realFileName);
          } catch (err) {
            console.log("⚠️ Error moviendo audio a BORRADOS:", rec.ArchNombre, err);
          }
        } else {
          console.log("[DefMedia] Audio para BORRADOS sin archivo físico:", rec.ArchNombre);
        }

        await markArchivoAsDeleted(rec.ArchInterno, newRelative);
      }


      Alert.alert("Listo", "Cambios guardados en la carpeta pública.");
      router.replace("/(drawer)/inspection");
    } catch (err) {
      console.log("Error guardando en SAF:", err);
      Alert.alert("Error", "No se pudo guardar.");
    }
  };




  // Limpieza de archivos temporales al cancelar
  const cleanupNewMedia = async () => {
    try {
      // fotos nuevas (sin archInterno, file://)
      for (let i = 0; i < photos.length; i++) {
        const uri = photos[i];
        const meta = photoMeta[i];
        if (uri && uri.startsWith("file://") && (!meta || !meta.archInterno)) {
          try {
            await FS.deleteAsync(uri, { idempotent: true });
          } catch (err) {
            console.log("⚠️ Error limpiando foto temporal en Cancelar:", err);
          }
        }
      }

      // audios nuevos (sin archInterno, file://)
      for (let i = 0; i < audios.length; i++) {
        const uri = audios[i];
        const meta = audioMeta[i];
        if (uri && uri.startsWith("file://") && (!meta || !meta.archInterno)) {
          try {
            await FS.deleteAsync(uri, { idempotent: true });
          } catch (err) {
            console.log("⚠️ Error limpiando audio temporal en Cancelar:", err);
          }
        }
      }
    } catch (err) {
      console.log("⚠️ Error en cleanupNewMedia:", err);
    }
  };

  const handleSlotPress = (index) => {
    const uri = photos[index];
    if (uri) {
      openPhoto(index);
    } else {
      if (!permission?.granted) {
        requestPermission();
        return;
      }
      setCaptureMode("single");
      setCurrentSlotIndex(index);
      setCapturedPhoto(null);
      setIsPreview(false);
      setIsCameraReady(false);
      setIsTakingPhoto(false);
      setCameraVisible(true);
    }
  };

  const canSave = photos[0] && photos[1] && photos[2] && photos[3];

  // Fotos para el visor: usar thumbs (base64) cuando existan
  const viewerPhotos = photos.map((p, idx) => photoThumbs[idx] || p);
  const nonEmptyPhotos = viewerPhotos.filter((p) => !!p);
  const selectedViewerUri =
    photoThumbs[selectedPhotoIndex] ||
    photos[selectedPhotoIndex] ||
    null;
  const initialIndex =
    selectedViewerUri && nonEmptyPhotos.length > 0
      ? nonEmptyPhotos.findIndex((u) => u === selectedViewerUri)
      : 0;

  // ================================
  // UI
  // ================================
  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      {/* 📷 CÁMARA FULL SCREEN */}
      {cameraVisible && (
        <Modal
          visible={cameraVisible}
          transparent={false}
          animationType="slide"
          onRequestClose={() => {
            setCameraVisible(false);
            setCaptureMode(null);
            setCurrentSlotIndex(null);
            setCapturedPhoto(null);
            setIsPreview(false);
            setIsCameraReady(false);
            setIsTakingPhoto(false);
          }}
        >
          <View style={styles.cameraOverlay}>
            <Text style={styles.cameraTitle}>
              {currentSlotIndex !== null
                ? `Foto ${SLOT_LABELS[currentSlotIndex]}`
                : "Foto"}
            </Text>

            {!isPreview ? (
              <CameraView
                style={styles.cameraLive}
                ref={setCameraRef}
                mode="picture"
                enableHighQualityPhotos
                ratio="16:9"
                zoom={zoom}
                onCameraReady={() => setIsCameraReady(true)}
              />
            ) : (
              capturedPhoto && (
                <Image
                  source={{ uri: capturedPhoto.uri }}
                  style={styles.cameraLive}
                  resizeMode="contain"
                />
              )
            )}

            {!isPreview && (
              <View style={styles.zoomContainer}>
                <Text style={{ color: "white", marginBottom: 4 }}>Zoom</Text>
                <Slider
                  style={{ width: "80%" }}
                  minimumValue={0}
                  maximumValue={1}
                  value={zoom}
                  onValueChange={setZoom}
                  minimumTrackTintColor="#fff"
                  maximumTrackTintColor="#555"
                  thumbTintColor="#fff"
                />
              </View>
            )}

            <View style={styles.cameraButtonsRow}>
              <TouchableOpacity
                style={styles.cameraCloseBtnRow}
                onPress={() => {
                  setCameraVisible(false);
                  setCaptureMode(null);
                  setCurrentSlotIndex(null);
                  setCapturedPhoto(null);
                  setIsPreview(false);
                  setIsCameraReady(false);
                  setIsTakingPhoto(false);
                }}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  Cerrar
                </Text>
              </TouchableOpacity>

              {!isPreview ? (
                <TouchableOpacity
                  style={styles.captureButtonCircle}
                  onPress={takePhoto}
                >
                  <View style={styles.captureInnerCircle} />
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.cameraSecondaryBtn}
                    onPress={retryCapture}
                  >
                    <Text style={styles.cameraSecondaryText}>Repetir</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cameraPrimaryBtn}
                    onPress={confirmCapturedPhoto}
                  >
                    <Text style={styles.cameraPrimaryText}>
                      {captureMode === "single" || currentSlotIndex === 3
                        ? "Aceptar"
                        : "Siguiente"}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* MODAL FOTO */}
        <Modal
          visible={showModal}
          transparent
          onRequestClose={() => setShowModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: "black" }}>
            <ImageViewer
              imageUrls={nonEmptyPhotos.map((p) => ({ url: p }))}
              index={initialIndex < 0 ? 0 : initialIndex}
              enableSwipeDown
              onSwipeDown={() => setShowModal(false)}
              saveToLocalByLongPress={false}
            />

            <TouchableOpacity onPress={deletePhoto} style={styles.modalDelete}>
              <Text style={{ color: "white", fontWeight: "bold" }}>
                Eliminar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowModal(false)}
              style={styles.modalClose}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* FOTOS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📸 Fotografías</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              if (!permission?.granted) {
                requestPermission();
                return;
              }

              const firstEmpty = findNextRequiredSlot(0);
              if (firstEmpty === null) {
                Alert.alert(
                  "Fotos completas",
                  "Ya tomaste las 4 fotos obligatorias (Frontal, P. derecho, P. izquierdo y Panorámico)."
                );
                return;
              }

              setCaptureMode("sequence");
              setCurrentSlotIndex(firstEmpty);
              setCapturedPhoto(null);
              setIsPreview(false);
              setIsCameraReady(false);
              setIsTakingPhoto(false);
              setCameraVisible(true);
            }}
          >
            <Text style={styles.buttonText}>Tomar foto</Text>
          </TouchableOpacity>

          <ScrollView horizontal style={styles.carousel}>
            {Array.from({ length: 6 }).map((_, i) => {
              const uri = photos[i];
              const thumbUri = photoThumbs[i] || uri;
              const meta = photoMeta[i];

              return (
                <View key={i} style={{ marginRight: 10, alignItems: "center" }}>
                  <TouchableOpacity
                    onPress={() => handleSlotPress(i)}
                    style={[
                      styles.photoSlot,
                      !thumbUri && styles.photoSlotEmpty,
                    ]}
                  >
                    {thumbUri ? (
                      <Image
                        source={{ uri: thumbUri }}
                        style={styles.photo}
                        resizeMode="cover"
                        onError={(e) =>
                          console.log(
                            "❌ Error cargando miniatura",
                            thumbUri,
                            e.nativeEvent
                          )
                        }
                      />
                    ) : (
                      <Text style={styles.plusText}>+</Text>
                    )}
                  </TouchableOpacity>

                  <Text style={styles.slotLabel}>{SLOT_LABELS[i]}</Text>

                  {meta?.fileTimestamp && (
                    <Text style={{ fontSize: 10, textAlign: "center" }}>
                      {`FOT-${meta.fileTimestamp}-${i + 1}.jpg`}
                    </Text>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* AUDIOS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎤 Audios</Text>

          {!recording ? (
            <TouchableOpacity style={styles.buttonGreen} onPress={startRecording}>
              <Text style={styles.buttonText}>REC</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.buttonRed} onPress={stopRecording}>
              <Text style={styles.buttonText}>STOP</Text>
            </TouchableOpacity>
          )}

          {recording && (
            <View style={styles.recordingRow}>
              <View
                style={[
                  styles.recDot,
                  { backgroundColor: blink ? "red" : "transparent" },
                ]}
              />
              <Text style={{ color: "red", fontWeight: "bold" }}>
                Grabando...
              </Text>
            </View>
          )}

          {audios.map((uri, i) => (
            <View key={i} style={styles.audioContainer}>
              <TouchableOpacity
                onPress={() => playAudio(uri, i)}
                style={styles.audioPlayButton}
              >
                <Text style={{ color: "white" }}>
                  {currentAudioIndex === i && !isPaused ? "⏸" : "▶️"}
                </Text>
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                <Text style={styles.audioTitle}>
                  {getAudioDisplayName(i, uri)}
                </Text>

                <Text style={styles.audioTime}>
                  {formatTime(audioProgress[i]?.position)} /{" "}
                  {formatTime(audioProgress[i]?.duration)}
                </Text>

                <Slider
                  style={{ width: "100%" }}
                  minimumValue={0}
                  maximumValue={audioProgress[i]?.duration || 1}
                  value={audioProgress[i]?.position || 0}
                  onSlidingComplete={(v) => seekAudio(v, i)}
                  minimumTrackTintColor="#007bff"
                  maximumTrackTintColor="#ccc"
                  thumbTintColor="#007bff"
                />
              </View>

              <TouchableOpacity onPress={() => deleteAudio(i)}>
                <Text style={{ color: "red", fontSize: 18, marginLeft: 8 }}>
                  ✖
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* BOTONES */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={async () => {
              const ok = await confirmStopRecording();
              if (!ok) return;
              // 🔇 detén reproducción si está sonando
              if (sound) {
                try { await sound.stopAsync(); } catch { }
                try { await sound.unloadAsync(); } catch { }
                setSound(null);
                setCurrentAudioIndex(null);
                setIsPaused(false);
              }

              await cleanupNewMedia();

              // 🔥 clave: recarga desde disco/DB para “pisar” cualquier estado cacheado
              await loadExistingMedia();

              router.replace("/(drawer)/inspection");

            }}

          >
            <Text style={styles.bottomText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, !canSave && { backgroundColor: "#aaa" }]}
            onPress={canSave ? handleSave : () => { }}
            disabled={!canSave}
          >
            <Text style={styles.bottomText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

/* ================================
   ESTILOS
================================== */
const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 5,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#007bff",
    padding: 8,
    borderRadius: 5,
    marginBottom: 10,
    width: 130,
  },
  buttonGreen: {
    backgroundColor: "green",
    padding: 8,
    borderRadius: 5,
    width: 80,
  },
  buttonRed: {
    backgroundColor: "red",
    padding: 8,
    borderRadius: 5,
    width: 80,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
  carousel: {
    paddingVertical: 5,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  audioContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 10,
  },
  audioPlayButton: {
    backgroundColor: "#007bff",
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
  },
  recordingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  recDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "red",
    marginRight: 6,
  },
  audioTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#222",
  },
  audioTime: {
    fontSize: 12,
    color: "#444",
  },
  bottomButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cancelBtn: {
    backgroundColor: "#6c757d",
    padding: 12,
    borderRadius: 5,
    width: "48%",
  },
  saveBtn: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 5,
    width: "48%",
  },
  bottomText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 40,
    backgroundColor: "#f5f5f5",
  },
  modalDelete: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(255,0,0,0.8)",
    padding: 10,
    borderRadius: 30,
  },
  modalClose: {
    position: "absolute",
    top: 40,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 10,
    borderRadius: 30,
  },
  photoSlot: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eee",
  },
  photoSlotEmpty: {
    borderWidth: 1,
    borderColor: "#aaa",
  },
  plusText: {
    fontSize: 32,
    color: "#777",
  },
  slotLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: "black",
    paddingTop: 40,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  cameraTitle: {
    color: "white",
    fontSize: 18,
    marginBottom: 10,
  },
  cameraLive: {
    width: "100%",
    height: "70%",
  },
  zoomContainer: {
    position: "absolute",
    bottom: 140,
    width: "100%",
    alignItems: "center",
  },
  cameraButtonsRow: {
    position: "absolute",
    bottom: 60,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  captureButtonCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  captureInnerCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "white",
  },
  cameraPrimaryBtn: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  cameraPrimaryText: {
    color: "white",
    fontWeight: "bold",
  },
  cameraSecondaryBtn: {
    backgroundColor: "#555",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  cameraSecondaryText: {
    color: "white",
    fontWeight: "bold",
  },
  cameraCloseBtnRow: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
});
