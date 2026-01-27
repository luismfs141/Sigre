import { useState, useCallback } from 'react';
import api from '../api/apiConfig';

export const useDeficienciesBySed = () => {
    const [deficiencies, setDeficiencies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchBySed = useCallback(async (sedId) => {
        if (!sedId || parseInt(sedId) <= 0) {
            console.warn("ID de SED inválido");
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            console.log(`📡 [GET] Buscando SED: ${sedId}`);
            
            const response = await api.get('/Deficiency/GetBySed', {
                params: { x_sed: sedId }
            });
            
            // FILTRO IMPORTANTE: Asegúrate de guardar solo las ACTIVAS
            // Si tu BD devuelve todo, fíltralo aquí para que no aparezcan las borradas.
            const rawData = response.data || [];
            const activeData = rawData.filter(d => d.defiActivo === true); 

            console.log(`✅ Registros activos encontrados: ${activeData.length}`);
            
            setDeficiencies(activeData); 
            return activeData;

        } catch (err) {
            console.error("❌ Error al buscar por SED:", err);
            const msg = err.response?.data?.mensaje || "Error de conexión.";
            setError(msg);
            setDeficiencies([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // ---------------------------------------------------------
    // 👇 AQUÍ VA LA NUEVA FUNCIÓN DE SOFT DELETE
    // ---------------------------------------------------------
    const softDeleteDeficiency = async (defiInterno) => {
        try {
            // Llamamos al endpoint que configuramos con [FromQuery] int id
            await api.post('/Deficiency/SoftDelete', null, {
                params: {
                    id: defiInterno // Axios lo convierte en ?id=...
                }
            });

            // ACTUALIZACIÓN OPTIMISTA (UI):
            // Eliminamos el registro de la lista local inmediatamente
            setDeficiencies(prev => prev.filter(d => d.defiInterno !== defiInterno));
            
            return true; // Retornamos éxito para mostrar el Toast verde

        } catch (err) {
            console.error("❌ Error eliminando:", err);
            // Opcional: Podrías setear un error en el estado si quieres mostrarlo
            // setError("No se pudo eliminar el registro");
            return false; // Retornamos fallo para mostrar el Toast rojo
        }
    };
    // ---------------------------------------------------------

    const clearData = () => {
        setDeficiencies([]);
        setError(null);
    };


    return { 
        deficiencies, 
        loading, 
        error, 
        fetchBySed, 
        softDeleteDeficiency, 
        clearData,
        setDeficiencies // Útil si necesitas manipular la lista manualmente desde fuera
    };
};