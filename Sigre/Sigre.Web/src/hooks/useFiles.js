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
            const response = await api.get('/File/GetByDeficiency', {
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

    // 2. ELIMINAR (POST SoftDelete)
    const deleteFile = async (archInterno) => {
        try {
            await api.post('/File/SoftDelete',null, {
                params: {
                    id: archInterno // Axios se encarga de poner ?id=...
                }
            });
            // Actualizamos la lista local filtrando el eliminado
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
            await api.post('/File/UploadFile', fileData);
            return true; // Si éxito, retornamos true
        } catch (error) {
            console.error("Error subiendo:", error);
            return false;
        }
    };

    return { files, loadingFiles, loadFiles, deleteFile, addFile };
};