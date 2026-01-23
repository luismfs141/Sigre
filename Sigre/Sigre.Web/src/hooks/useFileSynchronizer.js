import { useState } from 'react';
import * as FileSystem from 'expo-file-system'; // O la librería que uses para leer el archivo
import api from "../api/apiConfig"
export const useFileSynchronizer = () => {
    const [syncing, setSyncing] = useState(false);



    /**
     * Sincroniza fotos y audios:
     * 1. Elimina (Soft Delete) los que están en deletedIds
     * 2. Sube (Insert) los nuevos que no tienen ID
     */
    const syncMediaToCloud = async ({ 
        photos, 
        audios, 
        deletedIds, 
        contextData // { tabla, codTabla, idElemento, tipoElemento, tipiInterno }
    }) => {
        setSyncing(true);
        try {
            // ---------------------------------------------------------
            // 1. PROCESAR ELIMINACIONES (Soft Delete: ARCH_Activo = 0)
            // ---------------------------------------------------------
            if (deletedIds.length > 0) {
                // Opción A: Enviar un array de IDs para desactivar en lote
                await fetch(`${api}/archivos/delete-batch`, {
                    method: 'POST', // Usamos POST para enviar body
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: deletedIds.map(d => d.id) })
                });
                
                // Opción B: Si tu API es uno por uno (menos eficiente)
                // for (const item of deletedIds) { ... }
            }

            // ---------------------------------------------------------
            // 2. PROCESAR NUEVOS ARCHIVOS (Insert)
            // ---------------------------------------------------------
            const newFiles = [
                ...photos.filter(p => p !== null && !p.id), // Fotos sin ID (Nuevas)
                ...audios.filter(a => !a.id)                // Audios sin ID (Nuevos)
            ];

            for (const file of newFiles) {
                const formData = new FormData();

                // Preparar archivo para envío
                const localUri = file.uri;
                const filename = localUri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image`;

                // A) Datos del Archivo Físico
                formData.append('file', { uri: localUri, name: filename, type });

                // B) Datos para la Tabla SQL [dbo].[Archivos]
                // Mapeo según tu script SQL
                formData.append('ARCH_Tipo', file.type || '0'); // 1-6 fotos, 0 audio
                formData.append('ARCH_Tabla', contextData.tabla); // Ej: 'Deficiencias'
                formData.append('ARCH_CodTabla', contextData.codTabla); // ID Deficiencia
                formData.append('ARCH_Nombre', filename); // Nombre para guardar
                formData.append('ARCH_Latitud', file.latUtm ? String(file.latUtm) : '0');
                formData.append('ARCH_Longitud', file.lonUtm ? String(file.lonUtm) : '0');
                formData.append('ARCH_Fecha', file.fechaISO || new Date().toISOString());
                formData.append('ARCH_TipoElemento', contextData.tipoElemento); // 'POST' o 'VANO'
                formData.append('ARCH_IdElemento', contextData.idElemento);
                formData.append('TIPI_Interno', contextData.tipiInterno);
                formData.append('ARCH_Activo', '1'); // Por defecto activo

                // Enviar al servidor
                const response = await fetch(`${api}/archivos/upload`, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                if (!response.ok) throw new Error(`Error subiendo ${filename}`);
            }

            return { success: true };

        } catch (error) {
            console.error("Error en sincronización:", error);
            return { success: false, error: error.message };
        } finally {
            setSyncing(false);
        }
    };

    return { syncMediaToCloud, syncing };
};