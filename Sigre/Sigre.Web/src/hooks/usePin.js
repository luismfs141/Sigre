import { useState, useCallback } from 'react';
import api from '../api/apiConfig';

export const usePinsBySed = () => {
    const [pins, setPins] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchPinsBySed = useCallback(async (sedId) => {
        if (!sedId) return [];
        setLoading(true);
        console.group(`📡 Buscando Pines SED: ${sedId}`);

        try {
            const response = await api.get('/Pin/GetPinsBySubestacion', { params: { idSed: sedId } });
            const rawData = response.data || [];

            console.log("📥 Raw Data:", rawData[0]); // Debug

            const cleanData = rawData.map(p => ({
                id: p.Id || p.IdPoste || p.PostInterno,
                elementCode: p.groupEndlementCode || p.PostCodigo,
                label: p.label || p.Label || p.PostEtiqueta,
                
                // 🔥 MAPEO ROBUSTO (Cualquier nombre de variable funciona)
                Latitude: Number(p.Latitude ?? p.Latitud ?? p.latitude ?? p.PostLatitud ?? 0),
                Longitude: Number(p.Longitude ?? p.Longitud ?? p.longitude ?? p.PostLongitud ?? 0),
                inspeccionado: p.inspeccionado || p.Inspeccionado || false,
                status: p.status || 'pending',
                elementType: 'Poste',
                type: 5
            }))
            .filter(p => p.Latitude !== 0 && !isNaN(p.Latitude)); // Filtra invalidos

            console.log(`✅ Pines válidos: ${cleanData.length}`);
            setPins(cleanData);
            return cleanData;

        } catch (err) {
            console.error("❌ Error:", err);
            return [];
        } finally {
            setLoading(false);
            console.groupEnd();
        }
    }, []);

    return { pins, loading, fetchPinsBySed };
};