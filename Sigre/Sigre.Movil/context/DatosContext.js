import React, { createContext, useContext, useState } from "react";

const DatosContext = createContext();

export const DatosProvider = ({ children }) => {
  const [selectedFeeder, setSelectedFeeder] = useState(null);
  const [feeders, setFeeders] = useState([]);
  const [pins, setPins] = useState([]);
  const [gaps, setGaps] = useState([]);
  const [selectedPost, setSelectedPost] = useState([]);
  const [selectedSed, setSelectedSed] = useState([]);
  const [totalPins, setTotalPins] = useState([]);
  const [selectedItem, setSelectedItem] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

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
        // datos principales
        selectedFeeder,
        setSelectedFeeder,

        feeders,
        setFeeders,

        pins,
        setPins,

        gaps,
        setGaps,

        selectedPost,
        setSelectedPost,

        selectedSed,
        setSelectedSed,

        totalPins,
        setTotalPins,

        // item seleccionado
        selectedItem,
        setSelectedItem,

        setSelectedPin,
        setSelectedGap,

        region, setRegion,

        selectedProject,
        setSelectedProject
      }}
    >
      {children}
    </DatosContext.Provider>
  );
};

export const useDatos = () => useContext(DatosContext);