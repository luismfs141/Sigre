import { useFeeder } from "../../hooks/useFeeder";

import { useContext } from "react";
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





import { useEffect, useState } from "react";

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

// 👇 ajusta la ruta según dónde esté este archivo
import {
  getNextArchCodTablaLocal,
  insertArchivoLocal,
} from "../../database/offlineDB/files";

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

////////////////////////////////////////////////////////////////////////////////////////////
// // Construye la ruta relativa que queremos guardar en ArchNombre
// function buildRelativePath(tipoCarpeta, fileName) {
//   const {
//     proyecto,
//     alimentador,
//     subestacion,
//     tipoElemento,
//     elemento,
//     deficiencia,
//   } = PATH_CONFIG;

//   return [
//     "SIGRE",
//     proyecto,
//     alimentador,
//     subestacion,
//     tipoElemento,
//     elemento,
//     deficiencia,
//     tipoCarpeta, // "Fotos" | "Audios"
//     fileName,
//   ].join("/");
// }
////////////////////////////////////////////////////////////////////////////////////////////

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

  console.log("[buildRelativePath] ",
    "\n  tipoCarpeta:", tipoCarpeta,
    "\n  fileName:", fileName,
    "\n  PATH_CONFIG:", {
    proyecto,
    alimentador,
    subestacion,
    tipoElemento,
    elemento,
    deficiencia,
  },
    "\n  => relativePath:", path
  );

  return path;
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

export default function DeficiencyMediaScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  // ✅ AQUÍ van los hooks:
  const { findFeederById } = useFeeder();       // hook custom
  const [feederCode, setFeederCode] = useState("SIN_ALIM"); // state local

  // 🔗 Traemos todo lo que necesitamos del contexto
  const {
    selectedItem,
    selectedFeeder,
    selectedSed,
    feeders,
  } = useDatos();




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


  // 🔗 Leemos el código de deficiencia que viene desde Inspection
  const { defCode } = useLocalSearchParams();

  // Código del elemento (poste, vano, sed)
  const elementCode =
    selectedItem?.PostCodigoNodo ||
    selectedItem?.VanoCodigo ||
    selectedItem?.SedCodigo ||
    "SIN_CODIGO";

  // Código de proyecto / alimentador / subestación
  const projectCode = (() => {
    const p = user?.proyecto;

    // aquí decides cómo quieres que se llame la carpeta
    if (p === 0) return "BT";          // Baja Tensión
    if (p === 1) return "MT";          // Media Tensión

    // fallback por si cambia a futuro
    return p !== undefined && p !== null ? String(p) : "SIN_PROYECTO";
  })();


  // const feederCode = (() => {
  //   const alimInt = selectedItem?.AlimInterno ?? null;

  //   // 👀 LOG para ver qué hay en feeders
  //   console.log(
  //     "[DefMedia] feeders length:",
  //     feeders?.length ?? 0
  //   );
  //   if (feeders && feeders.length > 0) {
  //     console.log(
  //       "[DefMedia] ejemplo feeders[0]:",
  //       feeders[0],
  //       "keys:",
  //       Object.keys(feeders[0] || {})
  //     );
  //   }




  //   // 🔍 DEBUG RESUMEN DE ALIMENTADOR
  //   console.log("[DefMedia][DEBUG FINAL FEEDER]", {
  //     alimInt: selectedItem?.AlimInterno ?? null,
  //     alimEtiquetaItem: selectedItem?.AlimEtiqueta ?? null,
  //     // otros campos posibles que pudieran venir
  //     alimNombItem: selectedItem?.AlimNombre ?? null,
  //     alimDescItem: selectedItem?.AlimDescripcion ?? null,

  //     feederCodeFinal: feederCode,
  //     feedersLength: feeders?.length ?? 0,
  //     // mostramos hasta 3 alimentadores si es que hubiera
  //     feedersSample: feeders?.slice ? feeders.slice(0, 3) : feeders,
  //     selectedFeederCrudo: selectedFeeder,
  //   });








  //   // 🔍 Intentar recuperar el alimentador desde la lista global
  //   const findFromFeeders = () => {
  //     if (!feeders || feeders.length === 0 || alimInt == null) {
  //       console.log(
  //         "[DefMedia] findFromFeeders: sin feeders o alimInt null",
  //         { alimInt }
  //       );
  //       return null;
  //     }

  //     const found = feeders.find((f) => {
  //       const rawId =
  //         f.id ??
  //         f.AlimInterno ??
  //         f.alimInterno ??
  //         f.alim_id ??
  //         null;

  //       if (rawId == null) return false;

  //       // comparamos como números para evitar problemas "46" vs 46
  //       return Number(rawId) === Number(alimInt);
  //     });

  //     if (found) {
  //       console.log(
  //         "[DefMedia] feeder encontrado en feeders[] por AlimInterno:",
  //         { alimInt, found }
  //       );
  //     } else {
  //       console.log(
  //         "[DefMedia] NO se encontró en feeders[] un alimentador con AlimInterno:",
  //         alimInt
  //       );
  //     }

  //     return found || null;
  //   };

  //   // 1) Preferimos el selectedFeeder del contexto
  //   let effectiveFeeder = selectedFeeder || null;

  //   // 2) Si no hay, intentamos reconstruirlo desde feeders[]
  //   if (!effectiveFeeder) {
  //     effectiveFeeder = findFromFeeders();
  //   }

  //   // 3) Si AÚN no hay nada, usamos lo que traiga el propio item
  //   if (!effectiveFeeder) {
  //     if (selectedItem?.AlimEtiqueta) {
  //       console.log(
  //         "[DefMedia] feederCode desde selectedItem.AlimEtiqueta:",
  //         selectedItem.AlimEtiqueta
  //       );
  //       return String(selectedItem.AlimEtiqueta);
  //     }

  //     if (alimInt != null) {
  //       console.log(
  //         "[DefMedia] feederCode desde selectedItem.AlimInterno (solo id):",
  //         alimInt
  //       );
  //       return String(alimInt);
  //     }

  //     console.log(
  //       "[DefMedia] SIN_ALIM (no hay selectedFeeder, ni feeders[], ni campos en selectedItem)"
  //     );
  //     return "SIN_ALIM";
  //   }

  //   // 4) Ya tenemos un effectiveFeeder (de contexto o de feeders[])
  //   console.log("[DefMedia] effectiveFeeder detalle:", {
  //     type: typeof effectiveFeeder,
  //     id: effectiveFeeder?.id ?? null,
  //     name: effectiveFeeder?.name ?? null,
  //     alimEtiqueta:
  //       effectiveFeeder?.alimEtiqueta ?? effectiveFeeder?.AlimEtiqueta ?? null,
  //     descripcion:
  //       effectiveFeeder?.Descripcion ?? effectiveFeeder?.descripcion ?? null,
  //     keys: effectiveFeeder ? Object.keys(effectiveFeeder) : null,
  //   });

  //   // Si es string directo (ya es el nombre)
  //   if (typeof effectiveFeeder === "string") {
  //     console.log("[DefMedia] feederCode desde string:", effectiveFeeder);
  //     return effectiveFeeder;
  //   }

  //   // 🟢 PRIORIDAD 1: name (lo que tú mapeaste para mostrar)
  //   if (effectiveFeeder?.name) {
  //     console.log(
  //       "[DefMedia] feederCode desde effectiveFeeder.name:",
  //       effectiveFeeder.name
  //     );
  //     return String(effectiveFeeder.name);
  //   }

  //   // 🟠 PRIORIDAD 2: etiqueta
  //   if (effectiveFeeder?.alimEtiqueta || effectiveFeeder?.AlimEtiqueta) {
  //     const etq =
  //       effectiveFeeder.alimEtiqueta ?? effectiveFeeder.AlimEtiqueta;
  //     console.log(
  //       "[DefMedia] feederCode desde effectiveFeeder.alimEtiqueta:",
  //       etq
  //     );
  //     return String(etq);
  //   }

  //   // 🔵 PRIORIDAD 3: descripción
  //   if (effectiveFeeder?.Descripcion || effectiveFeeder?.descripcion) {
  //     const desc =
  //       effectiveFeeder.Descripcion ?? effectiveFeeder.descripcion;
  //     console.log(
  //       "[DefMedia] feederCode desde effectiveFeeder.Descripcion:",
  //       desc
  //     );
  //     return String(desc);
  //   }

  //   // 🔴 ÚLTIMO recurso: id numérico
  //   if (effectiveFeeder?.id != null) {
  //     console.log(
  //       "[DefMedia] feederCode desde effectiveFeeder.id (último recurso):",
  //       effectiveFeeder.id
  //     );
  //     return String(effectiveFeeder.id);
  //   }

  //   console.log(
  //     "[DefMedia] SIN_ALIM (effectiveFeeder sin campos útiles)",
  //     effectiveFeeder
  //   );
  //   return "SIN_ALIM";
  // })();

  // 🔄 Resolver el nombre/código del alimentador para la carpeta
  useEffect(() => {
    const alimInt = selectedItem?.AlimInterno ?? null;

    console.log("[DefMedia] useEffect FEEDER resolve =>", {
      alimInt,
      selectedFeeder,
      selectedItemAlimEtiqueta: selectedItem?.AlimEtiqueta,
    });

    // 1️⃣ Si tenemos selectedFeeder en contexto, usamos eso primero
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

    // 2️⃣ Si el item tiene etiqueta directa, úsala como nombre de carpeta
    if (selectedItem?.AlimEtiqueta) {
      console.log(
        "[DefMedia] feederCode desde selectedItem.AlimEtiqueta:",
        selectedItem.AlimEtiqueta
      );
      setFeederCode(String(selectedItem.AlimEtiqueta));
      return;
    }

    // 3️⃣ Si tenemos id interno (AlimInterno), buscamos en SQLite / memoria
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

    // 4️⃣ Si no hay nada de nada
    console.log("[DefMedia] SIN_ALIM (no se pudo resolver alimentador)");
    setFeederCode("SIN_ALIM");
  }, [selectedFeeder, selectedItem, findFeederById]);








  // 🔁 Código REAL de la SED para la carpeta (2755, 3481, 2459, ...)
  // prioridad: selectedSed.SedCodi / SedCodigo
  // fallback: selectedItem.SedCodi / SedCodigo
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


  // Tipo de elemento (para la carpeta)
  const tipoElemento =
    selectedItem?.PostCodigoNodo
      ? "Poste"
      : selectedItem?.VanoCodigo
        ? "Vano"
        : selectedItem?.SedCodigo
          ? "Subestacion"
          : "Desconocido";

  // Código de deficiencia (para la carpeta)
  const deficiencyCode = (defCode || "DEF_SIN_COD").toString();

  // Actualizamos el PATH_CONFIG global con lo que viene del contexto + params
  PATH_CONFIG.proyecto = projectCode;
  PATH_CONFIG.alimentador = feederCode;   // 👈 AQUÍ VA EL NUEVO
  PATH_CONFIG.subestacion = sedCode;
  PATH_CONFIG.tipoElemento = tipoElemento;
  PATH_CONFIG.elemento = elementCode;
  PATH_CONFIG.deficiencia = deficiencyCode;





  // Ruta base solo para log
  const rutaBase = [
    "SIGRE",
    projectCode,
    feederCode,     // 👈 aquí también
    sedCode,
    tipoElemento,
    elementCode,
    deficiencyCode,
  ].join("/");







  // 📸 Fotos: 6 slots fijos (pueden ser null)
  const [photos, setPhotos] = useState(Array(6).fill(null));


  // miniaturas (podemos guardar base64 para asegurar que se vea)
  const [photoThumbs, setPhotoThumbs] = useState(Array(6).fill(null));

  // Metadatos por slot (misma longitud)
  const [photoMeta, setPhotoMeta] = useState(Array(6).fill(null));


  // 🎤 Audios
  const [audios, setAudios] = useState([]);
  const [audioProgress, setAudioProgress] = useState([]);

  // Metadatos por audio (lat/lon, fecha, timestamp para nombre)
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

  // Modal fotos
  const [showModal, setShowModal] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const [currentSlotIndex, setCurrentSlotIndex] = useState(null); // 0..5
  const [captureMode, setCaptureMode] = useState(null); // "sequence" | "single"
  const [capturedPhoto, setCapturedPhoto] = useState(null); // { uri, meta }
  const [isPreview, setIsPreview] = useState(false);
  const [zoom, setZoom] = useState(0);





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

  // ---- SAF helpers ----

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
      // 👈 AQUI forzamos que siempre sea string
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
  // [root]/SIGRE/ProyectoX/Alim01/Sub01/TipoElemento/Elem01/DEF001/{Fotos,Audios}
  async function ensureMediaDirectories(rootUri) {
    const {
      proyecto,
      alimentador,
      subestacion,
      tipoElemento,
      elemento,
      deficiencia,
    } = PATH_CONFIG;

    const segments = [
      "SIGRE",
      String(proyecto),
      String(alimentador),
      String(subestacion),
      String(tipoElemento),
      String(elemento),
      String(deficiencia),
    ];

    // 🔍 LOGS para ver ruta de carpetas
    console.log("[ensureMediaDirectories] rootUri:", rootUri);
    console.log("[ensureMediaDirectories] segments:", segments);
    console.log(
      "[ensureMediaDirectories] ruta lógica:",
      segments.join("/")
    );

    let currentUri = rootUri;

    for (const name of segments) {
      currentUri = await findOrCreateSubdir(currentUri, name);
    }

    const fotosUri = await findOrCreateSubdir(currentUri, "Fotos");
    const audiosUri = await findOrCreateSubdir(currentUri, "Audios");

    console.log("[ensureMediaDirectories] fotosUri:", fotosUri);
    console.log("[ensureMediaDirectories] audiosUri:", audiosUri);

    return { fotosUri, audiosUri };
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
        if (
          msg.includes("EEXIST") ||
          msg.includes("Already") ||
          msg.includes("exist")
        ) {
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

  // ================================
  // CARGAR MEDIA EXISTENTE AL ENTRAR
  // ================================
  useEffect(() => {
    (async () => {
      try {
        const rootUri = await getRootUri();
        if (!rootUri) return;

        const { fotosUri, audiosUri } = await ensureMediaDirectories(rootUri);

        try {
          const photoUris = await SAF.readDirectoryAsync(fotosUri);

          // Mapeamos a 6 slots según el sufijo -N.jpg
          const slots = Array(6).fill(null);

          for (const uri of photoUris) {
            const name = getFileName(uri); // ya tienes la función
            const match = name.match(/-(\d+)\.(jpg|jpeg|png)$/i);
            if (match) {
              const pos = parseInt(match[1], 10);
              if (pos >= 1 && pos <= 6) {
                slots[pos - 1] = uri;
                continue;
              }
            }
            // si no matchea, lo ponemos en el primer hueco libre
            const freeIndex = slots.findIndex((s) => !s);
            if (freeIndex !== -1) {
              slots[freeIndex] = uri;
            }
          }

          setPhotos(slots);
          setPhotoThumbs(slots);   // 👈 para que también se vean al reabrir
          // photoMeta se quedará vacío por ahora para fotos anteriores
        } catch (err) {
          //console.log("Error inicializando media:", err);
        }


        try {
          const audioUris = await SAF.readDirectoryAsync(audiosUri);
          setAudios(audioUris);
          setAudioProgress(
            audioUris.map(() => ({ position: 0, duration: 1 }))
          );
          setAudioMeta(audioUris.map(() => null));



        } catch (err) {
          //console.log("⚠️ Error leyendo Audios SAF:", err);
        }
      } catch (err) {
        //console.log("Error inicializando media:", err);
      }
    })();
  }, [projectCode, feederCode, sedCode, tipoElemento, elementCode, deficiencyCode]);

  // ================================
  // 📸 TOMAR FOTO
  // ================================
  const takePhoto = async () => {
    if (!cameraRef || currentSlotIndex === null) return;

    // Evitar doble tap mientras dispara
    if (!isCameraReady || isTakingPhoto) {
      //console.log("Cámara no lista o ya capturando...");
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
      const timestamp = formatFileTimestampMs();   // 👈 NUEVO

      const meta = {
        utmText:
          latitude != null && longitude != null
            ? formatUtmFromLatLon(latitude, longitude)
            : "",
        fechaLegible: formatWatermarkDate(ahora),
        latitude: latitude || null,
        longitude: longitude || null,
        archFech: formatDateTimeSQLite(ahora),
        fileTimestamp: timestamp,                 // 👈 guardamos aquí
      };


      setCapturedPhoto({ uri, meta });
      setIsPreview(true);
    } catch (err) {
      //console.log("Error al tomar foto:", err);
      Alert.alert(
        "Error",
        "No se pudo capturar la foto. Inténtalo nuevamente."
      );
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

    // Intentamos generar una miniatura base64 para asegurar que el <Image> la pueda mostrar
    try {
      if (srcUri.startsWith("file://")) {
        const base64 = await FS.readAsStringAsync(srcUri, {
          encoding: "base64",
        });
        thumbUri = `data:image/jpeg;base64,${base64}`;
      }
    } catch (err) {
      //console.log("⚠️ Error generando thumbnail:", err);
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

    // para calcular siguiente slot en modo secuencia
    const nextStatePhotos = (prev => {
      const copy = [...prev];
      copy[currentSlotIndex] = srcUri;
      return copy;
    })(photos);

    // limpiamos preview
    setCapturedPhoto(null);
    setIsPreview(false);

    if (captureMode === "sequence") {
      const nextIndex = findNextRequiredSlot(
        REQUIRED_SLOTS.indexOf(currentSlotIndex) + 1,
        nextStatePhotos
      );
      if (nextIndex !== null) {
        setCurrentSlotIndex(nextIndex);
        // dejamos la cámara abierta
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

    try {
      await FS.deleteAsync(uri, { idempotent: true });
    } catch (err) {
      //console.log("⚠️ Error borrando foto:", err);
    }

    // Dejamos el slot vacío, sin mover el resto
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

    setShowModal(false);

    setPhotoThumbs((prev) => {
      const copy = [...prev];
      copy[selectedPhotoIndex] = null;
      return copy;
    });

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

      // Tomamos fecha y coordenadas para ESTE audio
      let latitude = null;
      let longitude = null;
      try {
        const position = await Location.getCurrentPositionAsync({});
        latitude = position.coords?.latitude ?? null;
        longitude = position.coords?.longitude ?? null;
      } catch (err) {
        // si falla, se queda en null
      }

      const ahora = new Date();
      const timestamp = formatFileTimestampMs();

      setAudios((prev) => [...prev, uri]); // uri temporal file://
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

      const newSound = new Audio.Sound();
      await newSound.loadAsync(
        { uri },
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

  const deleteAudio = async (index) => {
    const uri = audios[index];

    try {
      await FS.deleteAsync(uri, { idempotent: true });
    } catch (err) {
      //console.log("⚠️ Error al eliminar audio:", err);
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
  // 💾 GUARDAR A CARPETA PÚBLICA + ARCHIVOS
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

      const { fotosUri, audiosUri } = await ensureMediaDirectories(rootUri);

      // Coordenadas actuales (se usarán para todas las fotos/audios de este guardado)
      const position = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = position.coords || {};

      // Código de deficiencia (ArchCodTabla) - por ahora incremental global
      const archCodTabla = await getNextArchCodTablaLocal();

      // 📸 Fotos
      for (let i = 0; i < photos.length; i++) {
        const srcUri = photos[i];
        if (!srcUri || srcUri.startsWith("content://")) continue;

        const meta = photoMeta[i] || {};
        const timestamp = meta.fileTimestamp || formatFileTimestampMs();
        const fileName = `FOT-${timestamp}-${i + 1}.jpg`; // slot 1..6



        const destFileUri = await getUniqueSafFileUri(
          fotosUri,
          fileName,
          "image/jpeg"
        );

        const base64 = await FS.readAsStringAsync(srcUri, {
          encoding: "base64",
        });

        await SAF.writeAsStringAsync(destFileUri, base64, {
          encoding: "base64",
        });

        const relativePath = buildRelativePath("Fotos", fileName);

        const archFech = meta.archFech || formatDateTimeSQLite(new Date());

        await insertArchivoLocal({
          archTipo: 0,
          archTabla: "Deficiencias",
          archCodTabla,
          archNombre: relativePath,
          archLatit: meta.latitude ?? null,
          archLong: meta.longitude ?? null,
          archFech,
          archActiv: 1,
        });

        try {
          await FS.deleteAsync(srcUri, { idempotent: true });
        } catch (err) {
          //console.log("⚠️ Error borrando foto temporal:", err);
        }
      }


      // 🎤 Audios
      for (let i = 0; i < audios.length; i++) {
        const srcUri = audios[i];
        if (!srcUri || srcUri.startsWith("content://")) continue;

        const meta = audioMeta[i] || {};

        // Nombre: AUD-<timestamp>-<i+1>.m4a
        const timestamp = meta.fileTimestamp || formatFileTimestampMs();
        const fileName = `AUD-${timestamp}-${i + 1}.m4a`;

        const destFileUri = await getUniqueSafFileUri(
          audiosUri,
          fileName,
          "audio/mp4"
        );

        const base64 = await FS.readAsStringAsync(srcUri, {
          encoding: "base64",
        });

        await SAF.writeAsStringAsync(destFileUri, base64, {
          encoding: "base64",
        });

        const relativePath = buildRelativePath("Audios", fileName);

        const archFech = meta.archFech || formatDateTimeSQLite(new Date());

        await insertArchivoLocal({
          archTipo: 1, // audio
          archTabla: "Deficiencias",
          archCodTabla,
          archNombre: relativePath,
          archLatit: meta.latitude ?? latitude ?? null,
          archLong: meta.longitude ?? longitude ?? null,
          archFech,
          archActiv: 1,
        });

        try {
          await FS.deleteAsync(srcUri, { idempotent: true });
        } catch (err) {
          //console.log("⚠️ Error borrando audio temporal:", err);
        }
      }


      Alert.alert("Listo", "Fotos y audios guardados en la carpeta pública.");
      router.replace("/(drawer)/inspection");
    } catch (err) {
      //console.log("Error guardando en SAF:", err);
      Alert.alert("Error", "No se pudo guardar.");
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

      // 🔹 resetear estados de cámara
      setIsCameraReady(false);
      setIsTakingPhoto(false);

      setCameraVisible(true);
    }
  };


  const canSave =
    photos[0] && photos[1] && photos[2] && photos[3]; // 4 primeros llenos






  // Fotos sin nulos para el visor
  const nonEmptyPhotos = photos.filter((p) => !!p);

  // Índice dentro del arreglo filtrado que corresponde a la foto seleccionada
  const initialIndex = nonEmptyPhotos.findIndex(
    (u) => u === photos[selectedPhotoIndex]
  );





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

            {/* Vista de cámara o preview */}
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



            {/* Slider de zoom solo cuando está la cámara activa */}
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

            {/* Botones inferiores */}
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
                <Text style={{ color: "white", fontWeight: "bold" }}>Cerrar</Text>
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

              // 🔹 IMPORTANTE: resetear estados de la cámara
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
              const meta = photoMeta[i];          // 👈 volvemos a definirla

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
                          console.log("❌ Error cargando miniatura", thumbUri, e.nativeEvent)
                        }
                      />
                    ) : (
                      <Text style={styles.plusText}>+</Text>
                    )}
                  </TouchableOpacity>

                  {/* Subtítulo fijo del slot */}
                  <Text style={styles.slotLabel}>{SLOT_LABELS[i]}</Text>

                  {/* Nombre de archivo */}
                  {meta?.fileTimestamp && (       // 👈 optional chaining
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
                <Text style={styles.audioTitle}>{getFileName(uri)}</Text>

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
  cameraContainer: {
    width: "100%",
    height: 280,
    backgroundColor: "#000",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
  },

  captureButton: {
    backgroundColor: "#fff",
    padding: 10,
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    borderRadius: 6,
  },
  captureText: {
    fontWeight: "bold",
  },
  closeCameraButton: {
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 10,
    position: "absolute",
    top: 10,
    right: 10,
    borderRadius: 6,
  },
  carousel: {
    paddingVertical: 5,
  },

  photo: {
    width: "100%",   // 👈 en vez de 100
    height: "100%",  // 👈 en vez de 100
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
    height: "70%",   // casi toda la pantalla
  },


  zoomContainer: {
    position: "absolute",
    bottom: 140,          // antes 100 → lo subimos
    width: "100%",
    alignItems: "center",
  },
  cameraButtonsRow: {
    position: "absolute",
    bottom: 60,           // antes 20 → lo subimos para que no choque con la barra
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



  // contenedor que ocupa casi toda la pantalla
  cameraWrapper: {
    flex: 1,
    width: "100%",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "black",
  },

  // cámara (preview en vivo)
  cameraView: {
    flex: 1,
  },

  cameraPreview: {
    flex: 1,
    width: "100%",
  },

});
