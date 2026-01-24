import { useState, useCallback } from 'react';
import api from '../api/apiConfig';

export const useDeficienciesBySed = () => {
    const [deficiencies, setDeficiencies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchBySed = useCallback(async (sedId) => {
        // Validación: debe ser un número positivo
        if (!sedId || parseInt(sedId) <= 0) {
            console.warn("ID de SED inválido");
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            console.log(`📡 [GET] Buscando SED: ${sedId}`);
            
            // Llamada al endpoint GET que creamos
            const response = await api.get('/Deficiency/GetBySed', {
                params: { x_sed: sedId }
            });
            
            const data = response.data || [];
            console.log(`✅ Registros encontrados: ${data.length}`);
            
            setDeficiencies(data);
            return data;

        } catch (err) {
            console.error("❌ Error al buscar por SED:", err);
            const msg = err.response?.data?.mensaje || "Error de conexión.";
            setError(msg);
            setDeficiencies([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Función para limpiar la tabla si lo necesitas
    const clearData = () => {
        setDeficiencies([]);
        setError(null);
    };

    return { deficiencies, loading, error, fetchBySed, clearData };
};