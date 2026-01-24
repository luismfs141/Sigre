import React, { useEffect } from 'react';
import { Image } from 'primereact/image';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Skeleton } from 'primereact/skeleton';
import { ScrollPanel } from 'primereact/scrollpanel';
import { useFiles } from '../hooks/useFiles'; // Tu hook existente

export default function EvidenceGallery({ deficiency }) {
    const { files, loadingFiles, loadFiles } = useFiles();

    // 1. Cargar archivos cuando cambia la deficiencia seleccionada
    useEffect(() => {
        if (deficiency?.defiInterno) {
            loadFiles(deficiency.defiInterno);
        }
    }, [deficiency, loadFiles]);

    // Helper de URL (basado en tu código anterior)
    const getImageUrl = (fileName) => {
        return `http://localhost:5000/StaticFiles/${fileName}`; 
    };

    // Si no hay selección, mostrar mensaje de espera
    if (!deficiency) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50 text-gray-400">
                <i className="pi pi-arrow-left text-4xl mb-2 animate-bounce-x"></i>
                <p className="font-semibold">Selecciona una deficiencia</p>
                <p className="text-sm">para ver sus evidencias.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white border-l border-gray-200">
            {/* CABECERA DEL DETALLE */}
            <div className="p-3 border-b bg-gray-50 flex justify-between items-start shadow-sm z-10">
                <div className="overflow-hidden">
                    <h3 className="text-lg font-bold text-gray-800 m-0 truncate">
                        {deficiency.defiCodigoElemento}
                    </h3>
                    <div className="flex gap-2 mt-1 text-xs items-center">
                        <Tag value={`ID: ${deficiency.defiInterno}`} severity="secondary" />
                        <span className="text-gray-500 truncate" title={deficiency.defiObservacion}>
                            {deficiency.defiObservacion}
                        </span>
                    </div>
                </div>
                {/* Botón opcional para acción rápida */}
                <Button icon="pi pi-external-link" text rounded size="small" tooltip="Abrir detalles completos" />
            </div>

            {/* CONTENIDO (GRID DE FOTOS) */}
            <ScrollPanel style={{ width: '100%', height: '100%' }} className="bg-slate-100 p-3">
                
                <div className="mb-2 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase">
                        {files.length} Evidencias encontradas
                    </span>
                </div>

                {loadingFiles ? (
                    <div className="grid grid-cols-2 gap-3">
                        <Skeleton height="10rem" className="rounded-lg" />
                        <Skeleton height="10rem" className="rounded-lg" />
                    </div>
                ) : files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center pt-10 text-gray-400 opacity-60">
                        <i className="pi pi-camera text-4xl mb-2"></i>
                        <p className="text-sm">No hay fotos.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                        {files.map((file) => (
                            <div key={file.archInterno} className="bg-white p-1 rounded shadow-sm border hover:shadow-md transition-all">
                                <div className="aspect-square w-full overflow-hidden rounded bg-gray-200 relative group">
                                    <Image 
                                        src={getImageUrl(file.archNombre)} 
                                        alt="Evidencia" 
                                        preview 
                                        className="w-full h-full object-cover" 
                                        imageClassName="w-full h-full object-cover"
                                    />
                                    {/* Etiqueta de Tipo sobre la imagen */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] p-1 truncate text-center backdrop-blur-sm">
                                        {new Date(file.archFecha).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollPanel>
        </div>
    );
}