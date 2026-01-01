import { Directory, File, Paths } from "expo-file-system";
import { useContext, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthContext } from "../../context/AuthContext";
import { useDatos } from "../../context/DatosContext";

import AudioCard from "../../components/Multimedia/AudioCard";
import ModalAudio from "../../components/Multimedia/ModalAudio";
import ModalCamera from "../../components/Multimedia/ModalCamera";
import PhotoCard from "../../components/Multimedia/PhotoCard";

export default function Multimedia() {
  const { selectedItem } = useDatos();
  const { user } = useContext(AuthContext);

  /* ======================
     STATE
  ====================== */
  const [cameraModal, setCameraModal] = useState(false);
  const [audioModal, setAudioModal] = useState(false);

  const [photos, setPhotos] = useState([]);
  const [audios, setAudios] = useState([]);

  const [previewPhoto, setPreviewPhoto] = useState(null);

  /* ======================
     HANDLERS
  ====================== */
  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const removeAudio = (index) => {
    setAudios((prev) => prev.filter((_, i) => i !== index));
  };

  /* ======================
     FINALIZAR
  ====================== */

  const normalizeExt = (ext) => {
  if (!ext) return "jpg";
  return ext.startsWith(".") ? ext.slice(1) : ext;
};

const finalizar = async () => {
  if (!selectedItem) {
    Alert.alert("Error", "No hay elemento seleccionado");
    return;
  }

  try {
    const codigoUnico = `${user.id}-${Date.now()}`;

    const baseDir = new Directory(
      Paths.document,
      "SigreMovil",
      "Elemento",
      codigoUnico
    );

    await baseDir.create({
      intermediates: true,
      idempotent: true,
    });

    const photosDir = baseDir.createDirectory("Photos");
    const audiosDir = baseDir.createDirectory("Audios");

    await photosDir.create({ idempotent: true });
    await audiosDir.create({ idempotent: true });

    // 📸 FOTOS
    for (let i = 0; i < photos.length; i++) {
      const source = new File(photos[i].uri);
      const ext = normalizeExt(source.extension);

      const destination = photosDir.createFile(
        `photo_${i + 1}_${Date.now()}.${ext}`
      );

      if (destination.exists) {
        await destination.delete();
      }

      await source.move(destination);
    }

    // 🎙️ AUDIOS
    for (let i = 0; i < audios.length; i++) {
      const source = new File(audios[i].uri);
      const ext = normalizeExt(source.extension || "m4a");

      const destination = audiosDir.createFile(
        `audio_${i + 1}_${Date.now()}.${ext}`
      );

      if (destination.exists) {
        await destination.delete();
      }

      await source.move(destination);
    }

    setPhotos([]);
    setAudios([]);

    Alert.alert("Éxito", "Multimedia guardada correctamente");
    console.log("✔ Guardado en:", baseDir.uri);
  } catch (error) {
    console.error(error);
    Alert.alert("Error", "No se pudo guardar la multimedia");
  }
};

  /* ======================
     UI
  ====================== */
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.photosSection}>
          <Text style={styles.title}>📸 Registro de Fotos</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => setCameraModal(true)}
          >
            <Text style={styles.buttonText}>Tomar Foto</Text>
          </TouchableOpacity>

          <ScrollView
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
          >
            {photos.map((photo, index) => (
              <PhotoCard
                key={index}
                title={`Foto ${index + 1}`}
                uri={photo.uri}
                onPress={() => setPreviewPhoto(photo.uri)}
                onDelete={() => removePhoto(index)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.audioSection}>
          <Text style={styles.title}>🎙️ Registro de Audio</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => setAudioModal(true)}
          >
            <Text style={styles.buttonText}>Grabar Audio</Text>
          </TouchableOpacity>

          {audios.map((audio, index) => (
            <AudioCard
              key={audio.id}
              title={`Audio ${index + 1}`}
              uri={audio.uri}
              onDelete={() => removeAudio(index)}
            />
          ))}
        </View>

        <View style={styles.finishSection}>
          <TouchableOpacity style={styles.finishButton} onPress={finalizar}>
            <Text style={styles.finishText}>FINALIZAR</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={!!previewPhoto} transparent>
        <View style={styles.previewContainer}>
          <Image source={{ uri: previewPhoto }} style={styles.previewImage} />
          <TouchableOpacity
            style={styles.closePreview}
            onPress={() => setPreviewPhoto(null)}
          >
            <Text style={styles.closeText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <ModalCamera
        visible={cameraModal}
        onClose={() => setCameraModal(false)}
        onPhoto={(photo) => {
          if (photos.length >= 8) return;
          setPhotos((prev) => [...prev, { uri: photo.uri }]);
        }}
      />

      <ModalAudio
        visible={audioModal}
        onClose={() => setAudioModal(false)}
        onAudioRecorded={(uri) => {
          if (audios.length >= 2) return;
          setAudios((prev) => [
            ...prev,
            { id: Date.now().toString(), uri },
          ]);
        }}
      />
    </SafeAreaView>
  );
}


/* ======================
   ESTILOS
====================== */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6F6F6",
  },
  container: {
    flex: 1,
    paddingHorizontal: 12,
  },
  photosSection: {
    flex: 6,
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  audioSection: {
    flex: 3,
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  finishSection: {
    paddingVertical: 8,
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#2563EB",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "500",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBottom: 10,
  },
  finishButton: {
    backgroundColor: "#16A34A",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  finishText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  previewContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: "80%",
    resizeMode: "contain",
  },
  closePreview: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  closeText: {
    fontWeight: "600",
  },
});
