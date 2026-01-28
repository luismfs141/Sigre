import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  closeDatabase,
  isDatabaseAvailable,
  openDatabase,
  runQuery
} from "../database/offlineDB/db";
import { AuthContext } from "./AuthContext";

const DatosContext = createContext();

// 🔴 CLAVE PARA GUARDAR EL ALIMENTADOR EN STORAGE
const SELECTED_FEEDER_KEY = "SIGRE_SELECTED_FEEDER";

// 🔐 PERFIL (cache global)
const PROFILE_CACHE_KEY = "SIGRE_PROFILE_CACHE_V1";

export const DatosProvider = ({ children }) => {
  const { user } = useContext(AuthContext);

  // ------------------ ESTADO BD -------------------------
  const [dbName, setDbName] = useState(null);
  const [dbReady, setDbReady] = useState(false);
  const [loadingDB, setLoadingDB] = useState(true);

  // ------------------ PERFIL GLOBAL ---------------------
  const [profileId, setProfileId] = useState(null); // 1=Admin, 4=Inspector
  const [profileName, setProfileName] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInspector, setIsInspector] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const resetProfile = async () => {
    setProfileId(null);
    setProfileName(null);
    setIsAdmin(false);
    setIsInspector(false);
    setLoadingProfile(false);
    try {
      await AsyncStorage.removeItem(PROFILE_CACHE_KEY);
    } catch {
      /* noop */
    }
  };

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
      //console.log("ready:", dbName);
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

    await closeLocalDatabase(); // cerrar actual
    await AsyncStorage.setItem("db_name", newName); // guardar nombre
    setDbName(newName); // disparar openLocalDB automáticamente

    // (opcional) si cambias de base, puedes limpiar el alimentador guardado:
    await AsyncStorage.removeItem(SELECTED_FEEDER_KEY);
    _setSelectedFeeder(null);

    // 🔐 Reset perfil (se recalculará cuando la DB esté lista)
    await resetProfile();
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

  // -------------------------------------------------------
  // PERFIL: detectar (Admin/Inspector) desde SQLite
  // -------------------------------------------------------
  const resolveProfileTableName = async () => {
    // Última versión: "PerfilesUsuarios" (plural). Compatibilidad: "PerfilesUsuario" (singular)
    const rows = await runQuery(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('PerfilesUsuarios','PerfilesUsuario')"
    );
    const names = new Set((rows || []).map((r) => r.name));
    if (names.has("PerfilesUsuarios")) return "PerfilesUsuarios";
    if (names.has("PerfilesUsuario")) return "PerfilesUsuario";
    return null;
  };

  const loadProfileFromDB = async () => {
    if (!dbReady) return;
    const usuarioId = user?.id;
    if (!usuarioId) return;



    setLoadingProfile(true);

    try {
      // 1) Cache local (por si recargas UI)
      const cachedRaw = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if (cached?.dbName === dbName && cached?.usuarioId === usuarioId) {
          setProfileId(cached.profileId ?? null);
          setProfileName(cached.profileName ?? null);
          setIsAdmin(cached.profileId === 1);
          setIsInspector(cached.profileId === 4);
          setLoadingProfile(false);
          return;
        }
      }

      // 2) Tabla PerfilesUsuarios / PerfilesUsuario
      const table = await resolveProfileTableName();
      if (!table) {
        console.warn("⚠ No existe tabla PerfilesUsuarios/PerfilesUsuario en esta DB");
        await resetProfile();
        return;
      }

      const perfilRows = await runQuery(
        `SELECT PfusPerfil
         FROM "${table}"
         WHERE PfusUsuario = ?
         LIMIT 1`,
        [usuarioId]
      );

      const pid = perfilRows?.[0]?.PfusPerfil ?? null;

      let pname = null;
      if (pid != null) {
        // 3) (Opcional) resolver nombre del perfil desde "Perfiles"
        try {
          const perRows = await runQuery(
            `SELECT PerfNombre FROM "Perfiles" WHERE PerfInterno = ? LIMIT 1`,
            [pid]
          );
          pname = perRows?.[0]?.PerfNombre ?? null;
        } catch {
          pname = null;
        }
      }

      setProfileId(pid);
      setProfileName(pname);
      setIsAdmin(pid === 1);
      setIsInspector(pid === 4);


      await AsyncStorage.setItem(
        PROFILE_CACHE_KEY,
        JSON.stringify({
          dbName,
          usuarioId,
          profileId: pid,
          profileName: pname
        })
      );


    } catch (err) {
      console.error("❌ Error cargando perfil desde SQLite:", err);
      setProfileId(null);
      setProfileName(null);
      setIsAdmin(false);
      setIsInspector(false);
    } finally {
      setLoadingProfile(false);


 //console.log("🏁 [PROFILE] end loadingProfile=false");


    }
  };

  // Cargar perfil cuando DB está lista + usuario logueado
  useEffect(() => {
    loadProfileFromDB();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbReady, dbName, user?.id]);

  // Si se hace logout, limpiar perfil cacheado
  useEffect(() => {
    if (!user?.id) {
      resetProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
    console.log("[DatosContext] setSelectedFeeder:", feeder);
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
        loadingProfile,
        refreshProfile: loadProfileFromDB,

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
        setSelectedProject
      }}
    >
      {children}
    </DatosContext.Provider>
  );
};

export const useDatos = () => useContext(DatosContext);
