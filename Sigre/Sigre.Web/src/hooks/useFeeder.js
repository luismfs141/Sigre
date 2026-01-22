import { useState, useEffect, useCallback } from "react";
import api from "../api/apiConfig"

export function useFeeder(userId = null, options = { autoFetch: true }) {
  const [feeders, setFeeders] = useState([]);
  const [seds, setSeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. FUNCIÓN DE CARGA PRINCIPAL
  const fetchFeeders = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Cancelación de peticiones (Axios también soporta AbortController)
    const controller = new AbortController();

    try {
      // Definimos el endpoint relativo (Axios ya tiene la baseURL '.../api/')
      let endpoint = 'Feeder/GetFeeder'; 
      
      // Si hay userId, usamos el endpoint filtrado con parámetros
      // Nota: Axios permite pasar params como objeto para que sea más limpio
      const config = {
        signal: controller.signal,
        params: userId ? { idUser: userId } : {} 
      };

      // Si userId existe, cambiamos la ruta
      if (userId) {
        endpoint = 'Feeder/GetFeedersByUser';
      }

      // 👉 LLAMADA AXIOS
      const response = await api.get(endpoint, config);

      // Axios devuelve los datos directamente en .data
      setFeeders(response.data || []);

    } catch (err) {
      // Verificamos si el error fue por cancelación (navegación rápida)
      if (err.name === 'CanceledError' || err.code === "ERR_CANCELED") {
        console.log('Petición cancelada correctamente');
      } else {
        console.error("Error en useFeeder:", err);
        // Axios guarda el mensaje del backend en err.response.data
        setError(err.response?.data?.message || err.message);
        setFeeders([]);
      }
    } finally {
      // Importante: No apagar loading si el componente se desmontó (cancelado)
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }

    return () => controller.abort();
  }, [userId]);

  // 2. EFECTO DE CARGA AUTOMÁTICA
  useEffect(() => {
    let cancelRequest;
    if (options.autoFetch) {
      const promise = fetchFeeders();
      promise.then(cleanup => { cancelRequest = cleanup; });
    }
    return () => {
      if (cancelRequest) cancelRequest();
    };
  }, [fetchFeeders, options.autoFetch]);

  // 3. FUNCIONES AUXILIARES (Usando Axios)

  const fetchSedsByFeeder = useCallback(async (idFeeder) => {
    if (!idFeeder) return [];
    setLoading(true);
    try {
      // Pasamos parámetros limpios usando 'params'
      const response = await api.get('Feeder/GetSedsByFeeder', {
        params: { x_feeder: idFeeder }
      });
      
      setSeds(response.data);
      return response.data;
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const drawMap = useCallback(async (idFeeder) => {
    try {
      // POST con Axios
      // Nota: Tu backend parece recibir el ID por query param incluso en POST
      const response = await api.post(`Feeder/drawMap?idFeeder=${idFeeder}`);
      return response.data;
    } catch (err) {
      console.error("Error dibujando mapa:", err);
      throw err;
    }
  }, []);

  // 4. BÚSQUEDA LOCAL (Sigue igual, busca en memoria)
  const getFeederByIdLocal = useCallback((id) => {
    return feeders.find(f => 
      String(f.id || f.AlimInterno) === String(id)
    );
  }, [feeders]);

  return {
    feeders,
    seds,
    loading,
    error,
    reload: fetchFeeders,
    fetchSedsByFeeder,
    drawMap,
    getFeederByIdLocal
  };
}