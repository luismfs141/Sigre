import React, { useEffect, useMemo, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Image } from 'primereact/image';
import { Tag } from 'primereact/tag';
import { Skeleton } from 'primereact/skeleton';
import { useFiles } from '../hooks/useFiles'; 

export default function EvidenceGallery({ deficiency, onCountUpdate }) {
    const { files, loadingFiles, loadFiles } = useFiles();

    // 1. Cargar archivos
    useEffect(() => {
        if (deficiency?.defiInterno) {
            loadFiles(deficiency.defiInterno); 
        }
    }, [deficiency, loadFiles]);

    // 2. Filtrado Maestro
    const relevantFiles = useMemo(() => {
        if (!files || !deficiency) return [];
        const targetId = String(deficiency.defiIdElemento || "").trim();
        const targetTipo = String(deficiency.defiTipoElemento || "").trim().toUpperCase();
        const targetTipi = String(deficiency.tipiInterno ?? ""); 

        return files.filter(file => {
            const valActivo = file.archActivo ?? file.ARCH_Activo;
            const isActivo = valActivo === 1 || valActivo === "1" || valActivo === true || valActivo === "true";
            if (!isActivo) return false;

            const fileId = String(file.archIdElemento || file.ARCH_IdElemento || "").trim();
            const fileTipo = String(file.archTipoElemento || file.archTipo || file.ARCH_TipoElemento || "").trim().toUpperCase();
            const fileTipi = String(file.tipiInterno ?? file.TIPI_Interno ?? "");

            const matchId = (fileId === targetId);
            const matchTipo = (fileTipo === targetTipo);
            let matchTipi = (fileTipi === targetTipi);
            
            if (!matchTipi && targetTipi.length > 0 && targetTipi !== "0") {
                matchTipi = fileTipi.startsWith(`${targetTipi}.`) || fileTipi.startsWith(`${targetTipi}_`);
            }
            return matchId && matchTipo && matchTipi;
        });
    }, [files, deficiency]);

    // --- ESTADOS VISOR (LIGHTBOX) ---
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(-1);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });

    // --- ACCIONES DEL VISOR ---
    const openLightbox = (index) => {
        setSelectedPhotoIndex(index);
        setZoomLevel(1);
        setPosition({ x: 0, y: 0 });
    };

    const closeLightbox = () => {
        setSelectedPhotoIndex(-1);
        setZoomLevel(1);
        setPosition({ x: 0, y: 0 });
        setIsDragging(false);
    };

    const handleNext = (e) => {
        e?.stopPropagation();
        setZoomLevel(1);
        setPosition({ x: 0, y: 0 });
        setSelectedPhotoIndex((prev) => (prev + 1) % photos.length);
    };

    const handlePrev = (e) => {
        e?.stopPropagation();
        setZoomLevel(1);
        setPosition({ x: 0, y: 0 });
        setSelectedPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
    };

    const handleZoomIn = (e) => {
        e?.stopPropagation();
        setZoomLevel(prev => Math.min(prev + 0.5, 5));
    };

    const handleZoomOut = (e) => {
        e?.stopPropagation();
        setZoomLevel(prev => {
            const newZoom = Math.max(prev - 0.5, 1);
            if (newZoom === 1) setPosition({ x: 0, y: 0 });
            return newZoom;
        });
    };

    // --- LÓGICA DE ARRASTRE (PAN) ---
    const handleMouseDown = (e) => {
        if (zoomLevel > 1) {
            e.preventDefault();
            e.stopPropagation(); 
            setIsDragging(true);
            dragStartRef.current = { 
                x: e.clientX - position.x, 
                y: e.clientY - position.y 
            };
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging && zoomLevel > 1) {
            e.preventDefault();
            e.stopPropagation();
            setPosition({
                x: e.clientX - dragStartRef.current.x,
                y: e.clientY - dragStartRef.current.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // 3. Notificar al padre
    useEffect(() => {
        if (onCountUpdate) {
            onCountUpdate(relevantFiles.length);
        }
    }, [relevantFiles.length, onCountUpdate]);
  
    // 4. Generador de URL
    const getFileUrl = (fileData) => {
        let rawName = fileData.archNombre || fileData.ARCH_Nombre || ""; 
        const baseUrl = process.env.REACT_APP_FOTOS_URL || "https://capacity-preceding-skills-outline.trycloudflare.com/"; 
        if (!rawName) return null;
        
        rawName = rawName.replace(/\\/g, '/');
        rawName = rawName.replace(/^.*SigreMovil\//i, ''); 
        rawName = rawName.replace(/^.*SIGRE\.MOVIL\//i, '');
        rawName = rawName.replace(/\/Vano\//i, '/VANO/');
        rawName = rawName.replace(/\/Poste\//i, '/POSTE/');
        rawName = rawName.replace(/\/0000\//, '/SINDEF/');
        
        if (rawName.startsWith('/')) rawName = rawName.substring(1)
        return `${baseUrl}/${rawName}`;
    };

    // 5. Clasificación (Fotos vs Audios)
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

    // ------------------------------------------------------------------
    // RENDERIZADO DEL VISOR (PORTAL) - VERSIÓN LIMPIA SIN DIFUMINADO
    // ------------------------------------------------------------------
    const renderLightbox = () => {
        if (selectedPhotoIndex === -1 || !photos[selectedPhotoIndex]) return null;

        return ReactDOM.createPortal(
            <div 
                className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center overflow-hidden cursor-pointer select-none"
                onClick={closeLightbox} // Clic en el fondo cierra
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* 1. BOTÓN CERRAR (X) - TOTALMENTE TRANSPARENTE 
                    Se eliminaron los fondos, bordes y efectos de desenfoque.
                    Solo el icono es visible, con fondo rojo al pasar el mouse.
                */}
                <button 
                    onClick={(e) => {
                        e.stopPropagation(); 
                        closeLightbox();
                    }} 
                    className="fixed top-4 right-4 z-[100002] group bg-transparent hover:bg-red-600 text-white/80 hover:text-white rounded-full w-12 h-12 flex items-center justify-center transition-all hover:scale-110 active:scale-90 cursor-pointer outline-none"
                    title="Cerrar (Esc)"
                >
                    <i className="pi pi-times text-2xl"></i>
                </button>

                {/* 2. FLECHAS LATERALES */}
                <button 
                    onClick={handlePrev} 
                    className="fixed left-4 top-1/2 -translate-y-1/2 z-[100001] bg-transparent hover:bg-black/40 text-white/60 hover:text-white rounded-full p-4 transition-all hover:scale-110 active:scale-90 outline-none cursor-pointer"
                >
                    <i className="pi pi-chevron-left text-4xl drop-shadow-sm"></i>
                </button>

                <button 
                    onClick={handleNext} 
                    className="fixed right-4 top-1/2 -translate-y-1/2 z-[100001] bg-transparent hover:bg-black/40 text-white/60 hover:text-white rounded-full p-4 transition-all hover:scale-110 active:scale-90 outline-none cursor-pointer"
                >
                    <i className="pi pi-chevron-right text-4xl drop-shadow-sm"></i>
                </button>

                {/* 3. IMAGEN PRINCIPAL (DRAGGABLE) */}
                <div 
                    className="w-full h-full flex items-center justify-center overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    style={{ 
                        cursor: isDragging ? 'grabbing' : (zoomLevel > 1 ? 'grab' : 'default'),
                        touchAction: 'none'
                    }}
                >
                    <img 
                        src={getFileUrl(photos[selectedPhotoIndex])} 
                        alt="Full Screen"
                        draggable={false}
                        className="max-w-none transition-transform duration-100 ease-out select-none shadow-2xl"
                        style={{ 
                            transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
                            maxHeight: '100vh',
                            maxWidth: '100vw',
                            objectFit: 'contain'
                        }}
                    />
                </div>

                {/* 4. BARRA INFERIOR (ZOOM + INFO) */}
                <div 
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100001] flex flex-col items-center gap-3 cursor-default"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Controles de Zoom - Fondo semitransparente sutil */}
                    <div className="flex items-center gap-4 bg-black/40 px-6 py-2 rounded-full border border-white/10 shadow-sm">
                        <button 
                            onClick={handleZoomOut} 
                            disabled={zoomLevel <= 1}
                            className="text-white/80 hover:text-white disabled:opacity-30 transition-colors w-8 h-8 flex items-center justify-center active:scale-90 cursor-pointer outline-none"
                        >
                            <i className="pi pi-minus font-bold"></i>
                        </button>
                        
                        <span className="text-white font-mono font-bold text-sm w-12 text-center select-none">
                            {Math.round(zoomLevel * 100)}%
                        </span>
                        
                        <button 
                            onClick={handleZoomIn} 
                            disabled={zoomLevel >= 5}
                            className="text-white/80 hover:text-white disabled:opacity-30 transition-colors w-8 h-8 flex items-center justify-center active:scale-90 cursor-pointer outline-none"
                        >
                            <i className="pi pi-plus font-bold"></i>
                        </button>
                    </div>

                    {/* Contador */}
                    <span className="text-white/60 text-xs font-medium tracking-wider drop-shadow-sm select-none">
                        {selectedPhotoIndex + 1} / {photos.length}
                    </span>
                </div>
            </div>,
            document.body
        );
    };

    // --- RENDERIZADO PRINCIPAL ---
    const offlinePlaceholder = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22150%22%20height%3D%22150%22%20viewBox%3D%220%200%20150%20150%22%3E%3Crect%20fill%3D%22%23eeeeee%22%20width%3D%22150%22%20height%3D%22150%22%2F%3E%3Ctext%20fill%3D%22%23999999%22%20font-family%3D%22sans-serif%22%20font-size%3D%2212%22%20dy%3D%2210.5%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3ESIN%20IMAGEN%3C%2Ftext%3E%3C%2Fsvg%3E";

    if (!deficiency) return <div className="h-full flex items-center justify-center text-gray-400">Selecciona un registro</div>;
    if (loadingFiles) return <div className="p-4"><Skeleton height="100%" /></div>;

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden font-sans border-t border-gray-200">
            {/* Header */}
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

            <div className="flex-1 flex flex-row overflow-hidden relative">
                {/* Panel Izquierdo: FOTOS */}
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
                                    <div 
                                        key={i} 
                                        onClick={() => openLightbox(i)}
                                        className="relative group h-24 w-24 shrink-0 rounded border border-gray-200 shadow-sm overflow-hidden bg-gray-100 hover:shadow-md transition-all cursor-pointer"
                                    >
                                        <Image 
                                            src={url} 
                                            alt="Foto" 
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

                {/* Panel Derecho: AUDIOS */}
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

            {/* Portal del Visor */}
            {renderLightbox()}
        </div>
    );
}