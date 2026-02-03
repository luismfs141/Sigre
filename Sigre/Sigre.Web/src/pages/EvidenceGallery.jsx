import React, { useEffect, useMemo, useState } from 'react';
import { Image } from 'primereact/image';
import { Tag } from 'primereact/tag';
import { Skeleton } from 'primereact/skeleton';
import { useFiles } from '../hooks/useFiles'; 

// Recibimos 'feeder' y 'sed' para construir rutas
export default function EvidenceGallery({ deficiency, feeder, sed }) {
    const { files, loadingFiles, loadFiles } = useFiles();

    // 1. Cargar archivos iniciales
    useEffect(() => {
        if (deficiency?.defiInterno) {
            loadFiles(deficiency.defiInterno); 
        }
    }, [deficiency, loadFiles]);

    // 2. FILTRADO SENIOR (El mismo de antes)
    const relevantFiles = useMemo(() => {
        if (!files || !deficiency) return [];
        return files.filter(file => {
            const tipoFile = String(file.ARCH_TipoElemento || file.archTipoElemento).toUpperCase();
            const tipoDefi = String(deficiency.defiTipoElemento).toUpperCase();
            
            const idFile = String(file.ARCH_IdElemento || file.archIdElemento);
            const idDefi = String(deficiency.defiIdElemento);

            const tipiFile = Number(file.TIPI_Interno || file.tipiInterno);
            const tipiDefi = Number(deficiency.tipiInterno);

            // Filtro activo (soporta "1" o 1)
            const isActive = (file.ARCH_Activo == 1 || file.archActivo == 1);

            return (tipoFile === tipoDefi) && (idFile === idDefi) && (tipiFile === tipiDefi) && isActive;
        });
    }, [files, deficiency]);

    // 3. GENERADOR DE URL (Ruta Dinámica Local)
    const getFileUrl = (fileData) => {
        const rawName = fileData.ARCH_Nombre || fileData.archNombre || "";
        const baseUrl = "http://localhost:3000/StaticFiles"; 

        // Si ya viene con ruta, úsala
        if (rawName.includes("/")) return `${baseUrl}/${rawName}`;

        // Construcción Dinámica
        try {
            let feederName = "UNK";
            if (feeder && feeder.label) feederName = feeder.label.split('-')[0].trim(); 

            const sedCode = sed ? sed.sedCodigo : "UNK";
            
            const tipoRaw = deficiency.defiTipoElemento || "POST";
            const typeMap = { 'POST': 'Poste', 'POSTE': 'Poste', 'VANO': 'Vano' };
            const typeFolder = typeMap[tipoRaw.toUpperCase()] || "Poste";

            const elementCode = deficiency.defiCodigoElemento || "UNK";

            let defectCode = "0000";
            if (deficiency.tipificacionLabel) {
                defectCode = deficiency.tipificacionLabel.split(' ')[0].trim();
            } else if (deficiency.tipiInterno) {
                defectCode = String(deficiency.tipiInterno);
            }

            return `${baseUrl}/${feederName}/${sedCode}/${typeFolder}/${elementCode}/${defectCode}/${rawName}`;

        } catch (e) {
            console.error("Error ruta:", e);
            return `${baseUrl}/${rawName}`;
        }
    };

    // 4. RENDERIZADOR INTELIGENTE (FOTO vs AUDIO)
    const renderContent = (file) => {
        const url = getFileUrl(file);
        const fileName = (file.ARCH_Nombre || file.archNombre || "").toLowerCase();
        
        // Detectar si es Audio
        const isAudio = fileName.endsWith('.m4a') || fileName.endsWith('.mp3') || fileName.endsWith('.wav') || fileName.endsWith('.ogg');

        if (isAudio) {
            return (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-2">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2 shadow-sm text-blue-600">
                        <i className="pi pi-volume-up text-xl"></i>
                    </div>
                    {/* Reproductor Nativo HTML5 */}
                    <audio controls className="w-full h-8" style={{ transform: 'scale(0.8)', transformOrigin: 'center' }}>
                        <source src={url} type="audio/mp4" />
                        <source src={url} type="audio/mpeg" />
                        Tu navegador no soporta audio.
                    </audio>
                    <span className="text-[9px] text-gray-500 mt-1 truncate max-w-full px-1">
                        {fileName.split('/').pop()}
                    </span>
                </div>
            );
        }

        // Si es Foto (Default)
        return (
            <Image 
                src={url} 
                alt="Evidencia" 
                preview 
                className="w-full h-full object-cover" 
                imageClassName="w-full h-full object-cover"
                onError={(e) => {
                    // Fallback a ruta simple si la dinámica falla
                    // const fallback = `http://localhost:3000/StaticFiles/${fileName}`;
                    // if (e.target.src !== fallback) e.target.src = fallback;
                    // else e.target.src='https://via.placeholder.com/150?text=No+Disponible';
                }}
            />
        );
    };

    // --- ESTRUCTURA PRINCIPAL ---
    if (!deficiency) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center text-gray-400">
                <i className="pi pi-image text-4xl mb-2 opacity-20"></i>
                <p className="text-xs font-semibold opacity-60">Selecciona un registro</p>
            </div>
        );
    }

    if (loadingFiles) {
        return <div className="p-4 flex gap-3"><Skeleton size="8rem" /><Skeleton size="8rem" /></div>;
    }

    if (relevantFiles.length === 0) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 bg-slate-50 border border-dashed border-gray-300 rounded">
                <i className="pi pi-folder-open text-2xl mb-1 text-orange-300"></i>
                <p className="text-xs font-bold text-gray-500">Sin archivos multimedia</p>
            </div>
        );
    }

    return (
        <div className="flex gap-4 items-center h-full p-1">
            {relevantFiles.map((file, i) => (
                <div key={i} className="relative group h-32 w-32 shrink-0 rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-white hover:shadow-md transition-all">
                    
                    {/* Renderizamos Foto o Audio según corresponda */}
                    {renderContent(file)}

                    {/* Fecha en hover (Solo visual, no interfiere con el click del audio) */}
                    <div className="absolute top-0 left-0 p-1 pointer-events-none">
                        <Tag value={file.ARCH_Fecha ? new Date(file.ARCH_Fecha).toLocaleDateString() : ''} style={{ fontSize: '9px', padding: '2px' }} severity="info"/>
                    </div>

                    <div className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow-sm pointer-events-none">
                        <i className="pi pi-check-circle text-green-500 text-xs"></i>
                    </div>
                </div>
            ))}
        </div>
    );
}