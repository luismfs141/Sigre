import { useRef, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { formatLocalISO, getUniqueNowMs } from "../../utils/dateUtils";

// ✅ NUEVO: expo-audio
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";

export default function ModalAudio({ visible, onClose, onAudioRecorded }) {
  const stampRef = useRef(null); // ✅ timestamp único por grabación

  // ✅ NUEVO: recorder hook
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  const [busy, setBusy] = useState(false);

  const startRecording = async () => {
    if (busy) return;
    setBusy(true);

    try {
      const micPerm = await AudioModule.requestRecordingPermissionsAsync();
      if (!micPerm?.granted) return;

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      // ✅ UNA sola vez aquí
      stampRef.current = getUniqueNowMs();

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (err) {
      console.error("Error iniciando grabación", err);
    } finally {
      setBusy(false);
    }
  };

  const stopRecording = async () => {
    if (busy) return;
    setBusy(true);

    try {
      if (!recorderState.isRecording) return;

      await audioRecorder.stop();
      const uri = audioRecorder.uri;

      if (!uri) {
        console.warn("No se obtuvo uri de grabación.");
        return;
      }

      // ✅ reutiliza el mismo timestamp
      const capturedAtMs = stampRef.current ?? getUniqueNowMs();
      const fechaISO = formatLocalISO(capturedAtMs);

      stampRef.current = null;

      onAudioRecorded?.({ uri, fechaISO, capturedAtMs });
      onClose?.();
    } catch (err) {
      console.warn("Grabación ya detenida o error al detener:", err);
    } finally {
      setBusy(false);
      // opcional: volver a modo normal
      setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>🎙️ Grabar audio</Text>

          {!recorderState.isRecording ? (
            <TouchableOpacity style={styles.recordButton} onPress={startRecording} disabled={busy}>
              <Text style={styles.buttonText}>Iniciar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.stopButton} onPress={stopRecording} disabled={busy}>
              <Text style={styles.buttonText}>Detener</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => {
              stampRef.current = null;
              onClose?.();
            }}
            disabled={busy}
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