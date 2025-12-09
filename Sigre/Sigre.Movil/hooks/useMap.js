// useMap.js
import { useDatos } from "../context/DatosContext";
import { useGap } from "./useGap";
import { usePin } from "./usePin";

export const useMap = () => {
  const { setPins, setGaps, setRegion, totalPins, setTotalPins } = useDatos();
  const { fetchGapsByFeeder, fetchGapsBySed } = useGap();
  const { fetchPinsByFeeder, fetchPinsBySed } = usePin();

  // --------------------------------------------------------------
  // CARGAR TODOS LOS PINS DEL ALIMENTADOR
  // --------------------------------------------------------------
  const getPinsByFeeder = async (feederId) => {
    try {
      const pins = await fetchPinsByFeeder(feederId);

      // Filtrar por Type !== 0
      const pinsFiltered = pins.filter(p => p.Type !== 0);

      setTotalPins(pinsFiltered);
      return pinsFiltered;
    } catch (err) {
      console.error("❌ Error cargando pines del feeder:", err);
      setTotalPins([]);
      return [];
    }
  };

  // --------------------------------------------------------------
  // CARGAR TODOS LOS PINS DE LA SUBESTACION
  // --------------------------------------------------------------
  const getPinsBySed = async (sedId) => {
    try {
      const pins = await fetchPinsBySed(sedId);

      // Filtrar por Type !== 0
      const pinsFiltered = pins.filter(p => p.Type !== 0);

      setTotalPins(pinsFiltered);
      return pinsFiltered;
    } catch (err) {
      console.error("❌ Error cargando pines de la SED:", err);
      setTotalPins([]);
      return [];
    }
  };

  // --------------------------------------------------------------
  // MOSTRAR SOLO LOS PINS EN LA REGION VISIBLE
  // --------------------------------------------------------------
  const getPinsByRegion = (region) => {
    if (!Array.isArray(totalPins)) return setPins([]);

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
    try {
      const gaps = await fetchGapsByFeeder(feederId);
      setGaps(gaps);
      return gaps;
    } catch (err) {
      console.error("❌ Error cargando gaps por feeder:", err);
      setGaps([]);
      return [];
    }
  };

  const getGapsBySed = async (sedId) => {
    try {
      const gaps = await fetchGapsBySed(sedId);
      setGaps(gaps);
      return gaps;
    } catch (err) {
      console.error("❌ Error cargando gaps por SED:", err);
      setGaps([]);
      return [];
    }
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
  // CENTRAR REGION POR ALIMENTADOR
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

  // --------------------------------------------------------------
  // CENTRAR REGION POR SED
  // --------------------------------------------------------------
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
    getPinsBySed,
    getPinsByRegion,
    getGapsByFeeder,
    getGapsBySed,
    setRegionByFeeder,
    setRegionBySed,
    setRegionByCoordinate
  };
};
