import { useState, useCallback } from 'react';
import api from '../api/apiConfig';

export const useGapsBySed = () => {
    const [gaps, setGaps] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchGapsBySed = useCallback(async (sedId) => {
        if (!sedId) return [];
        setLoading(true);

        console.group(`📏 [DEBUG GAPS] Buscando para SED: ${sedId}`);

        try {
            // Asegúrate de que la URL coincida con tu GapController
            const response = await api.get('/Gap/GetGapsBySubestacion', { 
                params: { idSed: sedId } 
            });
            
            const rawData = response.data || [];
            
            const cleanGaps = rawData.map(g => ({
                id: g.Id || g.id,
                code: g.Code || g.code,
                
                // 🔥 Leemos las nuevas propiedades que creamos en el C#
                // Usamos mayúsculas o minúsculas por seguridad
                lat1: Number(g.Lat1 ?? g.lat1 ?? 0),
                lon1: Number(g.Lon1 ?? g.lon1 ?? 0),
                lat2: Number(g.Lat2 ?? g.lat2 ?? 0),
                lon2: Number(g.Lon2 ?? g.lon2 ?? 0),
                
                inspeccionado: g.inspeccionado === true || g.Inspeccionado === true,
            }))
            // Filtramos solo si tienen coordenadas válidas
            .filter(g => {
                const valido = g.lat1 !== 0 && g.lat2 !== 0;
                if (!valido) console.warn("⚠️ Vano descartado (coords = 0):", g.code);
                return valido;
            });

            console.log(`✅ VANOS VÁLIDOS PARA DIBUJAR: ${cleanGaps.length}`);
            setGaps(cleanGaps);
            return cleanGaps;

        } catch (err) {
            console.error("❌ ERROR GAPS:", err);
            return [];
        } finally {
            setLoading(false);
            console.groupEnd();
        }
    }, []);

    return { gaps, loading, fetchGapsBySed };
};