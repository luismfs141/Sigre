import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import piexif from 'piexifjs'; // IMPORTANTE: npm install piexifjs

// --- TUS HOOKS (Asegúrate que las rutas sean correctas) ---
import { useDeficiencyByGis } from '../hooks/useDeficiencyByGis'; 
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

// =====================================================================
// 1. HELPERS MATEMÁTICOS Y DE TEXTO
// =====================================================================

const safeSeg = (val) => val ? val.toString().trim().toUpperCase().replace(/[\\/:*?"<>|]/g, '_') : "UNKNOWN";

// Limpieza de códigos (Ej: "7004" de "7004_Roto")
const formatDeficiency = (code) => {
    if (!code || code === "NA" || code === "SINDEF" || code === "0000") return null;
    if (code.toString().startsWith("7004")) return "7004";
    return code; 
};

// Conversión WGS84 a UTM (Para marca de agua visual)
const getUtmBandLetter = (lat) => {
    if (-16 >= lat && lat >= -24) return 'K'; 
    if (-8 >= lat && lat > -16) return 'L';   
    if (0 >= lat && lat > -8) return 'M';     
    return 'S'; 
};

const latLonToUTM = (lat, lon) => {
    if (!lat || !lon) return { zone: "--", easting: 0, northing: 0, letter: "-" };
    const a = 6378137.0; 
    const f = 1 / 298.257223563; 
    const k0 = 0.9996; 
    const phi = lat * (Math.PI / 180);
    const lambda = lon * (Math.PI / 180);
    const zoneNumber = Math.floor((lon + 180) / 6) + 1;
    const lambda0 = ((zoneNumber - 1) * 6 - 180 + 3) * (Math.PI / 180);
    const e2 = 2 * f - f * f;
    const N = a / Math.sqrt(1 - e2 * Math.sin(phi) * Math.sin(phi));
    const T = Math.tan(phi) * Math.tan(phi);
    const C = e2 * Math.cos(phi) * Math.cos(phi) / (1 - e2);
    const A = (lambda - lambda0) * Math.cos(phi);
    const M = a * ((1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256) * phi
        - (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 * e2 * e2 / 1024) * Math.sin(2 * phi)
        + (15 * e2 * e2 / 256 + 45 * e2 * e2 * e2 / 1024) * Math.sin(4 * phi)
        - (35 * e2 * e2 * e2 / 3072) * Math.sin(6 * phi));
    const easting = 500000 + k0 * N * (A + (1 - T + C) * A * A * A / 6
        + (5 - 18 * T + T * T + 72 * C - 58 * e2) * A * A * A * A / 120);
    let northing = k0 * M + k0 * N * Math.tan(phi) * (A * A / 2
        + (5 - T + 9 * C + 4 * C * C) * A * A * A * A / 24
        + (61 - 58 * T + T * T + 600 * C - 330 * e2) * A * A * A * A * A * A / 720);
    if (lat < 0) northing += 10000000.0;
    const letter = getUtmBandLetter(lat);
    return { zone: zoneNumber, letter: letter, easting: Math.floor(easting), northing: Math.floor(northing) };
};

// =====================================================================
// 2. HELPERS EXIF (INYECTAR METADATOS INTERNOS EN JPG)
// =====================================================================

// Convierte decimal a racional [Grados, Minutos, Segundos] para EXIF
const toRational = (number) => {
    const defaultRes = [0, 1];
    if (!number) return defaultRes;
    const absVal = Math.abs(number);
    const deg = Math.floor(absVal);
    const minFloat = (absVal - deg) * 60;
    const min = Math.floor(minFloat);
    const sec = Math.round((minFloat - min) * 60 * 10000); 
    return [[deg, 1], [min, 1], [sec, 10000]];
};

// Convierte Base64 a Objeto File
const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, {type:mime});
};

// Inyecta GPS y Fecha dentro del binario JPG
const addExifToDataURL = (dataURL, lat, lng, dateStr) => {
    const exifObj = { "0th": {}, "Exif": {}, "GPS": {} };

    // A. FECHA (Formato requerido: "YYYY:MM:DD HH:MM:SS")
    if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
            const fmt = (n) => n.toString().padStart(2, '0');
            const exifDate = `${d.getFullYear()}:${fmt(d.getMonth() + 1)}:${fmt(d.getDate())} ${fmt(d.getHours())}:${fmt(d.getMinutes())}:${fmt(d.getSeconds())}`;
            exifObj["0th"][piexif.ImageIFD.DateTime] = exifDate;
            exifObj["Exif"][piexif.ExifIFD.DateTimeOriginal] = exifDate;
            exifObj["Exif"][piexif.ExifIFD.DateTimeDigitized] = exifDate;
        }
    }

    // B. GPS
    if (lat && lng) {
        exifObj["GPS"][piexif.GPSIFD.GPSLatitudeRef] = lat < 0 ? 'S' : 'N';
        exifObj["GPS"][piexif.GPSIFD.GPSLatitude] = toRational(lat);
        exifObj["GPS"][piexif.GPSIFD.GPSLongitudeRef] = lng < 0 ? 'W' : 'E';
        exifObj["GPS"][piexif.GPSIFD.GPSLongitude] = toRational(lng);
    }

    // C. Insertar
    const exifBytes = piexif.dump(exifObj);
    return piexif.insert(exifBytes, dataURL);
};

// =====================================================================
// 3. PROCESAMIENTO DE IMAGEN (VISUAL + EXIF)
// =====================================================================
const processImageWithWatermark = (file, meta) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = img.width;
                canvas.height = img.height;
                
                // 1. Dibujar imagen original
                ctx.drawImage(img, 0, 0);

                // --- INICIO DIBUJO MARCA DE AGUA (VISUAL) ---
                const fontSize = Math.floor(img.height * 0.018); 
                const lineHeight = fontSize * 1.4;
                ctx.font = `bold ${fontSize}px Arial`;
                ctx.fillStyle = '#ffffff'; 
                ctx.strokeStyle = 'black'; 
                ctx.lineWidth = fontSize / 5;
                ctx.textAlign = 'left'; 
                ctx.textBaseline = 'bottom'; 

                const drawText = (text, x, y) => {
                    ctx.strokeText(text, x, y);
                    ctx.fillText(text, x, y);
                };

                const padding = fontSize;
                let dateFormatted = "SIN FECHA";
                if (meta.dateStr) {
                    const d = new Date(meta.dateStr); 
                    if (!isNaN(d.getTime())) {
                        const day = String(d.getDate()).padStart(2, '0');
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const year = d.getFullYear(); 
                        dateFormatted = `${day}/${month}/${year}`;
                    }
                }

                const utm = latLonToUTM(meta.lat, meta.long);
                const utmText = `${utm.zone}${utm.letter} ${utm.easting}E ${utm.northing}N`;
                const gpsText = `Lat: ${meta.lat} | Long: ${meta.long}`;
                
                let operationalInfo = `GIS: ${meta.gis} | Tipo: ${meta.structType}`;
                const cleanDef = formatDeficiency(meta.defCode);
                if (cleanDef) operationalInfo += ` | DEF: ${cleanDef}`;

                // Dibujar líneas (de abajo hacia arriba)
                drawText(operationalInfo, padding, img.height - padding);
                drawText(gpsText, padding, img.height - padding - lineHeight);
                drawText(`UTM: ${utmText}`, padding, img.height - padding - (lineHeight * 2));
                drawText(` ${dateFormatted}`, padding, img.height - padding - (lineHeight * 3));
                // --- FIN MARCA DE AGUA ---

                // 2. OBTENER BINARIO BASE
                let finalDataURL = canvas.toDataURL('image/jpeg', 0.95);

                // 3. INYECTAR EXIF (LO NUEVO)
                try {
                    // Usamos la latitud/longitud de la BD para "setear" la foto
                    finalDataURL = addExifToDataURL(finalDataURL, meta.lat, meta.long, meta.dateStr);
                } catch (e) {
                    console.error("Fallo inyección EXIF:", e);
                }

                // 4. GENERAR ARCHIVO FINAL
                const newFile = dataURLtoFile(finalDataURL, file.name);

                resolve({ 
                    fileObj: newFile,            
                    previewUrl: finalDataURL 
                });
            };
        };
    });
};

const compressImageForLite = (blob) => {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.src = url;
        img.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const scale = 0.7; 
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(resolve, 'image/jpeg', 0.5); 
        };
    });
};

// =====================================================================
// 4. COMPONENTE PRINCIPAL
// =====================================================================

export default function AuditElectrical() {
    const { addFile } = useFiles();
    const { fetchByGis } = useDeficiencyByGis(); 
    const { masterTypifications, getCodeById } = useTypification(); 
    
    const toast = useRef(null);
    const [localItems, setLocalItems] = useState([]);         
    const [modalVisible, setModalVisible] = useState(false);
    const [zipLoading, setZipLoading] = useState(false);
    const [zipLiteLoading, setZipLiteLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [progressVal, setProgressVal] = useState(0);
    const [statusMsg, setStatusMsg] = useState("");
    const [previewImage, setPreviewImage] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [inputKey, setInputKey] = useState(Date.now());

    // --- LÓGICA PRINCIPAL DE LECTURA Y CRUCE DE DATOS ---
    const handleFolderSelect = async (e) => {
        try {
            const rawFiles = Array.from(e.target.files);
            const imageFiles = rawFiles.filter(f => f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|bmp)$/i.test(f.name));

            if (imageFiles.length === 0) {
                toast.current.show({ severity: 'warn', summary: 'Atención', detail: 'No se encontraron imágenes válidas.' });
                return;
            }

            setProcessing(true);
            setModalVisible(true);
            setStatusMsg(`Procesando ${imageFiles.length} imágenes...`);

            // Agrupar por carpeta
            const groups = new Map();
            imageFiles.forEach(file => {
                const folderPath = file.webkitRelativePath.substring(0, file.webkitRelativePath.lastIndexOf('/'));
                if (!groups.has(folderPath)) groups.set(folderPath, []);
                groups.get(folderPath).push(file);
            });

            const processedItems = [];
            const groupKeys = Array.from(groups.keys());
            const totalGroups = groupKeys.length;

            for (let i = 0; i < totalGroups; i++) {
                const folderPath = groupKeys[i];
                const filesInGroup = groups.get(folderPath);
                const pathParts = folderPath.split('/');

                setStatusMsg(`Analizando grupo ${i+1}/${totalGroups}...`);
                
                // Parseo de Ruta "Correcta" (Manual)
                const typeIndex = pathParts.findIndex(p => p.toUpperCase().includes('POST') || p.toUpperCase().includes('VANO'));
                let gisCode = "", defCode = "", feeder = "NA", sed = "NA", structType = "Poste";

                if (typeIndex !== -1) {
                    const typeRaw = pathParts[typeIndex].toUpperCase();
                    structType = typeRaw.includes('POST') ? 'Poste' : 'Vano';
                    if (pathParts.length > typeIndex + 1) gisCode = safeSeg(pathParts[typeIndex + 1]); 
                    if (pathParts.length > typeIndex + 2) defCode = safeSeg(pathParts[typeIndex + 2]); 
                    if (typeIndex - 1 >= 0) sed = safeSeg(pathParts[typeIndex - 1]);
                    if (typeIndex - 2 >= 0) feeder = safeSeg(pathParts[typeIndex - 2]);
                } else if (pathParts.length >= 2) {
                    defCode = safeSeg(pathParts[pathParts.length - 1]);
                    gisCode = safeSeg(pathParts[pathParts.length - 2]);
                }

                // --- CRUCE CON BASE DE DATOS ---
                let dbLat = 0, dbLong = 0, dbDateStr = null;
                let dbFound = false;
                let dbOldPath = "NO_ENCONTRADO_EN_BD"; // Para el reporte

                const cleanDefCodeLocal = formatDeficiency(defCode);

                if (gisCode) {
                    try {
                        // Trae el historial de la BD para este GIS
                        const history = await fetchByGis(gisCode); 
                        
                        if (history && history.length > 0) {
                            // MATCH: Buscamos por Código de Deficiencia, NO por ruta.
                            const match = history.find(r => {
                                const internalId = r.TIPI_Interno || r.tipiInterno;
                                if (!internalId) return false;
                                
                                const dbVisualCode = getCodeById(internalId); // Ej: "7004"
                                const cleanDefCodeDB = formatDeficiency(dbVisualCode);

                                // Si los códigos coinciden, es la misma incidencia (aunque la ruta en BD esté mal)
                                if (cleanDefCodeLocal && cleanDefCodeDB === cleanDefCodeLocal) return true;
                                
                                // Match genérico para fotos sin deficiencia
                                if (!cleanDefCodeLocal && (!cleanDefCodeDB || cleanDefCodeDB === "SINDEF")) return true;
                                
                                return false;
                            });

                            if (match) {
                                dbFound = true;
                                dbLat = match.DEFI_Latitud || match.defiLatitud || 0;
                                dbLong = match.DEFI_Longitud || match.defiLongitud || 0;
                                dbOldPath = match.DEFI_RutaFoto || match.defiRutaFoto || "RUTA_NULL"; // Guardamos ruta errónea
                                
                                const rawDate = match.DEFI_FecRegistro || match.defiFecRegistro;
                                if(rawDate) dbDateStr = rawDate;
                            }
                        }
                    } catch (err) { console.error(err); }
                }

                // Fecha final para EXIF (BD o Actual)
                const finalDateForExif = dbDateStr || new Date().toISOString(); 
                const typoExists = masterTypifications.some(t => t.code === defCode);

                // Procesar imágenes
                const groupPromises = filesInGroup.map(async (file) => {
                    const metaForWatermark = { 
                        gis: gisCode, 
                        defCode: defCode, 
                        lat: dbLat, 
                        long: dbLong, 
                        dateStr: finalDateForExif, // Fecha inyectada
                        structType: structType 
                    };
                    
                    // Inyecta visual y EXIF
                    const { fileObj, previewUrl } = await processImageWithWatermark(file, metaForWatermark);

                    const originalName = file.name; 
                    const pathSegments = [feeder, sed, structType, gisCode, defCode];
                    const cleanPath = pathSegments.filter(seg => seg && seg !== "NA").join('/');
                    const finalNewPath = `SIGREMOVIL/${cleanPath}/${originalName}`; // RUTA CORRECTA

                    return {
                        id: Date.now() + Math.random(),
                        originalFile: file,
                        processedFile: fileObj, // Tiene EXIF nuevo
                        preview: previewUrl,
                        
                        // Datos lógicos
                        feeder, sed, structType, gis: gisCode, defCode,
                        lat: dbLat, long: dbLong, dbDateStr: finalDateForExif,
                        
                        // Rutas para reporte
                        newPath: finalNewPath,
                        oldPath: dbOldPath,
                        
                        photoType: file.name.toLowerCase().includes('pano') ? 1 : 2,
                        isValidTypo: typoExists,
                        dbFound: dbFound
                    };
                });

                const processedGroup = await Promise.all(groupPromises);
                processedItems.push(...processedGroup);
                setProgressVal(Math.round(((i + 1) / totalGroups) * 100));
            }

            setLocalItems(prev => [...prev, ...processedItems]);
            toast.current.show({ severity: 'success', summary: 'Completado', detail: `${processedItems.length} fotos procesadas.` });

        } catch (error) {
            console.error(error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Falló el proceso.' });
        } finally {
            setProcessing(false);
            setModalVisible(false);
            setInputKey(Date.now());
        }
    };

    // --- REPORTE DE CRUCE (LO QUE PEDISTE) ---
    const handleExportMappingReport = () => {
        if (localItems.length === 0) return;

        const headers = [
            "GIS", "Deficiencia", "Latitud_BD", "Longitud_BD", "Fecha_BD", 
            "RUTA_CORRECTA (Local)", "RUTA_ERRONEA (BaseDatos)", "Estado_Cruce"
        ];
        
        const rows = localItems.map(item => [
            item.gis || "NA",
            item.defCode || "SINDEF",
            item.lat,
            item.long,
            item.dbDateStr ? new Date(item.dbDateStr).toLocaleString() : "Sin Fecha BD",
            item.newPath,
            item.oldPath,
            item.dbFound ? "MATCH EXITOSO" : "NO EN BD"
        ]);

        const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `Reporte_Cruce_Rutas_${new Date().getTime()}.csv`);
    };

    const handleGenerateZip = async (isLite = false) => {
        if (localItems.length === 0) return;
        if (isLite) setZipLiteLoading(true); else setZipLoading(true);
        const zip = new JSZip();
        
        const blobToArrayBuffer = (blob) => new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsArrayBuffer(blob);
        });

        for (const item of localItems) {
            // Usamos la RUTA NUEVA/CORRECTA para armar el ZIP
            const folderPath = item.newPath.substring(0, item.newPath.lastIndexOf('/'));
            const fileName = item.newPath.split('/').pop();
            try {
                let blobToZip = item.processedFile;
                if (isLite) blobToZip = await compressImageForLite(item.processedFile);
                const content = await blobToArrayBuffer(blobToZip);
                zip.folder(folderPath).file(fileName, content);
            } catch (e) { console.error(e); }
        }
        
        const suffix = isLite ? "LIGERO" : "FULL";
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `CargaMasiva_${suffix}_${new Date().getTime()}.zip`);
        if (isLite) setZipLiteLoading(false); else setZipLoading(false);
    };

    const clearList = () => { setLocalItems([]); setStatusMsg(""); };
    const openImagePreview = (url) => { setPreviewImage(url); setShowPreviewModal(true); };

    return (
        <div className="p-4 bg-slate-50 min-h-screen">
            <Toast ref={toast} />
            <Card title="Importación y Corrección de Metadatos" className="shadow-md">
                <Toolbar 
                    left={
                        <div className="flex gap-2 items-center">
                             <div className="relative overflow-hidden inline-block">
                                <Button label="Seleccionar Carpeta Raíz" icon="pi pi-images" severity="warning" />
                                <input key={inputKey} type="file" webkitdirectory="true" multiple onChange={handleFolderSelect} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                            </div>
                            <Button label="Limpiar" icon="pi pi-trash" text onClick={clearList} disabled={localItems.length === 0} />
                            {localItems.length > 0 && <span className="ml-4 text-gray-500 font-semibold">{localItems.length} fotos</span>}
                        </div>
                    }
                    right={
                        <div className="flex gap-2">
                            <Button label="Reporte Cruce (.csv)" icon="pi pi-table" severity="success" onClick={handleExportMappingReport} disabled={localItems.length === 0} tooltip="Compara Ruta Nueva vs Vieja" />
                            <Button label="ZIP Original" icon="pi pi-download" severity="help" onClick={() => handleGenerateZip(false)} loading={zipLoading} disabled={localItems.length === 0 || zipLiteLoading} />
                            <Button label="ZIP Ligero" icon="pi pi-send" severity="info" onClick={() => handleGenerateZip(true)} loading={zipLiteLoading} disabled={localItems.length === 0 || zipLoading} />
                        </div>
                    }
                />
                <div className="mt-4">
                    <DataTable value={localItems} size="small" paginator rows={5} stripedRows emptyMessage="Seleccione carpetas para comenzar.">
                        <Column header="Ver" body={(r)=> (
                            <div className="flex justify-center">
                                <img src={r.preview} onClick={() => openImagePreview(r.preview)} className="h-16 w-auto object-contain cursor-zoom-in border" alt="p"/>
                            </div>
                        )} />
                        <Column field="gis" header="GIS / Deficiencia" body={(r)=> (
                            <div className="flex flex-col">
                                <span className="font-bold">{r.gis}</span>
                                <div>
                                    <Tag severity={r.isValidTypo ? "info" : "warning"} value={r.defCode || "S/D"} className="mr-2"/>
                                    {r.dbFound ? <i className="pi pi-check-circle text-green-500" title="Encontrado en BD (Match Lógico)"></i> : <i className="pi pi-times-circle text-red-500" title="No existe en BD"></i>}
                                </div>
                            </div>
                        )}/>
                        <Column header="Datos Inyectados (BD)" body={(r)=> (
                            <div className="text-xs">
                                <div className="text-blue-700">Lat: {r.lat?.toFixed(5)}</div>
                                <div className="text-blue-700">Lon: {r.long?.toFixed(5)}</div>
                                <div className="text-gray-500">{r.dbDateStr ? new Date(r.dbDateStr).toLocaleDateString() : 'N/A'}</div>
                            </div>
                        )} />
                        <Column header="Comparativa Rutas" body={(r)=> (
                            <div className="text-xs flex flex-col gap-1 w-64">
                                <div className="bg-green-50 p-1 border border-green-200 rounded text-green-800 truncate" title={r.newPath}>
                                    <span className="font-bold">NUEVA:</span> {r.newPath}
                                </div>
                                <div className="bg-red-50 p-1 border border-red-200 rounded text-red-800 truncate" title={r.oldPath}>
                                    <span className="font-bold">BD:</span> {r.oldPath}
                                </div>
                            </div>
                        )} />
                    </DataTable>
                </div>
            </Card>
            <Dialog header="Vista Previa" visible={showPreviewModal} style={{ width: '80vw' }} maximizable modal onHide={() => setShowPreviewModal(false)}>
                {previewImage && (<div className="flex justify-center bg-black p-4"><img src={previewImage} alt="Zoom" className="max-h-[80vh] w-auto" /></div>)}
            </Dialog>
            <Dialog visible={modalVisible} style={{ width: '400px' }} modal closable={false} showHeader={false}>
                <div className="flex flex-col items-center justify-center p-8 text-center">
                    <i className="pi pi-spin pi-cog text-5xl text-blue-600 mb-4"></i>
                    <h3 className="font-bold text-lg mb-2">{statusMsg}</h3>
                    <ProgressBar value={progressVal} style={{ width: '100%', height: '10px' }}></ProgressBar>
                </div>
            </Dialog>
        </div>
    );
}