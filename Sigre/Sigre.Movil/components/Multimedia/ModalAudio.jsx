import { Audio } from "expo-av";
import { useRef, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { formatLocalISO, getUniqueNowMs } from "../../utils/dateUtils";


export default function ModalAudio({ visible, onClose, onAudioRecorded }) {
  const [recording, setRecording] = useState(null);
  const stampRef = useRef(null); // ✅ timestamp único por grabación

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // ✅ UNA sola vez aquí
      stampRef.current = getUniqueNowMs();

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
    } catch (err) {
      console.error("Error iniciando grabación", err);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      const rec = recording;
      setRecording(null);

      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();

      // ✅ reutiliza el mismo timestamp
      const capturedAtMs = stampRef.current ?? getUniqueNowMs();
      const fechaISO = formatLocalISO(capturedAtMs);

      stampRef.current = null;

      onAudioRecorded({ uri, fechaISO, capturedAtMs });
      onClose();
    } catch (err) {
      console.warn("Grabación ya detenida");
    }
  };


  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>🎙️ Grabar audio</Text>

          {!recording ? (
            <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
              <Text style={styles.buttonText}>Iniciar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
              <Text style={styles.buttonText}>Detener</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => {
              stampRef.current = null;
              onClose();
            }}
          >
            <Text style={styles.cancel}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "80%",
    maxWidth: 320,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    elevation: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  recordButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginBottom: 12,
  },
  stopButton: {
    backgroundColor: "#DC2626",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginBottom: 12,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  cancel: {
    marginTop: 4,
    fontSize: 13,
    color: "#555",
  },
});
