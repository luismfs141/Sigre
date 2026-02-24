import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { fromLatLon } from "utm";

import { formatLocalISO, getUniqueNowMs } from "../../utils/dateUtils";


export default function ModalCamera({
  visible,
  onClose,
  onPhoto = () => { },
}) {
  // ✅ 1. LAZY LOADING EXTREMO
  // Si el modal no es visible, no renderizamos NADA.
  // Esto apaga la cámara y libera memoria inmediatamente.
  if (!visible) return null;

  return (
    <ModalCameraContent
      visible={visible}
      onClose={onClose}
      onPhoto={onPhoto}
    />
  );
}

// Separamos el contenido para asegurar que los hooks se reinicien correctamente
function ModalCameraContent({ visible, onClose, onPhoto }) {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isReady, setIsReady] = useState(false);

  // ✅ 2. ESTADO PARA LA FOTO TEMPORAL (PREVIEW)
  const [tempPhoto, setTempPhoto] = useState(null);
  const [processing, setProcessing] = useState(false);
  // ✅ UBICACIÓN CACHEADA (se actualiza mientras el modal está abierto)
  const [lastCoords, setLastCoords] = useState(null);


  /* ======================
     ZOOM (BOTONES)
  ====================== */
  const [zoom, setZoom] = useState(0);

  useEffect(() => {
    // Resetear estados al abrir
    setIsReady(false);
    setZoom(0);
    setTempPhoto(null);
    setProcessing(false);
  }, []);

  const zoomIn = () => setZoom((z) => Math.min(z + 0.1, 1));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.1, 0));

  /* ======================
   UBICACIÓN (RÁPIDA: WATCH + LAST KNOWN)
====================== */
  useEffect(() => {
    let sub = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      // 1) inmediato si existe algo cacheado por el sistema
      const last = await Location.getLastKnownPositionAsync();
      if (last?.coords) {
        setLastCoords({
          latitude: last.coords.latitude,
          longitude: last.coords.longitude,
        });
      }

      // 2) se actualiza mientras el modal está abierto
      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 1200,
          distanceInterval: 2,
        },
        (loc) => {
          if (loc?.coords) {
            setLastCoords({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
          }
        }
      );
    })();

    return () => {
      sub?.remove?.();
    };
  }, []);

  const convertToUTM = (lat, lon) => {
    const utm = fromLatLon(lat, lon);
    return {
      utmX: utm.easting,
      utmY: utm.northing,
      zone: utm.zoneNum,
    };
  };




  const takePhoto = async () => {
  if (!cameraRef.current || processing) return;

  setProcessing(true);

  // ✅ snapshot exacto al disparo
  const coordsAtShot = lastCoords;
  const capturedAtMs = getUniqueNowMs();

  try {
    await cameraRef.current.takePictureAsync({
      quality: 0.7,
      exif: false,

      // ✅ evita pantalla en blanco (archivo listo)
      skipProcessing: false,

      // ✅ setTempPhoto SOLO cuando ya guardó el archivo
      onPictureSaved: (photo) => {
        try {
          if (!photo?.uri) return;

          let utm = null;
          if (coordsAtShot) {
            utm = convertToUTM(coordsAtShot.latitude, coordsAtShot.longitude);
          }

          const temp = {
            uri: photo.uri,
            latUtm: utm?.utmY ?? null,
            lonUtm: utm?.utmX ?? null,
            utmZone: utm?.zone ?? null,

            capturedAtMs,
            fechaISO: formatLocalISO(capturedAtMs),
          };

          setTempPhoto(temp);
        } catch (e) {
          console.error("❌ Error post-proceso foto:", e);
        } finally {
          setProcessing(false);
        }
      },
    });
  } catch (e) {
    console.error("❌ Error cámara:", e);
    setProcessing(false);
  }
};




  /* ======================
     ACCIONES PREVIEW
  ====================== */
  const handleRetake = () => {
    setTempPhoto(null); // Borra la preview y vuelve a mostrar la cámara
    setProcessing(false);
  };

  const handleSave = () => {
    if (tempPhoto) {
      onPhoto(tempPhoto); // Envía la foto al padre
      onClose(); // Cierra el modal
    }
  };

  /* ======================
     PERMISOS UI
  ====================== */
  if (!permission) return <View style={{ flex: 1, backgroundColor: 'black' }} />;

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
            <Text style={[styles.cancelText, { color: 'black' }]}>Cancelar</Text>
          </Pressable>
        </View>
      </Modal>
    );
  }

  /* ======================
     RENDER PRINCIPAL
  ====================== */
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'black' }}>

        {/* === CONDICIONAL: ¿HAY FOTO TOMADA? === */}
        {tempPhoto ? (
          // --- VISTA PREVIA (GUARDAR O REPETIR) ---
          <View style={styles.previewContainer}>
            <Image source={{ uri: tempPhoto.uri }} style={styles.previewImage} />

            {/* ✅ BOTONES SUBIDOS PARA NO TAPAR CON NAV BAR */}
            <View style={styles.previewControls}>
              <Pressable style={styles.btnRetake} onPress={handleRetake}>
                <Text style={styles.btnText}>↻ Repetir</Text>
              </Pressable>

              <Pressable style={styles.btnSave} onPress={handleSave}>
                <Text style={styles.btnText}>✓ Guardar</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          // --- VISTA CÁMARA ---
          <>
            <CameraView
              ref={cameraRef}
              style={{ flex: 1 }}
              facing="back"
              zoom={zoom}
              onCameraReady={() => setIsReady(true)}
              onMountError={(e) => console.error("❌ Error cámara", e)}
            />

            {/* 🔍 ZOOM CONTROLS */}
            <View style={styles.zoomControls}>
              <Pressable style={styles.zoomBtn} onPress={zoomOut}>
                <Text style={styles.zoomBtnText}>−</Text>
              </Pressable>
              <Text style={styles.zoomBtnValue}>{Math.round(zoom * 100)}%</Text>
              <Pressable style={styles.zoomBtn} onPress={zoomIn}>
                <Text style={styles.zoomBtnText}>+</Text>
              </Pressable>
            </View>

            {/* 🎛️ CONTROLES CAPTURA */}
            <View style={styles.controls}>
              {processing ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : (
                <Pressable
                  style={[styles.capture, !isReady && { opacity: 0.4 }]}
                  disabled={!isReady}
                  onPress={takePhoto}
                />
              )}
              <Pressable onPress={onClose} style={{ marginTop: 10 }}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

/* ======================
   ESTILOS
====================== */
const styles = StyleSheet.create({
  // ... (Tus estilos originales para permisos y zoom se mantienen) ...
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  text: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10
  },
  btn: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#2563EB",
    borderRadius: 8,
  },

  // --- ESTILOS CÁMARA ---
  controls: {
    position: "absolute",
    bottom: 50, // Subido un poco por seguridad
    width: "100%",
    alignItems: "center",
  },
  capture: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fff",
    marginBottom: 5,
  },
  cancelText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: '500'
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
  zoomBtn: { padding: 6 },
  zoomBtnText: { color: "#fff", fontSize: 22, fontWeight: "700" },
  zoomBtnValue: { color: "#fff", fontSize: 12, marginVertical: 4 },

  // --- NUEVOS ESTILOS PREVIEW ---
  previewContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  previewImage: {
    flex: 1,
    resizeMode: "contain",
  },
  previewControls: {
    position: "absolute",
    // ✅ AQUÍ ESTÁ EL MARGEN DE SEGURIDAD PARA LAS TECLAS DE NAVEGACIÓN
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 30,
    paddingBottom: 20, // Padding extra inferior
  },
  btnRetake: {
    backgroundColor: "#DC2626", // Rojo
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    minWidth: 130,
    alignItems: "center",
  },
  btnSave: {
    backgroundColor: "#16A34A", // Verde
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    minWidth: 130,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});