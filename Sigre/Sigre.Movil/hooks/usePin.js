

// hooks/usePin.js
import { useState } from "react";
import {
  getPinsByFeederLocal,
  getPinsBySedLocal,
  recalcularInspeccionadoPinesPorFeederLocal,
  recalcularInspeccionadoPinesPorSedLocal,
} from "../database/offlineDB/pins";

export const usePin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPinsByFeeder = async (feederId) => {
    setLoading(true);
    setError(null);

    try {
      // ✅ REGLA: como Pines es local, recalculamos según Deficiencias antes de devolver
      await recalcularInspeccionadoPinesPorFeederLocal(feederId);

      let data = await getPinsByFeederLocal(feederId);
      if (!Array.isArray(data)) data = [];

      const pins = data.map((p) => ({
        ...p,
        Latitude: Number(p.Latitude),
        Longitude: Number(p.Longitude),
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
      // ✅ REGLA: recalculamos antes de devolver pines de la SED
      await recalcularInspeccionadoPinesPorSedLocal(sedId);

      let data = await getPinsBySedLocal(sedId);
      if (!Array.isArray(data)) data = [];

      const pins = data.map((p) => ({
        ...p,
        Latitude: Number(p.Latitude),
        Longitude: Number(p.Longitude),
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
    error,
  };
};
