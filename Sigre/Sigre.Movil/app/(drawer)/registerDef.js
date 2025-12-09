// ⚙️ FileSystem (legacy para poder usar readAsStringAsync, deleteAsync, etc.)
import * as FS from "expo-file-system/legacy";
// SAF (carpeta pública Android) también desde legacy
import { StorageAccessFramework as SAF } from "expo-file-system/legacy";

import Slider from "@react-native-community/slider";
import { Alert } from "react-native";

import { Audio } from "expo-av";
import { useRouter } from "expo-router";
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

// Construye la ruta relativa que queremos guardar en ArchNombre
function buildRelativePath(tipoCarpeta, fileName) {
  const {
    proyecto,
    alimentador,
    subestacion,
    tipoElemento,
    elemento,
    deficiencia,
  } = PATH_CONFIG;

  return [
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

  // 📸 Fotos (URIs: temporales + SAF)
  const [photos, setPhotos] = useState([]);

  // 🎤 Audios
  const [audios, setAudios] = useState([]);
  const [audioProgress, setAudioProgress] = useState([]);

  // 📷 Cámara
  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraRef, setCameraRef] = useState(null);

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

  // ================================
  // HELPERS
  // ================================

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
      const entries = await SAF.readDirectoryAsync(parentUri);
      for (const entryUri of entries) {
        const name = getNameFromSafUri(entryUri);
        if (name === dirName) {
          return entryUri; // ya existe
        }
      }
    } catch (err) {
      console.log("⚠️ Error leyendo directorio SAF:", err);
    }

    const newDirUri = await SAF.makeDirectoryAsync(parentUri, dirName);
    return newDirUri;
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
      console.log("Error en getRootUri:", err);
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
      proyecto,
      alimentador,
      subestacion,
      tipoElemento,
      elemento,
      deficiencia,
    ];

    let currentUri = rootUri;

    for (const name of segments) {
      currentUri = await findOrCreateSubdir(currentUri, name);
    }

    const fotosUri = await findOrCreateSubdir(currentUri, "Fotos");
    const audiosUri = await findOrCreateSubdir(currentUri, "Audios");

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
      console.log("Error comprobando GPS:", err);
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
          setPhotos(photoUris);
        } catch (err) {
          console.log("⚠️ Error leyendo Fotos SAF:", err);
        }

        try {
          const audioUris = await SAF.readDirectoryAsync(audiosUri);
          setAudios(audioUris);
          setAudioProgress(
            audioUris.map(() => ({ position: 0, duration: 1 }))
          );
        } catch (err) {
          console.log("⚠️ Error leyendo Audios SAF:", err);
        }
      } catch (err) {
        console.log("Error inicializando media:", err);
      }
    })();
  }, []);

  // ================================
  // 📸 TOMAR FOTO
  // ================================
  const takePhoto = async () => {
    if (!cameraRef) return;

    const gpsOk = await ensureGpsReady();
    if (!gpsOk) return;

    const result = await cameraRef.takePictureAsync({ quality: 0.9 });
    setPhotos((prev) => [...prev, result.uri]); // uri temporal file://
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
      console.log("⚠️ Error borrando foto:", err);
    }

    const updated = photos.filter((_, i) => i !== selectedPhotoIndex);
    setPhotos(updated);
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
      console.log("Error al iniciar grabación:", err);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) return;

      setAudios((prev) => [...prev, uri]); // uri temporal file://
      setAudioProgress((prev) => [...prev, { position: 0, duration: 1 }]);
      setRecording(null);
    } catch (err) {
      console.log("Error al detener grabación:", err);
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
      console.log("Error play:", e);
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
      console.log("⚠️ Error al eliminar audio:", err);
    }

    setAudios((prev) => prev.filter((_, i) => i !== index));
    setAudioProgress((prev) => prev.filter((_, i) => i !== index));

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

        const timestamp = formatFileTimestampMs();
        const fileName = `FOT-${timestamp}-0.jpg`; // sufijo -0
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
        const archFech = formatDateTimeSQLite(new Date());

        await insertArchivoLocal({
          archTipo: 0, // foto
          archTabla: "Deficiencias",
          archCodTabla,
          archNombre: relativePath,
          archLatit: latitude || null,
          archLong: longitude || null,
          archFech,
          archActiv: 1,
        });

        try {
          await FS.deleteAsync(srcUri, { idempotent: true });
        } catch (err) {
          console.log("⚠️ Error borrando foto temporal:", err);
        }
      }

      // 🎤 Audios
      for (let i = 0; i < audios.length; i++) {
        const srcUri = audios[i];
        if (!srcUri || srcUri.startsWith("content://")) continue;

        const timestamp = formatFileTimestampMs();
        const fileName = `AUD-${timestamp}-1.m4a`; // sufijo -1
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
        const archFech = formatDateTimeSQLite(new Date());

        await insertArchivoLocal({
          archTipo: 1, // audio
          archTabla: "Deficiencias",
          archCodTabla,
          archNombre: relativePath,
          archLatit: latitude || null,
          archLong: longitude || null,
          archFech,
          archActiv: 1,
        });

        try {
          await FS.deleteAsync(srcUri, { idempotent: true });
        } catch (err) {
          console.log("⚠️ Error borrando audio temporal:", err);
        }
      }

      Alert.alert("Listo", "Fotos y audios guardados en la carpeta pública.");
      router.replace("/(drawer)/inspection");
    } catch (err) {
      console.log("Error guardando en SAF:", err);
      Alert.alert("Error", "No se pudo guardar.");
    }
  };

  // ================================
  // UI
  // ================================
  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* MODAL FOTO */}
        <Modal
          visible={showModal}
          transparent
          onRequestClose={() => setShowModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: "black" }}>
            <ImageViewer
              imageUrls={photos.map((p) => ({ url: p }))}
              index={selectedPhotoIndex}
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
              if (!permission?.granted) requestPermission();
              else setCameraVisible(true);
            }}
          >
            <Text style={styles.buttonText}>Tomar foto</Text>
          </TouchableOpacity>

          {cameraVisible && (
            <View style={styles.cameraContainer}>
              <CameraView style={styles.camera} ref={setCameraRef} />

              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePhoto}
              >
                <Text style={styles.captureText}>Capturar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeCameraButton}
                onPress={() => setCameraVisible(false)}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  Cerrar
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView horizontal style={styles.carousel}>
            {photos.map((p, i) => (
              <TouchableOpacity key={i} onPress={() => openPhoto(i)}>
                <Image source={{ uri: p }} style={styles.photo} />
              </TouchableOpacity>
            ))}
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

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
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
  camera: {
    flex: 1,
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
    height: 100,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 10,
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
});
