// ⚙️ Filesystem + SAF (Android)
import * as FS from "expo-file-system";
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
import ImageViewer from "react-native-image-zoom-viewer";

export default function DeficiencyMediaScreen() {
  const router = useRouter();

  const [permission, requestPermission] = useCameraPermissions();

  // 📸 Fotos (URIs temporales de cámara o SAF)
  const [photos, setPhotos] = useState([]);

  // 🎤 Audios
  const [audios, setAudios] = useState([]);
  const [audioProgress, setAudioProgress] = useState([]);

  // 📷 Cámara
  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraRef, setCameraRef] = useState(null);

  // 🎤 Grabación
  const [recording, setRecording] = useState(null);

  // 🔊 Reproducción de audio
  const [sound, setSound] = useState(null);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  // 🔴 Parpadeo (para futuro)
  const [blink, setBlink] = useState(true);

  // MODAL
  const [showModal, setShowModal] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // ================================
  // HELPERS
  // ================================

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

  const getFileName = (uri) => {
    const parts = uri.split("/");
    return parts[parts.length - 1] || "archivo";
  };

  const isTempFile = (uri) => uri.startsWith("file://");
  const isSafFile = (uri) => uri.startsWith("content://");

  // 🔐 Cargar / pedir carpeta raíz SIGRE (pública) una sola vez
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
        const perm = await SAF.requestDirectoryPermissionsAsync();
        if (!perm.granted) {
          return null;
        }

        uri = perm.directoryUri;
        await AsyncStorage.setItem("SIGRE_ROOT_URI", uri);
      }

      return uri;
    } catch (err) {
      console.log("Error en getRootUri:", err);
      throw err;
    }
  }

  // Crear estructura:
  // root/SIGRE/Proyecto/Alim/Sub/TipoElemento/Elemento/Deficiencia/{Fotos,Audios}
  async function ensureMediaDirectories(rootUri) {
    const proyecto = "ProyectoX";
    const alimentador = "Alim01";
    const subestacion = "Sub01";
    const tipoElemento = "TipoElemento";
    const elemento = "Elem01";
    const deficiencia = "DEF001";

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
      try {
        currentUri = await SAF.createDirectoryAsync(currentUri, name);
      } catch (err) {
        const msg = String((err && err.message) || err);
        if (msg.includes("EEXIST") || msg.includes("already exists")) {
          currentUri = `${currentUri}/${name}`;
        } else {
          throw err;
        }
      }
    }

    // Fotos
    let fotosUri = currentUri;
    try {
      fotosUri = await SAF.createDirectoryAsync(currentUri, "Fotos");
    } catch (err) {
      const msg = String((err && err.message) || err);
      if (msg.includes("EEXIST") || msg.includes("already exists")) {
        fotosUri = `${currentUri}/Fotos`;
      } else {
        throw err;
      }
    }

    // Audios
    let audiosUri = currentUri;
    try {
      audiosUri = await SAF.createDirectoryAsync(currentUri, "Audios");
    } catch (err) {
      const msg = String((err && err.message) || err);
      if (msg.includes("EEXIST") || msg.includes("already exists")) {
        audiosUri = `${currentUri}/Audios`;
      } else {
        throw err;
      }
    }

    return { fotosUri, audiosUri };
  }

  // Buscar nombre libre: baseName.ext → baseName (2).ext, (3), etc.
  async function getUniqueSafFileUri(folderUri, baseName, ext, mime) {
    let n = 1;

    while (true) {
      const suffix = n === 1 ? "" : ` (${n})`;
      const fileName = `${baseName}${suffix}${ext}`;

      try {
        const fileUri = await SAF.createFileAsync(folderUri, fileName, mime);
        return fileUri;
      } catch (err) {
        const msg = String((err && err.message) || err);
        if (msg.includes("EEXIST") || msg.includes("already exists")) {
          n += 1;
          continue;
        }
        throw err;
      }
    }
  }

  // ================================
  // CARGAR MEDIA EXISTENTE AL ENTRAR
  // ================================
  useEffect(() => {
    (async () => {
      try {
        const rootUri = await getRootUri();
        if (!rootUri) return;

        const { fotosUri, audiosUri } = await ensureMediaDirectories(rootUri);

        // 📸 Cargar fotos existentes
        try {
          const photoUris = (await SAF.readDirectoryAsync(fotosUri)) || [];
          setPhotos(photoUris);
        } catch (err) {
          console.log("⚠️ Error leyendo directorio Fotos:", err);
        }

        // 🎤 Cargar audios existentes
        try {
          const audioUris = (await SAF.readDirectoryAsync(audiosUri)) || [];
          setAudios(audioUris);
          setAudioProgress(
            audioUris.map(() => ({ position: 0, duration: 1 }))
          );
        } catch (err) {
          console.log("⚠️ Error leyendo directorio Audios:", err);
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
    const result = await cameraRef.takePictureAsync({ quality: 0.9 });
    setPhotos((prev) => [...prev, result.uri]); // file://
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
      console.log("⚠️ Error borrando foto física:", err);
    }

    const updated = photos.filter((_, i) => i !== selectedPhotoIndex);
    setPhotos(updated);
    setShowModal(false);
  };

  // ================================
  // 🎤 AUDIO
  // ================================
  const startRecording = async () => {
    try {
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

      setAudios((prev) => [...prev, uri]); // file://
      setAudioProgress((prev) => [...prev, { position: 0, duration: 1 }]);
      setRecording(null);
    } catch (err) {
      console.log("Error al detener grabación:", err);
    }
  };

  const onPlaybackStatusUpdate = (status, index) => {
    if (!status.isLoaded) return;

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

      newSound.setOnPlaybackStatusUpdate((st) =>
        onPlaybackStatusUpdate(st, index)
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
      updated[index].position = value;
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
      console.log("⚠️ Error al eliminar audio físico:", err);
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
  // 💾 GUARDAR
  // ================================
  const confirmStopRecording = async () => {
    if (!recording) return true;

    return new Promise((resolve) => {
      Alert.alert(
        "Grabación en curso",
        "Hay una grabación activa. ¿Deseas detenerla antes de salir?",
        [
          {
            text: "No",
            style: "cancel",
            onPress: () => resolve(false),
          },
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
    const ok = await confirmStopRecording();
    if (!ok) return;

    try {
      const rootUri = await getRootUri();
      if (!rootUri) {
        Alert.alert("Error", "No se eligió carpeta raíz SIGRE.");
        return;
      }

      const { fotosUri, audiosUri } = await ensureMediaDirectories(rootUri);

      // 📸 Copiar solo fotos temporales (file://)
      for (let i = 0; i < photos.length; i++) {
        const srcUri = photos[i];

        if (!isTempFile(srcUri)) continue; // ya está en SAF

        const timestamp = formatFileTimestampMs();
        const baseName = `FOT-${timestamp}`;
        const ext = ".jpg";

        const destFileUri = await getUniqueSafFileUri(
          fotosUri,
          baseName,
          ext,
          "image/jpeg"
        );

        const base64 = await FS.readAsStringAsync(srcUri, {
          encoding: FS.EncodingType.Base64,
        });

        await FS.writeAsStringAsync(destFileUri, base64, {
          encoding: FS.EncodingType.Base64,
        });

        try {
          await FS.deleteAsync(srcUri, { idempotent: true });
        } catch (err) {
          console.log("⚠️ Error borrando foto temporal:", err);
        }
      }

      // 🎤 Copiar solo audios temporales (file://)
      for (let i = 0; i < audios.length; i++) {
        const srcUri = audios[i];

        if (!isTempFile(srcUri)) continue;

        const timestamp = formatFileTimestampMs();
        const baseName = `AUD-${timestamp}`;
        const ext = ".m4a";

        const destFileUri = await getUniqueSafFileUri(
          audiosUri,
          baseName,
          ext,
          "audio/mp4"
        );

        const base64 = await FS.readAsStringAsync(srcUri, {
          encoding: FS.EncodingType.Base64,
        });

        await FS.writeAsStringAsync(destFileUri, base64, {
          encoding: FS.EncodingType.Base64,
        });

        try {
          await FS.deleteAsync(srcUri, { idempotent: true });
        } catch (err) {
          console.log("⚠️ Error borrando audio temporal:", err);
        }
      }

      Alert.alert("Listo", "Fotos y audios guardados en la carpeta SIGRE.");
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
        {/* MODAL DE FOTO */}
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

            {/* BORRAR */}
            <TouchableOpacity
              onPress={deletePhoto}
              style={{
                position: "absolute",
                top: 40,
                right: 20,
                backgroundColor: "rgba(255,0,0,0.8)",
                padding: 10,
                borderRadius: 30,
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>
                Eliminar
              </Text>
            </TouchableOpacity>

            {/* CERRAR */}
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              style={{
                position: "absolute",
                top: 40,
                left: 20,
                backgroundColor: "rgba(0,0,0,0.5)",
                padding: 10,
                borderRadius: 30,
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        <View style={{ height: 10 }} />

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
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 5,
              }}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: blink ? "red" : "transparent",
                  borderWidth: 1,
                  borderColor: "red",
                  marginRight: 6,
                }}
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
                <Text
                  style={{ fontSize: 12, fontWeight: "bold", color: "#222" }}
                >
                  {getFileName(uri)}
                </Text>

                <Text style={{ fontSize: 12, color: "#444" }}>
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
});
