import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../config";
import { getAllFeedersLocal } from "../database/offlineDB/feeders";

export function useFeeder(userId = null) {
  const [feeders, setFeeders] = useState([]);
  const [feedersByUser, setFeedersByUser] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_BASE = API_URL;

  /** 🔹 Obtener todos los alimentadores */
  const fetchFeeders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}Feeder/GetFeeder`);
      if (!res.ok) throw new Error("Error al obtener alimentadores");
      const data = await res.json();
      setFeeders(data);
    } catch (err) {
      console.error("useFeeder.fetchFeeders:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  /** 🔹 Obtener alimentadores por usuario */
  const getFeedersByUser = useCallback(async (id = userId) => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}Feeder/GetFeedersByUser?idUser=${id}`);
      if (!res.ok) throw new Error("Error al obtener alimentadores por usuario");
      const data = await res.json();
      setFeedersByUser(data);
    } catch (err) {
      console.error("useFeeder.getFeedersByUser:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, userId]);

  /** 🔹 Dibujar mapa por alimentador */
  const drawMap = useCallback(async (idFeeder) => {
    try {
      const res = await fetch(`${API_BASE}Feeder/drawMap?idFeeder=${idFeeder}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Error al actualizar mapa del alimentador");
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("useFeeder.drawMap:", err);
      throw err;
    }
  }, [API_BASE]);

  /** 🔹 Obtener todos los alimentadores locales*/
const fetchLocalFeeders = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);

    // Obtener todos los alimentadores desde la base local
    const localData = await getAllFeedersLocal();

    if (!localData || localData.length === 0) {
      console.warn("⚠ No hay alimentadores locales");
      setFeeders([]);
      return [];
    }

    setFeeders(localData);
    console.log("✅ Alimentadores locales cargados:", localData);
    return localData;
  } catch (err) {
    console.error("❌ Error al obtener alimentadores locales:", err);
    setError(err.message);
    return [];
  } finally {
    setLoading(false);
  }
}, []);


  /** 🔹 Cargar lista inicial (todos o por usuario) */
useEffect(() => {
  fetchLocalFeeders();
}, [fetchLocalFeeders]);

  return {
    feeders,
    feedersByUser,
    loading,
    error,
    reload: userId ? () => getFeedersByUser(userId) : fetchFeeders,
    getFeedersByUser,
    drawMap,
    fetchLocalFeeders,
  };
}