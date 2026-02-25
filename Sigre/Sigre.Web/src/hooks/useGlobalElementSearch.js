import { useState, useRef, useCallback } from 'react';

// 🔥 CORRECCIÓN AQUÍ: Los parámetros ahora se llaman igual que las funciones de adentro
export const useGlobalElementSearch = (fetchPostesChunk, fetchVanosChunk) => {
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false); 
    const debounceTimer = useRef(null);

    const searchNode = useCallback((queryTexto) => {
        // REGLA DE RENDIMIENTO: No buscar si está vacío o tiene menos de 3 letras
        if (!queryTexto || queryTexto.length < 3) {
            setSuggestions([]);
            setIsSearching(false);
            return;
        }

        const query = queryTexto.toLowerCase();

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        // VELOCIDAD: Bajamos de 500ms a 300ms
        debounceTimer.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                // Ahora sí coinciden los nombres perfectamente
                const [responsePostes, responseVanos] = await Promise.all([
                    fetchPostesChunk(0, 15, query, null, null), 
                    fetchVanosChunk(0, 15, query, null, null)
                ]);
                
                const resultados = [];

                if (responsePostes?.data) {
                    resultados.push(...responsePostes.data.map(p => ({
                        ...p,
                        _tipo: 'POST',
                        codigo: p.postCodigoNodo, 
                        label: p.postEtiqueta || 'S/N',
                        lat: p.postLatitud,
                        lng: p.postLongitud,
                        alimentadorId: p.alimInterno,
                        sedId: p.postSubestacion,
                    })));
                }

                if (responseVanos?.data) {
                    resultados.push(...responseVanos.data.map(v => ({
                        ...v,
                        _tipo: 'VANO',
                        codigo: v.vanoCodigo, 
                        label: v.vanoEtiqueta || 'S/N',
                        lat: v.vanoLatitudIni,
                        lng: v.vanoLongitudIni,
                        alimentadorId: v.alimInterno, 
                        sedId: v.vanoSubestacion
                        
                    })));
                } 

                resultados.sort((a, b) => a.codigo.localeCompare(b.codigo));

                setSuggestions(resultados);
            } catch (error) {
                console.error("Error en búsqueda global:", error);
                setSuggestions([]); 
            } finally {
                setIsSearching(false);
            }
        }, 300);
    }, [fetchPostesChunk, fetchVanosChunk]);

    return { suggestions, searchNode, setSuggestions, isSearching };
};