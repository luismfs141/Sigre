import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from "react-redux";


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
import { AuthContext } from "../../context/AuthContext";
import { useDatos } from "../../context/DatosContext";
import { closeDatabase } from '../../database/offlineDB/db';
import { useFeeder } from "../../hooks/useFeeder";
import { useOffline } from "../../hooks/useOffline";

export default function Sync() {




  const { user } = useContext(AuthContext);
  const { offlineLoading, downloadDatabase } = useOffline();
  const { dbName, setDbName, selectedFeeder, setSelectedFeeder } = useDatos();
  const dispatch = useDispatch();
  const isAppLoading = useSelector((state) => state.app.isLoading);



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
  //const [selectedFeeder, setSelectedFeeder] = useState(null);
  const [substationsByFeeder, setSubstationsByFeeder] = useState([]);
  const [selectedSubstations, setSelectedSubstations] = useState([]);
  const [searchSed, setSearchSed] = useState("");

  // 🔹 Cargar alimentadores al iniciar
  useEffect(() => {
    if (user?.id) getFeedersByUser(user.id);
  }, [user?.id]);

  // 🔹 Revisar la base local cuando cambia dbName
  useEffect(() => {
    if (!dbName) return;
    checkDatabase();
  }, [dbName]);

  // 🔹 Función que revisa si la base existe
  const checkDatabase = async () => {
    try {
      const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      setDbExists(fileInfo.exists);
    } catch (e) {
      console.log("❌ Error revisando BD", e);
    }
  };

  //───────────────────────────────────────────────
  // DESCARGAR BASE
  //───────────────────────────────────────────────

  // const handleDownload = async () => {
  //   try {
  //     let nombreBase;

  //     //──────────────────────
  //     // PROYECTO 0 — BAJA TENSIÓN
  //     //──────────────────────
  //     if (user?.proyecto === 0) {
  //       if (!selectedFeeder)
  //         return Alert.alert("Selecciona un alimentador");

  //       if (selectedSubstations.length === 0)
  //         return Alert.alert("Selecciona al menos una subestación");

  //       const sedsIds = selectedSubstations.map(s => parseInt(s.id));

  //       nombreBase = `sigre_offline_${Date.now()}.db`;

  //       const fileUri = await downloadDatabase(
  //         user.id,
  //         sedsIds,
  //         0,
  //         nombreBase
  //       );

  //       if (!fileUri) throw new Error("Descarga fallida");

  //       await closeDatabase();
  //       await new Promise(r => setTimeout(r, 150));

  //       await setDbName(`${nombreBase}`);

  //       setSelectedFeeders([]);
  //       setSelectedSubstations([]);
  //       // ❌ NO pongas setSelectedFeeder(null) aquí
  //       // Lo dejamos tal cual, porque este es justo el alimentador activo para la base descargada

  //       setDbExists(true);
  //       return Alert.alert("Éxito", "Base descargada correctamente.");
  //     }














  //     //──────────────────────
  //     // PROYECTO 1 — MEDIA TENSIÓN
  //     //──────────────────────
  //     if (!selectedFeeders.length)
  //       return Alert.alert("Selecciona al menos un alimentador");

  //     const feederIds = selectedFeeders.map(f => parseInt(f.id));

  //     nombreBase = `sigre_offline_${Date.now()}.db`;

  //     const fileUri = await downloadDatabase(
  //       user.id,
  //       feederIds,
  //       1,
  //       nombreBase
  //     );

  //     if (!fileUri) throw new Error("Descarga fallida");

  //     await closeDatabase();
  //     await new Promise(r => setTimeout(r, 150));

  //     await setDbName(`${nombreBase}.db`);
  //     setSelectedFeeders([]);

  //     setDbExists(true);
  //     Alert.alert("Éxito", "Base descargada correctamente.");
  //   } catch (e) {
  //     console.log(e);
  //     Alert.alert("Error", "No se pudo descargar la base.");
  //   }
  // };

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

  //───────────────────────────────────────────────
  // SINCRONIZAR (ELIMINAR BASE)
  //───────────────────────────────────────────────
  const handleSync = async () => {
    try {
      const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;

      await closeDatabase();
      await FileSystem.deleteAsync(dbPath, { idempotent: true });

      await AsyncStorage.removeItem("selectedFeeders");
      await AsyncStorage.removeItem("offline_db_name");

      setSelectedFeeders([]);
      setSelectedFeeder(null);
      setSelectedSubstations([]);
      setSubstationsByFeeder([]);

      setDbExists(false);
      setDbName(null);

      Alert.alert("Listo", "Base eliminada.");
    } catch {
      Alert.alert("Error", "No se pudo sincronizar.");
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
        // <>
        //   {/* HEADER */}
        //   <View style={styles.header}>
        //     <Text style={styles.headerTitle}>
        //       Proyecto: {user?.proyecto === 0 ? "Baja Tensión" : "Media Tensión"}
        //     </Text>

        //     <View style={styles.headerButtons}>
        //       <Button title="➕ Alimentador" onPress={() => setModalVisible(true)} />
        //       {user?.proyecto === 0 && (
        //         <Button title="🏢 Subestaciones" onPress={openSubModal} />
        //       )}
        //     </View>
        //   </View>

        //   {/* LISTA ALIMENTADORES */}
        //   <FlatList
        //     data={selectedFeeders}
        //     keyExtractor={i => i.id.toString()}
        //     renderItem={({ item }) => (
        //       <View style={styles.feederRow}>
        //         <Text style={styles.feederText}>{item.name}</Text>
        //         <Button title="❌" onPress={() => removeFeeder(item)} />
        //       </View>
        //     )}
        //   />

        //   {/* SEDs SELECCIONADOS */}
        //   {user?.proyecto === 0 && selectedSubstations.length > 0 && (
        //     <View>
        //       <Text style={{ fontWeight: "bold", fontSize: 16 }}>SED seleccionados:</Text>
        //       <FlatList
        //         data={selectedSubstations}
        //         keyExtractor={i => i.id.toString()}
        //         renderItem={({ item }) => (
        //           <View style={styles.feederRow}>
        //             <Text style={styles.feederText}>{item.name}</Text>
        //             <Button title="❌" onPress={() => toggleSubstation({ sedInterno: item.id })} />
        //           </View>
        //         )}
        //       />
        //     </View>
        //   )}

        //   {/* BOTONES */}
        //   <View style={styles.bottomButtons}>
        //     {!dbExists && <Button title="📥 Descargar Base" onPress={handleDownload} />}

        //     {dbExists && (
        //       <>
        //         <Button title="💾 Exportar Base" onPress={handleExport} />
        //         <View style={{ height: 10 }} />
        //         <Button title="🔄 Sincronizar" onPress={handleSync} />
        //       </>
        //     )}
        //   </View>

        //   <Text style={{ marginTop: 10, fontWeight: "bold", color: dbExists ? "green" : "red" }}>
        //     {dbExists ? "📦 Base local detectada" : "⚠️ No hay base local"}
        //   </Text>

        //   {/* MODAL ALIMENTADORES */}
        //   <Modal visible={modalVisible} transparent animationType="slide">
        //     <View style={styles.modalBackground}>
        //       <View style={styles.modalContainer}>
        //         <Text style={{ fontWeight: "bold" }}>Selecciona un alimentador</Text>

        //         <FlatList
        //           data={feedersByUser.filter(
        //             f => !selectedFeeders.some(sf => sf.id === f.alimInterno)
        //           )}
        //           keyExtractor={i => i.alimInterno.toString()}
        //           renderItem={({ item }) => (
        //             <TouchableOpacity
        //               style={styles.modalItem}
        //               onPress={() => addFeeder(item)}
        //             >
        //               <Text>{item.alimEtiqueta}</Text>
        //             </TouchableOpacity>
        //           )}
        //         />

        //         <Button title="Cerrar" onPress={() => setModalVisible(false)} />
        //       </View>
        //     </View>
        //   </Modal>

        //   {/* MODAL SEDS */}
        //   <Modal visible={modalSubVisible} transparent animationType="slide">
        //     <View style={styles.modalBackground}>
        //       <View style={[styles.modalContainer, { height: "70%" }]}>
        //         <Text style={{ fontWeight: "bold" }}>Selecciona una subestación</Text>

        //         <TextInput
        //           placeholder="Buscar SED..."
        //           value={searchSed}
        //           onChangeText={setSearchSed}
        //           style={{
        //             backgroundColor: "#eee",
        //             padding: 10,
        //             borderRadius: 10,
        //             marginVertical: 10,
        //           }}
        //         />

        //         <FlatList
        //           data={substationsByFeeder.filter(s =>
        //             (s.sedCodigo ?? "")
        //               .toLowerCase()
        //               .includes(searchSed.toLowerCase())
        //           )}
        //           keyExtractor={i => i.sedInterno.toString()}
        //           renderItem={({ item }) => {
        //             const isSelected = selectedSubstations.some(s => s.id === item.sedInterno);

        //             return (
        //               <TouchableOpacity
        //                 style={[styles.modalItem, isSelected && { backgroundColor: "#cce5ff" }]}
        //                 onPress={() => toggleSubstation(item)}
        //               >
        //                 <Text>{item.sedCodigo}</Text>
        //               </TouchableOpacity>
        //             );
        //           }}
        //         />

        //         <Button title="Cerrar" onPress={() => setModalSubVisible(false)} />
        //       </View>
        //     </View>
        //   </Modal>
        // </>

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
              ListEmptyComponent={
                <Text style={{ color: "#777" }}>
                  {user?.proyecto === 0 ? "No hay SED seleccionados" : "No hay alimentadores seleccionados"}
                </Text>
              }
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
            {!dbExists && (
              <Button
                title={isAppLoading ? "Descargando..." : "📥 Descargar Base"}
                onPress={handleDownload}
                disabled={isAppLoading}
              />
            )}


            {dbExists && (
              <>
                <Button title="💾 Exportar Base" onPress={handleExport} disabled={isAppLoading} />
                <View style={{ height: 10 }} />
                <Button title="🔄 Sincronizar" onPress={handleSync} disabled={isAppLoading} />
              </>
            )}

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
});
