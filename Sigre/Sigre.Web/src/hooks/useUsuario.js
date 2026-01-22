import { useCallback, useEffect, useState } from 'react';
import api from '../api/apiConfig';

export function useUsuario(autoFetch = false) {
  const [usuarios, setUsuarios] = useState([]);
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // --- 1. MÉTODOS DE AUTENTICACIÓN (LO QUE TE FALTA) ---
  
  // ✅ ESTA ES LA FUNCIÓN QUE TE DABA ERROR. TIENE QUE ESTAR AQUÍ.
  const getUsuarioLocalStorage = useCallback(() => {
    try {
      const usuario = localStorage.getItem('usuario');
      return usuario ? JSON.parse(usuario) : null;
    } catch (e) {
      console.error("Error al leer usuario", e);
      return null;
    }
  }, []);

  const logoutUsuario = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  }, []);

  // --- 2. MÉTODOS DE DATOS (CRUD) ---

  const fetchData = useCallback(async () => {
    setLoading(true);
    const controller = new AbortController();
    try {
      const [userRes, perfilRes] = await Promise.all([
        api.get('User/users', { signal: controller.signal }),
        api.get('User/profiles', { signal: controller.signal })
      ]);
      setUsuarios(userRes.data);
      setPerfiles(perfilRes.data);
    } catch (err) {
      if (err.name !== 'CanceledError') {
        setError(err.message);
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (autoFetch) fetchData();
  }, [fetchData, autoFetch]);

  // --- 3. RETORNO (EL OBJETO FINAL) ---
  return {
    usuarios,
    perfiles,
    loading,
    error,
    reload: fetchData,
    
    // 👇 ¡IMPORTANTE! TIENES QUE EXPORTAR LA FUNCIÓN AQUÍ
    getUsuarioLocalStorage, 
    logoutUsuario
  };
}