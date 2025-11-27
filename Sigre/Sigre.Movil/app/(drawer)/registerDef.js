


import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { Audio } from "expo-audio"; // NUEVA API DE AUDIO
import { CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system";

export default function DeficiencyMediaScreen() {
  const router = useRouter();
  const { id, name, severity } = useLocalSearchParams();

  const [photos, setPhotos] = useState([]);
  const [audios, setAudios] = useState([]);
  const [note, setNote] = useState("");

  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraRef, setCameraRef] = useState(null);

  const [recording, setRecording] = useState(null);

  // Carpeta donde guardar todo
  const baseFolder = `${FileSystem.documentDirectory}def_${id}/`;

  // Permisos de cámara
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    prepareFolder();
  }, []);

  // Crear carpeta si no existe
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

    const result = await cameraRef.takePictureAsync({ quality: 0.9 });
    const filename = `${baseFolder}photo_${Date.now()}.jpg`;

    await FileSystem.copyAsync({
      from: result.uri,
      to: filename,
    });

    setPhotos([...photos, filename]);
    setCameraVisible(false);
  };

  // ================================
  // 🎤 GRABAR AUDIO — expo-audio
  // ================================
  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();

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

      const filename = `${baseFolder}audio_${Date.now()}.m4a`;

      await FileSystem.moveAsync({
        from: uri,
        to: filename,
      });

      setAudios([...audios, filename]);
      setRecording(null);

    } catch (err) {
      console.log("Error al detener grabación:", err);
    }
  };

  // ================================
  // 💾 GUARDAR
  // ================================
  const handleSave = () => {
    router.replace("/(drawer)/inspection");
  };

  // ================================ UI
  return (
    <View style={styles.container}>
      
      <Text style={styles.title}>{name}</Text>
      <Text style={styles.sub}>Severidad: {severity}</Text>
      <Text style={styles.path}>Ruta: {baseFolder}</Text>

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

        <ScrollView horizontal style={styles.carousel}>
          {photos.map((p, i) => (
            <Image key={i} source={{ uri: p }} style={styles.photo} />
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

        {audios.map((a, i) => (
          <Text key={i} style={styles.audioItem}>🎧 {a}</Text>
        ))}
      </View>

      {/* NOTA */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Nota</Text>
        <TextInput
          style={styles.textArea}
          multiline
          value={note}
          onChangeText={setNote}
        />
      </View>

      {/* BOTONES */}
      <View style={styles.bottomButtons}>

        <TouchableOpacity 
          style={styles.cancelBtn}
          onPress={() => router.replace("/(drawer)/inspection")}
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

    </View>
  );
}



