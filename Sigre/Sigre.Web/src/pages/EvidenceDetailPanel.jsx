import React, { useEffect } from 'react';
import { Image } from 'primereact/image';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { Button } from 'primereact/button';
import { Skeleton } from 'primereact/skeleton'; // Para efecto de carga elegante

import { useFiles } from '../hooks/useFiles'; // Tu hook existente

export default function EvidenceDetailPanel({ deficiency }) {
    const { files, loadingFiles, loadFiles } = useFiles();

    // Cada vez que cambia la deficiencia seleccionada (prop), recargamos los archivos
    useEffect(() => {
        if (deficiency?.defiInterno) {
            loadFiles(deficiency.defiInterno);
        }
    }, [deficiency, loadFiles]);

    // Helper URL
    const getImageUrl = (fileName) => {
        // Reemplaza con tu ruta real o usa un placeholder si falla
        return fileName ? `http://localhost:5000/StaticFiles/${fileName}` : 'https://via.placeholder.com/150';
    };

    const getTypeLabel = (typeId) => {
        const types = { "1": "Panorámica", "2": "Frontal", "3": "Izquierda", "4": "Derecha" };
        return types[typeId] || "Otro";
    };

    return (
        <div className="animate-fade-in">
            {/* CABECERA DE DETALLE */}
            <div className="bg-white p-4 rounded shadow-sm border-l-4 border-purple-500 mb-4 flex justify-between items-start">
                <div>
                    <h3 className="text-2xl font-bold text-gray-800 m-0">{deficiency.defiCodigoElemento}</h3>
                    <div className="flex gap-2 mt-2">
                        <Tag icon="pi pi-key" value={`ID: ${deficiency.defiInterno}`} severity="secondary" />
                        <Tag icon="pi pi-calendar" value={new Date(deficiency.defiFecRegistro).toLocaleDateString()} severity="info" />
                    </div>
                    <p className="mt-3 text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 italic">
                        "{deficiency.defiObservacion || 'Sin observaciones'}"
                    </p>
                </div>
                <div className="text-right">
                     {/* Aquí podrías poner botones de acción específicos para esta deficiencia */}
                     <Button label="Editar Datos" icon="pi pi-pencil" text size="small" />
                </div>
            </div>

            <Divider align="left">
                <span className="p-tag p-component p-tag-success">Evidencias ({files.length})</span>
            </Divider>

            {/* GRID DE FOTOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                
                {loadingFiles && (
                    // Skeleton Loading (Se ve muy profesional)
                    <>
                        <Skeleton height="12rem" className="rounded" />
                        <Skeleton height="12rem" className="rounded" />
                        <Skeleton height="12rem" className="rounded" />
                    </>
                )}

                {!loadingFiles && files.length === 0 && (
                    <div className="col-span-full text-center py-10 opacity-50">
                        <i className="pi pi-camera text-4xl mb-2"></i>
                        <p>No hay fotografías cargadas para este elemento.</p>
                    </div>
                )}

                {!loadingFiles && files.map((file) => (
                    <div key={file.archInterno} className="group relative bg-white p-2 rounded shadow hover:shadow-lg transition-all duration-200 border border-transparent hover:border-blue-300">
                        {/* IMAGEN CON PREVIEW */}
                        <div className="overflow-hidden rounded h-40 bg-gray-200 flex items-center justify-center">
                            <Image 
                                src={getImageUrl(file.archNombre)} 
                                alt="evidencia" 
                                preview 
                                className="w-full h-full object-cover"
                                imageClassName="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                        </div>

                        {/* INFO DEBAJO DE LA FOTO */}
                        <div className="mt-2 flex justify-between items-center">
                            <div>
                                <span className="text-xs font-bold text-blue-600 uppercase block">
                                    {getTypeLabel(file.archTipo)}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                    {new Date(file.archFecha).toLocaleDateString()}
                                </span>
                            </div>
                            
                            {/* Botón flotante al hacer hover */}
                            <Button 
                                icon="pi pi-download" 
                                rounded text 
                                severity="secondary" 
                                size="small" 
                                tooltip="Descargar"
                                onClick={() => window.open(getImageUrl(file.archNombre), '_blank')}
                            />
                        </div>
                        
                        {/* Lat/Long flotante (Opcional) */}
                        {file.archLatitud && (
                             <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">
                                GPS
                             </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}