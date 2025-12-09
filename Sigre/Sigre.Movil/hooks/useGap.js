// hooks/useGap.js
import { useState } from "react";
import {
  getGapsByFeederLocal,
  getGapsBySedLocal,
  getVanoByIdLocal,
  saveOrUpdateVano
} from "../database/offlineDB/gaps";

export const useGap = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ------------------- GAPS POR ALIMENTADOR -------------------
  const fetchGapsByFeeder = async (feederId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getGapsByFeederLocal(feederId);
      return data;
    } catch (err) {
      console.error("❌ Error cargando gaps por feeder:", err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // ------------------- GAPS POR SUBESTACION -------------------
  const fetchGapsBySed = async (sedId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getGapsBySedLocal(sedId);
      return data;
    } catch (err) {
      console.error("❌ Error cargando gaps por SED:", err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // ------------------- GUARDAR O ACTUALIZAR VANO -------------------
  const saveVano = async (vano) => {
    setLoading(true);
    setError(null);
    try {
      const id = await saveOrUpdateVano(vano);
      return id;
    } catch (err) {
      console.error("❌ Error guardando vano:", err);
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

    // ------------------- OBTENER VANO POR VanoInterno -------------------
    const fetchVanoById = async (vanoInterno) => {
      setLoading(true);
      setError(null);
      try {
        const vano = await getVanoByIdLocal(vanoInterno);
        return vano;
      } catch (err) {
        console.error("❌ Error cargando vano por ID:", err);
        setError(err);
        return null;
      } finally {
        setLoading(false);
      }
    };

  return {
    loading,
    error,
    fetchGapsByFeeder,
    fetchGapsBySed,
    saveVano,
    fetchVanoById,
  };
};
