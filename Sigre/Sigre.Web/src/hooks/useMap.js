import { useState, useCallback } from 'react';
import { useDatos } from "../context/DatosContext";
import api from "../api/apiConfig"; // Tu instancia de Axios
import { adaptPin, adaptGap } from "../utils/mapAdapters"; // Importamos los adaptadores

export const useMap = () => {
  const {
    setPins,
    setGaps,
    setRegion,
    totalPins,
    setTotalPins
  } = useDatos();

  const [loadingMap, setLoadingMap] = useState(false);

  // --------------------------------------------------------------
  // CARGAR DATA POR ALIMENTADOR (ONLINE)
  // --------------------------------------------------------------
  const loadFeederData = useCallback(async (feederId) => {
    setLoadingMap(true);
    try {
      // 🔥 SENIOR MOVE: Promise.all para concurrencia.
      // Hacemos las dos peticiones al mismo tiempo, no una después de otra.
      const [pinsRes, gapsRes] = await Promise.all([
        api.get('/Post/GetStructByFeeder', { params: { idFeeder: feederId } }),
        api.get('/Gap/GetByFeeder', { params: { idFeeder: feederId } })
      ]);

      // 1. Procesar Pines
      const rawPins = pinsRes.data || [];
      const cleanPins = rawPins
        .map(adaptPin) // Usamos el adaptador
        .filter(p => p.type !== 0 && !isNaN(p.Latitude) && !isNaN(p.Longitude));

      // 2. Procesar Gaps
      const rawGaps = gapsRes.data || [];
      const cleanGaps = rawGaps
        .map(adaptGap) // Usamos el adaptador
        .filter(g => !isNaN(g.lat1) && !isNaN(g.lon1));

      // 3. Actualizar Contexto Global
      setTotalPins(cleanPins); // Guardamos TODO en memoria para filtrado rápido
      setPins(cleanPins);      // Inicialmente mostramos todo (o filtrar por región luego)
      setGaps(cleanGaps);
      
      return { pins: cleanPins, gaps: cleanGaps };

    } catch (err) {
      console.error("❌ Error API Map Data:", err);
      // Opcional: toast.error("Error cargando datos del mapa");
      setTotalPins([]);
      setGaps([]);
      return { pins: [], gaps: [] };
    } finally {
      setLoadingMap(false);
    }
  }, [setTotalPins, setPins, setGaps]);

  // --------------------------------------------------------------
  // CARGAR DATA POR SED (ONLINE)
  // --------------------------------------------------------------
  const loadSedData = useCallback(async (sedId) => {
    setLoadingMap(true);
    try {
      const [pinsRes, gapsRes] = await Promise.all([
        api.get('/Post/GetStructBySed', { params: { idSed: sedId } }),
        api.get('/Gap/GetBySed', { params: { idSed: sedId } }) // Asumiendo endpoint existente
      ]);

      const cleanPins = (pinsRes.data || []).map(adaptPin).filter(p => !isNaN(p.Latitude));
      const cleanGaps = (gapsRes.data || []).map(adaptGap).filter(g => !isNaN(g.lat1));

      setTotalPins(cleanPins);
      setPins(cleanPins);
      setGaps(cleanGaps);

      return { pins: cleanPins, gaps: cleanGaps };

    } catch (err) {
      console.error("❌ Error API SED Data:", err);
      setTotalPins([]);
      setGaps([]);
      return { pins: [], gaps: [] };
    } finally {
      setLoadingMap(false);
    }
  }, [setTotalPins, setPins, setGaps]);

  // --------------------------------------------------------------
  // CLIENT-SIDE FILTERING (OPTIMIZACIÓN DE RENDIMIENTO)
  // --------------------------------------------------------------
  // Esto se mantiene igual que en tu versión offline porque es pura matemática
  // y es muy eficiente hacerlo en el cliente (navegador).
  const filterPinsByRegion = useCallback((region) => {
    if (!Array.isArray(totalPins) || totalPins.length === 0) return;

    // Si el zoom es muy lejano, ocultamos pines para mejorar FPS
    // (Ajusta 0.05 según tu necesidad de zoom en web vs móvil)
    if (region.latitudeDelta > 0.08) { 
      // Opcional: Mostrar solo SEDs o nada
      // setPins(totalPins.filter(p => p.type === 1 || p.type === 2)); 
      return; 
    }

    const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
    // Margen de seguridad (buffer) para que no desaparezcan pines en los bordes
    const buffer = 0.5; 

    const minLat = latitude - (latitudeDelta * (1 + buffer)) / 2;
    const maxLat = latitude + (latitudeDelta * (1 + buffer)) / 2;
    const minLng = longitude - (longitudeDelta * (1 + buffer)) / 2;
    const maxLng = longitude + (longitudeDelta * (1 + buffer)) / 2;

    const visiblePins = totalPins.filter(p =>
      p.Latitude >= minLat &&
      p.Latitude <= maxLat &&
      p.Longitude >= minLng &&
      p.Longitude <= maxLng
    );

    setPins(visiblePins);
  }, [totalPins, setPins]);

  // --------------------------------------------------------------
  // HELPERS DE CAMARA
  // --------------------------------------------------------------
  const setRegionByData = (dataArray) => {
    if (!dataArray || dataArray.length === 0) return;
    
    // Tomamos el primer elemento válido para centrar
    const target = dataArray[0];
    const lat = target.Latitude || target.lat1;
    const lon = target.Longitude || target.lon1;

    if (lat && lon) {
      setRegion({
        latitude: lat,
        longitude: lon,
        latitudeDelta: 0.015, // Zoom inicial cómodo
        longitudeDelta: 0.015
      });
    }
  };

  return {
    loadingMap,
    loadFeederData,
    loadSedData,
    filterPinsByRegion,
    setRegionByData
  };
};