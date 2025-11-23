import { useDatos } from "../context/DatosContext";
import { getGapsByFeederLocal } from "../database/offlineDB/gaps";
import { getPinsByFeederLocal } from "../database/offlineDB/pins";

export const useMap = () => {
  const {
    selectedItem,
    setPins,
    setGaps,
    setRegion,
    totalPins,
    setTotalPins
  } = useDatos();

  // ------------------------------------------------------------------
  // CARGAR GAPS (solo offline)
  // ------------------------------------------------------------------
  const getGapsByFeeder = async (feederId) => {
    try {
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
    } catch (err) {
      console.error("❌ Error cargando gaps offline:", err);
      setGaps([]);
    }
  };

  // ------------------------------------------------------------------
  // CARGAR PINS (solo offline)
  // ------------------------------------------------------------------
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

  // ------------------------------------------------------------------
  // FILTRAR PINS VISIBLES SEGÚN REGIÓN DEL MAPA
  // ------------------------------------------------------------------
  const getPinsByRegion = (region) => {
    if (!Array.isArray(totalPins)) return setPins([]);
    setPins(totalPins); // Muestra todos los pines
  };

  // ------------------------------------------------------------------
  // UBICAR MAPA EN UNA COORDENADA
  // ------------------------------------------------------------------
  const setRegionByCoordinate = (latitude, longitude, delta = 0.005) => {
    setRegion({
      latitude,
      longitude,
      latitudeDelta: delta,
      longitudeDelta: delta
    });
  };

  // ------------------------------------------------------------------
  // UBICAR MAPA EN EL CENTRO DE UN ALIMENTADOR
  // ------------------------------------------------------------------
  const setRegionByFeeder = (pinsArray, gapsArray) => {
    if ((!pinsArray || pinsArray.length === 0) && (!gapsArray || gapsArray.length === 0)) return;

    const latitudes = [];
    const longitudes = [];

    pinsArray.forEach(p => {
      if (p.Latitude && p.Longitude) {
        latitudes.push(p.Latitude);
        longitudes.push(p.Longitude);
      }
    });

    gapsArray.forEach(g => {
      if (g.VanoLatitudIni && g.VanoLongitudIni) {
        latitudes.push(g.VanoLatitudIni, g.VanoLatitudFin);
        longitudes.push(g.VanoLongitudIni, g.VanoLongitudFin);
      }
    });

    if (latitudes.length === 0 || longitudes.length === 0) return;

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Calcular delta para abarcar todos los elementos
    const deltaLat = (maxLat - minLat) * 1.5 || 0.01; // un poco de margen
    const deltaLng = (maxLng - minLng) * 1.5 || 0.01;

    setRegion({
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: deltaLat,
      longitudeDelta: deltaLng
    });
  };

  return {
    getGapsByFeeder,
    getPinsByFeeder,
    getPinsByRegion,
    setRegionByCoordinate,
    setRegionByFeeder
  };
};