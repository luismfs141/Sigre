import { useCallback, useEffect, useState } from 'react';
import { API_URL } from "../config";

export function useUser() {
  const [usuarios, setUsuarios] = useState([]);
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = API_URL;

  /** 🔹 Cargar usuarios y perfiles */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [usuariosRes, perfilesRes] = await Promise.all([
        fetch(`${API_BASE}User/users`),
        fetch(`${API_BASE}User/profiles`)
      ]);

      if (!usuariosRes.ok || !perfilesRes.ok) {
        throw new Error('Error al obtener datos del servidor');
      }

      const usuariosData = await usuariosRes.json();
      const perfilesData = await perfilesRes.json();

      setUsuarios(usuariosData);
      setPerfiles(perfilesData);
    } catch (err) {
      console.error('Error en useUser:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** 🔹 Guardar usuario (crear o editar) */
  const saveUser = useCallback(async (usuario) => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`${API_BASE}User/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(usuario),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al guardar usuario");
      }

      const data = await response.json();

      // ✅ Recargar lista de usuarios
      await fetchData();

      return data;
    } catch (err) {
      console.error("Error al guardar usuario:", err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [API_BASE, fetchData]);


  const saveUserFeeders = useCallback(async (userId, feeders) => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`${API_BASE}User/savefeeders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuarioId: userId,
          alimentadores: feeders,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Error al guardar alimentadores");
      }

      const data = await response.json();

      return data;
    } catch (err) {
      console.error("useUserFeeders.saveUserFeeders:", err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [API_BASE]);

  return {
    usuarios,
    perfiles,
    loading,
    saving,
    error,
    reload: fetchData,
    saveUser,
    saveUserFeeders,
  };
}