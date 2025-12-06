import * as FileSystem from "expo-file-system"; // API moderna
import { useEffect, useState } from "react";
const SAF = FileSystem.StorageAccessFramework;

import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import { Audio } from "expo-av";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import ImageViewer from "react-native-image-zoom-viewer";

import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function DeficiencyMediaScreen() {
  const router = useRouter();

  // Permiso de cámara
  const [permission, requestPermission] = useCameraPermissions();

  // 📸 Fotos
  const [photos, setPhotos] = useState([]); // URIs locales

  // 🎤 Audios
  const [audios, setAudios] = useState([]); // URIs locales
  const [audioProgress, setAudioProgress] = useState([]); // { position, duration }

  // 📝 Nota
  const [note, setNote] = useState("");

  // 📷 Cámara
  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraRef, setCameraRef] = useState(null);

  // 🎤 Grabación
  const [recording, setRecording] = useState(null);

  // 🔊 Reproducción de audio
  const [sound, setSound] = useState(null);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  // 🔴 Parpadeo de indicador de grabación
  const [blink, setBlink] = useState(true);

  // Efecto para parpadear el punto rojo cuando hay grabación
  useEffect(() => {
    if (!recording) {
      setBlink(true);
      return;
    }
    const id = setInterval(() => {
      setBlink((prev) => !prev);
    }, 500);
    return () => clearInterval(id);
  }, [recording]);

  // ================================
  // Utilidades generales
  // ================================

  // Timestamp para nombres de archivos
  function formatFileTimestamp() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    return `${yyyy}${MM}${dd}_${hh}${mm}${ss}`;
  }

  const getFileName = (uri) => {
    if (!uri) return "archivo";
    const parts = uri.split("/");
    return parts[parts.length - 1];
  };

  // ================================
  // Storage Access Framework (SAF)
  // ================================

  async function getRootUri() {
    let uri = await AsyncStorage.getItem("SIGRE_ROOT_URI");
    if (!uri) {
      uri = await requestRootFolder();
    }
    return uri;
  }

  async function requestRootFolder() {
    const perm = await SAF.requestDirectoryPermissionsAsync();
    if (perm.granted) {
      await AsyncStorage.setItem("SIGRE_ROOT_URI", perm.directoryUri);
      return perm.directoryUri;
    }
    return null;
  }

  async function createFolder(parentUri, name) {
    try {
      return await SAF.createDirectoryAsync(parentUri, name);
    } catch (err) {
      // Si ya existe, devolvemos la ruta existente
      if (String(err).includes("EEXIST")) {
        return `${parentUri}/${name}`;
      }
      console.log("Error creando carpeta SAF:", parentUri, name, err);
      throw err;
    }
  }

  async function saveFileToSAF(folderUri, localFileUri, filename, mimeType) {
    try {
      const base64 = await FileSystem.readAsStringAsync(localFileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const newFileUri = await SAF.createFileAsync(
        folderUri,
        filename,
        mimeType
      );

      await FileSystem.writeAsStringAsync(newFileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return newFileUri;
    } catch (err) {
      console.log("Error guardando archivo en SAF:", err);
      throw err;
    }
  }

  // ================================
  // Inicialización / limpieza mínima
  // ================================
  useEffect(() => {
    // Limpieza defensiva de arrays por si llegan valores raros
    setAudios((prev) => prev.filter((a) => typeof a === "string"));
    setAudioProgress((prev) => prev.filter((a) => a && typeof a === "object"));
  }, []);

  // ================================
  // 📸 FOTOS
  // ================================

  const getNextPhotoNumber = () => {
    const number = photos.length + 1;
    return String(number).padStart(3, "0"); // 001, 002, 003...
  };

  const takePhoto = async () => {
    if (!cameraRef) return;

    const result = await cameraRef.takePictureAsync({ quality: 0.9 });

    const timestamp = formatFileTimestamp();
    const nextNum = getNextPhotoNumber();

    // Usamos la URI temporal directamente.
    // Podrías usarla tal cual o, si quisieras, moverla a documentDirectory
    // SIN copyAsync, pero no es necesario para que funcione bien.
    const fileUri = result.uri + `?name=ALIM-SUBEST-FOT${nextNum}-${timestamp}`;

    setPhotos((prev) => [...prev, fileUri]);
  };

  const openPhoto = (index) => {
    setSelectedPhotoIndex(index);
    setShowModal(true);
  };

  const [showModal, setShowModal] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const deletePhoto = async () => {
    const fileToDelete = photos[selectedPhotoIndex];

    // Intentamos borrar el archivo local (si es que está bajo control del sandbox)
    try {
      await FileSystem.deleteAsync(fileToDelete, { idempotent: true });
    } catch (err) {
      console.log("Error al eliminar foto local (puede ser normal):", err);
    }

    const updated = photos.filter((_, i) => i !== selectedPhotoIndex);
    setPhotos(updated);
    setShowModal(false);
  };

  // ================================
  // 🎤 AUDIO
  // ================================

  const getNextAudioNumber = () => {
    const number = audios.length + 1;
    return String(number).padStart(3, "0");
  };

  const startRecording = async () => {
    try {
      // Detener audio en reproducción si lo hubiera
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

      const timestamp = formatFileTimestamp();
      const nextNum = getNextAudioNumber();

      // Igual que con la foto, usamos la URI retornada + sufijo en query para nombre
      const fileUri = uri + `?name=ALIM-SUBEST-AUD${nextNum}-${timestamp}.m4a`;

      setAudios((prev) => [...prev, fileUri]);
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
        position: status.positionMillis,
        duration: status.durationMillis ?? 1,
      };
      return updated;
    });

    if (status.didJustFinish) {
      setAudioProgress((prev) => {
        const updated = [...prev];
        updated[index] = {
          position: 0,
          duration: status.durationMillis ?? 1,
        };
        return updated;
      });

      setCurrentAudioIndex(null);
      setIsPaused(false);
    }
  };

  const playOrPauseAudio = async (uri, index) => {
    try {
      // Si es el mismo audio y estaba en pausa → continuar
      if (currentAudioIndex === index && sound && isPaused) {
        await sound.playAsync();
        setIsPaused(false);
        return;
      }

      // Si es el mismo audio y NO estaba en pausa → pausar
      if (currentAudioIndex === index && sound && !isPaused) {
        await sound.pauseAsync();
        setIsPaused(true);
        return;
      }

      // Si cambiamos de audio, detener el anterior
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      const newSound = new Audio.Sound();
      await newSound.loadAsync(
        { uri },
        {
          shouldPlay: true,
          positionMillis: audioProgress[index]?.position ?? 0,
        }
      );

      const status = await newSound.getStatusAsync();

      setAudioProgress((prev) => {
        const updated = [...prev];
        updated[index] = {
          position: audioProgress[index]?.position ?? 0,
          duration: status.durationMillis ?? 1,
        };
        return updated;
      });

      newSound.setOnPlaybackStatusUpdate((statusUpdate) =>
        onPlaybackStatusUpdate(statusUpdate, index)
      );

      setSound(newSound);
      setCurrentAudioIndex(index);
      setIsPaused(false);
    } catch (e) {
      console.log("Error al reproducir audio:", e);
    }
  };

  const seekAudio = async (value, index) => {
    if (index !== currentAudioIndex) return;
    if (!sound) return;

    await sound.setPositionAsync(value);

    setAudioProgress((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        position: value,
      };
      return updated;
    });
  };

  const deleteAudio = async (index) => {
    try {
      const filePath = audios[index];

      try {
        await FileSystem.deleteAsync(filePath, { idempotent: true });
      } catch (err) {
        console.log("Error al eliminar audio local (puede ser normal):", err);
      }

      setAudios((prev) => prev.filter((_, i) => i !== index));
      setAudioProgress((prev) => prev.filter((_, i) => i !== index));

      if (currentAudioIndex === index) {
        if (sound) {
          await sound.stopAsync();
          await sound.unloadAsync();
        }
        setSound(null);
        setCurrentAudioIndex(null);
        setIsPaused(false);
      } else if (currentAudioIndex > index) {
        setCurrentAudioIndex((prev) => prev - 1);
      }
    } catch (err) {
      console.log("Error al eliminar audio:", err);
    }
  };

  const formatTime = (ms) => {
    if (!ms || ms < 1000) return "00:00";
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // ================================
  // 💾 GUARDAR / SALIR
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
        Alert.alert("Error", "No se eligió la carpeta raíz SIGRE");
        return;
      }

      // TODO: reemplazar estos valores quemados por datos reales
      const proyecto = "ProyectoX";
      const alimentador = "Alim01";
      const subestacion = "Sub01";
      const elemento = "Elem01";
      const codigoElemento = "COD123";
      const deficiencia = "DEF001";

      const proyectoUri = await createFolder(rootUri, proyecto);
      const alimUri = await createFolder(proyectoUri, alimentador);
      const subUri = await createFolder(alimUri, subestacion);
      const elementoUri = await createFolder(subUri, elemento);
      const codigoUri = await createFolder(elementoUri, codigoElemento);
      const defUri = await createFolder(codigoUri, deficiencia);

      const fotosUri = await createFolder(defUri, "Fotos");
      const audiosUri = await createFolder(defUri, "Audios");

      // Guardar fotos en SAF
      for (const photoUri of photos) {
        const filename = getFileName(photoUri);
        await saveFileToSAF(fotosUri, photoUri, filename, "image/jpeg");
      }

      // Guardar audios en SAF
      for (const audioUri of audios) {
        const filename = getFileName(audioUri);
        await saveFileToSAF(audiosUri, audioUri, filename, "audio/mp4");
      }

      // Guardar nota en SAF
      if (note.trim() !== "") {
        const tempNoteFile =
          (FileSystem.documentDirectory || "") + "nota_temp.txt";

        await FileSystem.writeAsStringAsync(tempNoteFile, note, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        await saveFileToSAF(defUri, tempNoteFile, "nota.txt", "text/plain");
      }

      Alert.alert("Listo", "Fotos, audios y nota guardados en SIGRE");
      router.replace("/(drawer)/inspection");
    } catch (err) {
      console.log("Error guardando SAF:", err);
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
            <TouchableOpacity
              style={styles.buttonGreen}
              onPress={startRecording}
            >
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
                onPress={() => playOrPauseAudio(uri, i)}
                style={styles.audioPlayButton}
              >
                <Text style={{ color: "white" }}>
                  {currentAudioIndex === i && !isPaused ? "⏸" : "▶️"}
                </Text>
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 12, fontWeight: "bold", color: "#222" }}
                  numberOfLines={1}
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
                  maximumValue={audioProgress[i]?.duration ?? 1}
                  value={audioProgress[i]?.position ?? 0}
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

        {/* NOTA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Nota</Text>
          <TextInput
            style={styles.textArea}
            multiline
            value={note}
            onChangeText={(t) => {
              if (t.length <= 144) setNote(t);
            }}
            textAlignVertical="top"
            maxLength={144}
          />
          <View style={styles.charCounterContainer}>
            <Text style={styles.charCounter}>{note.length}/144</Text>
          </View>
        </View>

        {/* BOTONES ABAJO */}
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
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  sub: {
    fontSize: 16,
    marginTop: 5,
  },
  path: {
    fontSize: 12,
    color: "#555",
    marginTop: 3,
    marginBottom: 15,
  },
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
  carousel: {
    height: 100,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 10,
  },
  textArea: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
    height: 120,
    textAlignVertical: "top",
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
  closeCameraButton: {
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 10,
    position: "absolute",
    top: 10,
    right: 10,
    borderRadius: 6,
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
  scrollContent: {
    padding: 15,
    paddingBottom: 40,
    backgroundColor: "#f5f5f5",
  },
  charCounterContainer: {
    width: "100%",
    alignItems: "flex-end",
    marginTop: 4,
    paddingRight: 4,
  },
  charCounter: {
    fontSize: 12,
    color: "#555",
  },
});
