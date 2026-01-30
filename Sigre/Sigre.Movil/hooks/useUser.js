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

      // ✅ Construir request como lo espera el backend (UsuarioRequest)
      const perfilIdNum = Number(usuario?.perfilId);

      const requestBody = {
        UsuaInterno: Number(usuario?.usuaInterno ?? 0),
        UsuaNombres: String(usuario?.usuaNombres ?? ""),
        UsuaApellidos: String(usuario?.usuaApellidos ?? ""),
        UsuaCorreo: String(usuario?.usuaCorreo ?? ""),
        UsuaActivo: usuario?.usuaActivo !== false,

        // 👇 Backend espera List<int>
        Perfiles: Number.isFinite(perfilIdNum) && perfilIdNum > 0 ? [perfilIdNum] : [],
      };

      // ✅ Solo enviar password si el usuario escribió algo
      const pwd = String(usuario?.usuaPassword ?? "").trim();
      if (pwd.length > 0) {
        requestBody.UsuaPassword = pwd;
      }

      const response = await fetch(`${API_BASE}User/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let msg = "Error al guardar usuario";
        try {
          const errorData = await response.json();
          msg = errorData?.message || msg;
        } catch { }

        setError(msg);
        return { ok: false, status: response.status, message: msg };
      }

      const data = await response.json();
      await fetchData();
      return { ok: true, data };



    } catch (err) {
      // ✅ Esto es un error controlado (mensaje para el usuario), no queremos LogBox en dev
      if (__DEV__) console.log("saveUser (controlado):", err?.message);

      setError(err?.message || "Error al guardar usuario");
      throw err; // ✅ lo sigues lanzando para que tu UI muestre el Alert
    }
    finally {
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


  const setUserActive = useCallback(async (usuarioId, activo) => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`${API_BASE}User/setactive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ usuarioId, activo }),
      });

      if (!response.ok) {
        let msg = "Error al actualizar estado";
        try {
          const err = await response.json();
          msg = err?.message || msg;
        } catch { }
        throw new Error(msg);
      }

      const data = await response.json();

      // ✅ refresca lista (y si el server ya ordena activos primero, lo verás tal cual)
      await fetchData();

      return data;
    } catch (err) {
      console.error("useUser.setUserActive:", err);
      setError(err?.message || "Error al actualizar estado");
      throw err;
    } finally {
      setSaving(false);
    }
  }, [API_BASE, fetchData]);





  return {
    usuarios,
    perfiles,
    loading,
    saving,
    error,
    reload: fetchData,
    saveUser,
    saveUserFeeders,
    setUserActive,
  };
}