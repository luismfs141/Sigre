import { useState, useCallback } from "react";
import api from "../api/apiConfig";

export function useOffline() {
  const [deficiencias, setDeficiencias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ======================================
     SUBIR SQLITE Y LEER DEFICIENCIAS
     ====================================== */
  const loadFromSqliteFile = useCallback(async (file) => {
    if (!file) return [];

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file); // 🔑 debe llamarse igual que en el controller

    try {
      const response = await api.post(
        "/offline/upload", // 🔑 RUTA CORRECTA
        formData
      );
      console.log(response.data);
      setDeficiencias(response.data || []);
      return response.data;

    } catch (err) {
      console.error("Error leyendo SQLite:", err);
      setError(err.response?.data || err.message);
      setDeficiencias([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    deficiencias,
    loading,
    error,
    loadFromSqliteFile
  };
}
