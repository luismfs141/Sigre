import React, { createContext, useContext, useEffect, useState } from "react";

const DatosContext = createContext();

// CLAVES PARA LOCALSTORAGE
const SELECTED_FEEDER_KEY = "SIGRE_SELECTED_FEEDER";
const SELECTED_SED_KEY = "SIGRE_SELECTED_SED"; // 👈 Agregado para SED

export const DatosProvider = ({ children }) => {
  
  // -------------------- ESTADOS DE DATOS ------------------------
  // Ya no necesitamos dbName, dbReady, loadingDB porque usamos API directa.

  const [selectedProject, setSelectedProject] = useState(0);

  // --- GESTIÓN ALIMENTADOR ---
  const [selectedFeeder, _setSelectedFeeder] = useState(null);
  const [feeders, setFeeders] = useState([]); // Lista cargada desde API

  // --- GESTIÓN SUBESTACIÓN (SED) ---
  const [selectedSed, _setSelectedSed] = useState(null);
  
  // --- OTROS ESTADOS DE FLUJO ---
  const [selectedTypification, setSelectedTypification] = useState(null);
  const [selectedDeficiency, setSelectedDeficiency] = useState(null);

  // =========================================================
  // 1. CARGAR DATOS GUARDADOS AL INICIAR (PERSISTENCIA)
  // =========================================================
  useEffect(() => {
    try {
      // Restaurar Alimentador
      const rawFeeder = localStorage.getItem(SELECTED_FEEDER_KEY);
      if (rawFeeder) {
        console.log("📦 Alimentador restaurado:", JSON.parse(rawFeeder));
        _setSelectedFeeder(JSON.parse(rawFeeder));
      }

      // Restaurar SED
      const rawSed = localStorage.getItem(SELECTED_SED_KEY);
      if (rawSed) {
        console.log("📦 SED restaurada:", JSON.parse(rawSed));
        _setSelectedSed(JSON.parse(rawSed));
      }

    } catch (e) {
      console.error("Error restaurando sesión:", e);
    }
  }, []);

  // =========================================================
  // 2. SETTERS CON PERSISTENCIA (GUARDAN EN MEMORIA Y DISCO)
  // =========================================================
  
  // Guardar Alimentador
  const setSelectedFeeder = (feeder) => {
    _setSelectedFeeder(feeder);
    if (feeder) {
      localStorage.setItem(SELECTED_FEEDER_KEY, JSON.stringify(feeder));
      // Opcional: Si cambias de alimentador, quizás quieras borrar la SED seleccionada anterior
      // setSelectedSed(null); 
    } else {
      localStorage.removeItem(SELECTED_FEEDER_KEY);
    }
  };

  // Guardar SED
  const setSelectedSed = (sed) => {
    _setSelectedSed(sed);
    if (sed) {
      localStorage.setItem(SELECTED_SED_KEY, JSON.stringify(sed));
    } else {
      localStorage.removeItem(SELECTED_SED_KEY);
    }
  };

  return (
    <DatosContext.Provider
      value={{
        // Proyecto
        selectedProject,
        setSelectedProject,

        // Alimentador
        feeders,
        setFeeders, // Lo llenarás con el resultado de tu API (Axios)
        selectedFeeder,
        setSelectedFeeder, // Usa la versión persistente

        // Subestación (SED)
        selectedSed,
        setSelectedSed, // Usa la versión persistente

        // Flujo de Deficiencias
        selectedTypification,
        setSelectedTypification,
        selectedDeficiency,
        setSelectedDeficiency,
      }}
    >
      {children}
    </DatosContext.Provider>
  );
};

export const useDatos = () => useContext(DatosContext);