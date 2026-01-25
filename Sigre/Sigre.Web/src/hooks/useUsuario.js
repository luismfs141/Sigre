import { useCallback, useEffect, useState } from 'react';
import api from '../api/apiConfig';

export function useUsuario(autoFetch = false) {
  const [usuarios, setUsuarios] = useState([]);
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- 1. MÉTODOS DE DATOS (CRUD) ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Cargamos usuarios y perfiles en paralelo
      const [userRes, perfilRes] = await Promise.all([
        api.get('User/users'),
        api.get('User/profiles')
      ]);
      setUsuarios(userRes.data || []);
      setPerfiles(perfilRes.data || []);
    } catch (err) {
      console.error("Error cargando usuarios:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) fetchData();
  }, [fetchData, autoFetch]);

  // --- 2. NUEVA FUNCIÓN BUSCADORA (LA MEJORA) ---
// --- 2. NUEVA FUNCIÓN BUSCADORA (CORREGIDA) ---
  const getInspectorName = useCallback((idInspector) => {
    // Si no hay lista o el ID es nulo/cero
    if (!usuarios || usuarios.length === 0 || !idInspector) return "Sin Asignar";

    // BUSCAMOS EN LA LISTA DE USUARIOS
    // Ajuste clave: Usamos 'usuaInterno' (camelCase de USUA_Interno)
    // Usamos '==' para que "1" sea igual a 1
    const inspector = usuarios.find(u => u.usuaInterno == idInspector);

    if (inspector) {
        // Ajuste clave: Usamos 'usuaNombres' y 'usuaApellidos' según tu BD
        return `${inspector.usuaNombres} ${inspector.usuaApellidos}`; 
    }
    
    // Debug: Si no lo encuentra, ayuda ver qué IDs tenemos
    // console.log("Buscando ID:", idInspector, "en:", usuarios);
    
    return "Desconocido";
  }, [usuarios]);

  // --- 3. MÉTODOS DE AUTENTICACIÓN ---
  const getUsuarioLocalStorage = useCallback(() => {
    try {
      const usuario = localStorage.getItem('usuario');
      return usuario ? JSON.parse(usuario) : null;
    } catch (e) { return null; }
  }, []);

  const logoutUsuario = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  }, []);

  return {
    usuarios,
    perfiles,
    loading,
    error,
    reload: fetchData,
    getInspectorName, 
    getUsuarioLocalStorage,
    logoutUsuario
  };
}