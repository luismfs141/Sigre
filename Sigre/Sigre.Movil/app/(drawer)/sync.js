import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../../context/AuthContext";
import { useOffline } from "../../hooks/useOffline";

// Mock de feeders disponibles, cada uno con id y nombre
const allFeeders = [
  { id: 1, name: "Alimentador A" },
  { id: 2, name: "Alimentador B" },
  { id: 3, name: "Alimentador C" },
  { id: 4, name: "Alimentador D" },
];

export default function Sync() {
  const { user } = useContext(AuthContext);
  const { loading, downloadDatabase } = useOffline();

  const [selectedFeeders, setSelectedFeeders] = useState([]);
  const [dbExists, setDbExists] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const dbName = "sigre_offline.db";

  useEffect(() => {
    checkDatabase();
  }, []);

  const checkDatabase = async () => {
    try {
      const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      setDbExists(fileInfo.exists);
    } catch (error) {
      console.error("Error verificando base local:", error);
      Alert.alert("Error", "No se pudo verificar la base local");
    }
  };

  const handleDownload = async () => {
    if (!selectedFeeders.length) {
      Alert.alert("Selecciona al menos un alimentador");
      return;
    }

    const feederIds = selectedFeeders.map(f=>f.id);

    const fileUri = await downloadDatabase(user.id, feederIds);
    if (fileUri) {
      Alert.alert("✅ Base descargada correctamente");
      await checkDatabase();
    } else {
      Alert.alert("❌ Error descargando la base");
    }
  };

  const handleExport = async () => {
    try {
      const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;
      const fileInfo = await FileSystem.getInfoAsync(dbPath);

      if (!fileInfo.exists) {
        Alert.alert("Sin base local", "No se encontró la base SQLite local.");
        return;
      }

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("No disponible", "La función de compartir no está disponible.");
        return;
      }

      await Sharing.shareAsync(dbPath);
    } catch (error) {
      console.error("Error exportando backup:", error);
      Alert.alert("Error", "No se pudo exportar la base de datos.");
    }
  };

  const handleSync = async () => {
    // Simulación de sincronización: eliminar base local
    try {
      const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;
      await FileSystem.deleteAsync(dbPath, { idempotent: true });
      setDbExists(false);
      Alert.alert("📡 Sincronización simulada", "Base local eliminada.");
    } catch (error) {
      console.error("Error sincronizando:", error);
      Alert.alert("Error", "No se pudo sincronizar la base.");
    }
  };

  const addFeeder = (feeder) => {
    setSelectedFeeders((prev) => [...prev, feeder]);
    setModalVisible(false);
  };

  const removeFeeder = (feeder) => {
    setSelectedFeeders((prev) => prev.filter((f) => f.id !== feeder.id));
  };

  const renderSelectedFeeder = ({ item }) => (
    <View style={styles.feederRow}>
      <Text style={styles.feederText}>{item.name}</Text>
      <Button title="❌" onPress={() => removeFeeder(item)} />
    </View>
  );

  const renderFeederItem = ({ item }) => (
    <TouchableOpacity
      style={styles.modalItem}
      onPress={() => addFeeder(item)}
    >
      <Text>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={{ marginTop: 10 }}>Procesando...</Text>
        </View>
      )}

      {!loading && (
        <>
          <Text style={styles.title}>Alimentadores seleccionados:</Text>

          {selectedFeeders.length === 0 && (
            <Text style={{ marginBottom: 10 }}>Ninguno seleccionado</Text>
          )}

          <FlatList
            data={selectedFeeders}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderSelectedFeeder}
            style={{ marginBottom: 10 }}
          />

          <Button title="➕ Añadir alimentador" onPress={() => setModalVisible(true)} />

          <View style={styles.buttonGroup}>
            <Button title="📥 Descargar Base" onPress={handleDownload} disabled={dbExists} />
            <Button title="💾 Exportar Base" onPress={handleExport} disabled={!dbExists} />
            <Button title="🔄 Sincronizar" onPress={handleSync} />
          </View>

          <Text style={{ marginTop: 10, fontWeight: "bold", color: dbExists ? "green" : "red" }}>
            {dbExists ? "📦 Base local detectada" : "⚠️ No hay base de datos local"}
          </Text>

          {/* Modal para seleccionar feeders */}
          <Modal
            visible={modalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalBackground}>
              <View style={styles.modalContainer}>
                <Text style={{ fontWeight: "bold", marginBottom: 10 }}>Selecciona un alimentador</Text>
                <FlatList
                  data={allFeeders.filter((f) => !selectedFeeders.some((sf) => sf.id === f.id))}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderFeederItem}
                />
                <Button title="Cerrar" onPress={() => setModalVisible(false)} />
              </View>
            </View>
          </Modal>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#f9f9f9" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  feederRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 },
  feederText: { fontSize: 16 },
  buttonGroup: { flexDirection: "row", justifyContent: "space-around", marginVertical: 10 },
  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContainer: { width: "80%", backgroundColor: "#fff", borderRadius: 10, padding: 15 },
  modalItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: "#ccc" },
});