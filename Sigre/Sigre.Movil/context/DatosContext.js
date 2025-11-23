import React, { createContext, useContext, useState } from "react";

const DatosContext = createContext();

export const DatosProvider = ({ children }) => {
  
  // Feeder Seleccionado
  const [selectedFeeder, setSelectedFeeder] = useState(null);
  // 🔵 Alimentadores locales
  const [feeders, setFeeders] = useState([]);

  // Datos generales del mapa
  const [pins, setPins] = useState([]);
  const [gaps, setGaps] = useState([]);
  const [totalPins, setTotalPins] = useState([]);

  // Región actual del mapa
  const [region, setRegion] = useState({
    latitude: -12.0464,
    longitude: -77.0428,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // Elemento seleccionado (pin o gap)
  const [selectedItem, setSelectedItem] = useState(null);

  // Guardar PIN seleccionado
  const setSelectedPin = (pin) => {
    setSelectedItem({ ...pin, type: "pin" });
  };

  // Guardar GAP seleccionado
  const setSelectedGap = (gap) => {
    setSelectedItem({ ...gap, type: "gap" });
  };

  return (
    <DatosContext.Provider
      value={{
        selectedFeeder,
        setSelectedFeeder,
        feeders,
        setFeeders,
        pins,
        setPins,
        gaps,
        setGaps,
        totalPins,
        setTotalPins,
        region,
        setRegion,
        selectedItem,
        setSelectedPin,
        setSelectedGap,
      }}
    >
      {children}
    </DatosContext.Provider>
  );
};

export const useDatos = () => useContext(DatosContext);
