import { useCallback } from 'react';
import api from '../../api/apiConfig'; // Ajusta la ruta si es necesario

export const useTramosMap = () => {

    const fetchTramosDictionary = useCallback(async (sedId) => {
        if (!sedId) return {};

        try {
            // Llamamos a tu nuevo endpoint limpio y rápido
            // (Ajusta la ruta '/Feeder/GetTramosPorSed' según el nombre real de tu controlador)
            const response = await api.get('/Feeder/GetTramosPorSed', { params: { sedId } });
            const listaTramos = response.data || [];

            // Convertimos la lista plana en un Diccionario para búsquedas instantáneas (O(1))
            const map = {};
            
            listaTramos.forEach(item => {
                // Estandarizamos el tipo ('POST' o 'POSTE') para evitar errores
                const tipoNormalized = item.tipo.toUpperCase().startsWith('POST') ? 'POSTE' : 'VANO';
                
                // Creamos una llave única: "POSTE_25" o "VANO_10"
                const key = `${tipoNormalized}_${item.idElemento}`;
                
                map[key] = {
                    orden: item.orden || 0,
                    circuito: item.circuito || ''
                };
            });

            return map;

        } catch (error) {
            console.error("Error sincronizando tramos para el PDF:", error);
            return {}; // Devolvemos un objeto vacío para no romper el PDF si hay error
        }
    }, []);

    return { fetchTramosDictionary };
};