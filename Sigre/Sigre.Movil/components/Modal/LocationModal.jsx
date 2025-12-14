import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function LocationModal({ visible, onClose, onConfirm }) {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (!visible) return;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permiso de ubicación denegado");
        onClose();
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    })();
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Ubicación Actual</Text>
          
          {location ? (
            <>
              <Text style={styles.coordText}>Latitud: {location.latitude}</Text>
              <Text style={styles.coordText}>Longitud: {location.longitude}</Text>

              <View style={styles.buttons}>
                <TouchableOpacity style={styles.btnSave} onPress={() => onConfirm(location)}>
                  <Text style={styles.btnText}>Confirmar</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.btnDelete} onPress={onClose}>
                  <Text style={styles.btnText}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <Text>Cargando ubicación...</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "#0008", justifyContent: "center", alignItems: "center", padding: 12 },
  container: { backgroundColor: "#fff", padding: 20, borderRadius: 12, width: "80%", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  coordText: { fontSize: 16, marginBottom: 8 },
  buttons: { flexDirection: "row", justifyContent: "space-between", marginTop: 20, width: "100%" },
  btnDelete: { backgroundColor: "#e74c3c", padding: 12, borderRadius: 8, width: "48%", alignItems: "center" },
  btnSave: { backgroundColor: "#27ae60", padding: 12, borderRadius: 8, width: "48%", alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "600" }
});
