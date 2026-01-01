import { Audio } from "expo-av";
import { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ModalAudio({ visible, onClose, onAudioRecorded }) {
  const [recording, setRecording] = useState(null);

  useEffect(() => {
    return () => {
      recording?.stopAndUnloadAsync();
    };
  }, [recording]);

  const startRecording = async () => {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    setRecording(recording);
  };

  const stopRecording = async () => {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();

    onAudioRecorded(uri);
    setRecording(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <Text style={styles.title}>🎙️ Grabación de Audio</Text>

        {!recording ? (
          <TouchableOpacity style={styles.button} onPress={startRecording}>
            <Text style={styles.text}>Iniciar Grabación</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.buttonStop} onPress={stopRecording}>
            <Text style={styles.text}>Detener Grabación</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={onClose}>
          <Text>Cerrar</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#2563EB",
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  buttonStop: {
    backgroundColor: "#DC2626",
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  text: {
    color: "#fff",
    fontWeight: "500",
  },
});
