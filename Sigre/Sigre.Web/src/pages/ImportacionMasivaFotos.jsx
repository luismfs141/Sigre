import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// --- TUS HOOKS ---
import { useDeficiencyByGis } from '../hooks/useDeficiencyByGis'; // 👈 Usaremos esto para lat/long
import { useFiles } from '../hooks/useFiles'; 
import { useTypification } from '../hooks/useTypification'; 

// --- COMPONENTES UI ---
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';

// Helper limpieza
const safeSeg = (val) => val ? val.toString().trim().toUpperCase().replace(/[\\/:*?"<>|]/g, '_') : "UNKNOWN";

export default function WebInspectionManager() {
    // 1. HOOKS
    const { addFile } = useFiles();
    const { fetchByGis } = useDeficiencyByGis(); // 👈 Destructuramos la función de búsqueda
    const { masterTypifications } = useTypification(); 
    
    const toast = useRef(null);

    // 2. ESTADOS
    const [localItems, setLocalItems] = useState([]);         
    const [modalVisible, setModalVisible] = useState(false);
    const [zipLoading, setZipLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [progressVal, setProgressVal] = useState(0);

    const [totalStats, setTotalStats] = useState({ folders: 0, photos: 0 });

    // =================================================================
    // 📂 PROCESAMIENTO INTELIGENTE
    // =================================================================
    const handleFolderSelect = async (e) => {
        const rawFiles = Array.from(e.target.files);
        // Filtramos imágenes
        const imageFiles = rawFiles.filter(f => f.type.startsWith('image/'));

        if (imageFiles.length === 0) {
            toast.current.show({ severity: 'warn', summary: 'Vacío', detail: 'No hay imágenes en la carpeta seleccionada.' });
            return;
        }

        setProcessing(true);
        setModalVisible(true);
        setProgressVal(0);

        // MAPA PARA AGRUPAR FOTOS POR ESTRUCTURA + DEFICIENCIA
        // Clave temporal: RUTA_RELATIVA_SIN_ARCHIVO
        const groups = new Map();

        imageFiles.forEach(file => {
            // Obtenemos la ruta carpeta padre: "Mejia/8153/POST/PTO.../6002"
            const folderPath = file.webkitRelativePath.substring(0, file.webkitRelativePath.lastIndexOf('/'));
            
            if (!groups.has(folderPath)) {
                groups.set(folderPath, []);
            }
            groups.get(folderPath).push(file);
        });

        const processedItems = [];
        const groupKeys = Array.from(groups.keys());
        const totalGroups = groupKeys.length;

        console.log(`📂 Detectados ${totalGroups} grupos de carpetas.`);

        // ITERAMOS LOS GRUPOS (CARPETAS DE DEFICIENCIA)
        for (let i = 0; i < totalGroups; i++) {
            const folderPath = groupKeys[i]; // Ej: Mejia/8153/POST/PTO001/6002
            const filesInGroup = groups.get(folderPath);
            const pathParts = folderPath.split('/');

            // --- 1. PARSEO ROBUSTO DE RUTA (SOLUCIÓN UNKNOWN) ---
            // Buscamos dónde está "POST" o "VANO" para usarlos como ancla
            // .findIndex busca ignorando mayúsculas/minúsculas
            const typeIndex = pathParts.findIndex(p => p.toUpperCase().includes('POST') || p.toUpperCase().includes('VANO'));

            let feeder = "SIN_DATA";
            let sed = "SIN_DATA";
            let typeRaw = "POST";
            let gisCode = "";
            let defCode = "";

            if (typeIndex !== -1) {
                // ANCLAJE ENCONTRADO
                typeRaw = pathParts[typeIndex].toUpperCase(); // POST o VANO
                
                // GIS Code suele estar justo después del Tipo (Index + 1)
                if (pathParts.length > typeIndex + 1) gisCode = safeSeg(pathParts[typeIndex + 1]);
                
                // Deficiencia suele estar después del GIS (Index + 2)
                if (pathParts.length > typeIndex + 2) defCode = safeSeg(pathParts[typeIndex + 2]);

                // SED suele estar antes del Tipo (Index - 1)
                if (typeIndex - 1 >= 0) sed = safeSeg(pathParts[typeIndex - 1]);

                // Feeder suele estar antes del SED (Index - 2)
                if (typeIndex - 2 >= 0) feeder = safeSeg(pathParts[typeIndex - 2]);
            } else {
                // FALLBACK: Si no encuentra POST/VANO, intenta lógica inversa (últimos elementos)
                console.warn(`⚠️ No se detectó carpeta POST/VANO en: ${folderPath}`);
                if (pathParts.length >= 2) {
                    defCode = safeSeg(pathParts[pathParts.length - 1]);
                    gisCode = safeSeg(pathParts[pathParts.length - 2]);
                }
            }

            // Normalizar Tipo para BD
            const structType = typeRaw.includes('POST') ? 'Poste' : 'Vano';

            // --- 2. CONSULTAR BD (SOLUCIÓN LATITUD) ---
            let dbLat = 0;
            let dbLong = 0;
            let dbDate = new Date(); // Fecha actual por defecto si falla BD

            if (gisCode) {
                try {
                    // Llamamos a TU hook. Nota: fetchByGis retorna el array de datos
                    const history = await fetchByGis(gisCode);
                    
                    if (history && history.length > 0) {
                        // Tomamos el primer registro encontrado (o el más reciente)
                        const record = history[0]; 
                        
                        // Manejamos posible diferencia de nombres (Mayúsculas/Minúsculas) según tu SQL
                        // Según tu imagen, las columnas son DEFI_Latitud
                        dbLat = record.DEFI_Latitud || record.defiLatitud || record.defi_Latitud || 0;
                        dbLong = record.DEFI_Longitud || record.defiLongitud || record.defi_Longitud || 0;
                        
                        // Si quisieras leer fecha de la denuncia o inspección:
                        // const rawDate = record.DEFI_FechaInspeccion;
                        // if(rawDate) dbDate = new Date(rawDate);
                    }
                } catch (err) {
                    console.error(`Error consultando GIS ${gisCode}`, err);
                }
            }

            // --- 3. CREAR ÍTEMS LOCALES ---
            // Validar si el código de deficiencia existe en tu maestro (Visual)
            const typoExists = masterTypifications.some(t => t.code === defCode);

            filesInGroup.forEach((file, idx) => {
                // Generar segundos virtuales para que no se llamen igual
                const adjustedDate = new Date(dbDate.getTime() + idx * 1000); 
                const dateStr = adjustedDate.toISOString().slice(0,19).replace(/[:]/g, '-');
                
                // Tipo de foto basado en nombre (opcional)
                let photoType = 1; 
                const lower = file.name.toLowerCase();
                if(lower.includes('pano')) photoType = 1;
                else if(lower.includes('front')) photoType = 2;
                else if(lower.includes('izq')) photoType = 3;
                else if(lower.includes('der')) photoType = 4;

                // Nombre Estándar
                const standardizedName = `${gisCode}_${defCode}_${dateStr}_Tipo${photoType}.jpg`;
                
                // Ruta BD: SIGREMOVIL/ALIMENTADOR/SED/TIPO/GIS/DEFICIENCIA
                const relativePath = `${feeder}/${sed}/${structType}/${gisCode}/${defCode}`;
                const dbPath = `SIGREMOVIL/${relativePath}/${standardizedName}`;

                processedItems.push({
                    id: Date.now() + Math.random(),
                    file: file,
                    preview: URL.createObjectURL(file),
                    
                    // Datos Estructura Parseados
                    feeder, sed, structType, gis: gisCode, defCode,
                    
                    // Datos Consultados de BD (REPLICADOS)
                    lat: dbLat,
                    long: dbLong,
                    date: adjustedDate,
                    
                    // Meta
                    dbPath,
                    photoType,
                    isValidTypo: typoExists
                });
            });

            // Actualizar barra de progreso
            setProgressVal(Math.round(((i + 1) / totalGroups) * 100));
        }

        setLocalItems(prev => [...prev, ...processedItems]);
        setTotalStats({ folders: totalGroups, photos: processedItems.length });
        setProcessing(false);
        toast.current.show({ severity: 'success', summary: 'Procesado', detail: `${processedItems.length} fotos listas.` });
    };

    // 3. GUARDAR EN BD
    const handleSaveToDB = async () => {
        if (localItems.length === 0) return;
        setProcessing(true);

        let successCount = 0;
        for (const item of localItems) {
            const payload = {
                archInterno: 0,
                archTipo: item.photoType.toString(),
                archNombre: item.dbPath,
                archTabla: "Deficiencias",
                archCodTabla: 0, 
                archLatitud: item.lat || 0,   // 👈 Se envía latitud leída de BD
                archLongitud: item.long || 0, // 👈 Se envía longitud leída de BD
                archFecha: item.date.toISOString(),
                archTipoElemento: item.structType === 'Poste' ? "POST" : "VANO",
                archIdElemento: 0, 
                tipiInterno: 0, 
                archActivo: true,
                estadoOffLine: 0
            };

            const ok = await addFile(payload);
            if(ok) successCount++;
        }
        
        setProcessing(false);
        setModalVisible(false);
        toast.current.show({ severity: 'success', summary: 'Carga Completada', detail: `${successCount} registros guardados.` });
    };

    // 4. GENERAR ZIP
    const handleGenerateZip = async () => {
        if (localItems.length === 0) return;
        setZipLoading(true);
        const zip = new JSZip();

        const readFile = (file) => new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsArrayBuffer(file);
        });

        for (const item of localItems) {
            const folderPath = item.dbPath.substring(0, item.dbPath.lastIndexOf('/'));
            const fileName = item.dbPath.split('/').pop();
            try {
                const content = await readFile(item.file);
                zip.folder(folderPath).file(fileName, content);
            } catch (e) { console.error(e); }
        }

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `CargaMasiva_${new Date().getTime()}.zip`);
        setZipLoading(false);
    };

    const clearList = () => {
        setLocalItems([]);
        setTotalStats({ folders: 0, photos: 0 });
    };

    return (
        <div className="p-4 bg-slate-50 min-h-screen">
            <Toast ref={toast} />

            <Card title="Carga Masiva (Conexión a BD y Auto-Parseo)" className="shadow-md">
                <Toolbar 
                    left={
                        <div className="flex gap-2">
                             <div className="relative overflow-hidden inline-block">
                                <Button label="Seleccionar Carpeta Raíz" icon="pi pi-folder-open" severity="warning" />
                                <input 
                                    type="file" 
                                    webkitdirectory="" directory="" multiple 
                                    onChange={handleFolderSelect} 
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                                />
                            </div>
                            <Button label="Limpiar" icon="pi pi-trash" severity="secondary" onClick={clearList} disabled={localItems.length === 0} />
                        </div>
                    }
                    right={
                        <div className="flex gap-2">
                            <Button label="Guardar BD" icon="pi pi-database" severity="success" onClick={handleSaveToDB} disabled={localItems.length === 0} />
                            <Button label="Descargar ZIP" icon="pi pi-download" severity="help" onClick={handleGenerateZip} loading={zipLoading} disabled={localItems.length === 0} />
                        </div>
                    }
                />

                {processing && (
                    <div className="mt-4">
                        <span className="text-sm font-bold text-gray-600">Consultando BD y procesando... {progressVal}%</span>
                        <ProgressBar value={progressVal} style={{ height: '10px' }}></ProgressBar>
                    </div>
                )}

                <div className="mt-4">
                    <DataTable value={localItems} size="small" paginator rows={10} stripedRows emptyMessage="Seleccione carpetas para procesar.">
                        <Column header="Vista" body={(r)=><img src={r.preview} className="w-10 h-10 object-cover rounded border" alt="p"/>} />
                        <Column field="gis" header="Estructura (GIS)" sortable filter filterPlaceholder="PTO..." />
                        <Column field="defCode" header="Cód. Def" sortable body={(r)=> (
                            <Tag severity={r.isValidTypo ? "success" : "warning"} value={r.defCode} />
                        )}/>
                        <Column field="feeder" header="Alim." />
                        <Column field="sed" header="SED" />
                        <Column header="GPS (BD)" body={(r)=> (
                            <div className="text-xs font-mono">
                                {r.lat !== 0 ? (
                                    <span className="text-green-700 font-bold">{r.lat}<br/>{r.long}</span>
                                ) : (
                                    <span className="text-red-400">No encontrado</span>
                                )}
                            </div>
                        )} />
                        <Column header="Ruta Generada" field="dbPath" body={(r)=> <small className="text-gray-400 block w-40 truncate" title={r.dbPath}>{r.dbPath}</small>} />
                    </DataTable>
                </div>
            </Card>

            <Dialog visible={modalVisible && processing} style={{ width: '300px' }} modal closable={false} showHeader={false}>
                <div className="flex flex-col items-center justify-center p-4">
                    <i className="pi pi-spin pi-spinner text-4xl text-blue-500 mb-4"></i>
                    <p className="font-bold text-center">Consultando BD...</p>
                </div>
            </Dialog>
        </div>
    );
}