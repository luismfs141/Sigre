
import { useState, useCallback } from 'react';
import api from '../api/apiConfig';

export const useTechnicalInfo = () => {
    const [technicalInfo, setTechnicalInfo] = useState(null);
    const [loadingInfo, setLoadingInfo] = useState(false);
    const [errorInfo, setErrorInfo] = useState(null);

    const resetInfo = useCallback(() => {
        setTechnicalInfo(null);
        setErrorInfo(null);
        setLoadingInfo(false);
    }, []);

    // AHORA SOLO RECIBE CODIGO (tipo ya no es necesario enviarlo)
    const fetchTechnicalInfo = useCallback(async (codigo) => {
        if (!codigo) return;

        setLoadingInfo(true);
        setErrorInfo(null);
        setTechnicalInfo(null);

        try {
            // Solo enviamos 'codigo'
            const response = await api.get('/Deficiency/GetInfoTecnica', {
                params: { codigo: codigo } 
            });

            setTechnicalInfo(response.data);

        } catch (err) {
            if (err.response && err.response.status === 404) {
                console.warn("Elemento no encontrado.");
                setTechnicalInfo(null);
            } else {
                console.error("Error:", err);
                setErrorInfo("Error de conexión");
            }
        } finally {
            setLoadingInfo(false);
        }
    }, []);

    return { technicalInfo, loadingInfo, fetchTechnicalInfo, resetInfo };
};