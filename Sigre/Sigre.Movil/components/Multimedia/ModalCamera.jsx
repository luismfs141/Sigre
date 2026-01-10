import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  Image,
  ActivityIndicator
} from "react-native";
import { fromLatLon } from "utm";
import { nowPeruISO } from "../../utils/dateUtils";

export default function ModalCamera({
  visible,
  onClose,
  onPhoto = () => {},
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
     UBICACIÓN
  ====================== */
  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
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

  /* ======================
     📸 TOMA DE FOTO (MODIFICADO)
  ====================== */
  const takePhoto = async () => {
    if (!cameraRef.current || processing) return;
    setProcessing(true);

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

      // ✅ EN LUGAR DE CERRAR, GUARDAMOS EN TEMPORAL PARA MOSTRAR PREVIEW
      setTempPhoto({
        uri: photo.uri,
        latUtm: utm?.utmY ?? null,
        lonUtm: utm?.utmX ?? null,
        utmZone: utm?.zone ?? null,
        fechaISO: nowPeruISO(),
      });
      
    } catch (e) {
      console.error("❌ Error cámara:", e);
    } finally {
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
  if (!permission) return <View style={{flex:1, backgroundColor:'black'}} />;

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
            <Text style={[styles.cancelText, {color: 'black'}]}>Cancelar</Text>
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
              <Pressable onPress={onClose} style={{marginTop: 10}}>
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