import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import api from '../api/apiConfig'; 

// --- TUS HOOKS ---
import { useDeficiencyByGis } from '../hooks/useDeficiency';
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

// --- IMPORTAMOS TU UTILIDAD ---
import { latLonToUTM } from '../utils/latLonUtm';

// --- UTILIDADES ---
const safeSeg = (val) => val ? val.toString().trim().toUpperCase().replace(/[\\/:*?"<>|]/g, '_') : "UNKNOWN";

const formatDeficiency = (code) => {
    if (!code || code === "NA" || code === "SINDEF" || code === "0000") return null;
    if (code.toString().startsWith("7004")) return "7004";
    return code;
};

// =====================================================================
// 🌎 MOTOR MATEMÁTICO INVERSO: UTM A WGS84 EXACTA
// =====================================================================
const utmToLatLon = (easting, northing, zone = 19, isSouthHemi = true) => {
    const a = 6378137.0;
    const e = 0.081819191;
    const e1sq = 0.00673949674227;
    const k0 = 0.9996;

    let arc = northing / k0;
    if (isSouthHemi) arc = (northing - 10000000.0) / k0;

    const mu = arc / (a * (1 - Math.pow(e, 2) / 4.0 - 3 * Math.pow(e, 4) / 64.0 - 5 * Math.pow(e, 6) / 256.0));
    const ei = (1 - Math.pow((1 - e * e), 0.5)) / (1 + Math.pow((1 - e * e), 0.5));

    const ca = 3 * ei / 2 - 27 * Math.pow(ei, 3) / 32.0;
    const cb = 21 * Math.pow(ei, 2) / 16 - 55 * Math.pow(ei, 4) / 32;
    const cc = 151 * Math.pow(ei, 3) / 96;
    const cd = 1097 * Math.pow(ei, 4) / 512;
    const phi1 = mu + ca * Math.sin(2 * mu) + cb * Math.sin(4 * mu) + cc * Math.sin(6 * mu) + cd * Math.sin(8 * mu);

    const n0 = a / Math.pow((1 - Math.pow((e * Math.sin(phi1)), 2)), 0.5);
    const r0 = a * (1 - e * e) / Math.pow((1 - Math.pow((e * Math.sin(phi1)), 2)), 1.5);
    const fact1 = n0 * Math.tan(phi1) / r0;

    const _a1 = 500000 - easting;
    const dd0 = _a1 / (n0 * k0);
    const fact2 = dd0 * dd0 / 2;

    const t0 = Math.pow(Math.tan(phi1), 2);
    const Q0 = e1sq * Math.pow(Math.cos(phi1), 2);
    const fact3 = (5 + 3 * t0 + 10 * Q0 - 4 * Q0 * Q0 - 9 * e1sq) * Math.pow(dd0, 4) / 24;
    const fact4 = (61 + 90 * t0 + 298 * Q0 + 45 * t0 * t0 - 252 * e1sq - 3 * Q0 * Q0) * Math.pow(dd0, 6) / 720;

    const lof1 = _a1 / (n0 * k0);
    const lof2 = (1 + 2 * t0 + Q0) * Math.pow(dd0, 3) / 6.0;
    const lof3 = (5 - 2 * Q0 + 28 * t0 - 3 * Math.pow(Q0, 2) + 8 * e1sq + 24 * Math.pow(t0, 2)) * Math.pow(dd0, 5) / 120;
    const _a2 = (lof1 - lof2 + lof3) / Math.cos(phi1);
    const _a3 = _a2 * 180 / Math.PI;

    const lat = 180 * (phi1 - fact1 * (fact2 + fact3 + fact4)) / Math.PI;
    const centralMeridian = (zone > 0) ? (6 * zone - 183.0) : 3.0;
    const lon = centralMeridian - _a3;

    return { 
        lat: parseFloat(lat.toFixed(6)), 
        lon: parseFloat(lon.toFixed(6)) 
    };
};

// =====================================================================
// 1. PROCESAMIENTO DE IMAGEN CON MAPA OSM Y WATERMARK
// =====================================================================
const processImageWithWatermark = (file, meta) => {
    const long2tile = (lon, zoom) => (lon + 180) / 360 * Math.pow(2, zoom);
    const lat2tile = (lat, zoom) => (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom);
    
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
                ctx.drawImage(img, 0, 0);

                const fontSize = Math.floor(img.height * 0.018);
                const lineHeight = fontSize * 1.4;
                const padding = fontSize;

                const zoom = 16;
                let mapLoadedPromise = Promise.resolve();

                if (meta.latMap && meta.longMap && meta.latMap !== 0) {
                    mapLoadedPromise = new Promise((resolveMap) => {
                        try {
                            const tileXNum = long2tile(meta.longMap, zoom);
                            const tileYNum = lat2tile(meta.latMap, zoom);
                            const tileX = Math.floor(tileXNum);
                            const tileY = Math.floor(tileYNum);

                            const offsetX = (tileXNum - tileX) * 256;
                            const offsetY = (tileYNum - tileY) * 256;

                            const osmUrl = `https://a.tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`;

                            const mapImg = new Image();
                            mapImg.crossOrigin = "Anonymous";
                            
                            mapImg.onload = () => {
                                const mapSize = img.width * 0.25;
                                const mapX = img.width - mapSize - padding;
                                const mapY = img.height - mapSize - padding;

                                ctx.save();
                                ctx.shadowColor = "rgba(0,0,0,0.5)";
                                ctx.shadowBlur = 10;
                                ctx.fillStyle = "white";
                                ctx.fillRect(mapX - 5, mapY - 5, mapSize + 10, mapSize + 10);
                                ctx.restore();

                                ctx.drawImage(mapImg, mapX, mapY, mapSize, mapSize);

                                const scale = mapSize / 256; 
                                const markerX = mapX + (offsetX * scale);
                                const markerY = mapY + (offsetY * scale);

                                ctx.beginPath();
                                ctx.arc(markerX, markerY, 5 * scale * 2, 0, 2 * Math.PI);
                                ctx.fillStyle = "red";
                                ctx.fill();
                                ctx.strokeStyle = "white";
                                ctx.lineWidth = 2;
                                ctx.stroke();

                                resolveMap();
                            };
                            mapImg.onerror = () => resolveMap();
                            mapImg.src = osmUrl;
                        } catch (e) { resolveMap(); }
                    });
                }

                mapLoadedPromise.then(() => {
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

                    let dateFormatted = "SIN FECHA";
                    if (meta.dateStr) {
                        let d = new Date(meta.dateStr);
                        if (!isNaN(d.getTime())) {
                            const offsetMs = d.getTimezoneOffset() * 60000;
                            d = new Date(d.getTime() - offsetMs);
                            const day = String(d.getDate()).padStart(2, '0');
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const year = d.getFullYear();
                            dateFormatted = `${day}/${month}/${year}`;
                        }
                    }

                    const formattedE = meta.utmEPrint ? Math.round(meta.utmEPrint) : 0;
                    const formattedN = meta.utmNPrint ? Math.round(meta.utmNPrint) : 0;
                    const utmText = `19K ${formattedE}E ${formattedN}N`; 

                    const lat6 = Number(meta.latMap).toFixed(6);
                    const long6 = Number(meta.longMap).toFixed(6);
                    const gpsText = `Lat: ${lat6} | Long: ${long6}`;

                    drawText(gpsText, padding, img.height - padding);
                    drawText(`UTM: ${utmText}`, padding, img.height - padding - lineHeight);
                    drawText(` ${dateFormatted}`, padding, img.height - padding - (lineHeight * 2));

                    canvas.toBlob((blob) => {
                        const newFile = new File([blob], file.name, { type: 'image/jpeg' });
                        resolve({
                            fileObj: newFile,
                            previewUrl: URL.createObjectURL(blob)
                        });
                    }, 'image/jpeg', 0.95);
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
            canvas.toBlob(resolve, 'image/jpeg', 0.6);
        };
    });
};

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function ImportacionMasivaInversa() {
    const { addFile, fetchFilesData } = useFiles();
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
    
    // --- ESTADOS PARA AUDITORÍA DE INTEGRIDAD ---
    const [oficinaCount, setOficinaCount] = useState(0);
    const [dateAnomalyCount, setDateAnomalyCount] = useState(0);
    const [mainDateStr, setMainDateStr] = useState(""); // La fecha predominante
    const [showAnomalyModal, setShowAnomalyModal] = useState(false);
    const [anomalyFilter, setAnomalyFilter] = useState(null)

    // Coordenadas objetivo (Oficina Arequipa)
    const TARGET_UTM_E = 232611;
    const TARGET_UTM_N = 8184225;
    const TOLERANCE_METERS = 15; 

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

            const groups = new Map();
            imageFiles.forEach(file => {
                const folderPath = file.webkitRelativePath.substring(0, file.webkitRelativePath.lastIndexOf('/'));
                if (!groups.has(folderPath)) groups.set(folderPath, []);
                groups.get(folderPath).push(file);
            });

            let processedItems = [];
            const groupKeys = Array.from(groups.keys());
            const totalGroups = groupKeys.length;

            for (let i = 0; i < totalGroups; i++) {
                const folderPath = groupKeys[i];
                const filesInGroup = groups.get(folderPath);
                const pathParts = folderPath.split('/');

                setStatusMsg(`Grupo ${i + 1}/${totalGroups}: Analizando rutas y BD...`);

                const typeIndex = pathParts.findIndex(p => p.toUpperCase().includes('POST') || p.toUpperCase().includes('VANO'));
                let gisCode = "", defCode = "", feeder = "NA", sed = "NA", structType = "Poste", subFolder7004 = "";

                if (typeIndex !== -1) {
                    const typeRaw = pathParts[typeIndex].toUpperCase();
                    structType = typeRaw.includes('POST') ? 'Poste' : 'Vano';
                    if (pathParts.length > typeIndex + 1) gisCode = safeSeg(pathParts[typeIndex + 1]);
                    if (pathParts.length > typeIndex + 2) defCode = safeSeg(pathParts[typeIndex + 2]);
                    if (defCode === "7004" && pathParts.length > typeIndex + 3) subFolder7004 = safeSeg(pathParts[typeIndex + 3]);
                    if (typeIndex - 1 >= 0) sed = safeSeg(pathParts[typeIndex - 1]);
                    if (typeIndex - 2 >= 0) feeder = safeSeg(pathParts[typeIndex - 2]);
                } else if (pathParts.length >= 2) {
                    defCode = safeSeg(pathParts[pathParts.length - 1]);
                    gisCode = safeSeg(pathParts[pathParts.length - 2]);
                }

                let dbDateStr = new Date().toISOString();
                let archivosBD = [];

                if (gisCode) {
                    try {
                        const history = await fetchByGis(gisCode);

                        if (history && history.length > 0) {
                            const cleanDefCode = formatDeficiency(defCode);
                            let specificDef = null;

                            if (cleanDefCode) {
                                specificDef = history.find(r => {
                                    const internalId = r.TIPI_Interno || r.tipiInterno;
                                    if (!internalId) return false;
                                    return formatDeficiency(getCodeById(internalId)) === cleanDefCode;
                                });
                            }
                            if (!specificDef) specificDef = history[0];

                            if (specificDef) {
                                const defiInternoId = specificDef.DEFI_Interno || specificDef.defiInterno;
                                const rawDate = specificDef.DEFI_FecRegistro || specificDef.defiFecRegistro || specificDef.fechaRegistro;
                                if (rawDate) dbDateStr = rawDate;

                                if (defiInternoId) {
                                    const resArchivos = await fetchFilesData(defiInternoId);
                                    if (resArchivos) archivosBD = resArchivos;
                                }
                            }
                        }
                    } catch (err) { console.error("🚨 Error API:", err); }
                }

                const typoExists = masterTypifications.some(t => t.code === defCode);

                const groupPromises = filesInGroup.map(async (file) => {
                    let fileLat = 0, fileLong = 0, fileUtmE = 0, fileUtmN = 0;
                    let fileDateStr = dbDateStr;
                    let dbFound = false, isFromOffice = false;

                    const matchingDbFile = archivosBD.find(a => 
                        a.archNombre && a.archNombre.includes(file.name)
                    );

                    if (matchingDbFile) {
                        const rawDbVal1 = parseFloat(matchingDbFile.archLatitud || matchingDbFile.ARCH_Latitud || 0);
                        const rawDbVal2 = parseFloat(matchingDbFile.archLongitud || matchingDbFile.ARCH_Longitud || 0);
                        
                        if (matchingDbFile.archFecha) fileDateStr = matchingDbFile.archFecha;

                        if (rawDbVal1 !== 0 && rawDbVal2 !== 0) {
                            if (Math.abs(rawDbVal1) > 1000 || Math.abs(rawDbVal2) > 1000) {
                                fileUtmN = rawDbVal1; fileUtmE = rawDbVal2;
                                const wgs84 = utmToLatLon(fileUtmE, fileUtmN, 19, true);
                                fileLat = wgs84.lat; fileLong = wgs84.lon;
                            } else {
                                fileLat = rawDbVal1; fileLong = rawDbVal2;
                                const utmConverted = latLonToUTM(fileLat, fileLong);
                                fileUtmE = utmConverted.easting; fileUtmN = utmConverted.northing;
                            }

                            // 1. EVALUAR INTEGRIDAD DE UBICACIÓN
                            const diffE = Math.abs(fileUtmE - TARGET_UTM_E);
                            const diffN = Math.abs(fileUtmN - TARGET_UTM_N);
                            if (diffE <= TOLERANCE_METERS && diffN <= TOLERANCE_METERS) {
                                isFromOffice = true;
                            }
                            dbFound = true;
                        }
                    }

                    const metaForWatermark = {
                        gis: gisCode, defCode: defCode,
                        latMap: fileLat, longMap: fileLong, 
                        utmEPrint: fileUtmE, utmNPrint: fileUtmN, 
                        dateStr: fileDateStr, structType: structType
                    };
                    
                    const { fileObj, previewUrl } = await processImageWithWatermark(file, metaForWatermark);

                    const originalName = file.name;
                    const pathSegments = [feeder, sed, structType, gisCode, defCode, subFolder7004];
                    const cleanPath = pathSegments.filter(seg => seg && seg !== "NA").join('/');

                    return {
                        id: Date.now() + Math.random(),
                        originalFile: file, processedFile: fileObj, preview: previewUrl,
                        feeder, sed, structType, gis: gisCode, defCode,
                        lat: fileLat, long: fileLong, dbDateStr: fileDateStr,
                        dbPath: `${cleanPath}/${originalName}`,
                        photoType: file.name.toLowerCase().includes('pano') ? 1 : 2,
                        isValidTypo: typoExists, dbFound: dbFound, 
                        isOffice: isFromOffice,
                        simpleDate: fileDateStr.split('T')[0] // Guardamos solo YYYY-MM-DD para agrupar fácil
                    };
                });

                const processedGroup = await Promise.all(groupPromises);
                processedItems.push(...processedGroup);
                setProgressVal(Math.round(((i + 1) / totalGroups) * 100));
            }

            // ==========================================================
            // 🧠 AUDITORÍA DE INTEGRIDAD DE DATOS (POST-PROCESAMIENTO)
            // ==========================================================
            
            // A. Encontrar la fecha más común
            const dateFreq = {};
            let maxCount = 0;
            let dominantDate = "";

            processedItems.forEach(item => {
                const d = item.simpleDate;
                dateFreq[d] = (dateFreq[d] || 0) + 1;
                if (dateFreq[d] > maxCount) {
                    maxCount = dateFreq[d];
                    dominantDate = d;
                }
            });

            // B. Marcar y contar las anomalías en el arreglo final
            let anomalies = 0;
            let officeBreaks = 0;

            processedItems = processedItems.map(item => {
                const isDateAnomaly = item.simpleDate !== dominantDate;
                if (isDateAnomaly) anomalies++;
                if (item.isOffice) officeBreaks++;
                
                return { ...item, isDateAnomaly };
            });

            setMainDateStr(dominantDate);
            setDateAnomalyCount(anomalies);
            setOficinaCount(officeBreaks);

            setLocalItems(prev => [...prev, ...processedItems]);
            toast.current.show({ severity: 'success', summary: 'Completado', detail: `${processedItems.length} fotos analizadas.` });

        } catch (error) {
            console.error(error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Falló la lectura de archivos.' });
        } finally {
            setProcessing(false);
            setModalVisible(false);
            setInputKey(Date.now());
        }
    };

    const handleSaveToDB = async () => { /* ... se mantiene igual ... */ };
    const handleGenerateZip = async (isLite = false) => { /* ... se mantiene igual ... */ };

    const clearList = () => { 
        setLocalItems([]); 
        setStatusMsg(""); 
        setOficinaCount(0); 
        setDateAnomalyCount(0);
        setMainDateStr("");
    };
    
    const openImagePreview = (url) => { setPreviewImage(url); setShowPreviewModal(true); };
    // Abre el modal filtrando por tipo de anomalía
    const openAnomalyModal = (type) => {
        setAnomalyFilter(type);
        setShowAnomalyModal(true);
    };

    // Filtra la lista según lo que el usuario seleccionó
    const anomalyList = localItems.filter(item => {
        if (anomalyFilter === 'office') return item.isOffice;
        if (anomalyFilter === 'date') return item.isDateAnomaly;
        return false;
    });

    // BONUS: Botón para copiar los códigos GIS únicos al portapapeles
    const copyGisToClipboard = () => {
        const uniqueGis = [...new Set(anomalyList.map(item => item.gis))];
        navigator.clipboard.writeText(uniqueGis.join('\n'));
        toast.current.show({ severity: 'info', summary: 'Copiado', detail: `${uniqueGis.length} códigos GIS copiados al portapapeles.` });
    };

    return (
        <div className="p-4 bg-slate-50 min-h-screen">
            <Toast ref={toast} />
            <Card title="Importación Masiva Inversa & Auditoría de Integridad" className="shadow-md">
                <Toolbar
                    left={
                        <div className="flex gap-2 items-center">
                            <div className="relative overflow-hidden inline-block">
                                <Button label="Seleccionar Carpeta Raíz" icon="pi pi-images" severity="warning" />
                                <input key={inputKey} type="file" webkitdirectory="true" multiple onChange={handleFolderSelect} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                            </div>
                            <Button label="Limpiar" icon="pi pi-trash" text onClick={clearList} disabled={localItems.length === 0} />
                            {localItems.length > 0 && <span className="ml-4 text-gray-500 font-semibold">{localItems.length} fotos</span>}
                            
{/* 🚨 ALERTAS DE INTEGRIDAD (AHORA CLICKEABLES) 🚨 */}
                            {oficinaCount > 0 && (
                                <Tag 
                                    severity="danger" 
                                    icon="pi pi-map-marker" 
                                    value={`${oficinaCount} fotos de Oficina`} 
                                    className="ml-2 font-bold animate-pulse cursor-pointer hover:bg-red-600 transition-colors" 
                                    onClick={() => openAnomalyModal('office')}
                                />
                            )}
                            {dateAnomalyCount > 0 && (
                                <Tag 
                                    severity="warning" 
                                    icon="pi pi-calendar-times" 
                                    value={`${dateAnomalyCount} fechas difieren de ${mainDateStr}`} 
                                    className="ml-2 font-bold cursor-pointer hover:bg-orange-600 transition-colors" 
                                    onClick={() => openAnomalyModal('date')}
                                />
                            )}
                        </div>
                    }
                    right={
                        <div className="flex gap-2">
                            <Button label="ZIP Original" icon="pi pi-download" severity="help" onClick={() => handleGenerateZip(false)} loading={zipLoading} disabled={localItems.length === 0 || zipLiteLoading} />
                            <Button label="ZIP Ligero" icon="pi pi-send" severity="info" onClick={() => handleGenerateZip(true)} loading={zipLiteLoading} disabled={localItems.length === 0 || zipLoading} tooltip="Para Correo (Baja Res)" />
                        </div>
                    }
                />
                <div className="mt-4">
                    <DataTable value={localItems} size="small" paginator rows={5} stripedRows emptyMessage="Seleccione carpetas para comenzar.">
                        <Column header="Ver" body={(r) => (
                            <div className="flex justify-center" title="Clic para ampliar">
                                <img src={r.preview} onClick={() => openImagePreview(r.preview)} 
                                     className={`h-24 w-auto object-contain border shadow-sm cursor-zoom-in transition-all hover:scale-110 
                                     ${(r.isOffice || r.isDateAnomaly) ? 'border-red-500 border-2' : 'bg-gray-100'}`} alt="prev" />
                            </div>
                        )} />
                        <Column field="gis" header="GIS / Deficiencia" body={(r) => {
                            const cleanDef = formatDeficiency(r.defCode);
                            return (
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-700">{r.gis}</span>
                                    <div className="mt-1">
                                        {cleanDef ?
                                            <Tag severity={r.isValidTypo ? "info" : "warning"} value={`Cód: ${cleanDef}`} /> :
                                            <span className="text-gray-400 text-xs font-bold border px-1 rounded">Sin Deficiencia</span>
                                        }
                                        {r.dbFound ? <i className="pi pi-check-circle text-green-500 ml-2" title="Sincronizado"></i> : <i className="pi pi-exclamation-triangle text-red-500 ml-2" title="No en BD"></i>}
                                        {r.isOffice && <i className="pi pi-map-marker text-red-500 ml-2" title="¡Alerta! Coordenadas de Oficina"></i>}
                                    </div>
                                </div>
                            );
                        }} />
                        <Column header="Datos & Integridad" body={(r) => (
                            <div className="text-xs space-y-1">
                                <div className={`font-bold ${r.isDateAnomaly ? 'text-orange-500' : 'text-gray-600'}`}> 
                                    {r.dbDateStr ? new Date(r.dbDateStr).toLocaleString() : 'Sin Fecha'}
                                    {r.isDateAnomaly && <span className="ml-1 text-[10px] uppercase">(Anomalía)</span>}
                                </div>
                                <div className={`${r.isOffice ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                    Lat: {Number(r.lat).toFixed(6)}, Long: {Number(r.long).toFixed(6)}
                                </div>
                            </div>
                        )} />
                        <Column header="Ruta Virtual" field="dbPath" body={(r) => <small className="text-gray-400 block w-48 truncate" title={r.dbPath}>{r.dbPath}</small>} />
                    </DataTable>
                </div>
            </Card>
            <Dialog header="Previsualización" visible={showPreviewModal} style={{ width: '80vw' }} maximizable modal onHide={() => setShowPreviewModal(false)}>
                {previewImage && (<div className="flex justify-center bg-black p-4 rounded"><img src={previewImage} alt="Zoom" className="max-h-[80vh] w-auto object-contain" /></div>)}
            </Dialog>
            <Dialog visible={modalVisible} style={{ width: '400px' }} modal closable={false} showHeader={false}>
                <div className="flex flex-col items-center justify-center p-8 text-center"><i className="pi pi-spin pi-cog text-5xl text-blue-600 mb-4"></i><h3 className="font-bold text-lg mb-2">{statusMsg}</h3><ProgressBar value={progressVal} style={{ width: '100%', height: '10px' }}></ProgressBar></div>
            </Dialog>
            {/* 🔥 MODAL DE REPORTE DE ANOMALÍAS 🔥 */}
            <Dialog 
                header={anomalyFilter === 'office' ? "🚨 Reporte: Capturas en Oficina" : "🟠 Reporte: Fechas Anómalas"} 
                visible={showAnomalyModal} 
                style={{ width: '70vw' }} 
                maximizable 
                modal 
                onHide={() => setShowAnomalyModal(false)}
            >
                <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-600">
                        A continuación se listan los elementos que rompieron la regla de integridad. 
                        Usa los códigos GIS para ubicarlos en tu otra instancia.
                    </p>
                    <Button 
                        label="Copiar Códigos GIS" 
                        icon="pi pi-copy" 
                        severity="secondary" 
                        size="small" 
                        onClick={copyGisToClipboard} 
                        tooltip="Copia los códigos sin repetir"
                    />
                </div>

                <DataTable value={anomalyList} size="small" paginator rows={10} stripedRows emptyMessage="No hay datos para mostrar.">
                    <Column field="gis" header="Código GIS" body={(r) => <span className="font-bold text-blue-600">{r.gis}</span>} />
                    <Column field="defCode" header="Deficiencia" body={(r) => r.defCode ? formatDeficiency(r.defCode) : 'N/A'} />
                    <Column header="Fecha Registrada" body={(r) => (
                        <span className={r.isDateAnomaly ? 'text-orange-500 font-bold' : ''}>
                            {r.dbDateStr ? new Date(r.dbDateStr).toLocaleString() : 'Sin Fecha'}
                        </span>
                    )} />
                    <Column header="Coordenadas" body={(r) => (
                        <span className={r.isOffice ? 'text-red-500 font-bold' : ''}>
                            Lat: {Number(r.lat).toFixed(6)} | Lon: {Number(r.long).toFixed(6)}
                        </span>
                    )} />
                    <Column field="originalFile.name" header="Archivo Base" body={(r) => <small>{r.originalFile.name}</small>} />
                </DataTable>
            </Dialog>
        </div>
    );
}