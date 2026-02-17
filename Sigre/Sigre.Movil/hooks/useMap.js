// useMap.js
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//name del proyecto 
import { useRef } from "react";
import { useDatos } from "../context/DatosContext";
import { ZOOM_THRESHOLD } from "../utils/map/mapUtils";





//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
  // MOSTRAR SOLO LOS PINS EN LA REGION VISIBLE + LOG DIFF
  // --------------------------------------------------------------
  const DEBUG_VISIBLE_PINS = true;     // <-- ponlo false cuando termines
  const DEBUG_LOG_LIMIT = 20;         // <-- cuantos IDs muestra

  const getPinKey = (p) =>
    String(
      p?.IdOriginal ??
      p?.Id ??
      p?.ElementCode ??
      `${p?.Type}-${p?.Latitude}-${p?.Longitude}`
    );

  const prevVisibleIdsRef = useRef(new Set());

  const getPinsByRegion = (region, pinsOverride = null, options = {}) => {
    const { force = false } = options;

    const basePins = Array.isArray(pinsOverride) ? pinsOverride : totalPins;

    if (!Array.isArray(basePins)) {
      if (prevVisibleIdsRef.current.size !== 0) {
        prevVisibleIdsRef.current.clear();
        setPins([]);
      }
      return;
    }

    // Si el zoom no es suficiente → no mostrar pines
    if (region.latitudeDelta > ZOOM_THRESHOLD) {
      if (prevVisibleIdsRef.current.size !== 0) {
        if (DEBUG_VISIBLE_PINS) {
          console.log(
            `[PINS][ZOOM OUT] visible->0 (prev=${prevVisibleIdsRef.current.size})`
          );
        }
        prevVisibleIdsRef.current.clear();
        setPins([]);
      }
      return;
    }

    const { latitude, longitude, latitudeDelta, longitudeDelta } = region;

    const minLat = latitude - latitudeDelta * 0.6;
    const maxLat = latitude + latitudeDelta * 0.6;
    const minLng = longitude - longitudeDelta * 0.6;
    const maxLng = longitude + longitudeDelta * 0.6;

    const visiblePins = basePins.filter(
      (p) =>
        p.Latitude >= minLat &&
        p.Latitude <= maxLat &&
        p.Longitude >= minLng &&
        p.Longitude <= maxLng
    );

    const nextIds = new Set(visiblePins.map(getPinKey));
    const prevIds = prevVisibleIdsRef.current;

    // --- diff: added / removed ---
    const added = [];
    for (const id of nextIds) if (!prevIds.has(id)) added.push(id);

    const removed = [];
    for (const id of prevIds) if (!nextIds.has(id)) removed.push(id);

    // --- si NO cambió el set y NO es force, no hacemos setPins ---
    if (!force && prevIds.size === nextIds.size) {
      let same = true;
      for (const id of nextIds) {
        if (!prevIds.has(id)) {
          same = false;
          break;
        }
      }
      if (same) return;
    }

    if (DEBUG_VISIBLE_PINS) {
      console.log(
        `[PINS][DIFF${force ? " FORCE" : ""}] visible=${nextIds.size} (+${added.length} / -${removed.length})`
      );
      if (added.length) console.log(`[PINS][ADD]`, added.slice(0, DEBUG_LOG_LIMIT));
      if (removed.length) console.log(`[PINS][REMOVE]`, removed.slice(0, DEBUG_LOG_LIMIT));
    }

    prevVisibleIdsRef.current = nextIds;
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