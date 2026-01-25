import { useState, useCallback } from "react";
import api from "../api/apiConfig";

export const usePin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ------------------- PINES (POSTES) POR ALIMENTADOR -------------------
  const fetchPinsByFeeder = useCallback(async (feederId) => {
    setLoading(true);
    setError(null);
    try {
      // Endpoint según tu Swagger: /Post/GetStructByFeeder?idFeeder=...
      const response = await api.get('/Post/GetStructByFeeder', { 
        params: { idFeeder: feederId } 
      });

      const data = response.data || [];

      // Mapeo para Leaflet (latitude, longitude)
      return data.map(p => ({
        id: p.IdPoste || p.id,
        elementCode: p.PostCodigo || p.codigo,
        Latitude: Number(p.Latitud || p.latitude),
        Longitude: Number(p.Longitud || p.longitude),
        status: p.Estado || 'pending',
        elementType: 'Poste',
        ...p
      }));

    } catch (err) {
      console.error("❌ Error cargando pines por feeder:", err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ------------------- PINES POR SED -------------------
  const fetchPinsBySed = useCallback(async (sedId) => {
    setLoading(true);
    setError(null);
    try {
      // Ajusta endpoint si existe /Post/GetBySed o similar
      const response = await api.get('/Post/GetStructBySed', { 
        params: { idSed: sedId } 
      });

      const data = response.data || [];

      return data.map(p => ({
        id: p.IdPoste,
        Latitude: Number(p.Latitud),
        Longitude: Number(p.Longitud),
        ...p
      }));
    } catch (err) {
      console.error("❌ Error cargando pines por SED:", err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchPinsByFeeder,
    fetchPinsBySed
  };
};