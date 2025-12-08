// hooks/usePin.js
import { useState } from "react";
import { getPinsByFeederLocal, getPinsBySedLocal } from "../database/offlineDB/pins";

export const usePin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPinsByFeeder = async (feederId) => {
    setLoading(true);
    setError(null);
    try {
      let data = await getPinsByFeederLocal(feederId);
      if (!Array.isArray(data)) data = [];

      // convertir coordenadas
      const pins = data.map(p => ({
        ...p,
        Latitude: Number(p.Latitude),
        Longitude: Number(p.Longitude)
      }));

      return pins;
    } catch (err) {
      console.error("❌ Error cargando pines por feeder:", err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchPinsBySed = async (sedId) => {
    setLoading(true);
    setError(null);
    try {
      let data = await getPinsBySedLocal(sedId);
      if (!Array.isArray(data)) data = [];

      // convertir coordenadas
      const pins = data.map(p => ({
        ...p,
        Latitude: Number(p.Latitude),
        Longitude: Number(p.Longitude)
      }));

      return pins;
    } catch (err) {
      console.error("❌ Error cargando pines por SED:", err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchPinsByFeeder,
    fetchPinsBySed,
    loading,
    error
  };
};
