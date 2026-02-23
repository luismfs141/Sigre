import { useState, useCallback } from 'react';

export const useNodeSearch = (fetchPostesChunk, seds = []) => {
    const [suggestions, setSuggestions] = useState([]);

    // Extraemos los parámetros del event y formData para hacer la función pura
    const searchNode = useCallback(async (queryTexto, alimentadorId, sedId) => {
        if (!queryTexto) {
            setSuggestions([]);
            return;
        }

        const query = queryTexto.toLowerCase();

        // 1. Buscar Postes (Backend)
        const postesPromise = fetchPostesChunk(0, 15, query, alimentadorId, sedId);
        
        // 2. Buscar SEDs (Local)
        const sedsFiltradas = seds.filter(sed => {
            const labelStr = (sed.label || "").toLowerCase();
            const codigoStr = (sed.sedCodigo || "").toLowerCase(); 
            const internoStr = String(sed.sedInterno || "");
            
            return labelStr.includes(query) || codigoStr.includes(query) || internoStr.includes(query);
        }).map(sed => ({
            ...sed, 
            _tipo: 'SED', 
            postCodigoNodo: sed.label, 
            postEtiqueta: 'SUBESTACIÓN', 
            postLatitud: sed.sedLatitud || sed.latitud || 0,
            postLongitud: sed.sedLongitud || sed.longitud || 0
        }));

        try {
            // 3. Ejecutar y Combinar
            const resPostes = await postesPromise;
            const postesNormalizados = (resPostes.data || []).map(p => ({ ...p, _tipo: 'POSTE' }));

            setSuggestions([...sedsFiltradas, ...postesNormalizados]);
        } catch (error) {
            console.error("Error al buscar nodos unificados:", error);
            // Fallback: Si falla el backend de postes, al menos mostramos las SEDs locales
            setSuggestions(sedsFiltradas); 
        }
    }, [fetchPostesChunk, seds]);

    // Exponemos el estado y la función
    return { suggestions, searchNode, setSuggestions };
};