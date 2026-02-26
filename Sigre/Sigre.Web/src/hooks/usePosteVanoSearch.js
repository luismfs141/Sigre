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
// 🔥 2. NUEVA FUNCIÓN PARA BÚSQUEDA MANUAL DEL CÓDIGO PRINCIPAL
    const searchExactCode = async (codigo, alimentadorId, sedId) => {
        try {
            const query = codigo.trim().toLowerCase();
            const [responsePostes, responseVanos] = await Promise.all([
                fetchPostesChunk(0, 1, query, alimentadorId, sedId),
                fetchVanosChunk(0, 1, query, alimentadorId, sedId)
            ]);

            if (responsePostes?.data?.length > 0) return { ...responsePostes.data[0], _tipo: 'POSTE' };
            if (responseVanos?.data?.length > 0) return { ...responseVanos.data[0], _tipo: 'VANO' };
            
            return null; // Si no hay nada, retorna null
        } catch (error) {
            console.error("Error buscando código exacto:", error);
            return null;
        }
    };

    const validateGisGlobal = async (codigoFormateado) => {
        try {
            const query = codigoFormateado.toLowerCase();
            const [responsePostes, responseVanos] = await Promise.all([
                fetchPostesChunk(0, 1, query), // Búsqueda sin filtros de SED/Alimentador
                fetchVanosChunk(0, 1, query)
            ]);

            // Verificamos si hubo alguna coincidencia exacta
            const existePoste = responsePostes?.data?.some(p => p.postCodigoNodo.toLowerCase() === query);
            const existeVano = responseVanos?.data?.some(v => v.vanoCodigo.toLowerCase() === query);

            return existePoste || existeVano; // Retorna true si ya existe
        } catch (error) {
            console.error("Error validando GIS global:", error);
            return false; // Ante la duda, asume falso para no bloquear, o maneja el error
        }
    };

    return { suggestions, searchNode, setSuggestions, searchExactCode, validateGisGlobal };
};