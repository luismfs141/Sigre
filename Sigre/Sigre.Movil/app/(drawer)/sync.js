import AsyncStorage from '@react-native-async-storage/async-storage';
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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../../context/AuthContext";
import { closeDatabase, openDatabase } from '../../database/offlineDB/db';
import { useFeeder } from "../../hooks/useFeeder";
import { useOffline } from "../../hooks/useOffline";

export default function Sync() {

  const { user } = useContext(AuthContext);
  const { loading: offlineLoading, downloadDatabase } = useOffline();
  const { feedersByUser, getFeedersByUser, loading: loadingFeeders } =
    useFeeder(user?.id);

  const [selectedFeeders, setSelectedFeeders] = useState([]);
  const [dbExists, setDbExists] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const dbName = "sigre_offline.db";

  // Cargar alimentadores del usuario y verificar base
  useEffect(() => {
    if (user?.id) getFeedersByUser(user.id);
    checkDatabase();
  }, [user?.id]);

  useEffect(() => {
    loadSelectedFeeders();
  }, []);

  // ───────────────────────────────
  //   Verificar si la base existe
  // ───────────────────────────────
  const checkDatabase = async () => {
    try {
      const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      setDbExists(fileInfo.exists);
    } catch (error) {
      Alert.alert("Error", "No se pudo verificar la base local");
    }
  };

  // ───────────────────────────────
  //           Descargar base
  // ───────────────────────────────
  const handleDownload = async () => {
    if (!selectedFeeders.length)
      return Alert.alert("Selecciona al menos un alimentador");

    try {
      const feederIds = selectedFeeders.map(f => parseInt(f.id, 10));
      const fileUri = await downloadDatabase(user.id, feederIds);
      const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;

      await closeDatabase();

      if (fileUri !== dbPath) {
        await FileSystem.copyAsync({ from: fileUri, to: dbPath });
      }

      await openDatabase();
      await new Promise(r => setTimeout(r, 150));

      setSelectedFeeders([]);
      setDbExists(true);

      Alert.alert("Éxito", "Base descargada correctamente.");

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo descargar la base");
    }
  };

  // ───────────────────────────────
  //           Exportar base
  // ───────────────────────────────
  const handleExport = async () => {
    try {
      const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;
      const fileInfo = await FileSystem.getInfoAsync(dbPath);

      if (!fileInfo.exists)
        return Alert.alert("No hay base local");

      if (!(await Sharing.isAvailableAsync()))
        return Alert.alert("No disponible", "Tu dispositivo no permite compartir archivos");

      await Sharing.shareAsync(dbPath);
    } catch (error) {
      Alert.alert("Error", "No se pudo exportar la base");
    }
  };

  // ───────────────────────────────
  //              Sync
  // ───────────────────────────────
  const handleSync = async () => {
    try {
      const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;

      await closeDatabase();
      await FileSystem.deleteAsync(dbPath, { idempotent: true });

      setDbExists(false);
      setSelectedFeeders([]);
      await AsyncStorage.removeItem('selectedFeeders');

      Alert.alert("Listo", "Base eliminada y selección limpiada.");
    } catch (error) {
      Alert.alert("Error", "No se pudo sincronizar.");
    }
  };

  // ───────────────────────────────
  // Manejo de seleccionados
  // ───────────────────────────────
  const addFeeder = async (feeder) => {
    const newList = [...selectedFeeders, feeder];
    setSelectedFeeders(newList);
    await AsyncStorage.setItem('selectedFeeders', JSON.stringify(newList));
  };

  const loadSelectedFeeders = async () => {
    const saved = await AsyncStorage.getItem('selectedFeeders');
    if (saved) setSelectedFeeders(JSON.parse(saved));
  };

  const removeFeeder = async (feeder) => {
    const filtered = selectedFeeders.filter(f => f.id !== feeder.id);
    setSelectedFeeders(filtered);
    await AsyncStorage.setItem('selectedFeeders', JSON.stringify(filtered));
  };

  const isLoading = offlineLoading || loadingFeeders;

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={{ marginTop: 10 }}>Procesando...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.title}>Alimentadores seleccionados:</Text>

          <FlatList
            data={selectedFeeders}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.feederRow}>
                <Text style={styles.feederText}>{item.name}</Text>
                <Button title="❌" onPress={() => removeFeeder(item)} />
              </View>
            )}
          />

          {/* Botones principales */}
          <View style={[styles.buttonGroup, { flexWrap: 'wrap', justifyContent: 'space-between' }]}>
             {!dbExists && (
              <>
                <View style={styles.buttonWrapper}>
                  <Button title="➕ Añadir alimentador" onPress={() => setModalVisible(true)} />
                </View>
                <View style={styles.buttonWrapper}>
                  <Button title="📥 Descargar Base" onPress={handleDownload} />
                </View>
              </>
            )}

            {dbExists && (
              <>
                <View style={styles.buttonWrapper}>
                  <Button title="💾 Exportar Base" onPress={handleExport} />
                </View>
                <View style={styles.buttonWrapper}>
                  <Button title="🔄 Sincronizar" onPress={handleSync} />
                </View>
              </>
            )}
          </View>

          <Text style={{ marginTop: 10, fontWeight: "bold", color: dbExists ? "green" : "red" }}>
            {dbExists ? "📦 Base local detectada" : "⚠️ No hay base local"}
          </Text>

          {/* Modal de selección */}
          <Modal visible={modalVisible} transparent animationType="slide">
            <View style={styles.modalBackground}>
              <View style={styles.modalContainer}>
                <Text style={{ fontWeight: "bold", marginBottom: 10 }}>Selecciona un alimentador</Text>

                <FlatList
                  data={feedersByUser.filter(f =>
                    !selectedFeeders.some(sf => sf.id === f.alimInterno)
                  )}
                  keyExtractor={item => item.alimInterno.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalItem}
                      onPress={() =>
                        addFeeder({ id: item.alimInterno, name: item.alimEtiqueta })
                      }
                    >
                      <Text>{item.alimEtiqueta}</Text>
                    </TouchableOpacity>
                  )}
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
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 10
  },
  buttonWrapper: {
    width: '48%',
    marginVertical: 5
  },

  title: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },

  feederRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },

  feederText: { fontSize: 16 },

  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  modalContainer: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
  },

  modalItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
});