import { useState, useRef, useCallback } from 'react';

export const usePosteVanoSearch = (fetchPostesChunk, fetchVanosChunk) => {
    const [suggestions, setSuggestions] = useState([]);
    const debounceTimer = useRef(null);

    // 🔥 1. AÑADIMOS LOS PARÁMETROS AQUÍ
    const searchNode = useCallback((queryTexto, alimentadorId, sedId) => {
        if (!queryTexto) {
            setSuggestions([]);
            return;
        }

        const query = queryTexto.toLowerCase();

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(async () => {
            try {
                // 🔥 2. SE LOS PASAMOS DIRECTO AL BACKEND
                const [responsePostes, responseVanos] = await Promise.all([
                    fetchPostesChunk(0, 15, query, alimentadorId, sedId),
                    fetchVanosChunk(0, 15, query, alimentadorId, sedId)
                ]);
                
                const resultados = [];

                if (responsePostes?.data) {
                    resultados.push(...responsePostes.data.map(p => ({
                        ...p,
                        _tipo: 'POSTE',
                        codigo: p.postCodigoNodo, 
                        label: p.postEtiqueta || 'S/N',
                        lat: p.postLatitud,
                        lng: p.postLongitud
                    })));
                }

                if (responseVanos?.data) {
                    resultados.push(...responseVanos.data.map(v => ({
                        ...v,
                        _tipo: 'VANO',
                        codigo: v.vanoCodigo, 
                        label: v.vanoEtiqueta || 'S/N',
                        lat: v.vanoLatitudIni,
                        lng: v.vanoLongitudIni
                    })));
                } 

                setSuggestions(resultados);
            } catch (error) {
                console.error("Error al buscar elementos de red:", error);
                setSuggestions([]); 
            }
        }, 500);
    }, [fetchPostesChunk, fetchVanosChunk]);

    return { suggestions, searchNode, setSuggestions };
};