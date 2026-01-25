import { useState, useCallback } from "react";
import api from "../api/apiConfig"; // Tu Axios configurado

export const useGap = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ------------------- GAPS POR ALIMENTADOR -------------------
  const fetchGapsByFeeder = useCallback(async (feederId) => {
    setLoading(true);
    setError(null);
    try {
      // Endpoint según tu Swagger: /Gap/GetByFeeder?idFeeder=...
      const response = await api.get('/Gap/GetByFeeder', { 
        params: { idFeeder: feederId } 
      });
      
      const data = response.data || [];
      
      // Normalizamos datos para que el mapa los entienda fácil
      return data.map(g => ({
        id: g.IdVano || g.id,
        lat1: Number(g.VanoLatitudIni),
        lon1: Number(g.VanoLongitudIni),
        lat2: Number(g.VanoLatitudFin),
        lon2: Number(g.VanoLongitudFin),
        color: '#3b82f6', // Azul por defecto
        ...g // Guardamos el resto de propiedades
      }));

    } catch (err) {
      console.error("❌ Error cargando gaps por feeder:", err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ------------------- GAPS POR SED (Opcional) -------------------
  const fetchGapsBySed = useCallback(async (sedId) => {
    setLoading(true);
    setError(null);
    try {
      // Ajusta si tu API tiene este endpoint específico
      const response = await api.get('/Gap/GetBySed', { 
        params: { idSed: sedId } 
      });
      return response.data || [];
    } catch (err) {
      console.error("❌ Error cargando gaps por SED:", err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchGapsByFeeder,
    fetchGapsBySed
  };
};