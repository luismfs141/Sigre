import * as FileSystem from "expo-file-system";

import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { Audio } from "expo-av";
import { CameraView, useCameraPermissions } from "expo-camera";
//const { File, Directory } = FileSystem;


export default function DeficiencyMediaScreen() {
  const router = useRouter();
  const { id, name, severity } = useLocalSearchParams();

  const [photos, setPhotos] = useState([]);
  const [audios, setAudios] = useState([]);
  const [note, setNote] = useState("");

  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraRef, setCameraRef] = useState(null);

  const [audioRecording, setAudioRecording] = useState(null);

  // Carpeta donde guardar todo
  const baseFolder = `${FileSystem.documentDirectory}def_${id}/`;

  // Permisos de cámara
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    prepareFolder();
  }, []);

  const prepareFolder = async () => {
  const folder = await FileSystem.getInfoAsync(baseFolder);

  if (!folder.exists) {
    await FileSystem.makeDirectoryAsync(baseFolder, { intermediates: true });
  }
};


  // ================================
  // 📸 TOMAR FOTO
  // ================================
  const takePhoto = async () => {
    if (!cameraRef) return;

    const result = await cameraRef.takePictureAsync();
    const filename = `${baseFolder}photo_${Date.now()}.jpg`;

    await FileSystem.copyAsync({
  from: result.uri,
  to: filename,
});



    setPhotos([...photos, filename]);
    setCameraVisible(false);
  };

  // ================================
  // 🎤 GRABAR AUDIO
  // ================================
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setAudioRecording(recording);

    } catch (err) {
      console.log("Error al iniciar grabación:", err);
    }
  };

  const stopRecording = async () => {
    try {
      await audioRecording.stopAndUnloadAsync();
      const uri = audioRecording.getURI();

      const filename = `${baseFolder}audio_${Date.now()}.m4a`;

      await FileSystem.moveAsync({
  from: uri,
  to: filename,
});



      setAudios([...audios, filename]);
      setAudioRecording(null);

    } catch (err) {
      console.log("Error al detener grabación:", err);
    }
  };

  // ================================
  // 💾 GUARDAR
  // ================================
  const handleSave = () => {
    // Aquí enviarías datos a SQLite o API
    router.back();
  };

  return (
    <View style={styles.container}>

      {/* ================================
          CABECERA
      =================================*/}
      <Text style={styles.title}>{name ?? "Deficiencia"}</Text>
      <Text style={styles.sub}>Severidad: {severity ?? "—"}</Text>
      <Text style={styles.path}>Ruta: {baseFolder}</Text>

      {/* ================================
          ZONA 1 - FOTOS
      =================================*/}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📸 Fotografías</Text>

        {/* Botón Cámara */}
        <TouchableOpacity 
          style={styles.button}
          onPress={() => {
            if (!permission?.granted) requestPermission();
            else setCameraVisible(true);
          }}
        >
          <Text style={styles.buttonText}>Tomar foto</Text>
        </TouchableOpacity>

        {/* Cámara visible */}
        {cameraVisible && (
          <View style={styles.cameraContainer}>
            <CameraView 
              style={styles.camera}
              ref={setCameraRef}
            />
            <TouchableOpacity 
              style={styles.captureButton}
              onPress={takePhoto}
            >
              <Text style={styles.captureText}>Capturar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Carrusel de fotos */}
        <ScrollView horizontal style={styles.carousel}>
          {photos.map((p, i) => (
            <Image 
              key={i} 
              source={{ uri: p }} 
              style={styles.photo}
            />
          ))}
        </ScrollView>
      </View>

      {/* ================================
          ZONA 2 - AUDIOS
      =================================*/}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎤 Audios</Text>

        <View style={styles.row}>
          {!audioRecording ? (
            <TouchableOpacity style={styles.buttonGreen} onPress={startRecording}>
              <Text style={styles.buttonText}>REC</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.buttonRed} onPress={stopRecording}>
              <Text style={styles.buttonText}>STOP</Text>
            </TouchableOpacity>
          )}
        </View>

        {audios.map((a, i) => (
          <Text key={i} style={styles.audioItem}>
            🎧 {a}
          </Text>
        ))}
      </View>

      {/* ================================
          ZONA 3 - NOTA
      =================================*/}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Nota</Text>
        <TextInput
          style={styles.textArea}
          multiline
          value={note}
          onChangeText={setNote}
          placeholder="Escribe aquí..."
        />
      </View>

      {/* ================================
          BOTONES
      =================================*/}
      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.bottomText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.bottomText}>Guardar</Text>
        </TouchableOpacity>
      </View>

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

  row: {
    flexDirection: "row",
    gap: 10,
  },
  audioItem: {
    marginTop: 5,
    fontSize: 14,
  },

  textArea: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
    height: 100,
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
});

