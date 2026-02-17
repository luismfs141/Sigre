import { getSingleFeederLocal } from "../database/offlineDB/feeders";




import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  closeDatabase,
  isDatabaseAvailable,
  openDatabase
} from "../database/offlineDB/db";
import { AuthContext } from "./AuthContext";

const DatosContext = createContext();

// 🔴 CLAVE PARA GUARDAR EL ALIMENTADOR EN STORAGE
const SELECTED_FEEDER_KEY = "SIGRE_SELECTED_FEEDER";


export const DatosProvider = ({ children }) => {
  const { user } = useContext(AuthContext);

  // ------------------ ESTADO BD -------------------------
  const [dbName, setDbName] = useState(null);
  const [dbReady, setDbReady] = useState(false);
  const [loadingDB, setLoadingDB] = useState(true);




  const [alimEtiquetaLocal, setAlimEtiquetaLocal] = useState(null);


  // ------------------ PERFIL GLOBAL (desde login del servidor) ------------------
  const profileId = user?.perfilId ?? null;
  const profileName = user?.perfilNombre ?? null;

  const role = String(profileName ?? "").trim().toUpperCase();

  // ✅ Control por NOMBRE, no por ID (así escalas rápido cuando agregues perfiles)
  const isAdmin = role === "ADMINISTRADOR" || role === "ADMIN";
  const isInspector = role === "INSPECTOR";
  const isSupervisor = role === "SUPERVISOR";

  // Ya no depende de DB
  const loadingProfile = false;

  // si algún componente llama refreshProfile, que no rompa
  const refreshProfile = async () => true;

  // útil para comparar dueño
  const currentUserId = user?.id ?? null;



  // -------------------------------------------------------
  // Cargar última base al iniciar APP
  // -------------------------------------------------------
  const loadLastDatabaseName = async () => {
    try {
      const savedName = await AsyncStorage.getItem("db_name");
      if (savedName) {
        //console.log("📦 Última base cargada:", savedName);
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
  // const openLocalDB = async () => {
  //   setLoadingDB(true);

  //   // fuerza reset
  //   setDbReady(false);
  //   setAlimEtiquetaLocal(null);

  //   if (!dbName) {
  //     console.log("⚠ No hay dbName asignado todavía.");
  //     setLoadingDB(false);
  //     return;
  //   }

  //   const exists = await isDatabaseAvailable(dbName);
  //   if (!exists) {
  //     console.log("⚠ No existe la base local:", dbName);
  //     setLoadingDB(false);
  //     return;
  //   }

  //   try {
  //     await openDatabase(dbName);

  //     // ✅ 100% local: lee el único alimentador descargado
  //     const feeder = await getSingleFeederLocal();
  //     setAlimEtiquetaLocal(feeder?.AlimEtiqueta ?? null);

  //     setDbReady(true);
  //   } catch (err) {
  //     console.error("openLocalDB -> error:", err);
  //     setDbReady(false);
  //     setAlimEtiquetaLocal(null);
  //   }

  //   setLoadingDB(false);
  // };
  const openLocalDB = async () => {
    setLoadingDB(true);

    // fuerza reset
    setDbReady(false);
    setAlimEtiquetaLocal(null);

    if (!dbName) {
      console.log("⚠ No hay dbName asignado todavía.");
      setLoadingDB(false);
      return;
    }

    const exists = await isDatabaseAvailable(dbName);
    if (!exists) {
      console.log("⚠ No existe la base local:", dbName);
      setLoadingDB(false);
      return;
    }

    try {
      await openDatabase(dbName);

      // ✅ 100% local: en SQLite SIEMPRE hay 1 alimentador
      const feeder = await getSingleFeederLocal();
      const etiqueta = feeder?.AlimEtiqueta ?? null;

      setAlimEtiquetaLocal(etiqueta);
      setDbReady(true);

      console.log("[DatosContext] AlimEtiquetaLocal:", etiqueta);
    } catch (err) {
      console.error("openLocalDB -> error:", err);
      setDbReady(false);
      setAlimEtiquetaLocal(null);
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
    //console.log("🔄 setNewDatabase ejecutado:", newName);

    // 🔥 fuerza "flip" de estado (evita que el perfil se cargue antes de abrir DB)
    setDbReady(false);

    await closeLocalDatabase();               // cerrar actual
    await AsyncStorage.setItem("db_name", newName);
    setDbName(newName);                      // disparará openLocalDB()

    await AsyncStorage.removeItem(SELECTED_FEEDER_KEY);
    _setSelectedFeeder(null);
    setAlimEtiquetaLocal(null);


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






  // -------------------- ESTADOS DE DATOS ------------------------

  const [selectedFeeder, _setSelectedFeeder] = useState(null);
  const [feeders, setFeeders] = useState([]);
  const [pins, setPins] = useState([]);
  const [gaps, setGaps] = useState([]);
  const [selectedSed, setSelectedSed] = useState([]);
  const [totalPins, setTotalPins] = useState([]);
  const [selectedItem, setSelectedItem] = useState([]);

  const [selectedProject, setSelectedProject] = useState(0);
  const [selectedTypification, setSelectedTypification] = useState(null);
  const [selectedDeficiency, setSelectedDeficiency] = useState(null);

  const [region, setRegion] = useState({
    latitude: -12.0464,
    longitude: -77.0428,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05
  });

  const setSelectedPin = (pin) => setSelectedItem({ ...pin, type: "pin" });
  const setSelectedGap = (gap) => setSelectedItem({ ...gap, type: "gap" });

  // 🔁 Cargar alimentador guardado al iniciar APP
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SELECTED_FEEDER_KEY);
        if (raw) {
          const stored = JSON.parse(raw);
          console.log("[DatosContext] alimentador restaurado de storage:", stored);
          _setSelectedFeeder(stored);
        } else {
          console.log("[DatosContext] no había alimentador guardado");
        }
      } catch (e) {
        console.log("[DatosContext] error leyendo alimentador de storage:", e);
      }
    })();
  }, []);

  // 🔐 Setter que guarda también en AsyncStorage
  const setSelectedFeederPersist = (feeder) => {
    //console.log("[DatosContext] setSelectedFeeder:", feeder);
    _setSelectedFeeder(feeder);

    (async () => {
      try {
        if (feeder) {
          const minimal = {
            id: feeder.id ?? feeder.AlimInterno ?? feeder.alimInterno ?? null,
            name: feeder.name ?? feeder.AlimEtiqueta ?? feeder.alimEtiqueta ?? null,
            AlimInterno: feeder.AlimInterno ?? feeder.alimInterno ?? feeder.id ?? null,
            AlimEtiqueta: feeder.AlimEtiqueta ?? feeder.alimEtiqueta ?? feeder.name ?? null
          };
          await AsyncStorage.setItem(SELECTED_FEEDER_KEY, JSON.stringify(minimal));
        } else {
          await AsyncStorage.removeItem(SELECTED_FEEDER_KEY);
        }
      } catch (e) {
        console.log("[DatosContext] error guardando alimentador en storage:", e);
      }
    })();
  };

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

        // Perfil global (roles)
        profileId,
        profileName,
        isAdmin,
        isInspector,
        isSupervisor,
        loadingProfile,
        refreshProfile,

        // Usuario actual
        currentUserId,


        setSelectedTypification,
        selectedTypification,

        setSelectedDeficiency,
        selectedDeficiency,

        // Datos
        selectedFeeder,
        setSelectedFeeder: setSelectedFeederPersist,
        feeders,
        setFeeders,
        pins,
        setPins,
        gaps,
        setGaps,

        selectedSed,
        setSelectedSed,

        totalPins,
        setTotalPins,
        selectedItem,
        setSelectedItem,
        setSelectedPin,
        setSelectedGap,
        region,
        setRegion,

        selectedProject,
        alimEtiquetaLocal,

        setSelectedProject
      }}
    >
      {children}
    </DatosContext.Provider>
  );
};

export const useDatos = () => useContext(DatosContext);
