import { Directory, File, Paths } from "expo-file-system";
import { useContext, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
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

  const [cameraModal, setCameraModal] = useState(false);
  const [audioModal, setAudioModal] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [audios, setAudios] = useState([]);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const getElementoInfo = () => {
    if (selectedItem?.PostInterno) return { tipo: "Poste", codigo: selectedItem.PostCodigoNodo };
    if (selectedItem?.VanoInterno) return { tipo: "Vano", codigo: selectedItem.VanoCodigo };
    throw new Error("Elemento no soportado");
  };

  const normalizeExt = (uri) => {
    const parts = uri.split(".");
    return parts.length > 1 ? parts[parts.length - 1] : "jpg";
  };

  const removePhoto = (index) => setPhotos((prev) => prev.filter((_, i) => i !== index));
  const removeAudio = (index) => setAudios((prev) => prev.filter((_, i) => i !== index));

  const finalizar = async () => {
    if (!selectedItem) return Alert.alert("Error", "No hay elemento seleccionado");

    try {
      const { tipo, codigo } = getElementoInfo();
      const sessionId = `${user.id}-${Date.now()}`;

      // 📁 Carpeta base externa (Android) o Documents (iOS)
      const baseDir = new Directory(
        Platform.OS === "android" ? Paths.externalStorage : Paths.document,
        "SigreMovil",
        tipo,
        codigo,
        sessionId
      );
      await baseDir.create({ intermediates: true, idempotent: true });

      // 📂 Subcarpetas Fotos y Audios
      const fotosDir = baseDir.createDirectory("Fotos");
      const audiosDir = baseDir.createDirectory("Audios");
      await fotosDir.create({ idempotent: true });
      await audiosDir.create({ idempotent: true });

      // 📸 Guardar fotos
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (!photo?.uri) continue;
        const ext = normalizeExt(photo.uri);
        const destino = fotosDir.createFile(`Foto${i + 1}.${ext}`);
        const source = new File(photo.uri);
        if (await destino.exists()) await destino.delete();
        await source.move(destino);
      }

      // 🎙️ Guardar audios
      for (let i = 0; i < audios.length; i++) {
        const audio = audios[i];
        if (!audio?.uri) continue;
        const ext = normalizeExt(audio.uri) || "m4a";
        const destino = audiosDir.createFile(`Audio${i + 1}.${ext}`);
        const source = new File(audio.uri);
        if (await destino.exists()) await destino.delete();
        await source.move(destino);
      }

      setPhotos([]);
      setAudios([]);

      Alert.alert("Éxito", `Multimedia guardada correctamente en:\n${baseDir.uri}`);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo guardar la multimedia");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.photosSection}>
          <Text style={styles.title}>📸 Registro de Fotos</Text>
          <TouchableOpacity style={styles.button} onPress={() => setCameraModal(true)}>
            <Text style={styles.buttonText}>Tomar Foto</Text>
          </TouchableOpacity>
          <ScrollView contentContainerStyle={styles.grid}>
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
          <TouchableOpacity style={styles.button} onPress={() => setAudioModal(true)}>
            <Text style={styles.buttonText}>Grabar Audio</Text>
          </TouchableOpacity>
          <ScrollView contentContainerStyle={{ paddingBottom: 10 }}>
            {audios.map((audio, index) => (
              <AudioCard
                key={audio.id}
                title={`Audio ${index + 1}`}
                uri={audio.uri}
                onDelete={() => removeAudio(index)}
              />
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity style={styles.finishButton} onPress={finalizar}>
          <Text style={styles.finishText}>FINALIZAR</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={!!previewPhoto} transparent>
        <View style={styles.previewContainer}>
          <Image source={{ uri: previewPhoto }} style={styles.previewImage} />
          <TouchableOpacity style={styles.closePreview} onPress={() => setPreviewPhoto(null)}>
            <Text>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <ModalCamera
        visible={cameraModal}
        onClose={() => setCameraModal(false)}
        onPhoto={(photo) =>
          setPhotos((prev) => (prev.length < 8 ? [...prev, { uri: photo.uri }] : prev))
        }
      />

      <ModalAudio
        visible={audioModal}
        onClose={() => setAudioModal(false)}
        onAudioRecorded={(uri) =>
          setAudios((prev) => [...prev, { id: Date.now().toString(), uri }])
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F6F6F6" },
  container: { flex: 1, paddingHorizontal: 12 },
  photosSection: { flex: 6, backgroundColor: "#fff", padding: 14, borderRadius: 12, marginBottom: 8 },
  audioSection: { flex: 3, backgroundColor: "#fff", padding: 14, borderRadius: 12, marginBottom: 8 },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 10 },
  button: { backgroundColor: "#2563EB", paddingVertical: 10, borderRadius: 8, alignItems: "center", marginBottom: 10 },
  buttonText: { color: "#fff", fontWeight: "500" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingBottom: 10 },
  finishButton: { backgroundColor: "#16A34A", paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  finishText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  previewContainer: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  previewImage: { width: "100%", height: "80%", resizeMode: "contain" },
  closePreview: { marginTop: 20, padding: 10, backgroundColor: "#fff", borderRadius: 8 },
});
