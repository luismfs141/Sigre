import React, { useEffect, useMemo } from 'react';
import { Image } from 'primereact/image';
import { Tag } from 'primereact/tag';
import { Skeleton } from 'primereact/skeleton';
import { useFiles } from '../hooks/useFiles'; 

export default function EvidenceGallery({ deficiency, onCountUpdate }) {
    const { files, loadingFiles, loadFiles } = useFiles();

    // 1. Cargar archivos al cambiar la deficiencia
    useEffect(() => {
        if (deficiency?.defiInterno) {
            loadFiles(deficiency.defiInterno); 
        }
    }, [deficiency, loadFiles]);

    // 2. FILTRADO MAESTRO (ACTIVOS + COINCIDENCIA)
    const relevantFiles = useMemo(() => {
        if (!files || !deficiency) return [];

        const targetId = String(deficiency.defiIdElemento || "").trim();
        const targetTipo = String(deficiency.defiTipoElemento || "").trim().toUpperCase();
        const targetTipi = String(deficiency.tipiInterno ?? ""); 

        return files.filter(file => {
            // --- VALIDACIÓN DE ACTIVO BLINDADA ---
            // Aceptamos: 1 (num), "1" (string), true (bool), "true" (string)
            const valActivo = file.archActivo ?? file.ARCH_Activo;
            const isActivo = 
                valActivo === 1 || 
                valActivo === "1" || 
                valActivo === true || 
                valActivo === "true";
            
            if (!isActivo) return false;
            // -------------------------------------

            // Datos del archivo
            const fileId = String(file.archIdElemento || file.ARCH_IdElemento || "").trim();
            const fileTipo = String(file.archTipoElemento || file.archTipo || file.ARCH_TipoElemento || "").trim().toUpperCase();
            const fileTipi = String(file.tipiInterno ?? file.TIPI_Interno ?? "");

            // Comparación Clave
            const matchId = (fileId === targetId);
            const matchTipo = (fileTipo === targetTipo);
            
            // Comparación Tipi (Inclusiva para 7004.x.x)
            let matchTipi = (fileTipi === targetTipi);
            if (!matchTipi && targetTipi.length > 0 && targetTipi !== "0") {
                matchTipi = fileTipi.startsWith(`${targetTipi}.`) || fileTipi.startsWith(`${targetTipi}_`);
            }

            return matchId && matchTipo && matchTipi;
        });
    }, [files, deficiency]);

    // 3. Notificar cantidad al padre
    useEffect(() => {
        if (onCountUpdate) {
            onCountUpdate(relevantFiles.length);
        }
    }, [relevantFiles.length, onCountUpdate]);

    // 4. Generador de URL (Rutas corregidas)
    const getFileUrl = (fileData) => {
        let rawName = fileData.archNombre || fileData.ARCH_Nombre || ""; 
        const baseUrl = process.env.REACT_APP_FOTOS_URL || "https://subobscure-hilda-audacious.ngrok-free.dev"; 

        if (!rawName) return null;

        rawName = rawName.replace(/^SIGRE\.MOVIL[\/\\]/i, '');
        rawName = rawName.replace(/[\/\\]0000[\/\\]/, '/SINDEF/');
        rawName = rawName.replace(/[\/\\]Poste[\/\\]/i, '/POSTE/');
        rawName = rawName.replace(/[\/\\]Vano[\/\\]/i, '/VANO/');
        // Parche para carpeta limpia 7004
        rawName = rawName.replace(/[\/\\]7004\.[^/\\]+[\/\\]/, '/7004/');
        rawName = rawName.replace(/\\/g, '/');

        return `${baseUrl}/${rawName}`;
    };

    // 5. Clasificar (Fotos vs Audios)
    const { audios, photos } = useMemo(() => {
        const audiosArr = [];
        const photosArr = [];
        
        relevantFiles.forEach(file => {
            const rawName = (file.archNombre || file.ARCH_Nombre || "").toLowerCase();
            if (rawName.endsWith('.m4a') || rawName.endsWith('.mp3') || rawName.endsWith('.wav')) {
                audiosArr.push(file);
            } else {
                photosArr.push(file);
            }
        });
        return { audios: audiosArr, photos: photosArr };
    }, [relevantFiles]);

    // --- RENDERIZADO ---
    const offlinePlaceholder = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22150%22%20height%3D%22150%22%20viewBox%3D%220%200%20150%20150%22%3E%3Crect%20fill%3D%22%23eeeeee%22%20width%3D%22150%22%20height%3D%22150%22%2F%3E%3Ctext%20fill%3D%22%23999999%22%20font-family%3D%22sans-serif%22%20font-size%3D%2212%22%20dy%3D%2210.5%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3ESIN%20IMAGEN%3C%2Ftext%3E%3C%2Fsvg%3E";

    if (!deficiency) return <div className="h-full flex items-center justify-center text-gray-400">Selecciona un registro</div>;
    if (loadingFiles) return <div className="p-4"><Skeleton height="100%" /></div>;

    return (
        // Contenedor Principal: Usa h-full para llenar el SplitterPanel
        <div className="flex flex-col h-full bg-white overflow-hidden font-sans border-t border-gray-200">
            
            {/* CABECERA: Título y Datos */}
            <div className="flex-none p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-black text-gray-800 m-0 leading-none">
                        {deficiency.defiCodigoElemento || "SIN CÓDIGO"}
                    </h2>
                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">
                        ID: {deficiency.defiInterno} • {deficiency.defiTipoElemento}
                    </span>
                </div>
                <div className="flex gap-2">
                    <Tag severity="info" value={`${photos.length} Fotos`} className="text-[10px]" />
                    <Tag severity="warning" value={`${audios.length} Audios`} className="text-[10px]" />
                </div>
            </div>

            {/* CUERPO DIVIDIDO: Izquierda (Fotos) - Derecha (Audios) */}
            <div className="flex-1 flex flex-row overflow-hidden relative">
                
                {/* 1. ZONA FOTOS (IZQUIERDA - EXPANDIBLE) */}
                <div className="flex-1 overflow-y-auto p-3 bg-white">
                    {photos.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-50">
                            <i className="pi pi-image text-4xl mb-2"></i>
                            <p className="text-xs">No hay fotografías activas</p>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2 content-start">
                            {photos.map((file, i) => {
                                const url = getFileUrl(file);
                                return (
                                    <div key={i} className="relative group h-24 w-24 shrink-0 rounded border border-gray-200 shadow-sm overflow-hidden bg-gray-100 hover:shadow-md transition-all">
                                        <Image 
                                            src={url} 
                                            alt="Foto" 
                                            preview 
                                            className="w-full h-full"
                                            imageClassName="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = offlinePlaceholder;
                                            }}
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-0.5 pointer-events-none">
                                            <p className="text-white text-[8px] text-center font-mono truncate">
                                                {file.archFecha ? new Date(file.archFecha).toLocaleDateString() : ''}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 2. ZONA AUDIOS (DERECHA - FIJO - PEGADO) */}
                <div className="flex-none w-64 h-full border-l border-gray-200 bg-slate-50 flex flex-col">
                    <div className="flex-none p-2 bg-slate-100 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">
                        Audios
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {audios.length === 0 ? (
                            <div className="text-center text-gray-400 mt-10 text-[10px] italic opacity-50">
                                <i className="pi pi-volume-off text-2xl block mb-1"></i>
                                Sin audios
                            </div>
                        ) : (
                            audios.map((file, i) => {
                                const url = getFileUrl(file);
                                return (
                                    <div key={i} className="bg-white p-2 rounded border border-gray-200 shadow-sm flex flex-col gap-1 hover:border-blue-400 transition-colors group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-700 group-hover:text-blue-700">
                                                <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                                    <i className="pi pi-play text-[8px]"></i>
                                                </div>
                                                <span>Audio {i + 1}</span>
                                            </div>
                                            <span className="text-[8px] text-gray-400">
                                                {file.archFecha ? new Date(file.archFecha).toLocaleDateString() : ''}
                                            </span>
                                        </div>
                                        <audio controls className="w-full h-6 mt-1" style={{zoom: '0.8', outline: 'none'}} src={url} />
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}