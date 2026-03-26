import { useState, useCallback } from 'react';
import api from '../api/apiConfig'; // Tu instancia de axios

export const useCloneDeficiency = () => {
    const [isCloning, setIsCloning] = useState(false);

    const cloneDeficiency = useCallback(async (idOriginal, nuevaTipificacion,nuevoCodigoTipi, usuarioSesion = "20",folderPath) => {
        setIsCloning(true);
        try {
            console.log(`📡 [POST] Clonando deficiencia ${idOriginal} a tipi ${nuevaTipificacion}`);
            
            // Apuntamos al nuevo controlador en C#
            const response = await api.post('/Deficiency/clone', {
                idOriginal,
                nuevaTipificacion,
                nuevoCodigoTipi,
                usuarioSesion,
                folderPath
            });

            return { success: true, data: response.data };
        } catch (err) {
            console.error("❌ Error clonando deficiencia:", err);
            // Capturamos los mensajes de error exactos que mandamos desde C# (ej. "No puede registrar SIN DEFICIENCIA")
            const errorMessage = err.response?.data?.detalle || err.response?.data?.mensaje || "Error desconocido al clonar en el servidor.";
            return { success: false, error: errorMessage };
        } finally {
            setIsCloning(false);
        }
    }, []);

    return { cloneDeficiency, isCloning };
};