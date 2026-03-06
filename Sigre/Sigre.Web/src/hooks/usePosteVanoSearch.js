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
    // 🔥 CORRECCIÓN 1: Agregamos 'etiqueta' a los parámetros
const searchExactCode = async (codigo, etiqueta, alimentadorId, sedId) => {
    try {
        const queryCodigo = String(codigo || '').trim().toLowerCase();
        const queryEtiqueta = String(etiqueta || '').trim().toLowerCase();
        
        // 🔥 CORRECCIÓN 2: Pasamos queryCodigo y queryEtiqueta en el orden correcto a tus fetch
        const [responsePostes, responseVanos] = await Promise.all([
            fetchPostesChunk(0, 15, queryCodigo, queryEtiqueta, alimentadorId, sedId),
            fetchVanosChunk(0, 15, queryCodigo, queryEtiqueta, alimentadorId, sedId)
        ]);

        // 🚀 FILTRO ESTRICTO: Buscamos coincidencia exacta en el código GIS O en la etiqueta
        if (responsePostes?.data) {
            const exactPoste = responsePostes.data.find(p => {
                const matchCodigo = queryCodigo && (p.postCodigoNodo || '').toLowerCase() === queryCodigo;
                const matchEtiqueta = queryEtiqueta && (p.postEtiqueta || '').toLowerCase() === queryEtiqueta;
                return matchCodigo || matchEtiqueta; // Si coincide uno u otro, ¡lo encontramos!
            });
            if (exactPoste) return { ...exactPoste, _tipo: 'POSTE' };
        }

        // 🔥 CORRECCIÓN 3: Aplicamos la misma lógica para los VANOS
        if (responseVanos?.data) {
            const exactVano = responseVanos.data.find(v => {
                const matchCodigo = queryCodigo && (v.vanoCodigo || '').toLowerCase() === queryCodigo;
                // Asumo que tu campo en vanos se llama vanoEtiqueta, ajústalo si es distinto
                const matchEtiqueta = queryEtiqueta && (v.vanoEtiqueta || '').toLowerCase() === queryEtiqueta; 
                return matchCodigo || matchEtiqueta;
            });
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