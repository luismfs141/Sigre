import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { closeDatabase, isDatabaseAvailable, openDatabase } from "../database/offlineDB/db";

const DatosContext = createContext();

export const DatosProvider = ({ children }) => {

  // ------------------ ESTADO BD -------------------------
  const [dbName, setDbName] = useState(null);
  const [dbReady, setDbReady] = useState(false);
  const [loadingDB, setLoadingDB] = useState(true);

  // -------------------------------------------------------
  // Cargar última base al iniciar APP
  // -------------------------------------------------------
  const loadLastDatabaseName = async () => {
    try {
      const savedName = await AsyncStorage.getItem("db_name");
      if (savedName) {
        console.log("📦 Última base cargada:", savedName);
        setDbName(savedName);
      } else {
        console.log("⚠ No hay base previa guardada.");
      }
    } catch (err) {
      console.log("❌ Error leyendo db_name:", err);
    }
  };

  // -------------------------------------------------------
  // Abrir la base existente
  // -------------------------------------------------------
  const openLocalDB = async () => {
    setLoadingDB(true);

    if (!dbName) {
      console.log("⚠ No hay dbName asignado todavía.");
      setDbReady(false);
      setLoadingDB(false);
      return;
    }

    const exists = await isDatabaseAvailable(dbName);
    if (!exists) {
      console.log("⚠ No existe la base local:", dbName);
      setDbReady(false);
      setLoadingDB(false);
      return;
    }

    try {
      await openDatabase(dbName);
      console.log("ready:", dbName);
      setDbReady(true);
    } catch (err) {
      console.error("openLocalDB -> error:", err);
      setDbReady(false);
    }

    setLoadingDB(false);
  };

  // -------------------------------------------------------
  // Comprobar base antes de cada pantalla
  // -------------------------------------------------------
  const checkDatabase = async () => {
    if (!dbName) return false;
    const exists = await isDatabaseAvailable(dbName);
    if (!exists) {
      console.warn("❌ checkDatabase -> La base NO existe:", dbName);
      setDbReady(false);
      return false;
    }
    return true;
  };

  // -------------------------------------------------------
  // Cerrar BD actual
  // -------------------------------------------------------
  const closeLocalDatabase = async () => {
    try {
      await closeDatabase();
    } catch (err) {
      console.log("❌ Error cerrando DB:", err);
    }
  };

  // -------------------------------------------------------
  // Cambiar a nueva base descargada
  // -------------------------------------------------------
  const setNewDatabase = async (newName) => {
    console.log("🔄 setNewDatabase ejecutado:", newName);

    await closeLocalDatabase();       // cerrar actual
    await AsyncStorage.setItem("db_name", newName); // guardar nombre
    setDbName(newName);               // disparar openLocalDB automáticamente
  };

  // Cuando cambia dbName → abrir base
  useEffect(() => {
    if (dbName) openLocalDB();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbName]);

  // Al iniciar app → cargar última base
  useEffect(() => {
    loadLastDatabaseName();
  }, []);











  //GLOBALES = SELECTE DEFICIENCIAS
  // -------------------- ESTADOS DE DATOS ------------------------
  const [selectedFeeder, setSelectedFeeder] = useState(null);
  const [feeders, setFeeders] = useState([]);
  const [pins, setPins] = useState([]);
  const [gaps, setGaps] = useState([]);
  const [selectedPost, setSelectedPost] = useState([]);
  const [selectedSed, setSelectedSed] = useState([]);
  const [totalPins, setTotalPins] = useState([]);
  const [selectedItem, setSelectedItem] = useState([]);
  const [selectedProject, setSelectedProject] = useState(0);

  const [region, setRegion] = useState({
    latitude: -12.0464,
    longitude: -77.0428,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05
  });

  const setSelectedPin = (pin) => setSelectedItem({ ...pin, type: "pin" });
  const setSelectedGap = (gap) => setSelectedItem({ ...gap, type: "gap" });

  return (
    <DatosContext.Provider
      value={{
        // BD
        dbReady,
        loadingDB,
        dbName,
        setDbName,
        openLocalDB,
        checkDatabase,
        setNewDatabase,

        // Datos
        //////////////////////////////////// alimentador
        selectedFeeder, setSelectedFeeder,
        feeders, setFeeders,
        pins, setPins,
        gaps, setGaps,


        //borrar
        selectedPost, setSelectedPost,

        ///////////// subestacion
        selectedSed, setSelectedSed,




        totalPins, setTotalPins,
        selectedItem, setSelectedItem,
        setSelectedPin,
        setSelectedGap,
        region, setRegion,




        ////////////////////////////// proyecto
        selectedProject, setSelectedProject,
      }}
    >
      {children}
    </DatosContext.Provider>
  );
};

export const useDatos = () => useContext(DatosContext);
