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
// 🔥 2. BÚSQUEDA MANUAL ESTRICTA
    const searchExactCode = async (codigo, alimentadorId, sedId) => {
        try {
            const query = codigo.trim().toLowerCase();
            
            // Pedimos unos 15 registros por si el backend devuelve coincidencias parciales (LIKE)
            const [responsePostes, responseVanos] = await Promise.all([
                fetchPostesChunk(0, 15, query, alimentadorId, sedId),
                fetchVanosChunk(0, 15, query, alimentadorId, sedId)
            ]);

            // 🚀 FILTRO ESTRICTO: Buscamos coincidencia exacta (===) en el código GIS
            if (responsePostes?.data) {
                const exactPoste = responsePostes.data.find(p => 
                    (p.postCodigoNodo || '').toLowerCase() === query
                );
                if (exactPoste) return { ...exactPoste, _tipo: 'POSTE' };
            }

            if (responseVanos?.data) {
                const exactVano = responseVanos.data.find(v => 
                    (v.vanoCodigo || '').toLowerCase() === query
                );
                if (exactVano) return { ...exactVano, _tipo: 'VANO' };
            }
            
            return null; // Si ninguno coincide exactamente, es libre/nuevo
        } catch (error) {
            console.error("Error buscando código exacto:", error);
            return null;
        }
    };

    // 🔥 3. VALIDACIÓN GLOBAL ESTRICTA (Sin filtros de SED/Alimentador)
    const validateGisGlobal = async (codigoFormateado) => {
        try {
            const query = codigoFormateado.trim().toLowerCase();
            const [responsePostes, responseVanos] = await Promise.all([
                fetchPostesChunk(0, 15, query),
                fetchVanosChunk(0, 15, query)
            ]);

            // 🚀 VALIDACIÓN ESTRICTA: El código exacto (===) debe existir
            const existePoste = responsePostes?.data?.some(p => 
                (p.postCodigoNodo || '').toLowerCase() === query
            );
            const existeVano = responseVanos?.data?.some(v => 
                (v.vanoCodigo || '').toLowerCase() === query
            );

            return existePoste || existeVano; 
        } catch (error) {
            console.error("Error validando GIS global:", error);
            return false; 
        }
    };

    return { suggestions, searchNode, setSuggestions, searchExactCode, validateGisGlobal };
};