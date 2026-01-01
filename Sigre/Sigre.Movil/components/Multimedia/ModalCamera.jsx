import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function ModalCamera({
  visible,
  onClose,
  onPhoto = () => {}, // 🛡️ evita crash si no se pasa
}) {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isReady, setIsReady] = useState(false);

  // 🔁 Reset al abrir
  useEffect(() => {
    if (visible) {
      setIsReady(false);
    }
  }, [visible]);

  // ⛔ Sin permisos aún
  if (!permission) return null;

  // 🔐 Solicitud de permisos
  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.center}>
          <Text style={styles.text}>
            Se requiere permiso para usar la cámara
          </Text>

          <Pressable style={styles.btn} onPress={requestPermission}>
            <Text style={styles.btnText}>Permitir cámara</Text>
          </Pressable>

          <Pressable onPress={onClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </Modal>
    );
  }

  // 📸 Captura SEGURA
  const takePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: false,
      });

      if (photo?.uri) {
        onPhoto(photo);
        onClose();
      }
    } catch (error) {
      console.error("❌ Error cámara:", error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={{ flex: 1 }}>
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing="back"
          onMountError={(e) =>
            console.error("❌ Error al montar cámara", e)
          }
          onCameraReady={() => setIsReady(true)}
        />

        {/* 🎛️ CONTROLES */}
        <View style={styles.controls}>
          <Pressable
            style={[
              styles.capture,
              !isReady && { opacity: 0.4 },
            ]}
            disabled={!isReady}
            onPress={takePhoto}
          />

          <Pressable onPress={onClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/* ======================
   ESTILOS
====================== */
const styles = StyleSheet.create({
  controls: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
  },
  capture: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fff",
    marginBottom: 14,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  btn: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#2563EB",
    borderRadius: 8,
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
  },
  text: {
    fontSize: 16,
    textAlign: "center",
  },
  cancelText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 14,
  },
});
