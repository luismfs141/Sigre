import { useCallback } from 'react';
import api from './../api/apiConfig'; 

export const useTramosMap = () => {
    const fetchTramosDictionary = useCallback(async (sedId) => {
        if (!sedId) return {};

        try {
            const response = await api.get('/Feeder/GetTramosPorSed', { params: { sedId } });
            const listaTramos = response.data || [];

            const map = {};
            
            listaTramos.forEach(item => {
                // Validación por si acaso llega algo corrupto
                if(!item.tipo || !item.idElemento) return; 

                const tipoNormalized = String(item.tipo).toUpperCase().startsWith('POST') ? 'POSTE' : 'VANO';
                const key = `${tipoNormalized}_${item.idElemento}`;
                
                map[key] = {
                    // Mapeamos los nombres exactos que enviará tu nuevo DTO en C#
                    orden: item.tramOrden || 0,
                    circuito: item.tramCodigo || ''
                };
            });

            return map;

        } catch (error) {
            console.error("Error sincronizando tramos para el PDF:", error);
            return {}; 
        }
    }, []);

    return { fetchTramosDictionary };
};