// useMap.js
import { useDatos } from "../context/DatosContext";
import { getGapsByFeederLocal, getGapsBySedLocal } from "../database/offlineDB/gaps";
import { getPinsByFeederLocal, getPinsBySedLocal } from "../database/offlineDB/pins";

export const useMap = () => {
  const {
    setPins,
    setGaps,
    setRegion,
    totalPins,
    setTotalPins
  } = useDatos();

  // --------------------------------------------------------------
  // CARGAR TODOS LOS PINS DEL ALIMENTADOR (NO SE MUESTRAN AÚN)
  // --------------------------------------------------------------
  const getPinsByFeeder = async (feederId) => {
    try {
      let data = await getPinsByFeederLocal(feederId);
      if (!Array.isArray(data)) data = [];

      const pinsFiltered = data
        .filter(p => p.Type !== 0)
        .map(p => ({
          ...p,
          Latitude: Number(p.Latitude),
          Longitude: Number(p.Longitude)
        }));

      setTotalPins(pinsFiltered);
      return pinsFiltered;
    } catch (err) {
      console.error("❌ Error cargando pines offline:", err);
      setTotalPins([]);
      return [];
    }
  };

  // --------------------------------------------------------------
  // CARGAR TODOS LOS PINS DE LA SUBESTACION (NO SE MUESTRAN AÚN)
  // --------------------------------------------------------------
  const getPinsBySed = async (sedId) => {
    try {
      let data = await getPinsBySedLocal(sedId);
      if (!Array.isArray(data)) data = [];

      const pinsFiltered = data
        .filter(p => p.Type !== 0)
        .map(p => ({
          ...p,
          Latitude: Number(p.Latitude),
          Longitude: Number(p.Longitude)
        }));

      setTotalPins(pinsFiltered);
      return pinsFiltered;
    } catch (err) {
      console.error("❌ Error cargando pines offline:", err);
      setTotalPins([]);
      return [];
    }
  };

  // --------------------------------------------------------------
  // MOSTRAR SOLO LOS PINS EN LA REGION VISIBLE
  // --------------------------------------------------------------
  const getPinsByRegion = (region) => {
    if (!Array.isArray(totalPins)) return setPins([]);

    // Si el zoom no es suficiente → no mostrar pines
    if (region.latitudeDelta > 0.008) {
      setPins([]);
      return;
    }


    const { latitude, longitude, latitudeDelta, longitudeDelta } = region;

    const minLat = latitude - latitudeDelta * 0.6;
    const maxLat = latitude + latitudeDelta * 0.6;
    const minLng = longitude - longitudeDelta * 0.6;
    const maxLng = longitude + longitudeDelta * 0.6;

    const visiblePins = totalPins.filter(p =>
      p.Latitude >= minLat &&
      p.Latitude <= maxLat &&
      p.Longitude >= minLng &&
      p.Longitude <= maxLng
    );

    setPins(visiblePins);
  };


  // --------------------------------------------------------------
  // GAPS (no causan lag)
  // --------------------------------------------------------------
  const getGapsByFeeder = async (feederId) => {
    let data = await getGapsByFeederLocal(feederId);
    if (!Array.isArray(data)) data = [];

    setGaps(data.map(g => ({
      ...g,
      VanoLatitudIni: Number(g.VanoLatitudIni),
      VanoLongitudIni: Number(g.VanoLongitudIni),
      VanoLatitudFin: Number(g.VanoLatitudFin),
      VanoLongitudFin: Number(g.VanoLongitudFin)
    })));

    return data;
  };

  // --------------------------------------------------------------
  // GAPS POR SUBESTACION(no causan lag)
  // --------------------------------------------------------------
  const getGapsBySed = async (sedId) => {
    let data = await getGapsBySedLocal(sedId);
    if (!Array.isArray(data)) data = [];

    setGaps(data.map(g => ({
      ...g,
      VanoLatitudIni: Number(g.VanoLatitudIni),
      VanoLongitudIni: Number(g.VanoLongitudIni),
      VanoLatitudFin: Number(g.VanoLatitudFin),
      VanoLongitudFin: Number(g.VanoLongitudFin)
    })));

    return data;
  };


  // --------------------------------------------------------------
  // SET REGION POR COORDENADAS (GPS)
  // --------------------------------------------------------------
  const setRegionByCoordinate = (lat, lon) => {
    if (!lat || !lon) return;

    setRegion({
      latitude: lat,
      longitude: lon,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
  };


  // --------------------------------------------------------------
  // SET REGION AL CENTRAR ALIMENTADOR
  // --------------------------------------------------------------
  const setRegionByFeeder = (pinsArray) => {
    if (!pinsArray || pinsArray.length === 0) return;

    setRegion({
      latitude: pinsArray[0].Latitude,
      longitude: pinsArray[0].Longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01
    });
  };

  const setRegionBySed = (pinsArray, sed) => {
    if (pinsArray && pinsArray.length > 0) {
      setRegion({
        latitude: pinsArray[0].Latitude,
        longitude: pinsArray[0].Longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      });
    } else if (sed) {
      setRegion({
        latitude: sed.SedLatitud,
        longitude: sed.SedLongitud,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      });
    }
  };

  return {
    getPinsByFeeder,
    getPinsByRegion,
    getGapsByFeeder,
    getGapsBySed,
    getPinsBySed,
    setRegionByFeeder,
    setRegionBySed,
    setRegionByCoordinate
  };

};