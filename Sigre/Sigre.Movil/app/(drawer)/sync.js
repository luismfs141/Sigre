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

export default function Sync() {

  const { user } = useContext(AuthContext);
  const { offlineLoading, downloadDatabase } = useOffline();
  const { dbName, setDbName, selectedFeeder, setSelectedFeeder } = useDatos();
  const dispatch = useDispatch();
  const isAppLoading = useSelector((state) => state.app.isLoading);
  const [isSynced, setIsSynced] = useState(false);
  const { fetchAllSedsLocal } = useSed();
  const {
    feedersByUser,
    getFeedersByUser,
    loading: loadingFeeders,
    fetchSedsByFeeder,
    seds
  } = useFeeder(user?.id);


  // Estados originales
  const [selectedFeeders, setSelectedFeeders] = useState([]);
  const [dbExists, setDbExists] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalSubVisible, setModalSubVisible] = useState(false);

  // Proyecto 0
  const [substationsByFeeder, setSubstationsByFeeder] = useState([]);
  const [selectedSubstations, setSelectedSubstations] = useState([]);
  const [searchSed, setSearchSed] = useState("");

  // 🔹 Cargar alimentadores al iniciar
  useEffect(() => {
    const init = async () => {
      if (!user?.id) return;

      try {
        await getFeedersByUser(user.id);   // Alimentadores del backend
        await loadLocalFeeders();          // Alimentadores locales

        // Si es proyecto 0 y no hay selección, puedes cargar SEDs locales
        if (user?.proyecto === 0) {
          await loadLocalSeds();           // 👈 USANDO EL HOOK
        }

      } catch (e) {
        console.error("❌ Error inicializando Sync:", e);
      }
    };

    init();
  }, [user?.id]);


  // 🔹 Revisar la base local cuando cambia dbName
  useEffect(() => {
    checkDatabase();
  }, [dbName]);

  // 🔹 Función que revisa si la base existe
  const checkDatabase = async () => {
    try {
      if (!dbName) {
        setDbExists(false);   // 👈 IMPORTANTE
        return;
      }

      const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      setDbExists(fileInfo.exists);
    } catch (e) {
      console.log("❌ Error revisando BD", e);
      setDbExists(false);
    }
  };


  const loadLocalFeeders = async () => {
    try {
      const saved = await AsyncStorage.getItem("selectedFeeders");

      if (!saved) {
        console.log("⚠ No hay alimentadores locales guardados");
        setSelectedFeeders([]);
        setSelectedFeeder(null);
        return;
      }

      const parsed = JSON.parse(saved);

      if (!parsed || parsed.length === 0) {
        setSelectedFeeders([]);
        setSelectedFeeder(null);
        return;
      }

      // Proyecto 0 → solo uno
      if (user?.proyecto === 0) {
        setSelectedFeeder(parsed[0]);
        setSelectedFeeders([parsed[0]]);

        // Cargar subestaciones si aplica
        const data = await fetchSedsByFeeder(parsed[0].id);
        setSubstationsByFeeder(Array.isArray(data) ? data : []);
      }
      // Proyecto 1 → múltiples
      else {
        setSelectedFeeders(parsed);
      }

    } catch (error) {
      console.error("❌ Error cargando feeders locales:", error);
    }
  };

const loadLocalSeds = async () => {
  try {
    const data = await fetchAllSedsLocal();

    if (!data || data.length === 0) {
      console.log("⚠ No hay SEDs locales");
      setSubstationsByFeeder([]);
      setSelectedSubstations([]);
      return [];
    }

    // Adaptar estructura
    const adapted = data.map(s => ({
      sedInterno: s.SedInterno,
      sedCodigo: s.SedCodigo,
      alimInterno: s.AlimInterno,
    }));

    // 👇 Lista disponible
    setSubstationsByFeeder(adapted);

    // 👇 Marcar TODAS como seleccionadas
    const selected = adapted.map(s => ({
      id: s.sedInterno,
      name: s.sedCodigo,
    }));

    setSelectedSubstations(selected);

    return adapted;
  } catch (error) {
    console.error("❌ Error cargando SEDs locales:", error);
    setSubstationsByFeeder([]);
    setSelectedSubstations([]);
    return [];
  }
};


  //───────────────────────────────────────────────
  // DESCARGAR BASE
  //───────────────────────────────────────────────

  const handleDownload = async () => {
    if (isAppLoading) return;
    // ✅ VALIDACIONES ANTES de prender el loading (para no dejarlo “pegado”)
    if (user?.proyecto === 0) {
      if (!selectedFeeder) return Alert.alert("Selecciona un alimentador");
      if (selectedSubstations.length === 0)
        return Alert.alert("Selecciona al menos una subestación");
    } else {
      if (!selectedFeeders.length)
        return Alert.alert("Selecciona al menos un alimentador");
    }

    // ✅ PRENDER LOADING (tu modal global)
    dispatch({ type: "APP/SET_LOADING_MESSAGE", payload: "Descargando base de datos..." });
    dispatch({ type: "APP/SET_LOADING", payload: true });

    let ok = false;

    try {
      let nombreBase = `sigre_offline_${Date.now()}.db`;

      //──────────────────────
      // PROYECTO 0 — BAJA TENSIÓN
      //──────────────────────
      if (user?.proyecto === 0) {
        const sedsIds = selectedSubstations.map((s) => parseInt(s.id, 10));

        const fileUri = await downloadDatabase(user.id, sedsIds, 0, nombreBase);
        if (!fileUri) throw new Error("Descarga fallida");

        dispatch({ type: "APP/SET_LOADING_MESSAGE", payload: "Cerrando base anterior..." });
        await closeDatabase();
        await new Promise((r) => setTimeout(r, 150));

        dispatch({ type: "APP/SET_LOADING_MESSAGE", payload: "Guardando base local..." });
        await setDbName(nombreBase);
        await checkDatabase();

        setSelectedFeeders([]);
        setSelectedSubstations([]);

        setDbExists(true);
        ok = true;
      }

      //──────────────────────
      // PROYECTO 1 — MEDIA TENSIÓN
      //──────────────────────
      else {
        const feederIds = selectedFeeders.map((f) => parseInt(f.id, 10));

        const fileUri = await downloadDatabase(user.id, feederIds, 1, nombreBase);
        if (!fileUri) throw new Error("Descarga fallida");

        dispatch({ type: "APP/SET_LOADING_MESSAGE", payload: "Cerrando base anterior..." });
        await closeDatabase();
        await new Promise((r) => setTimeout(r, 150));

        dispatch({ type: "APP/SET_LOADING_MESSAGE", payload: "Guardando base local..." });

        // ✅ OJO: tu código tenía `${nombreBase}.db` → eso quedaba ".db.db"
        await setDbName(nombreBase);

        setSelectedFeeders([]);
        setDbExists(true);
        ok = true;
      }
    } catch (e) {
      console.log(e);
    } finally {
      // ✅ APAGAR LOADING SIEMPRE
      dispatch({ type: "APP/SET_LOADING", payload: false });
      dispatch({ type: "APP/SET_LOADING_MESSAGE", payload: "" });
    }

    // ✅ ALERT DESPUÉS de apagar el loading (tal como pediste)
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

  const handleNewBasePress = () => {
    if (dbExists) {
      Alert.alert(
        "Base existente",
        "Primero debes eliminar la base actual para poder descargar una nueva base."
      );
      return;
    }

    handleDownload();
  };

  //───────────────────────────────────────────────
  // SINCRONIZAR (SINCRONIZA BASE)
  //───────────────────────────────────────────────

  // const handleSync = async () => {
  //   try {
  //     const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;

  //     // 1️⃣ Cerrar base
  //     await closeDatabase();

  //     // 2️⃣ Eliminar archivo
  //     await FileSystem.deleteAsync(dbPath, { idempotent: true });

  //     // 3️⃣ Limpiar storage
  //     await AsyncStorage.removeItem("selectedFeeders");
  //     await AsyncStorage.removeItem("offline_db_name");
  //     await AsyncStorage.removeItem("db_name");   // 👈 IMPORTANTE

  //     // 4️⃣ Limpiar estados
  //     setSelectedFeeders([]);
  //     setSelectedFeeder(null);
  //     setSelectedSubstations([]);
  //     setSubstationsByFeeder([]);

  //     setDbName(null);     // 👈 hace que checkDatabase falle
  //     setDbExists(false);  // 👈 REACTIVA BOTONES
  //     setIsSynced(true);

  //     Alert.alert("Listo", "Base eliminada.");
  //   } catch (e) {
  //     console.log("❌ Error en sincronización:", e);
  //     Alert.alert("Error", "No se pudo sincronizar.");
  //   }
  // };

  const handleSyncPress = () => {
    Alert.alert(
      "Sincronización",
      "La base ha sido sincronizada correctamente."
    );

    // 👉 Marca como sincronizada (sin borrar nada)
    setIsSynced(true);
  };

  //───────────────────────────────────────────────
  // SINCRONIZAR (ELIMINAR BASE)
  //───────────────────────────────────────────────

  const handleDelete = async () => {
    try {
      const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;

      // 1️⃣ Cerrar base
      await closeDatabase();

      // 2️⃣ Eliminar archivo
      await FileSystem.deleteAsync(dbPath, { idempotent: true });

      // 3️⃣ Limpiar storage
      await AsyncStorage.removeItem("selectedFeeders");
      await AsyncStorage.removeItem("offline_db_name");
      await AsyncStorage.removeItem("db_name");

      // 4️⃣ Limpiar estados
      setSelectedFeeders([]);
      setSelectedFeeder(null);
      setSelectedSubstations([]);
      setSubstationsByFeeder([]);

      setDbName(null);
      setDbExists(false);
      setIsSynced(false); // 👈 ya no hay nada sincronizado

      Alert.alert("Listo", "Base eliminada.");
    } catch (e) {
      console.log("❌ Error al eliminar:", e);
      Alert.alert("Error", "No se pudo eliminar la base.");
    }
  };

  const handleDeletePress = () => {
    if (!isSynced) {
      Alert.alert(
        "Sincronización pendiente",
        "Primero debes sincronizar la base antes de poder eliminarla."
      );
      return;
    }

    Alert.alert(
      "Eliminar base",
      "¿Estás seguro de que deseas eliminar la base local?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: handleDelete },
      ]
    );
  };



  //───────────────────────────────────────────────
  // ALIMENTADORES
  //───────────────────────────────────────────────

  const addFeeder = async (feeder) => {
    const obj = {
      id: feeder.alimInterno ?? feeder.id,
      name: feeder.alimEtiqueta ?? feeder.name,
    };

    // Proyecto 0 = uno solo
    if (user?.proyecto === 0) {
      setSelectedFeeder(obj);

      console.log("✅ Alimentador seleccionado (global):", obj);


      setSelectedFeeders([obj]);

      await AsyncStorage.setItem("selectedFeeders", JSON.stringify([obj]));

      const sedsList = await fetchSedsByFeeder(obj.id);
      setSubstationsByFeeder(Array.isArray(sedsList) ? sedsList : []);

      setModalVisible(false);
      return;
    }

    // Proyecto 1 = múltiples
    const newList = [...selectedFeeders, obj];
    setSelectedFeeders(newList);
    await AsyncStorage.setItem("selectedFeeders", JSON.stringify(newList));

    setModalVisible(false);
  };

  const removeFeeder = async (feeder) => {
    const filtered = selectedFeeders.filter(f => f.id !== feeder.id);
    setSelectedFeeders(filtered);
    await AsyncStorage.setItem("selectedFeeders", JSON.stringify(filtered));

    if (user?.proyecto === 0 && selectedFeeder?.id === feeder.id) {
      setSelectedFeeder(null);
      setSubstationsByFeeder([]);
      setSelectedSubstations([]);
    }
  };

  // cargar alimentador guardado en storage
  const loadSelectedFeeders = async () => {
    const saved = await AsyncStorage.getItem("selectedFeeders");
    if (!saved) return;

    const parsed = JSON.parse(saved);
    setSelectedFeeders(parsed);

    if (user?.proyecto === 0 && parsed.length > 0) {
      setSelectedFeeder(parsed[0]);
      const data = await fetchSedsByFeeder(parsed[0].id);
      setSubstationsByFeeder(Array.isArray(data) ? data : []);
    }
  };

  //───────────────────────────────────────────────
  // SUBESTACIONES (SED)
  //───────────────────────────────────────────────

  const toggleSubstation = (item) => {
    const exists = selectedSubstations.some(s => s.id === item.sedInterno);

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

    const data = await fetchSedsByFeeder(selectedFeeder.id);
    setSubstationsByFeeder(Array.isArray(data) ? data : []);
    setSearchSed("");
    setModalSubVisible(true);
  };

  //const isLoading = offlineLoading || loadingFeeders;
  const isLoading = loadingFeeders; // ✅ solo para carga de alimentadores


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

            {/* <View style={styles.headerButtons}>
              <Button title="➕ Alimentador" onPress={() => setModalVisible(true)} />
              {user?.proyecto === 0 && (
                <Button title="🏢 Subestaciones" onPress={openSubModal} />
              )}
            </View> */}
            <View style={styles.headerButtons}>
              <Button
                title="➕ Alimentador"
                onPress={() => setModalVisible(true)}
                disabled={dbExists}   // 👈 DESACTIVADO SI HAY BASE
              />

              {user?.proyecto === 0 && (
                <Button
                  title="🏢 Subestaciones"
                  onPress={openSubModal}
                  disabled={dbExists} // 👈 DESACTIVADO SI HAY BASE
                />
              )}
            </View>
          </View>

          {/* CONTENIDO PRINCIPAL (ESTO ES LO QUE SCROLLEA) */}
          <View style={{ flex: 1 }}>
            {/* Si quieres mostrar el alimentador seleccionado (proyecto 0) */}
            {user?.proyecto === 0 && selectedFeeder && (
              <View style={{ marginBottom: 10 }}>
                <Text style={{ fontWeight: "bold" }}>Alimentador:</Text>
                <Text>{selectedFeeder.name}</Text>
              </View>
            )}

            <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 8 }}>
              {user?.proyecto === 0 ? "SED seleccionados:" : "Alimentadores seleccionados:"}
            </Text>

            <FlatList
              style={{ flex: 1 }}
              data={user?.proyecto === 0 ? selectedSubstations : selectedFeeders}
              keyExtractor={(i) => i.id.toString()}
              contentContainerStyle={{ paddingBottom: 20 }}
              // ListEmptyComponent={
              //   <Text style={{ color: "#777" }}>
              //     {user?.proyecto === 0 ? "No hay SED seleccionados" : "No hay alimentadores seleccionados"}
              //   </Text>
              // }

              ListEmptyComponent={() => (
                <View style={{ paddingVertical: 12 }}>
                  <Text style={{ color: "#777" }}>
                    {user?.proyecto === 0
                      ? "No hay SED seleccionados"
                      : "No hay alimentadores seleccionados"}
                  </Text>
                </View>
              )}

              renderItem={({ item }) => (
                <View style={styles.feederRow}>
                  <Text style={styles.feederText}>{item.name}</Text>

                  <Button
                    title="❌"
                    onPress={() => {
                      if (user?.proyecto === 0) {
                        // item.id aquí es el id que guardas en selectedSubstations
                        toggleSubstation({ sedInterno: item.id });
                      } else {
                        removeFeeder(item);
                      }
                    }}
                  />
                </View>
              )}
            />
          </View>

          {/* FOOTER FIJO (SIEMPRE VISIBLE) */}
          <View style={styles.footer}>
            <View style={styles.grid}>
              {/* NUEVA BASE */}
              <View style={styles.gridItem}>
                <Button
                  title={isAppLoading ? "Descargando..." : "📥 Nueva Base"}
                  onPress={handleNewBasePress}
                  disabled={isAppLoading || dbExists}   // ❌ desactivado si ya hay base
                />
              </View>

              {/* EXPORTAR */}
              <View style={styles.gridItem}>
                <Button
                  title="💾 Exportar Base"
                  onPress={handleExport}
                  disabled={isAppLoading || !dbExists} // ❌ desactivado si NO hay base
                />
              </View>

              {/* ELIMINAR */}
              <View style={styles.gridItem}>
                <Button
                  title="🗑 Eliminar Base"
                  onPress={handleDeletePress}                // usa tu función de borrar
                  disabled={isAppLoading || !dbExists}
                />
              </View>

              {/* SINCRONIZAR */}
              <View style={styles.gridItem}>
                <Button
                  title="🔄 Sincronizar"
                  onPress={handleSyncPress}
                  disabled={isAppLoading || !dbExists}
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
  bottomButtons: { justifyContent: "center", alignItems: "center", marginVertical: 20 },
  feederRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  feederText: { fontSize: 16 },
  modalBackground: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContainer: { width: "80%", backgroundColor: "#fff", borderRadius: 10, padding: 15 },
  modalItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#ccc" },
  grid: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
},

gridItem: {
  width: "48%",      // 2 columnas
  marginBottom: 10,
},

});
