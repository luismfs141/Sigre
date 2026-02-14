import { useState, useCallback } from 'react';
import api from '../api/apiConfig';

export const useElements = () => {
    const [loading, setLoading] = useState(false);

    // Función genérica
    const fetchBloque = useCallback(async (endpoint, skip, take, busqueda = "") => {
        setLoading(true);
        try {
            const params = {
                skip: skip,
                take: take,
                busqueda: busqueda // <--- Enviamos el filtro al backend
            };

            const response = await api.get(endpoint, { params });
            // Esperamos { totalRecords: 0, data: [] }
            return response.data; 

        } catch (err) {
            console.error(`Error en ${endpoint}:`, err);
            return { totalRecords: 0, data: [] };
        } finally {
            setLoading(false);
        }
    }, []);

    // Wrappers específicos
    const fetchPostesChunk = (skip, take, busqueda) => fetchBloque('/Post/GetPaginado', skip, take, busqueda);
    const fetchVanosChunk = (skip, take, busqueda) => fetchBloque('/Gap/GetPaginado', skip, take, busqueda);

    // --- SAVE ---
    const saveElement = async (formData) => {
        setLoading(true);
        try {
            const isPoste = formData.tipoElemento === 'POSTE';
            const endpoint = isPoste ? '/Post/GuardarPosteWeb' : '/Gap/GuardarVanoWeb';
            const response = await api.post(endpoint, formData);
            return { success: true, data: response.data };
        } catch (err) {
            return { success: false, message: "Error al guardar" };
        } finally {
            setLoading(false);
        }
    };

    // --- DELETE ---
    const deleteElement = async (id, tipoElemento) => {
        try {
            const endpoint = tipoElemento === 'POSTE' ? '/Post/EliminarPosteWeb' : '/Gap/EliminarVanoWeb';
            await api.post(endpoint, { id });
            return true;
        } catch (err) {
            return false;
        }
    };

    return { 
        loading, 
        fetchPostesChunk, 
        fetchVanosChunk, 
        saveElement, 
        deleteElement 
    };
};