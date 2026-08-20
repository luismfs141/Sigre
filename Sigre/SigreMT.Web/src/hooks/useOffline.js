import { useState, useCallback } from "react";
import api from "../api/apiConfig";

export function useOffline() {
  const [deficiencias, setDeficiencias] = useState([]);
  const [archivos, setArchivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  /* ======================================
     SUBIR SQLITE Y LEER DEFICIENCIAS + ARCHIVOS
     ====================================== */
  const loadFromSqliteFile = useCallback(async (file) => {
    if (!file) return { deficiencias: [], archivos: [] };

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/offline/upload", formData);

      const { deficiencias: defs, archivos: archs } = response.data;

      setDeficiencias(defs || []);
      setArchivos(archs || []);

      return { deficiencias: defs, archivos: archs };
    } catch (err) {
      console.error("Error leyendo SQLite:", err);
      setError(err.response?.data || err.message);
      setDeficiencias([]);
      setArchivos([]);
      return { deficiencias: [], archivos: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  /* ===============================
     SINCRONIZAR SQLITE → SERVIDOR
     =============================== */
  const syncData = useCallback(async (file) => {
    if (!file) return;

    setSyncing(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post(
        "/offline/sync",
        formData,
        {
          timeout: 0 // ⬅️ sin límite de tiempo
        }
      );

      return response.data;

    } catch (err) {
      console.error("Error sincronizando:", err);
      setError(
        err.code === "ECONNABORTED"
          ? "La sincronización está tardando demasiado"
          : err.response?.data || err.message
      );
      throw err;
    } finally {
      setSyncing(false);
    }
  }, []);


  return {
    deficiencias,
    archivos,
    loading,
    syncing,
    error,
    loadFromSqliteFile,
    syncData
  };
}
