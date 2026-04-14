import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';
import { Message } from 'primereact/message';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function CloneSyncModal({ visible, onHide, deficiency, photos, feeder, sed }) {
    const [status, setStatus] = useState('idle'); // idle, processing, success, error
    const [progress, setProgress] = useState(0);

    // Función Senior: Reconstruye la ruta física exacta basada en la lógica de negocio
    const buildManualPath = (photo) => {
        // Extraemos partes de la ruta actual para mantener coherencia
        const parts = photo.archNombre.split('/');
        const fileName = parts.pop();
        const folderStructure = parts.join('/'); // Esto ya trae SIGRE.MOVIL/ALIM/SED/TIPO/ELEM/CODE
        return { folderStructure, fileName };
    };

    const handlePrepareManualDownload = async () => {
        setStatus('processing');
        setProgress(0);
        const zip = new JSZip();

        try {
            for (let i = 0; i < photos.length; i++) {
                const photo = photos[i];
                const { folderStructure, fileName } = buildManualPath(photo);
                
                // Intentamos obtener la imagen (del server o de la cache)
                const response = await fetch(photo.archNombre); // El browser usará su cache si ya la vio en la galería
                if (response.ok) {
                    const blob = await response.blob();
                    // Creamos la carpeta en el ZIP y metemos el archivo
                    zip.folder(folderStructure).file(fileName, blob);
                }
                
                setProgress(Math.round(((i + 1) / photos.length) * 100));
            }

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `CLON_MANUAL_${deficiency.defiCodigoElemento}.zip`);
            setStatus('success');
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    return (
        <Dialog 
            header="Gestor de Clonación Manual" 
            visible={visible} 
            onHide={onHide}
            style={{ width: '450px' }}
            footer={
                <div>
                    <Button label="Cerrar" onClick={onHide} className="p-button-text" />
                    {status !== 'success' && (
                        <Button 
                            label="Descargar Pack de Fotos" 
                            icon="pi pi-download" 
                            onClick={handlePrepareManualDownload} 
                            loading={status === 'processing'}
                        />
                    )}
                </div>
            }
        >
            <div className="flex flex-col gap-4">
                <Message 
                    severity="info" 
                    text="Esta deficiencia es un CLON. Las fotos no se duplican en el servidor para ahorrar espacio." 
                    className="w-full justify-start"
                />
                
                <div className="p-3 bg-gray-50 rounded border">
                    <p className="text-sm font-bold mb-2">Instrucciones para el revisor:</p>
                    <ol className="text-xs list-decimal ml-4 flex flex-col gap-1 text-gray-600">
                        <li>Presiona el botón de descarga.</li>
                        <li>Se generará un ZIP con la **nueva ruta lógica**.</li>
                        <li>Descomprime el contenido en tu almacenamiento local.</li>
                        <li>La base de datos ya apunta a estas nuevas rutas.</li>
                    </ol>
                </div>

                {status === 'processing' && (
                    <div className="mt-2">
                        <p className="text-[10px] font-bold mb-1">PROCESANDO ZIP: {progress}%</p>
                        <ProgressBar value={progress} showValue={false} style={{ height: '6px' }} />
                    </div>
                )}

                {status === 'success' && (
                    <Message severity="success" text="¡ZIP Generado! Ya puedes mover las fotos a su carpeta final." />
                )}
            </div>
        </Dialog>
    );
}