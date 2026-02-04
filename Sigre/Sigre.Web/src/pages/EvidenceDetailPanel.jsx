import React, { useEffect } from 'react';
import { Image } from 'primereact/image';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { Button } from 'primereact/button';
import { Skeleton } from 'primereact/skeleton';
import { useFiles } from '../hooks/useFiles';

// IMPORTANTE: Recibimos 'feeder' y 'sed' para construir la ruta exacta
export default function EvidenceDetailPanel({ deficiency, feeder, sed }) {
    const { files, loadingFiles, loadFiles } = useFiles();

    // Cargar archivos al cambiar la deficiencia
    useEffect(() => {
        if (deficiency?.defiInterno) {
            loadFiles(deficiency.defiInterno);
        }
    }, [deficiency, loadFiles]);

    // --- 1. LÓGICA DE RUTA CON CONSOLEO (DEBUG) ---
    const getFileUrl = (fileData) => {
        const rawName = fileData.ARCH_Nombre || fileData.archNombre || "";
        const baseUrl = process.env.REACT_APP_FOTOS_URL || "http://localhost:8080"; 

        // Si no hay nombre, retornamos error o placeholder
        if (!rawName) return "https://via.placeholder.com/150?text=Sin+Nombre";
        
        // Si ya tiene slash, asumimos ruta completa
        if (rawName.includes("/")) return `${baseUrl}/${rawName}`;

        try {
            // A. Alimentador
            let feederName = "UNK";
            if (feeder && feeder.label) feederName = feeder.label.split('-')[0].trim(); 

            // B. SED
            const sedCode = sed ? sed.sedCodigo : "UNK";
            
            // C. Tipo (Poste/Vano) - Forzamos MAYÚSCULAS
            const tipoRaw = deficiency.defiTipoElemento || "POST";
            const typeFolder = tipoRaw.toUpperCase(); 

            // D. Elemento
            const elementCode = deficiency.defiCodigoElemento || "UNK";

            // E. Defecto (Lógica SINDEF / 0000)
            let defectCodeRaw = "0000";
            if (deficiency.tipificacionLabel) {
                defectCodeRaw = deficiency.tipificacionLabel.split(' ')[0].trim();
            } else if (deficiency.tipiInterno) {
                defectCodeRaw = String(deficiency.tipiInterno);
            }

            let defectFolder = defectCodeRaw;
            if (defectCodeRaw === "0000" || defectCodeRaw === "S/D") {
                defectFolder = "SINDEF";
            }

            // URL Final
            const finalUrl = `${baseUrl}/${feederName}/${sedCode}/${typeFolder}/${elementCode}/${defectFolder}/${rawName}`;

            // --- AQUÍ ESTÁ EL CONSOLEO ---
            console.log(`%c 📸 FOTO: ${rawName}`, 'color: cyan; font-weight: bold;');
            console.log({
                "1_BaseUrl": baseUrl,
                "2_Alimentador": feederName,
                "3_SED": sedCode,
                "4_Tipo": typeFolder,
                "5_Elemento": elementCode,
                "6_Defecto_Carpeta": defectFolder,
                ">> URL_GENERADA": finalUrl
            });
            // -----------------------------

            return finalUrl;

        } catch (e) {
            console.error("Error ruta:", e);
            return `${baseUrl}/${rawName}`;
        }
    };

    // Helper para etiquetas visuales
    const getTypeLabel = (typeId) => {
        const types = { "1": "Panorámica", "2": "Frontal", "3": "Izquierda", "4": "Derecha" };
        return types[typeId] || "Otro";
    };

    if (!deficiency) return null;

    return (
        <div className="animate-fade-in">
            {/* CABECERA DE DETALLE */}
            <div className="bg-white p-4 rounded shadow-sm border-l-4 border-purple-500 mb-4 flex justify-between items-start">
                <div>
                    <h3 className="text-2xl font-bold text-gray-800 m-0">{deficiency.defiCodigoElemento}</h3>
                    <div className="flex gap-2 mt-2">
                        <Tag icon="pi pi-key" value={`ID: ${deficiency.defiInterno}`} severity="secondary" />
                        <Tag icon="pi pi-calendar" value={deficiency.defiFecRegistro ? new Date(deficiency.defiFecRegistro).toLocaleDateString() : '-'} severity="info" />
                    </div>
                    <p className="mt-3 text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 italic">
                        "{deficiency.defiObservacion || 'Sin observaciones'}"
                    </p>
                </div>
                <div className="text-right">
                     <Button label="Editar Datos" icon="pi pi-pencil" text size="small" />
                </div>
            </div>

            <Divider align="left">
                <span className="p-tag p-component p-tag-success">Evidencias ({files ? files.length : 0})</span>
            </Divider>

            {/* GRID DE FOTOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                
                {loadingFiles && (
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
                    <div key={file.archInterno || Math.random()} className="group relative bg-white p-2 rounded shadow hover:shadow-lg transition-all duration-200 border border-transparent hover:border-blue-300">
                        {/* IMAGEN CON PREVIEW */}
                        <div className="overflow-hidden rounded h-40 bg-gray-200 flex items-center justify-center">
                            <Image 
                                src={getFileUrl(file)} // <--- AQUÍ USAMOS LA NUEVA FUNCIÓN
                                alt="evidencia" 
                                preview 
                                className="w-full h-full object-cover"
                                imageClassName="w-full h-full object-cover transition-transform group-hover:scale-105"
                                onError={(e) => e.target.src='https://via.placeholder.com/150?text=Error+Carga'}
                            />
                        </div>

                        {/* INFO DEBAJO DE LA FOTO */}
                        <div className="mt-2 flex justify-between items-center">
                            <div>
                                <span className="text-xs font-bold text-blue-600 uppercase block">
                                    {getTypeLabel(file.archTipo)}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                    {file.archFecha ? new Date(file.archFecha).toLocaleDateString() : ''}
                                </span>
                            </div>
                            
                            <Button 
                                icon="pi pi-download" 
                                rounded text 
                                severity="secondary" 
                                size="small" 
                                tooltip="Descargar"
                                onClick={() => window.open(getFileUrl(file), '_blank')}
                            />
                        </div>
                        
                        {/* Lat/Long flotante */}
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