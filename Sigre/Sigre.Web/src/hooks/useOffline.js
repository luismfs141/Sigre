import { useState, useCallback } from "react";
import api from "../api/apiConfig";

export function useOffline() {
  const [deficiencias, setDeficiencias] = useState([]);
  const [archivos, setArchivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ======================================
     SUBIR SQLITE Y LEER DEFICIENCIAS + ARCHIVOS
     ====================================== */
  const loadFromSqliteFile = useCallback(async (file) => {
    if (!file) return { deficiencias: [], archivos: [] };

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file); // 🔑 debe llamarse igual que en el controller

    try {
      const response = await api.post("/offline/upload", formData);

      // El backend devuelve: { deficiencias: [...], archivos: [...] }
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

  return {
    deficiencias,
    archivos,
    loading,
    error,
    loadFromSqliteFile
  };
}
