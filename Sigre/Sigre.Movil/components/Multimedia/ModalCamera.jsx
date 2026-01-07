import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { fromLatLon } from "utm";
import { nowPeruISO } from "../../utils/dateUtils";

export default function ModalCamera({
  visible,
  onClose,
  onPhoto = () => {},
}) {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isReady, setIsReady] = useState(false);

  /* ======================
     ZOOM (BOTONES)
  ====================== */
  const [zoom, setZoom] = useState(0); // 0 → 1

  useEffect(() => {
    if (visible) {
      setIsReady(false);
      setZoom(0);
    }
  }, [visible]);

  const zoomIn = () =>
    setZoom((z) => Math.min(z + 0.1, 1));

  const zoomOut = () =>
    setZoom((z) => Math.max(z - 0.1, 0));

  /* ======================
     UBICACIÓN
  ====================== */
  const getCurrentLocation = async () => {
    const { status } =
      await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") return null;

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    };
  };

  const convertToUTM = (lat, lon) => {
    const utm = fromLatLon(lat, lon);
    return {
      utmX: utm.easting,
      utmY: utm.northing,
      zone: utm.zoneNum,
    };
  };

  if (!permission) return null;

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

  /* ======================
     📸 FOTO
  ====================== */
  const takePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: false,
      });

      if (!photo?.uri) return;

      const coords = await getCurrentLocation();
      let utm = null;

      if (coords) {
        utm = convertToUTM(coords.latitude, coords.longitude);
      }

      onPhoto({
        uri: photo.uri,
        latUtm: utm?.utmY ?? null,
        lonUtm: utm?.utmX ?? null,
        utmZone: utm?.zone ?? null,
        fechaISO: nowPeruISO(),
      });

      onClose();
    } catch (e) {
      console.error("❌ Error cámara:", e);
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={{ flex: 1 }}>
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing="back"
          zoom={zoom}
          onCameraReady={() => setIsReady(true)}
          onMountError={(e) =>
            console.error("❌ Error cámara", e)
          }
        />

        {/* 🔍 ZOOM CONTROLS */}
        <View style={styles.zoomControls}>
          <Pressable style={styles.zoomBtn} onPress={zoomOut}>
            <Text style={styles.zoomBtnText}>−</Text>
          </Pressable>

          <Text style={styles.zoomBtnValue}>
            {Math.round(zoom * 100)}%
          </Text>

          <Pressable style={styles.zoomBtn} onPress={zoomIn}>
            <Text style={styles.zoomBtnText}>+</Text>
          </Pressable>
        </View>

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
  zoomControls: {
    position: "absolute",
    right: 20,
    top: 80,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  zoomBtn: {
    padding: 6,
  },
  zoomBtnText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  zoomBtnValue: {
    color: "#fff",
    fontSize: 12,
    marginVertical: 4,
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