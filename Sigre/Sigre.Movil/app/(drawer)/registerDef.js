import * as FS from "expo-file-system"; // SAF + read/write moderno
import * as LegacyFS from "expo-file-system/legacy"; // copyAsync + sandbox
const SAF = FS.StorageAccessFramework;






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
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import ImageViewer from "react-native-image-zoom-viewer";


export default function DeficiencyMediaScreen() {
  const router = useRouter();


  const [permission, requestPermission] = useCameraPermissions();


  // 📸 Fotos
  const [photos, setPhotos] = useState([]);

  // 🎤 Audios
  const [audios, setAudios] = useState([]);
  const [audioProgress, setAudioProgress] = useState([]);

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

  // 🔴 Parpadeo de grabando
  const [blink, setBlink] = useState(true);

  // Necesarios para slider de audio
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1);




  // ⏱ timestamp para archivos
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
      if (String(err).includes("EEXIST")) {
        return `${parentUri}/${name}`;
      }
      console.log("Error creando carpeta SAF:", parentUri, name, err);
      throw err;
    }
  }




  async function saveFileToSAF(folderUri, localFileUri, filename, mimeType) {
    try {
      const base64 = await FS.readAsStringAsync(localFileUri, { encoding: "base64" });

      const newFileUri = await SAF.createFileAsync(folderUri, filename, mimeType);

      await FS.writeAsStringAsync(newFileUri, base64, { encoding: "base64" });


      return newFileUri;

    } catch (err) {
      console.log("Error guardando archivo en SAF:", err);
      throw err;
    }
  }











  // ================================
  // 🧹 LIMPIAR AUDIOS INCORRECTOS
  // ================================
  useEffect(() => {
    setAudios(prev => prev.filter(a => typeof a === "string"));
    setAudioProgress(prev => prev.filter(a => a && typeof a === "object"));
  }, []);

  const getFileName = (uri) => uri.split("/").pop();


  // MODAL
  const [showModal, setShowModal] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Crear carpeta (solo en build real)
  const prepareFolder = async () => { };
  useEffect(() => {
    prepareFolder();
  }, []);

  // ================================
  // 📸 TOMAR FOTO
  // ================================
  const getNextPhotoNumber = () => {
    const number = photos.length + 1; // siguiente número
    return String(number).padStart(3, "0"); // convierte a 001, 002, 003
  };



  const takePhoto = async () => {
    if (!cameraRef) return;

    const result = await cameraRef.takePictureAsync({ quality: 0.9 });

    const timestamp = formatFileTimestamp();
    const nextNum = getNextPhotoNumber();
    const filePath =
      `${LegacyFS.documentDirectory}ALIM-SUBEST-FOT${nextNum}-${timestamp}.jpg`;

    await LegacyFS.copyAsync({
      from: result.uri,
      to: filePath,
    });






    setPhotos(prev => [...prev, filePath]);
  };





  // ================================
  // 📷 ABRIR FOTO EN GRANDE
  // ================================
  const openPhoto = (index) => {
    setSelectedPhotoIndex(index);
    setShowModal(true);
  };

  // ================================
  // 🗑 BORRAR FOTO
  // ================================
  const deletePhoto = async () => {
    const fileToDelete = photos[selectedPhotoIndex];

    await FS.deleteAsync(fileToDelete, { idempotent: true });

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
      // detener audio si estaba sonando
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
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      const timestamp = formatFileTimestamp();
      const nextNum = getNextAudioNumber();
      const filePath =
        `${LegacyFS.documentDirectory}ALIM-SUBEST-AUD${nextNum}-${timestamp}.m4a`;

      await LegacyFS.copyAsync({
        from: uri,
        to: filePath,
      });






      setAudios(prev => [...prev, filePath]);
      setAudioProgress(prev => [...prev, { position: 0, duration: 1 }]);
      setRecording(null);

    } catch (err) {
      console.log("Error al detener grabación:", err);
    }
  };






  const playAudio = async (uri, index) => {
    try {
      // 👉 Si es el mismo audio y estaba pausado → continuar desde donde quedó
      if (currentAudioIndex === index && sound && isPaused) {
        await sound.playAsync();
        setIsPaused(false);
        return;
      }

      // 👉 Si es el mismo audio y NO estaba pausado → pausar
      if (currentAudioIndex === index && sound && !isPaused) {
        await sound.pauseAsync();
        setIsPaused(true);
        return;
      }

      // 👉 Si cambia de audio, detener el anterior
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      // 👉 Cargar un nuevo audio
      const newSound = new Audio.Sound();
      await newSound.loadAsync(
        { uri },
        {
          shouldPlay: true,
          positionMillis: audioProgress[index]?.position ?? 0,
        }
      );

      const status = await newSound.getStatusAsync();

      setAudioProgress(prev => {
        const updated = [...prev];
        updated[index] = {
          position: audioProgress[index]?.position ?? 0,
          duration: status.durationMillis ?? 1,
        };
        return updated;
      });

      newSound.setOnPlaybackStatusUpdate((status) =>
        onPlaybackStatusUpdate(status, index)
      );

      setSound(newSound);
      setCurrentAudioIndex(index);
      setIsPaused(false); // 👉 Está reproduciendo normalmente

    } catch (e) {
      console.log("Error play:", e);
    }
  };







  const pauseAudio = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPaused(true);       // 🔥 ahora sí sabemos que está en pausa
    }
  };



  const onPlaybackStatusUpdate = (status, index) => {
    if (!status.isLoaded) return;

    // actualizar progreso normal
    setAudioProgress(prev => {
      const updated = [...prev];
      updated[index] = {
        position: status.positionMillis,
        duration: status.durationMillis ?? 1,
      };
      return updated;
    });

    // si termina, reiniciar barra y botón
    if (status.didJustFinish) {
      setAudioProgress(prev => {
        const updated = [...prev];
        updated[index] = { position: 0, duration: status.durationMillis ?? 1 };
        return updated;
      });

      setCurrentAudioIndex(null);
    }
  };






  const seekAudio = async (value, index) => {
    if (index !== currentAudioIndex) return; // Solo si es el audio reproducido

    if (sound) {
      await sound.setPositionAsync(value);
    }

    // Actualizamos también el progreso almacenado
    setAudioProgress(prev => {
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
    try {
      const filePath = audios[index];

      // borrar archivo físico
      await FS.deleteAsync(filePath, { idempotent: true });

      // borrar del array SIN duplicar
      setAudios(prev => prev.filter((_, i) => i !== index));
      setAudioProgress(prev => prev.filter((_, i) => i !== index));

      // si era el audio en reproducción → detenerlo
      if (currentAudioIndex === index) {
        if (sound) {
          await sound.stopAsync();
          await sound.unloadAsync();
        }
        setCurrentAudioIndex(null);
        setSound(null);
      }

      // si borraste uno anterior → reajustar el índice actual
      if (currentAudioIndex > index) {
        setCurrentAudioIndex(currentAudioIndex - 1);
      }

    } catch (err) {
      console.log("Error al eliminar audio:", err);
    }
  };


  // ================================
  // 💾 GUARDAR
  // ================================
  const confirmStopRecording = async () => {
    if (!recording) return true; // No hay grabación → permitir salir

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
              await stopRecording(); // detiene y guarda
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
      // 1️⃣ Obtener carpeta raíz SIGRE elegida por el usuario
      const rootUri = await getRootUri();
      if (!rootUri) {
        Alert.alert("Error", "No se eligió la carpeta raíz SIGRE");
        return;
      }

      // 2️⃣ Crear estructura de carpetas SIGRE
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

      // 3️⃣ Guardar todas las fotografías
      for (const photoUri of photos) {
        const filename = photoUri.split("/").pop();
        await saveFileToSAF(fotosUri, photoUri, filename, "image/jpeg");
      }

      // 4️⃣ Guardar todos los audios
      for (const audioUri of audios) {
        const filename = audioUri.split("/").pop();
        await saveFileToSAF(audiosUri, audioUri, filename, "audio/mp4");
      }

      // 5️⃣ Guardar nota como archivo TXT (opcional)
      if (note.trim() !== "") {
        const noteFile = LegacyFS.documentDirectory + "nota_temp.txt";
        await FS.writeAsStringAsync(noteFile, note, { encoding: "utf8" });

        await saveFileToSAF(
          defUri,
          noteFile,
          "nota.txt",
          "text/plain"
        );
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
          transparent={true}
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
              <Text style={{ color: "white", fontWeight: "bold" }}>Eliminar</Text>
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

        {/* ================================
          FOTOS
      ================================ */}
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
              <CameraView
                style={styles.camera}
                ref={setCameraRef}
              />

              {/* BOTÓN CAPTURAR */}
              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePhoto}
              >
                <Text style={styles.captureText}>Capturar</Text>
              </TouchableOpacity>

              {/* BOTÓN CERRAR CÁMARA */}
              <TouchableOpacity
                style={styles.closeCameraButton}
                onPress={() => setCameraVisible(false)}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>Cerrar</Text>
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

        {/* AUDIO */}
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

          {/* 🔴 Indicador de grabación */}
          {recording && (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 5 }}>
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
              <Text style={{ color: "red", fontWeight: "bold" }}>Grabando...</Text>
            </View>
          )}

          {/* LISTA DE AUDIOS */}
          {audios.map((uri, i) => (
            <View key={i} style={styles.audioContainer}>

              {/* PLAY / PAUSE */}
              <TouchableOpacity
                onPress={() => playAudio(uri, i)}
                style={styles.audioPlayButton}
              >
                <Text style={{ color: "white" }}>
                  {currentAudioIndex === i && !isPaused ? "⏸" : "▶️"}
                </Text>
              </TouchableOpacity>


              {/* INFORMACIÓN */}
              <View style={{ flex: 1 }}>



                <Text style={{ fontSize: 12, fontWeight: "bold", color: "#222" }}>
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

              {/* ELIMINAR */}
              <TouchableOpacity onPress={() => deleteAudio(i)}>
                <Text style={{ color: "red", fontSize: 18, marginLeft: 8 }}>✖</Text>
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
            textAlignVertical="top"   // ← MUY IMPORTANTE
            maxLength={144}
          />

          {/* CONTADOR DE CARACTERES */}
          <View style={styles.charCounterContainer}>
            <Text style={styles.charCounter}>{note.length}/144</Text>
          </View>

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
            style={styles.saveBtn}
            onPress={handleSave}
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
  audioItem: {
    marginTop: 5,
    fontSize: 14,
  },
  textArea: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
    height: 120,
    textAlignVertical: "top",  // ← NECESARIO para Android
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
  audioRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 10,
  },

  audioButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 30,
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
    paddingRight: 4
  },

  charCounter: {
    fontSize: 12,
    color: "#555",
  },


});
