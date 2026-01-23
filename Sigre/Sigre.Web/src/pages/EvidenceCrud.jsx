import React, { useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Image } from 'primereact/image';
import { useFiles } from '../hooks/useFiles'; 

export default function EvidenceCRUD({ visible, onHide, deficiency }) {
    const { files, loadingFiles, loadFiles } = useFiles();

    useEffect(() => {
        if (visible && deficiency?.defiInterno) {
            loadFiles(deficiency.defiInterno);
        }
    }, [visible, deficiency, loadFiles]);

    // Función para construir la URL de la imagen en tu servidor estático
    const getImageUrl = (fileName) => {
        // Ajusta la URL base a tu backend real
        // Ejemplo: Si fileName es "SigreMedios/...", concatenamos con el dominio
        return `http://localhost:5000/StaticFiles/${fileName}`; 
    };

    return (
        <Dialog 
            header={
                <div className="flex flex-col">
                    <span className="text-lg font-bold">Evidencias del Servidor</span>
                    <span className="text-xs text-gray-500 font-normal">ID Deficiencia: {deficiency.defiInterno} | GIS: {deficiency.defiCodigoElemento}</span>
                </div>
            }
            visible={visible} 
            style={{ width: '90vw', maxWidth: '800px' }} 
            onHide={onHide}
            maximizable
        >
            <div className="flex flex-col gap-4">
                
                <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-bold text-gray-600">{files.length} Fotos encontradas</span>
                    <div className="flex gap-2">
                        <Button label="Subir Nueva" icon="pi pi-upload" severity="success" size="small" />
                    </div>
                </div>

                {loadingFiles ? (
                    <div className="text-center py-10">
                        <i className="pi pi-spin pi-spinner text-4xl text-blue-500"></i>
                        <p className="mt-2 text-gray-500">Cargando imágenes...</p>
                    </div>
                ) : files.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded border border-dashed">
                        <i className="pi pi-image text-4xl text-gray-300"></i>
                        <p className="text-gray-500 mt-2">No hay fotografías registradas.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {files.map((file) => (
                            <div key={file.archInterno} className="border rounded p-2 bg-white shadow-sm relative group hover:shadow-md transition-shadow">
                                <Image 
                                    src={getImageUrl(file.archNombre)} 
                                    alt="Evidencia" 
                                    preview 
                                    width="100%" 
                                    className="object-cover h-32 w-full rounded bg-gray-100"
                                />
                                <div className="mt-2">
                                    <p className="text-xs font-bold text-gray-700 truncate" title={file.archNombre}>
                                        {new Date(file.archFecha).toLocaleDateString()}
                                    </p>
                                    <p className="text-[10px] text-gray-500">{file.archTipoElemento}</p>
                                </div>
                                
                                {/* Botón Borrar (Visible en Hover) */}
                                <Button 
                                    icon="pi pi-trash" 
                                    className="absolute top-1 right-1 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity" 
                                    severity="danger" 
                                    rounded
                                    tooltip="Eliminar imagen"
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Dialog>
    );
}