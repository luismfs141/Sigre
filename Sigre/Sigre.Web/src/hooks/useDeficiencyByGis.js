import { useState, useCallback } from 'react';
import api from '../api/apiConfig'; // 👈 Asegúrate que esto apunte a tu Axios

export const useDeficiencyByGis = () => {
    const [deficiencies, setDeficiencies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchByGis = useCallback(async (codigoGis) => {
        // 1. Validación
        if (!codigoGis || codigoGis.trim() === '') {
            console.warn("⚠️ [Hook] El código GIS está vacío.");
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            console.log(`📡 [GET] Buscando historial para: ${codigoGis}`);

            // 2. Petición al Backend
            const response = await api.get('/Deficiency/GetByGis', {
                params: { codigoGis: codigoGis }
            });

            const data = response.data || [];
            console.log(`✅ [SUCCESS] Registros encontrados: ${data.length}`);
            
            // 3. Actualizamos estado Y retornamos los datos
            setDeficiencies(data);
            return data; 

        } catch (err) {
            console.error("❌ [ERROR] Falló la búsqueda:", err);
            const msg = err.response?.data?.message || "Error de conexión con el servidor.";
            setError(msg);
            setDeficiencies([]);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const clearSearch = () => {
        setDeficiencies([]);
        setError(null);
    };

    return {
        deficiencies, // Historial encontrado en BD
        loading,
        error,
        fetchByGis,
        clearSearch
    };
};