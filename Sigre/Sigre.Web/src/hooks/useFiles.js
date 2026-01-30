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
            await api.post('/File/UploadFile', fileData);
            return true; 
        } catch (error) {
            console.error("Error subiendo:", error);
            return false;
        }
    };

    // 4. ACTUALIZAR COD TABLA
    const updateCodTablaBySed = useCallback(async (codigoSed) => {
        if (!codigoSed) throw new Error('Código de SED inválido');
        try {
            const response = await api.post('/File/UpdateCodTablaBySed', null, { params: { codigoSed } });
            return response.data?.mensaje || 'Proceso finalizado correctamente';
        } catch (error) {
            console.error('Error al actualizar código de tabla:', error);
            const backendMessage = error.response?.data?.mensaje || 'Error al actualizar código de tabla';
            throw new Error(backendMessage);
        }
    }, []);

    // 5. 🆕 BUSCAR POR NOMBRE EXACTO (Para Importación Masiva)
    const getFileByExactName = useCallback(async (fileName) => {
        if (!fileName) return null;
        try {
            // Llama a tu nuevo endpoint del backend
            const response = await api.get('/File/GetByExactName', {
                params: { fileName }
            });
            return response.data; // Devuelve el objeto Archivo (Lat, Long, Fecha)
        } catch (error) {
            return null; // Si no existe, retornamos null
        }
    }, []);

    return { 
        files, 
        loadingFiles, 
        loadFiles, 
        deleteFile, 
        addFile, 
        updateCodTablaBySed,
        getFileByExactName // ✅ Exportado
    };
};