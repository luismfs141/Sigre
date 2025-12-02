import React, { createContext, useContext, useEffect, useState } from "react";
import { isDatabaseAvailable, openDatabase } from "../database/offlineDB/db";

const DatosContext = createContext();

export const DatosProvider = ({ children }) => {

  // 🔵 Estados agregados para BD
  const [dbReady, setDbReady] = useState(false);
  const [loadingDB, setLoadingDB] = useState(true);

  const openLocalDB = async () => {
    setLoadingDB(true);
    const exists = await isDatabaseAvailable();

    if (!exists) {
      console.log("⚠ No existe base local");
      setDbReady(false);
      setLoadingDB(false);
      return;
    }

    const db = await openDatabase();
    if (db) setDbReady(true);

    setLoadingDB(false);
  };

  // 🟢 intentar abrir BD al iniciar app
  useEffect(() => {
    openLocalDB();
  }, []);

  // -------------------- TUS ESTADOS ------------------------
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

  const setSelectedPin = (pin) => {
    setSelectedItem({ ...pin, type: "pin" });
  };

  const setSelectedGap = (gap) => {
    setSelectedItem({ ...gap, type: "gap" });
  };

  return (
    <DatosContext.Provider
      value={{
        // BD
        dbReady,
        loadingDB,
        openLocalDB,

        // Datos
        selectedFeeder, setSelectedFeeder,
        feeders, setFeeders,
        pins, setPins,
        gaps, setGaps,
        selectedPost, setSelectedPost,
        selectedSed, setSelectedSed,
        totalPins, setTotalPins,
        selectedItem, setSelectedItem,
        setSelectedPin,
        setSelectedGap,
        region, setRegion,
        selectedProject, setSelectedProject
      }}
    >
      {children}
    </DatosContext.Provider>
  );
};

export const useDatos = () => useContext(DatosContext);