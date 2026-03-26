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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { AuthContext } from "../../context/AuthContext";
import { useDatos } from "../../context/DatosContext";
import { closeDatabase } from '../../database/offlineDB/db';
import { useFeeder } from "../../hooks/useFeeder";
import { useOffline } from "../../hooks/useOffline";
import { useSed } from "../../hooks/useSed";


const pad2 = (value) => String(value).padStart(2, "0");

const sanitizeFilePart = (value = "") =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/-+/g, "-");

const buildOfflineDbName = (user) => {
  const now = new Date();

  const fecha = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  const hora = `${pad2(now.getHours())}-${pad2(now.getMinutes())}-${pad2(now.getSeconds())}`;

  const usuario = sanitizeFilePart(
    `${user?.nombre ?? ""}-${user?.apellido ?? ""}`
  ) || "USUARIO";

  return `SIGRE_${usuario}_${fecha}_${hora}.db`;
};

export default function Sync() {

  const { user } = useContext(AuthContext);
  const { downloading, downloadDatabase, syncing, syncAllPending, getPendingSyncSummary } = useOffline();
  const { dbName, setDbName, selectedFeeder, setSelectedFeeder } = useDatos();
  const dispatch = useDispatch();
  const isAppLoading = useSelector((state) => state.app.isLoading);
  const { fetchAllSedsLocal } = useSed();

  const {
    feedersByUser,
    getFeedersByUser,
    loading: loadingFeeders,
    fetchSedsByFeeder,
    seds
  } = useFeeder(user?.id);

  // Estados
  const [selectedFeeders, setSelectedFeeders] = useState([]);
  const [dbExists, setDbExists] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalSubVisible, setModalSubVisible] = useState(false);

  // Proyecto 0
  const [substationsByFeeder, setSubstationsByFeeder] = useState([]);
  const [selectedSubstations, setSelectedSubstations] = useState([]);
  const [localSeds, setLocalSeds] = useState([]);
  const [searchSed, setSearchSed] = useState("");

  //───────────────────────────────────────────────
  // CARGAR SEDS LOCALES CUANDO EXISTE BASE
  //───────────────────────────────────────────────
  useEffect(() => {
    const loadLocalSeds = async () => {
      if (!dbName) return;

      try {
        console.log("📦 Base local detectada:", dbName);
        const data = await fetchAllSedsLocal();
        //console.log("✅ SEDs locales recibidas:", data);
        setLocalSeds(Array.isArray(data) ? data : []);
      } catch (e) {
        console.log("❌ Error cargando SEDs locales:", e);
        setLocalSeds([]);
      }
    };

    loadLocalSeds();
  }, [dbName]);

  //───────────────────────────────────────────────
  // CARGAR ALIMENTADORES
  //───────────────────────────────────────────────

  useEffect(() => {
    if (user?.id) {
      //console.log("👤 Cargando alimentadores del usuario:", user.id);
      getFeedersByUser(user.id);
    }
  }, [user?.id]);

  //───────────────────────────────────────────────
  // REVISAR BASE CUANDO CAMBIA NOMBRE
  //───────────────────────────────────────────────
  useEffect(() => {
    if (!dbName) return;
    //console.log("🗂 Revisando existencia de BD:", dbName);
    checkDatabase();
  }, [dbName]);

  const checkDatabase = async () => {
    try {
      const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      //console.log("📁 DB existe?:", fileInfo.exists, "→", dbPath);
      setDbExists(fileInfo.exists);
    } catch (e) {
      console.log("❌ Error revisando BD", e);
    }
  };

  //───────────────────────────────────────────────
  // DESCARGAR BASE
  //───────────────────────────────────────────────
  const handleDownload = async () => {
    if (isAppLoading) return;

    if (user?.proyecto === 0) {
      if (!selectedFeeder) return Alert.alert("Selecciona un alimentador");
      if (selectedSubstations.length === 0) {
        return Alert.alert("Selecciona al menos una subestación");
      }
    } else {
      if (!selectedFeeders.length) {
        return Alert.alert("Selecciona al menos un alimentador");
      }
    }

    dispatch({ type: "APP/SET_LOADING_MESSAGE", payload: "Descargando base de datos..." });
    dispatch({ type: "APP/SET_LOADING", payload: true });

    let ok = false;

    try {
      const nombreBase = buildOfflineDbName(user);
      
      console.log("⬇️ Descargando base:", nombreBase);

      if (user?.proyecto === 0) {
        const sedsIds = selectedSubstations.map((s) => parseInt(s.id, 10));

        const fileRes = await downloadDatabase(user.id, sedsIds, 0, nombreBase);
        if (!fileRes?.ok) throw new Error("Descarga fallida");

        setSelectedFeeders([]);
        setSelectedSubstations([]);
        setDbExists(true);
        ok = true;
      } else {
        const feederIds = selectedFeeders.map((f) => parseInt(f.id, 10));
        console.log("📥 Alimentadores a descargar:", feederIds);

        const fileRes = await downloadDatabase(user.id, feederIds, 1, nombreBase);
        if (!fileRes?.ok) throw new Error("Descarga fallida");

        setSelectedFeeders([]);
        setDbExists(true);
        ok = true;
      }
    } catch (e) {
      console.log("❌ Error en descarga:", e);
    } finally {
      dispatch({ type: "APP/SET_LOADING", payload: false });
      dispatch({ type: "APP/SET_LOADING_MESSAGE", payload: "" });
    }

    if (ok) Alert.alert("Éxito", "Base descargada correctamente.");
    else Alert.alert("Error", "No se pudo descargar la base.");
  };

  //───────────────────────────────────────────────
  // EXPORTAR BASE
  //───────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      if (!fileInfo.exists) return Alert.alert("No hay base local");

      if (!(await Sharing.isAvailableAsync()))
        return Alert.alert("Tu dispositivo no permite compartir archivos");

      await Sharing.shareAsync(dbPath);
    } catch {
      Alert.alert("Error", "No se pudo exportar la base");
    }
  };

  //───────────────────────────────────────────────
  // ELIMINAR BASE
  //───────────────────────────────────────────────
  const handleDelete = async () => {
    if (!dbName) {
      return Alert.alert("Aviso", "No hay base para eliminar.");
    }

    let remaining = 0;

    try {
      const result = await getPendingSyncSummary();

      const total = Number(result?.totalPending ?? 0);
      const synced = Number(result?.syncedCount ?? result?.synced ?? 0);
      remaining = Number(result?.remainingPending ?? Math.max(total - synced, 0));
    } catch (e) {
      console.log("❌ Error obteniendo pendientes antes de eliminar:", e);
    }

    const extraWarning =
      remaining > 0
        ? `\n\n🚨🚨🚨🚨🚨\nFALTAN ${remaining} REGISTROS PENDIENTES POR SINCRONIZAR.\n🚨🚨🚨🚨🚨\n\nRealice este procedimiento antes de ELIMINAR.`
        : "";

    Alert.alert(
      "Confirmar eliminación",
      `¿Estás seguro de que deseas eliminar la base local?\nEsta acción no se puede deshacer.${extraWarning}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;
              console.log("🗑 Eliminando DB:", dbPath);

              await closeDatabase();
              await FileSystem.deleteAsync(dbPath, { idempotent: true });

              await AsyncStorage.removeItem("selectedFeeders");
              await AsyncStorage.removeItem("db_name");

              setSelectedFeeders([]);
              setSelectedFeeder(null);
              setSelectedSubstations([]);
              setSubstationsByFeeder([]);

              setDbExists(false);
              setDbName(null);

              Alert.alert("Listo", "Base eliminada correctamente.");
            } catch (e) {
              console.log("❌ Error eliminando base:", e);
              Alert.alert("Error", "No se pudo eliminar la base.");
            }
          },
        },
      ]
    );
  };

  //───────────────────────────────────────────────
  // 🔄 SINCRONIZAR OFFLINE → SERVIDOR
  //───────────────────────────────────────────────
  const handleSync = async () => {
    if (!dbExists) {
      return Alert.alert("Aviso", "No existe una base local para sincronizar.");
    }

    if (syncing) return;

    dispatch({
      type: "APP/SET_LOADING_MESSAGE",
      payload: "Sincronizando información..."
    });
    dispatch({ type: "APP/SET_LOADING", payload: true });

    try {
      const result = await syncAllPending();

      const total = Number(result?.totalPending ?? 0);
      const synced = Number(result?.syncedCount ?? result?.synced ?? 0);
      const remaining = Number(result?.remainingPending ?? Math.max(total - synced, 0));

      Alert.alert(
        result?.ok ? "Sincronización completa" : "Sincronización incompleta",
        `Se sincronizaron ${synced} de ${total} registros.\nFaltan ${remaining} por sincronizar.`
      );
    } catch (e) {
      console.log("❌ Error sincronizando:", e);
      Alert.alert("Error", "Ocurrió un error durante la sincronización. Intenta nuevamente.");
    } finally {
      dispatch({ type: "APP/SET_LOADING", payload: false });
      dispatch({ type: "APP/SET_LOADING_MESSAGE", payload: "" });
    }
  };

  //───────────────────────────────────────────────
  // ALIMENTADORES
  //───────────────────────────────────────────────
  const addFeeder = async (feeder) => {
    const obj = {
      id: feeder.alimInterno ?? feeder.id,
      name: feeder.alimEtiqueta ?? feeder.name,
    };

    if (user?.proyecto === 0) {
      //console.log("➕ Alimentador seleccionado:", obj);
      setSelectedFeeder(obj);
      setSelectedFeeders([obj]);
      await AsyncStorage.setItem("selectedFeeders", JSON.stringify([obj]));

      const sedsList = await fetchSedsByFeeder(obj.id);
      setSubstationsByFeeder(Array.isArray(sedsList) ? sedsList : []);
      setModalVisible(false);
      return;
    }

    const newList = [...selectedFeeders, obj];
    setSelectedFeeders(newList);
    await AsyncStorage.setItem("selectedFeeders", JSON.stringify(newList));
    setModalVisible(false);
  };

  const removeFeeder = async (feeder) => {
    console.log("➖ Quitando alimentador:", feeder);
    const filtered = selectedFeeders.filter(f => f.id !== feeder.id);
    setSelectedFeeders(filtered);
    await AsyncStorage.setItem("selectedFeeders", JSON.stringify(filtered));

    if (user?.proyecto === 0 && selectedFeeder?.id === feeder.id) {
      setSelectedFeeder(null);
      setSubstationsByFeeder([]);
      setSelectedSubstations([]);
    }
  };

  //───────────────────────────────────────────────
  // SUBESTACIONES (SED)
  //───────────────────────────────────────────────
  const toggleSubstation = (item) => {
    const exists = selectedSubstations.some(s => s.id === item.sedInterno);
    //console.log("🔁 Toggle SED:", item.sedInterno, "exists:", exists);

    if (exists) {
      setSelectedSubstations(prev => prev.filter(s => s.id !== item.sedInterno));
    } else {
      setSelectedSubstations(prev => [
        ...prev,
        { id: item.sedInterno, name: item.sedCodigo },
      ]);
    }
  };

  const openSubModal = async () => {
    if (!selectedFeeder)
      return Alert.alert("Selecciona un alimentador");

    //console.log("🏢 Abriendo modal SED del feeder:", selectedFeeder.id);
    const data = await fetchSedsByFeeder(selectedFeeder.id);
    setSubstationsByFeeder(Array.isArray(data) ? data : []);
    setSearchSed("");
    setModalSubVisible(true);
  };

  const isLoading = loadingFeeders;

  //───────────────────────────────────────────────
  // UI
  //───────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={{ marginTop: 10 }}>Procesando...</Text>
        </View>
      ) : (
        <>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              Proyecto: {user?.proyecto === 0 ? "Baja Tensión" : "Media Tensión"}
            </Text>

            <View style={styles.headerButtons}>
              <Button title="➕ Alimentador" onPress={() => setModalVisible(true)} />
              {user?.proyecto === 0 && (
                <Button title="🏢 Subestaciones" onPress={openSubModal} />
              )}
            </View>
          </View>

          {/* CONTENIDO */}
          <View style={{ flex: 1 }}>
            {user?.proyecto === 0 && selectedFeeder && (
              <View style={{ marginBottom: 10 }}>
                <Text style={{ fontWeight: "bold" }}>Alimentador:</Text>
                <Text>{selectedFeeder.name}</Text>
              </View>
            )}

            <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 8 }}>
              {user?.proyecto === 0 ? "SED:" : "Alimentadores seleccionados:"}
            </Text>

            {/* 🔴 AQUÍ ESTÁ LA CORRECCIÓN: MOSTRAR SOLO SEDS LOCALES CUANDO EXISTE BASE */}
            <FlatList
              style={{ flex: 1 }}
              data={
                user?.proyecto === 0
                  ? dbExists
                    ? localSeds            // 👉 SED desde SQLite
                    : selectedSubstations // 👉 SED seleccionados antes
                  : selectedFeeders
              }
              keyExtractor={(item, index) =>
                item.SedInterno
                  ? item.SedInterno.toString()
                  : item.sedInterno
                    ? item.sedInterno.toString()
                    : index.toString()
              }
              contentContainerStyle={{ paddingBottom: 20 }}

              ListEmptyComponent={() => (
                <View style={{ paddingVertical: 12 }}>
                  <Text style={{ color: "#777" }}>
                    {user?.proyecto === 0
                      ? dbExists
                        ? "No hay SED en la base local"
                        : "No hay SED seleccionados"
                      : "No hay alimentadores seleccionados"}
                  </Text>
                </View>
              )}

              renderItem={({ item }) => (
                <View style={styles.feederRow}>
                  <Text style={styles.feederText}>
                    {user?.proyecto === 0
                      ? dbExists
                        ? item.SedCodigo    // ✅ CAMPO REAL
                        : item.name
                      : item.name}
                  </Text>

                  {/* ❌ Solo permitir borrar cuando NO es base local */}
                  {!dbExists && (
                    <Button
                      title="❌"
                      onPress={() => {
                        if (user?.proyecto === 0) {
                          toggleSubstation({ sedInterno: item.id });
                        } else {
                          removeFeeder(item);
                        }
                      }}
                    />
                  )}
                </View>
              )}
            />

          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <View style={styles.footerCol}>
                <Button title="📥 Descargar Base" onPress={handleDownload} />
              </View>
              <View style={styles.footerCol}>
                <Button title="💾 Exportar Base" onPress={handleExport} />
              </View>
            </View>

            <View style={{ height: 10 }} />

            <View style={styles.footerRow}>
              <View style={styles.footerCol}>
                <Button title="🗑️ Eliminar Base" onPress={handleDelete} />
              </View>
              <View style={styles.footerCol}>
                <Button
                  title={syncing ? "⏳ Sincronizando..." : "🔄 Sincronizar"}
                  onPress={handleSync}
                  disabled={!dbExists || syncing}
                />
              </View>
            </View>

            <Text style={{ marginTop: 10, fontWeight: "bold", color: dbExists ? "green" : "red" }}>
              {dbExists ? "📦 Base local detectada" : "⚠️ No hay base local"}
            </Text>
          </View>

          {/* MODAL ALIMENTADORES */}
          <Modal visible={modalVisible} transparent animationType="slide">
            <View style={styles.modalBackground}>
              <View style={styles.modalContainer}>
                <Text style={{ fontWeight: "bold" }}>Selecciona un alimentador</Text>

                <FlatList
                  data={feedersByUser.filter(
                    f => !selectedFeeders.some(sf => sf.id === f.alimInterno)
                  )}
                  keyExtractor={i => i.alimInterno.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalItem}
                      onPress={() => addFeeder(item)}
                    >
                      <Text>{item.alimEtiqueta}</Text>
                    </TouchableOpacity>
                  )}
                />

                <Button title="Cerrar" onPress={() => setModalVisible(false)} />
              </View>
            </View>
          </Modal>

          {/* MODAL SEDS */}
          <Modal visible={modalSubVisible} transparent animationType="slide">
            <View style={styles.modalBackground}>
              <View style={[styles.modalContainer, { height: "70%" }]}>
                <Text style={{ fontWeight: "bold" }}>Selecciona una subestación</Text>

                <TextInput
                  placeholder="Buscar SED..."
                  value={searchSed}
                  onChangeText={setSearchSed}
                  style={{
                    backgroundColor: "#eee",
                    padding: 10,
                    borderRadius: 10,
                    marginVertical: 10,
                  }}
                />

                <FlatList
                  data={substationsByFeeder.filter(s =>
                    (s.sedCodigo ?? "")
                      .toLowerCase()
                      .includes(searchSed.toLowerCase())
                  )}
                  keyExtractor={i => i.sedInterno.toString()}
                  renderItem={({ item }) => {
                    const isSelected = selectedSubstations.some(s => s.id === item.sedInterno);

                    return (
                      <TouchableOpacity
                        style={[styles.modalItem, isSelected && { backgroundColor: "#cce5ff" }]}
                        onPress={() => toggleSubstation(item)}
                      >
                        <Text>{item.sedCodigo}</Text>
                      </TouchableOpacity>
                    );
                  }}
                />

                <Button title="Cerrar" onPress={() => setModalSubVisible(false)} />
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
  footer: {
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  loadingContainer: { flex: 1, justifyContent: "center" },
  header: { marginBottom: 10 },
  headerTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  headerButtons: { flexDirection: "row", justifyContent: "space-between" },
  feederRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  feederText: { fontSize: 16 },
  modalBackground: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContainer: { width: "80%", backgroundColor: "#fff", borderRadius: 10, padding: 15 },
  modalItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#ccc" },
  footerRow: { flexDirection: "row", justifyContent: "space-between" },
  footerCol: { flex: 1, marginHorizontal: 5 },
});
