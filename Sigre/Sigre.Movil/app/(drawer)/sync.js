// import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as FileSystem from "expo-file-system/legacy";
// import * as Sharing from "expo-sharing";
// import { useContext, useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   Button,
//   FlatList,
//   Modal,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { AuthContext } from "../../context/AuthContext";
// import { closeDatabase, openDatabase } from '../../database/offlineDB/db';
// import { useFeeder } from "../../hooks/useFeeder";
// const { downloadOffline, isDownloading, dbName } = useOffline();

// export default function Sync() {

//   const { user } = useContext(AuthContext); // user.proyecto se asume disponible
//   const { loading: offlineLoading, downloadDatabase } = useOffline();
//   const {
//     feedersByUser,
//     getFeedersByUser,
//     loading: loadingFeeders,
//     fetchSedsByFeeder, // ✅ uso confirmado
//     seds // estado del hook (se llena tras fetchSedsByFeeder)
//   } = useFeeder(user?.id);

//   // Estados originales tuyos
//   const [selectedFeeders, setSelectedFeeders] = useState([]);
//   const [dbExists, setDbExists] = useState(false);
//   const [modalVisible, setModalVisible] = useState(false); // modal alimentadores
//   const [modalSubVisible, setModalSubVisible] = useState(false); // modal SEDs

//   // Nuevos estados para SEDs
//   const [selectedSubstations, setSelectedSubstations] = useState([]); // [{id, name}]
//   const [substationsByFeeder, setSubstationsByFeeder] = useState([]); // lista cargada
//   const [searchSed, setSearchSed] = useState("");
//   const [selectedFeeder, setSelectedFeeder] = useState(null); // para proyecto 0 solo 1

//   const dbName = "sigre_offline.db";

//   // Cargar alimentadores y verificar base
//   useEffect(() => {
//     if (user?.id) getFeedersByUser(user.id);
//     checkDatabase();
//   }, [user?.id]);

//   useEffect(() => {
//     loadSelectedFeeders();
//   }, []);

//   // Verificar si la base existe
//   const checkDatabase = async () => {
//     try {
//       const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;
//       const fileInfo = await FileSystem.getInfoAsync(dbPath);
//       setDbExists(fileInfo.exists);
//     } catch {
//       Alert.alert("Error", "No se pudo verificar la base local");
//     }
//   };

//   // ───────────────────────────────
//   // Descargar base
//   // ───────────────────────────────

// const handleDownload = async () => {
//   try {
//     // ──────────────────────────────
//     // PROYECTO 0 — Baja Tensión
//     // ──────────────────────────────
//     if (user?.proyecto === 0) {
//       if (!selectedFeeder)
//         return Alert.alert("Selecciona un alimentador");

//       if (selectedSubstations.length === 0)
//         return Alert.alert("Selecciona al menos una subestación");

//       // SOLO enviar el alimentador al backend
//       const sedsIds = selectedSubstations.map(s => parseInt(s.id, 10));

//       const fileUri = await downloadDatabase(user.id, sedsIds, 0);

//       if (!fileUri) throw new Error("No se descargó la base correctamente");

//       await closeDatabase();
//       await openDatabase();
//       await new Promise(r => setTimeout(r, 150));

//       setSelectedFeeders([]);
//       setSelectedSubstations([]);
//       setSelectedFeeder(null);
//       setDbExists(true);

//       Alert.alert("Éxito", "Base descargada correctamente.");
//       return;
//     }

//     // ──────────────────────────────
//     // PROYECTO 1 — Media Tensión
//     // ──────────────────────────────
//     if (!selectedFeeders.length)
//       return Alert.alert("Selecciona al menos un alimentador");

//     const feederIds = selectedFeeders.map(f => parseInt(f.id, 10));

//     const fileUri = await downloadDatabase(user.id, feederIds, 1);

//     if (!fileUri) throw new Error("No se descargó la base correctamente");

//     await closeDatabase();
//     await openDatabase();
//     await new Promise(r => setTimeout(r, 150));

//     setSelectedFeeders([]);
//     setDbExists(true);

//     Alert.alert("Éxito", "Base descargada correctamente.");
//   } catch (error) {
//     console.error(error);
//     Alert.alert("Error", "No se pudo descargar la base");
//   }
// };
//   // ───────────────────────────────
//   // Exportar base
//   // ───────────────────────────────
//   const handleExport = async () => {
//     try {
//       const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;
//       const fileInfo = await FileSystem.getInfoAsync(dbPath);
//       if (!fileInfo.exists) return Alert.alert("No hay base local");

//       if (!(await Sharing.isAvailableAsync()))
//         return Alert.alert("No disponible", "Tu dispositivo no permite compartir archivos");

//       await Sharing.shareAsync(dbPath);
//     } catch {
//       Alert.alert("Error", "No se pudo exportar la base");
//     }
//   };

//   // ───────────────────────────────
//   // Sync (eliminar base)
//   // ───────────────────────────────
//   const handleSync = async () => {
//     try {
//       const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;
//       await closeDatabase();
//       await FileSystem.deleteAsync(dbPath, { idempotent: true });

//       setDbExists(false);
//       setSelectedFeeders([]);
//       setSelectedSubstations([]);
//       setSelectedFeeder(null);
//       await AsyncStorage.removeItem('selectedFeeders');

//       Alert.alert("Listo", "Base eliminada y selección limpiada.");
//     } catch {
//       Alert.alert("Error", "No se pudo sincronizar.");
//     }
//   };

//   // ───────────────────────────────
//   // Manejo de alimentadores seleccionados
//   // ───────────────────────────────
//   const addFeeder = async (feeder) => {
//     // Si proyecto 0 → solo un alimentador (reemplaza)
//     if (user?.proyecto === 0) {
//       const single = { id: feeder.alimInterno ?? feeder.id ?? feeder.ID, name: feeder.alimEtiqueta ?? feeder.name ?? feeder.alimEtiqueta };
//       setSelectedFeeders([single]);
//       setSelectedFeeder(single);
//       await AsyncStorage.setItem('selectedFeeders', JSON.stringify([single]));
//       // cargar automáticamente SEDs
//       const data = await fetchSedsByFeeder(single.id);
//       setSubstationsByFeeder(Array.isArray(data) ? data : []);
//       setModalVisible(false);
//       return;
//     }

//     // Proyecto 1 (comportamiento original: lista múltiple)
//     const newList = [...selectedFeeders, { id: feeder.alimInterno ?? feeder.id, name: feeder.alimEtiqueta ?? feeder.name }];
//     setSelectedFeeders(newList);
//     await AsyncStorage.setItem('selectedFeeders', JSON.stringify(newList));
//     setModalVisible(false);
//   };

//   const loadSelectedFeeders = async () => {
//     const saved = await AsyncStorage.getItem('selectedFeeders');
//     if (saved) {
//       const parsed = JSON.parse(saved);
//       setSelectedFeeders(parsed);
//       // si hay uno y proyecto 0 lo marcamos
//       if (user?.proyecto === 0 && parsed.length > 0) {
//         setSelectedFeeder(parsed[0]);
//         // cargar SEDs
//         const data = await fetchSedsByFeeder(parsed[0].id);
//         setSubstationsByFeeder(Array.isArray(data) ? data : []);
//       }
//     }
//   };

//   const removeFeeder = async (feeder) => {
//     const filtered = selectedFeeders.filter(f => f.id !== feeder.id);
//     setSelectedFeeders(filtered);
//     await AsyncStorage.setItem('selectedFeeders', JSON.stringify(filtered));
//     // si era el selectedFeeder en proyecto 0 lo limpiamos
//     if (user?.proyecto === 0 && selectedFeeder?.id === feeder.id) {
//       setSelectedFeeder(null);
//       setSubstationsByFeeder([]);
//       setSelectedSubstations([]);
//     }
//   };

//   // ───────────────────────────────
//   // Manejo subestaciones (SED)
//   // ───────────────────────────────
//   const addSubstation = (sub) => {
//     if (selectedSubstations.some(s => s.id === sub.id)) return;
//     setSelectedSubstations(prev => [...prev, sub]);
//   };

//   const removeSubstation = (sub) => {
//     setSelectedSubstations(prev => prev.filter(s => s.id !== sub.id));
//   };

//   const toggleSubstation = (item) => {
//     if (selectedSubstations.some(s => s.id === item.SED_Interno)) {
//       removeSubstation({ id: item.SED_Interno });
//     } else {
//       addSubstation({ id: item.SED_Interno, name: item.SED_Etiqueta });
//     }
//   };

//   // Abrir modal de SED: validar que haya selectedFeeder
//   const openSubModal = async () => {
//     if (!selectedFeeder) return Alert.alert("Selecciona un alimentador primero");
//     // fetchSedsByFeeder ya fue llamado al seleccionar el feeder, pero lo reafirmamos
//     const data = await fetchSedsByFeeder(selectedFeeder.id);
//     setSubstationsByFeeder(Array.isArray(data) ? data : []);
//     setSearchSed("");
//     setModalSubVisible(true);
//   };

//   const isLoading = offlineLoading || loadingFeeders;

//   return (
//     <SafeAreaView style={styles.container}>
//       {isLoading ? (
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#007bff" />
//           <Text style={{ marginTop: 10 }}>Procesando...</Text>
//         </View>
//       ) : (
//         <>
//           {/* 🔹 Cabecera */}
//           <View style={styles.header}>
//             <Text style={styles.headerTitle}>Proyecto: {user?.proyecto === 0 ? "Baja Tensión" : user?.proyecto === 1 ? "Media Tensión" : "N/D"}</Text>
//             <View style={[
//               styles.headerButtons,
//               user?.proyecto === 1 && { justifyContent: "center" }
//             ]}>
//               <Button title="➕ Alimentador" onPress={() => setModalVisible(true)} />
//               {user?.proyecto !== 1 && (
//                 <Button title="🏢 Subestaciones" onPress={openSubModal} />
//               )}
//             </View>
//           </View>

//           {/* 🔹 Lista de alimentadores */}
//           <FlatList
//             data={selectedFeeders}
//             keyExtractor={item => item.id.toString()}
//             style={{ marginVertical: 10 }}
//             renderItem={({ item }) => (
//               <View style={styles.feederRow}>
//                 <Text style={styles.feederText}>{item.name}</Text>
//                 <Button title="❌" onPress={() => removeFeeder(item)} />
//               </View>
//             )}
//           />

//           {/* 🔹 MOSTRAR SEDs SELECCIONADOS (solo proyecto 0) */}
//           {user?.proyecto === 0 && selectedSubstations.length > 0 && (
//             <View style={{ marginTop: 10 }}>
//               <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 5 }}>
//                 SED seleccionados:
//               </Text>

//               <FlatList
//                 data={selectedSubstations}
//                 keyExtractor={(item) => item.id.toString()}
//                 renderItem={({ item }) => (
//                   <View style={styles.feederRow}>
//                     <Text style={styles.feederText}>{item.name}</Text>
//                     <Button title="❌" onPress={() => removeSubstation(item)} />
//                   </View>
//                 )}
//               />
//             </View>
//           )}

//           {/* 🔹 Botones inferiores centrados */}
//           <View style={styles.bottomButtons}>
//             {!dbExists && <Button title="📥 Descargar Base" onPress={handleDownload} />}
//             {dbExists && (
//               <>
//                 <Button title="💾 Exportar Base" onPress={handleExport} />
//                 <View style={{ height: 10 }} />
//                 <Button title="🔄 Sincronizar" onPress={handleSync} />
//               </>
//             )}
//           </View>

//           <Text style={{ marginTop: 10, fontWeight: "bold", color: dbExists ? "green" : "red" }}>
//             {dbExists ? "📦 Base local detectada" : "⚠️ No hay base local"}
//           </Text>

//           {/* Modal alimentadores */}
//           <Modal visible={modalVisible} transparent animationType="slide">
//             <View style={styles.modalBackground}>
//               <View style={styles.modalContainer}>
//                 <Text style={{ fontWeight: "bold", marginBottom: 10 }}>Selecciona un alimentador</Text>

//                 <FlatList
//                   data={feedersByUser.filter(f => !selectedFeeders.some(sf => sf.id === f.alimInterno))}
//                   keyExtractor={item => item.alimInterno.toString()}
//                   renderItem={({ item }) => (
//                     <TouchableOpacity
//                       style={styles.modalItem}
//                       onPress={() => addFeeder({ alimInterno: item.alimInterno, alimEtiqueta: item.alimEtiqueta })}
//                     >
//                       <Text>{item.alimEtiqueta}</Text>
//                     </TouchableOpacity>
//                   )}
//                 />

//                 <Button title="Cerrar" onPress={() => setModalVisible(false)} />
//               </View>
//             </View>
//           </Modal>

//           {/* Modal subestaciones (70% + buscador) */}
//           <Modal visible={modalSubVisible} transparent animationType="slide">
//             <View style={styles.modalBackground}>
//               <View style={[styles.modalContainer, { height: "70%" }]}>
//                 <Text style={{ fontWeight: "bold", marginBottom: 10 }}>Selecciona una subestación</Text>

//                 {/* Buscador */}
//                 <TextInput
//                   placeholder="Buscar SED..."
//                   value={searchSed}
//                   onChangeText={setSearchSed}
//                   style={{
//                     backgroundColor: "#eee",
//                     padding: 10,
//                     borderRadius: 10,
//                     marginBottom: 10,
//                   }}
//                 />

//                 <FlatList
//                   data={substationsByFeeder.filter(s =>
//                   (s.SED_Etiqueta ?? s.sedEtiqueta ?? "")
//                     .toLowerCase()
//                     .includes(searchSed.toLowerCase())
//                 )}
//                 keyExtractor={item => (item.SED_Interno ?? item.sedInterno).toString()}
//                 renderItem={({ item }) => {
//                   const id = item.SED_Interno ?? item.sedInterno;
//                   const name = item.SED_Etiqueta ?? item.sedCodigo;

//                   const isSelected = selectedSubstations.some(s => s.id === id);

//                   return (
//                     <TouchableOpacity
//                       style={[styles.modalItem, isSelected && { backgroundColor: "#cce5ff" }]}
//                       onPress={() => toggleSubstation({ SED_Interno: id, SED_Etiqueta: name })}
//                     >
//                       <Text>{name}</Text>
//                     </TouchableOpacity>
//                   );
//                 }}
//                 />

//                 <Button title="Cerrar" onPress={() => setModalSubVisible(false)} />
//               </View>
//             </View>
//           </Modal>

//         </>
//       )}
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 15, backgroundColor: "#f9f9f9" },
//   loadingContainer: { flex: 1, justifyContent: "center" },
//   header: { marginBottom: 10, justifyContent: "center"},
//   headerTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10, paddingLeft: "20%" },
//   headerButtons: { flexDirection: "row", justifyContent: "space-between" },
//   bottomButtons: { justifyContent: 'center', alignItems: 'center', marginVertical: 20 },
//   feederRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
//   feederText: { fontSize: 16 },
//   modalBackground: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
//   modalContainer: { width: "80%", backgroundColor: "#fff", borderRadius: 10, padding: 15 },
//   modalItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#ccc" },
// });

// screens/Sync.js
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
import { AuthContext } from "../../context/AuthContext";
import { useDatos } from "../../context/DatosContext";
import { closeDatabase, openDatabase } from '../../database/offlineDB/db';
import { useFeeder } from "../../hooks/useFeeder";
import { useOffline } from "../../hooks/useOffline";

export default function Sync() {

  const { user } = useContext(AuthContext); // user.proyecto se asume disponible
  const { offlineLoading, downloadDatabase, dbVersion, dbName: hookDbName } = useOffline();
  const {
    feedersByUser,
    getFeedersByUser,
    loading: loadingFeeders,
    fetchSedsByFeeder, // ✅ uso confirmado
    seds // estado del hook (se llena tras fetchSedsByFeeder)
  } = useFeeder(user?.id);

  // Estados originales tuyos
  const [selectedFeeders, setSelectedFeeders] = useState([]);
  const [dbExists, setDbExists] = useState(false);
  const [modalVisible, setModalVisible] = useState(false); // modal alimentadores
  const [modalSubVisible, setModalSubVisible] = useState(false); // modal SEDs
  const {dbName, setDbName} = useDatos();

  // Nuevos estados para SEDs
  const [selectedSubstations, setSelectedSubstations] = useState([]); // [{id, name}]
  const [substationsByFeeder, setSubstationsByFeeder] = useState([]); // lista cargada
  const [searchSed, setSearchSed] = useState("");
  const [selectedFeeder, setSelectedFeeder] = useState(null); // para proyecto 0 solo 1

  // Cargar alimentadores y verificar base
  useEffect(() => {
    if (user?.id) getFeedersByUser(user.id);
  }, [user?.id]);

  // Se ejecuta cuando cambia el nombre de la base
  useEffect(() => {
    if (!dbName) {
      console.log("⏳ Aún no hay dbName, no verifico BD");
      return;
    }
    
    checkDatabase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbName]);

  // Verificar si la base existe

  const checkDatabase = async () => {
    console.log("🔍 Revisando base:", dbName);

    try {
      const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;
      const fileInfo = await FileSystem.getInfoAsync(dbPath);

      console.log("📁 Existe?", fileInfo.exists);

      setDbExists(fileInfo.exists);
    } catch (e) {
      console.log("❌ Error revisando base", e);
    }
  };

  // ───────────────────────────────
  // Descargar base
  // ───────────────────────────────

const handleDownload = async () => {
  try {
    let nombreBase; // SIN extension

    // ──────────────────────────────
    // PROYECTO 0 — Baja Tensión
    // ──────────────────────────────
    if (user?.proyecto === 0) {
      if (!selectedFeeder)
        return Alert.alert("Selecciona un alimentador");

      if (selectedSubstations.length === 0)
        return Alert.alert("Selecciona al menos una subestación");

      // SOLO enviar las SEDs al backend
      const sedsIds = selectedSubstations.map(s => parseInt(s.id, 10));

      nombreBase = `sigre_offline_${selectedFeeder.id}_${Date.now()}`;

      const fileUri = await downloadDatabase(user.id, sedsIds, 0, nombreBase);

      if (!fileUri) throw new Error("No se descargó la base correctamente");

      // cerrar DB previa, esperar, abrir recién descargada
      await closeDatabase();
      await new Promise(r => setTimeout(r, 150));
      await openDatabase(`${nombreBase}.db`);

      // guardar nombre expuesto a la app (coincide con lo guardado por useOffline)
      await setDbName(`${nombreBase}.db`);

      setSelectedFeeders([]);
      setSelectedSubstations([]);
      setSelectedFeeder(null);
      setDbExists(true);

      Alert.alert("Éxito", "Base descargada correctamente.");
      return;
    }

    // ──────────────────────────────
    // PROYECTO 1 — Media Tensión
    // ──────────────────────────────
    if (!selectedFeeders.length)
      return Alert.alert("Selecciona al menos un alimentador");

    const feederIds = selectedFeeders.map(f => parseInt(f.id, 10));

    nombreBase = `sigre_offline_${Date.now()}`;

    const fileUri = await downloadDatabase(
      user.id,
      feederIds,
      1,
      nombreBase
    );

    if (!fileUri) throw new Error("No se descargó la base correctamente");
  
    // cerrar DB previa, esperar, abrir recién descargada
    await closeDatabase();
    await new Promise(r => setTimeout(r, 150));
    await openDatabase(`${nombreBase}.db`);

    // establecer nombre (coincide con lo guardado por useOffline)
    await setDbName(`${nombreBase}.db`);

    setSelectedFeeders([]);
    setDbExists(true);

    Alert.alert("Éxito", "Base descargada correctamente.");
  } catch (error) {
    console.error(error);
    Alert.alert("Error", "No se pudo descargar la base");
  }
};
  // ───────────────────────────────
  // Exportar base
  // ───────────────────────────────
  const handleExport = async () => {
    try {
      const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      if (!fileInfo.exists) return Alert.alert("No hay base local");

      if (!(await Sharing.isAvailableAsync()))
        return Alert.alert("No disponible", "Tu dispositivo no permite compartir archivos");

      await Sharing.shareAsync(dbPath);
    } catch {
      Alert.alert("Error", "No se pudo exportar la base");
    }
  };

  // ───────────────────────────────
  // Sync (eliminar base)
  // ───────────────────────────────
  const handleSync = async () => {
    try {
      const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;
      await closeDatabase();
      await FileSystem.deleteAsync(dbPath, { idempotent: true });

      setDbExists(false);
      setSelectedFeeders([]);
      setSelectedSubstations([]);
      setSelectedFeeder(null);
      await AsyncStorage.removeItem('selectedFeeders');
      await AsyncStorage.removeItem('offline_db_name');
      setDbName(null);

      Alert.alert("Listo", "Base eliminada y selección limpiada.");
    } catch {
      Alert.alert("Error", "No se pudo sincronizar.");
    }
  };

  // ───────────────────────────────
  // Manejo de alimentadores seleccionados
  // ───────────────────────────────
  const addFeeder = async (feeder) => {
    // Si proyecto 0 → solo un alimentador (reemplaza)
    if (user?.proyecto === 0) {
      const single = { id: feeder.alimInterno ?? feeder.id ?? feeder.ID, name: feeder.alimEtiqueta ?? feeder.name ?? feeder.alimEtiqueta };
      setSelectedFeeders([single]);
      setSelectedFeeder(single);
      await AsyncStorage.setItem('selectedFeeders', JSON.stringify([single]));
      // cargar automáticamente SEDs
      const data = await fetchSedsByFeeder(single.id);
      setSubstationsByFeeder(Array.isArray(data) ? data : []);
      setModalVisible(false);
      return;
    }

    // Proyecto 1 (comportamiento original: lista múltiple)
    const newList = [...selectedFeeders, { id: feeder.alimInterno ?? feeder.id, name: feeder.alimEtiqueta ?? feeder.name }];
    setSelectedFeeders(newList);
    await AsyncStorage.setItem('selectedFeeders', JSON.stringify(newList));
    setModalVisible(false);
  };

  const loadSelectedFeeders = async () => {
    const saved = await AsyncStorage.getItem('selectedFeeders');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSelectedFeeders(parsed);
      // si hay uno y proyecto 0 lo marcamos
      if (user?.proyecto === 0 && parsed.length > 0) {
        setSelectedFeeder(parsed[0]);
        // cargar SEDs
        const data = await fetchSedsByFeeder(parsed[0].id);
        setSubstationsByFeeder(Array.isArray(data) ? data : []);
      }
    }
  };

  const removeFeeder = async (feeder) => {
    const filtered = selectedFeeders.filter(f => f.id !== feeder.id);
    setSelectedFeeders(filtered);
    await AsyncStorage.setItem('selectedFeeders', JSON.stringify(filtered));
    // si era el selectedFeeder en proyecto 0 lo limpiamos
    if (user?.proyecto === 0 && selectedFeeder?.id === feeder.id) {
      setSelectedFeeder(null);
      setSubstationsByFeeder([]);
      setSelectedSubstations([]);
    }
  };

  // ───────────────────────────────
  // Manejo subestaciones (SED)
  // ───────────────────────────────
  const addSubstation = (sub) => {
    if (selectedSubstations.some(s => s.id === sub.id)) return;
    setSelectedSubstations(prev => [...prev, sub]);
  };

  const removeSubstation = (sub) => {
    setSelectedSubstations(prev => prev.filter(s => s.id !== sub.id));
  };

  const toggleSubstation = (item) => {
    if (selectedSubstations.some(s => s.id === item.SED_Interno)) {
      removeSubstation({ id: item.SED_Interno });
    } else {
      addSubstation({ id: item.SED_Interno, name: item.SED_Etiqueta });
    }
  };

  // Abrir modal de SED: validar que haya selectedFeeder
  const openSubModal = async () => {
    if (!selectedFeeder) return Alert.alert("Selecciona un alimentador primero");
    // fetchSedsByFeeder ya fue llamado al seleccionar el feeder, pero lo reafirmamos
    const data = await fetchSedsByFeeder(selectedFeeder.id);
    setSubstationsByFeeder(Array.isArray(data) ? data : []);
    setSearchSed("");
    setModalSubVisible(true);
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
          {/* 🔹 Cabecera */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Proyecto: {user?.proyecto === 0 ? "Baja Tensión" : user?.proyecto === 1 ? "Media Tensión" : "N/D"}</Text>
            <View style={[
              styles.headerButtons,
              user?.proyecto === 1 && { justifyContent: "center" }
            ]}>
              <Button title="➕ Alimentador" onPress={() => setModalVisible(true)} />
              {user?.proyecto !== 1 && (
                <Button title="🏢 Subestaciones" onPress={openSubModal} />
              )}
            </View>
          </View>

          {/* 🔹 Lista de alimentadores */}
          <FlatList
            data={selectedFeeders}
            keyExtractor={item => item.id.toString()}
            style={{ marginVertical: 10 }}
            renderItem={({ item }) => (
              <View style={styles.feederRow}>
                <Text style={styles.feederText}>{item.name}</Text>
                <Button title="❌" onPress={() => removeFeeder(item)} />
              </View>
            )}
          />

          {/* 🔹 MOSTRAR SEDs SELECCIONADOS (solo proyecto 0) */}
          {user?.proyecto === 0 && selectedSubstations.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 5 }}>
                SED seleccionados:
              </Text>

              <FlatList
                data={selectedSubstations}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.feederRow}>
                    <Text style={styles.feederText}>{item.name}</Text>
                    <Button title="❌" onPress={() => removeSubstation(item)} />
                  </View>
                )}
              />
            </View>
          )}

          {/* 🔹 Botones inferiores centrados */}
          <View style={styles.bottomButtons}>
            {!dbExists && <Button title="📥 Descargar Base" onPress={handleDownload} />}
            {dbExists && (
              <>
                <Button title="💾 Exportar Base" onPress={handleExport} />
                <View style={{ height: 10 }} />
                <Button title="🔄 Sincronizar" onPress={handleSync} />
              </>
            )}
          </View>

          <Text style={{ marginTop: 10, fontWeight: "bold", color: dbExists ? "green" : "red" }}>
            {dbExists ? "📦 Base local detectada" : "⚠️ No hay base local"}
          </Text>

          {/* Modal alimentadores */}
          <Modal visible={modalVisible} transparent animationType="slide">
            <View style={styles.modalBackground}>
              <View style={styles.modalContainer}>
                <Text style={{ fontWeight: "bold", marginBottom: 10 }}>Selecciona un alimentador</Text>

                <FlatList
                  data={feedersByUser.filter(f => !selectedFeeders.some(sf => sf.id === f.alimInterno))}
                  keyExtractor={item => item.alimInterno.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.modalItem}
                      onPress={() => addFeeder({ alimInterno: item.alimInterno, alimEtiqueta: item.alimEtiqueta })}
                    >
                      <Text>{item.alimEtiqueta}</Text>
                    </TouchableOpacity>
                  )}
                />

                <Button title="Cerrar" onPress={() => setModalVisible(false)} />
              </View>
            </View>
          </Modal>

          {/* Modal subestaciones (70% + buscador) */}
          <Modal visible={modalSubVisible} transparent animationType="slide">
            <View style={styles.modalBackground}>
              <View style={[styles.modalContainer, { height: "70%" }]}>
                <Text style={{ fontWeight: "bold", marginBottom: 10 }}>Selecciona una subestación</Text>

                {/* Buscador */}
                <TextInput
                  placeholder="Buscar SED..."
                  value={searchSed}
                  onChangeText={setSearchSed}
                  style={{
                    backgroundColor: "#eee",
                    padding: 10,
                    borderRadius: 10,
                    marginBottom: 10,
                  }}
                />

                <FlatList
                  data={substationsByFeeder.filter(s =>
                  (s.SED_Etiqueta ?? s.sedEtiqueta ?? "")
                    .toLowerCase()
                    .includes(searchSed.toLowerCase())
                )}
                keyExtractor={item => (item.SED_Interno ?? item.sedInterno).toString()}
                renderItem={({ item }) => {
                  const id = item.SED_Interno ?? item.sedInterno;
                  const name = item.SED_Etiqueta ?? item.sedCodigo;

                  const isSelected = selectedSubstations.some(s => s.id === id);

                  return (
                    <TouchableOpacity
                      style={[styles.modalItem, isSelected && { backgroundColor: "#cce5ff" }]}
                      onPress={() => toggleSubstation({ SED_Interno: id, SED_Etiqueta: name })}
                    >
                      <Text>{name}</Text>
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
  loadingContainer: { flex: 1, justifyContent: "center" },
  header: { marginBottom: 10, justifyContent: "center"},
  headerTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10, paddingLeft: "20%" },
  headerButtons: { flexDirection: "row", justifyContent: "space-between" },
  bottomButtons: { justifyContent: 'center', alignItems: 'center', marginVertical: 20 },
  feederRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  feederText: { fontSize: 16 },
  modalBackground: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContainer: { width: "80%", backgroundColor: "#fff", borderRadius: 10, padding: 15 },
  modalItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#ccc" },
});
