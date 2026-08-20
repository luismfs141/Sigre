import { useState, useCallback } from 'react';
import api from '../api/apiConfig';

export const useElements = () => {
    const [loading, setLoading] = useState(false);

    // Función genérica MEJORADA para aceptar filtros dinámicos
const fetchBloque = useCallback(async (endpoint, skip, take, codigo = "", etiqueta = "", alimentadorId = null, sedId = null) => {
        setLoading(true);
        try {
            const params = {
                skip: skip,
                take: take,
                codigo: codigo,      // Se envía a C#
                etiqueta: etiqueta   // Se envía a C#
            };

            // 🔥 Añadimos los filtros jerárquicos solo si tienen un valor
            if (alimentadorId) params.alimentadorId = alimentadorId;
            if (sedId) params.sedId = sedId;

            // Axios automáticamente convertirá este objeto params en: ?skip=0&take=15&busqueda=...&alimentadorId=...
            const response = await api.get(endpoint, { params });
            return response.data; 

        } catch (err) {
            console.error(`Error en ${endpoint}:`, err);
            return { totalRecords: 0, data: [] };
        } finally {
            setLoading(false);
        }
    }, []);

    // Wrappers específicos ACTUALIZADOS
    const fetchPostesChunk = (skip, take, codigo, etiqueta, alimentadorId, sedId) => 
        fetchBloque('/Post/GetPaginado', skip, take, codigo, etiqueta, alimentadorId, sedId);
    
    const fetchVanosChunk = (skip, take, codigo, etiqueta, alimentadorId, sedId) => 
        fetchBloque('/Gap/GetPaginado', skip, take, codigo, etiqueta, alimentadorId, sedId);

    // ... (Tu código de saveElement y deleteElement se mantiene exactamente igual) ...
    // --- SAVE ---
    const saveElement = async (formData) => {
        setLoading(true);
        try {
            const isPoste = formData.tipoElemento === 'POSTE';
            const endpoint = isPoste ? '/Post/GuardarPosteWeb' : '/Gap/GuardarVanoWeb';
            const response = await api.post(endpoint, formData);
            return { success: true, data: response.data };
        } catch (err) {
        console.error("Error en saveElement:", err);

            // 2. CAPTURA DE ERROR DEL BACKEND
            // Intentamos leer la respuesta del servidor si existe
let serverMsg = "Error desconocido al guardar";

            if (err.response && err.response.data) {
                const data = err.response.data;

                // 1. Errores de Negocio (Tu 'detalleTecnico')
                if (data.detalleTecnico) {
                    serverMsg = data.detalleTecnico;
                }
                // 2. Errores de Validación (.NET 400)
                else if (data.errors) {
                    const errorKeys = Object.keys(data.errors);
                    
                    // 🔥 CORRECCIÓN:
                    // Buscamos cualquier llave que NO sea el nombre genérico del parámetro ('x_vano').
                    // Aceptamos las que empiezan con '$' (como $.VanoLatitudIni) porque ahí está el error real.
                    const specificKey = errorKeys.find(key => key !== 'x_vano') || errorKeys[0];

                    if (specificKey) {
                        // Limpiamos el nombre: quitamos "$." o "$" del inicio para que se vea limpio
                        const nombreLimpio = specificKey.replace(/^\$\.?/, '');
                        
                        // Obtenemos el mensaje de error
                        const mensajeError = data.errors[specificKey][0];

                        // Resultado: "VanoLatitudIni: The JSON value could not be converted..."
                        serverMsg = `${nombreLimpio}: ${mensajeError}`;
                    } else {
                        serverMsg = "Error de validación en los datos enviados.";
                    }
                }
                // 3. Otros mensajes
                else if (data.mensaje) {
                    serverMsg = data.mensaje;
                } else if (data.title) {
                    serverMsg = data.title;
                }
            } else if (err.message) {
                serverMsg = err.message;
            }

            return { success: false, message: serverMsg };
        

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