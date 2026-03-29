import { useState, useCallback } from 'react';
import api from '../api/apiConfig';

export const useFiles = () => {
    const [files, setFiles] = useState([]);
    const [loadingFiles, setLoadingFiles] = useState(false);

    // 1. CARGAR (GET)
    const loadFiles = useCallback(async (defiInterno) => {
        if (!defiInterno) return;
        setLoadingFiles(true);
        try {
            const response = await api.get('/File/GetByDeficiencyWeb', {
                params: { x_deficiency: defiInterno }
            });
            setFiles(response.data);
        } catch (error) {
            console.error("Error cargando fotos:", error);
            setFiles([]);
        } finally {
            setLoadingFiles(false);
        }
    }, []);

    // 1.5 NUEVO: CARGAR DIRECTO (Para bucles e Importación Masiva)
    // No usa setLoadingFiles ni setFiles para no trabar la interfaz
    const fetchFilesData = useCallback(async (defiInterno) => {
        if (!defiInterno) return [];
        try {
            const response = await api.get('/File/GetByDeficiencyWeb', {
                params: { x_deficiency: defiInterno }
            });
            return response.data || []; // Retorna la data directamente
        } catch (error) {
            console.error(`Error obteniendo archivos directos (Def: ${defiInterno}):`, error);
            return []; // Retorna un array vacío en caso de error para que no rompa el for
        }
    }, []);

    // 2. ELIMINAR (POST SoftDelete)
    const deleteFile = async (archInterno) => {
        try {
            await api.post('/File/SoftDelete', null, {
                params: { id: archInterno }
            });
            setFiles(prev => prev.filter(f => f.archInterno !== archInterno));
            return true;
        } catch (error) {
            console.error("Error eliminando:", error);
            return false;
        }
    };

    // 3. AGREGAR (POST UploadFile)
    const addFile = async (fileData) => {
        try {
            await api.post('/File/UploadFileInWeb', fileData);
            return true; 
        } catch (error) {
            console.error("Error subiendo:", error);
            return false;
        }
    };
    const moveFilePhysical = useCallback(async (oldPath, newPath) => {
        if (!oldPath || !newPath) return false;
        
        try {
            console.log(`📡 [POST] Moviendo archivo en servidor: ${oldPath} -> ${newPath}`);
            // Axios ya usa tu baseURL, así que solo pones la ruta final
            await api.post('/File/move', { 
                oldPath, 
                newPath 
            });
            return true; // Éxito
        } catch (err) {
            console.error("❌ Error moviendo archivo físico:", err);
            return false; // Falló (ya sea por red, disco H vs D, etc.)
        }
    }, []);

    const overwritePhysicalImage = async (archInterno, fileToUpload) => {
        try {
            const formData = new FormData();
            formData.append('archInterno', archInterno);
            formData.append('file', fileToUpload);

            const response = await api.post('/File/OverwritePhysicalImage', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // Retornamos éxito y el mensaje del Backend
            return { success: true, message: response.data.message };
        } catch (error) {
            console.error("Error sobrescribiendo imagen:", error);
            
            // Extraemos el mensaje exacto que C# nos mandó en el StatusCode(500, ...)
            const errorMsg = error.response?.data?.message || "Error desconocido al conectar con el servidor.";
            
            return { success: false, message: errorMsg };
        }
    };



    return { 
        files, 
        loadingFiles, 
        loadFiles, 
        deleteFile, 
        addFile, 
        fetchFilesData,
        moveFilePhysical,
        overwritePhysicalImage
    };
};