import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// --- TUS HOOKS ---
import { useDeficiencyByGis } from '../hooks/useDeficiency'; // Asegúrate de la ruta correcta
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

// --- UTILIDADES ---
const safeSeg = (val) => val ? val.toString().trim().toUpperCase().replace(/[\\/:*?"<>|]/g, '_') : "UNKNOWN";

const formatDeficiency = (code) => {
    if (!code || code === "NA" || code === "SINDEF" || code === "0000") return null;
    if (code.toString().startsWith("7004")) return "7004";
    return code;
};

// =====================================================================
// 🌎 MOTOR MATEMÁTICO: CONVERSIÓN WGS84 EXACTA
// =====================================================================

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

    return {
        zone: zoneNumber,
        letter: letter,
        easting: Math.floor(easting),
        northing: Math.floor(northing)
    };
};
/**
 /**
 * 1. PROCESAMIENTO DE IMAGEN CON MAPA OSM (Gratis) Y WATERMARK
 * Colocar esta función FUERA y ANTES del componente ImportacionMasivaFotos
 */
const processImageWithWatermark = (file, meta) => {
    
    // --- 🌍 MATEMÁTICAS OSM (Slippy Map Tiles) ---
    // Convierte Latitud/Longitud a coordenadas de Tile (x, y) y Píxel
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

                // Dibujar foto original
                ctx.drawImage(img, 0, 0);

                const fontSize = Math.floor(img.height * 0.018);
                const lineHeight = fontSize * 1.4;
                const padding = fontSize;

                // --- 🗺️ BLOQUE MAPA OPENSTREETMAP ---
                const zoom = 16; // Zoom nivel calle
                let mapLoadedPromise = Promise.resolve();

                if (meta.lat && meta.long) {
                    mapLoadedPromise = new Promise((resolveMap) => {
                        try {
                            // 1. Calcular índices del Tile
                            const tileXNum = long2tile(meta.long, zoom);
                            const tileYNum = lat2tile(meta.lat, zoom);
                            
                            const tileX = Math.floor(tileXNum);
                            const tileY = Math.floor(tileYNum);

                            // 2. Calcular dónde cae el punto ROJO dentro de ese cuadro (0-256px)
                            const offsetX = (tileXNum - tileX) * 256;
                            const offsetY = (tileYNum - tileY) * 256;

                            // 3. URL del Tile de OpenStreetMap (Servidor A, B o C)
                            const osmUrl = `https://a.tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`;

                            const mapImg = new Image();
                            mapImg.crossOrigin = "Anonymous"; // Vital para evitar errores de seguridad
                            
                            mapImg.onload = () => {
                                // Configurar tamaño y posición del mapa en la foto
                                const mapSize = img.width * 0.25; // 25% del ancho de la foto
                                const mapX = img.width - mapSize - padding;
                                const mapY = img.height - mapSize - padding; // Arriba del texto

                                // A. Dibujar fondo blanco y sombra
                                ctx.save();
                                ctx.shadowColor = "rgba(0,0,0,0.5)";
                                ctx.shadowBlur = 10;
                                ctx.fillStyle = "white";
                                ctx.fillRect(mapX - 5, mapY - 5, mapSize + 10, mapSize + 10);
                                ctx.restore();

                                // B. Dibujar el mapa (escalado)
                                ctx.drawImage(mapImg, mapX, mapY, mapSize, mapSize);

                                // C. Dibujar el marcador ROJO en la posición exacta
                                // Convertimos el offset del tile (0-256) al tamaño final en el canvas
                                const scale = mapSize / 256; 
                                const markerX = mapX + (offsetX * scale);
                                const markerY = mapY + (offsetY * scale);

                                ctx.beginPath();
                                ctx.arc(markerX, markerY, 5 * scale * 2, 0, 2 * Math.PI); // Círculo
                                ctx.fillStyle = "red";
                                ctx.fill();
                                ctx.strokeStyle = "white";
                                ctx.lineWidth = 2;
                                ctx.stroke();

                                resolveMap();
                            };
                            
                            mapImg.onerror = () => {
                                console.warn("No se pudo cargar tile de OSM");
                                resolveMap();
                            };
                            
                            mapImg.src = osmUrl;

                        } catch (e) {
                            console.error("Error calculando mapa OSM", e);
                            resolveMap();
                        }
                    });
                }

                // Esperar a que cargue el mapa (o falle) y seguir
                mapLoadedPromise.then(() => {
                    // --- TEXTOS ---
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

                    // Fecha con corrección horaria
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

                    const utm = latLonToUTM(meta.lat, meta.long);
                    const utmText = `${utm.zone}${utm.letter} ${utm.easting}E ${utm.northing}N`;
                    const gpsText = `Lat: ${meta.lat} | Long: ${meta.long}`;

                    drawText(gpsText, padding, img.height - padding);
                    drawText(`UTM: ${utmText}`, padding, img.height - padding - lineHeight);
                    drawText(` ${dateFormatted}`, padding, img.height - padding - (lineHeight * 2));

                    canvas.toBlob((blob) => {
                        const newFile = new File([blob], file.name, { type: 'image/jpeg' });
                        resolve({
                            fileObj: newFile,
                            previewUrl: URL.createObjectURL(blob)
                        });
                    }, 'image/jpeg', 0.95); // Calidad JPEG
                });
            };
        };
    });
};
// 🔴🔴 MODIFICACIÓN 1: RESOLUCIÓN AÚN MÁS BAJA 🔴🔴
const compressImageForLite = (blob) => {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.src = url;
        img.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // ✅ CAMBIO: Escala de 0.7 a 0.5 (Mitad del tamaño original)
            const scale = 0.7;

            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // ✅ CAMBIO: Calidad JPEG a 0.5 para reducir peso drásticamente
            canvas.toBlob(resolve, 'image/jpeg', 0.6);
        };
    });
};

export default function ImportacionMasivaFotos() {
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

            const processedItems = [];
            const groupKeys = Array.from(groups.keys());
            const totalGroups = groupKeys.length;

            for (let i = 0; i < totalGroups; i++) {
                const folderPath = groupKeys[i];
                const filesInGroup = groups.get(folderPath);
                const pathParts = folderPath.split('/');

                setStatusMsg(`Grupo ${i + 1}/${totalGroups}: Analizando rutas...`);

                const typeIndex = pathParts.findIndex(p => p.toUpperCase().includes('POST') || p.toUpperCase().includes('VANO'));
                let gisCode = "", defCode = "", feeder = "NA", sed = "NA", structType = "Poste";

                // 1. NUEVA VARIABLE: Para guardar el "1" o "2" de las carpetas 7004
                let subFolder7004 = "";

                if (typeIndex !== -1) {
                    const typeRaw = pathParts[typeIndex].toUpperCase();
                    structType = typeRaw.includes('POST') ? 'Poste' : 'Vano';

                    if (pathParts.length > typeIndex + 1) gisCode = safeSeg(pathParts[typeIndex + 1]);
                    if (pathParts.length > typeIndex + 2) defCode = safeSeg(pathParts[typeIndex + 2]);

                    // 2. LÓGICA DE DETECCIÓN: Solo si es 7004 y hay algo después
                    if (defCode === "7004" && pathParts.length > typeIndex + 3) {
                        // Capturamos la carpeta '1' o '2'
                        subFolder7004 = safeSeg(pathParts[typeIndex + 3]);
                    }

                    if (typeIndex - 1 >= 0) sed = safeSeg(pathParts[typeIndex - 1]);
                    if (typeIndex - 2 >= 0) feeder = safeSeg(pathParts[typeIndex - 2]);
                } else if (pathParts.length >= 2) {
                    // Lógica fallback existente
                    defCode = safeSeg(pathParts[pathParts.length - 1]);
                    gisCode = safeSeg(pathParts[pathParts.length - 2]);
                }

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

                let dbLat = 0, dbLong = 0, dbDateStr = new Date().toISOString();
                let dbFound = false;

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
                                    const visualCode = getCodeById(internalId);
                                    return formatDeficiency(visualCode) === cleanDefCode;
                                });
                            }

                            if (!specificDef) specificDef = history[0];

                            if (specificDef) {
                                dbLat = specificDef.DEFI_Latitud || specificDef.defiLatitud || 0;
                                dbLong = specificDef.DEFI_Longitud || specificDef.defiLongitud || 0;

                                const rawDate = specificDef.DEFI_FecRegistro || specificDef.defiFecRegistro || specificDef.fechaRegistro;

                                if (rawDate) {
                                    dbDateStr = rawDate;
                                    dbFound = true;
                                }
                            }
                        } else {
                            console.warn(`🚨 [API] No se encontró historial para GIS ${gisCode}`);
                        }
                    } catch (err) { console.error("🚨 Error API:", err); }
                }

                const typoExists = masterTypifications.some(t => t.code === defCode);

                const groupPromises = filesInGroup.map(async (file, idx) => {
                    const metaForWatermark = {
                        gis: gisCode,
                        defCode: defCode,
                        lat: dbLat,
                        long: dbLong,
                        dateStr: dbDateStr,
                        structType: structType
                    };
                    const { fileObj, previewUrl } = await processImageWithWatermark(file, metaForWatermark);

                    const originalName = file.name;
                    // 3. ACTUALIZACIÓN DE RUTA: Agregamos subFolder7004 al array
                    // Si no es 7004, la variable estará vacía y no afectará nada.
                    // Si es 7004, se generará: .../7004/1/foto.jpg o .../7004/2/foto.jpg
                    const pathSegments = [feeder, sed, structType, gisCode, defCode, subFolder7004];

                    const cleanPath = pathSegments.filter(seg => seg && seg !== "NA").join('/');
                    const finalDbPath = `${cleanPath}/${originalName}`;

                    return {
                        id: Date.now() + Math.random(),
                        originalFile: file,
                        processedFile: fileObj,
                        preview: previewUrl,
                        feeder, sed, structType, gis: gisCode, defCode,
                        lat: dbLat, long: dbLong, dbDateStr,
                        dbPath: finalDbPath,
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
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Falló la lectura de archivos.' });
        } finally {
            setProcessing(false);
            setModalVisible(false);
            setInputKey(Date.now());
        }
    };

    const handleSaveToDB = async () => {
        if (localItems.length === 0) return;
        setProcessing(true);
        setStatusMsg("Subiendo a BD...");
        let successCount = 0;
        for (const [idx, item] of localItems.entries()) {
            setProgressVal(Math.round(((idx + 1) / localItems.length) * 100));
            const payload = {
                archInterno: 0,
                archTipo: item.photoType.toString(),
                archNombre: item.dbPath,
                archTabla: "Deficiencias",
                archCodTabla: 0,
                archLatitud: item.lat, archLongitud: item.long,
                archFecha: new Date().toISOString(),
                archTipoElemento: item.structType === 'Poste' ? "POST" : "VANO",
                archIdElemento: 0, tipiInterno: 0, archActivo: true, estadoOffLine: 0
            };
            const ok = await addFile(payload, item.processedFile);
            if (ok) successCount++;
        }
        setProcessing(false);
        setModalVisible(false);
        toast.current.show({ severity: 'success', summary: 'Subida Finalizada', detail: `${successCount} registros guardados.` });
    };

    // 🔴🔴 MODIFICACIÓN 2: CORRECCIÓN DE ZONA HORARIA EN EL ZIP 🔴🔴
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
            const folderPath = item.dbPath.substring(0, item.dbPath.lastIndexOf('/'));
            const fileName = item.dbPath.split('/').pop();
            try {
                let blobToZip = item.processedFile;
                if (isLite) blobToZip = await compressImageForLite(item.processedFile);
                const content = await blobToArrayBuffer(blobToZip);

                const originalDate = item.dbDateStr ? new Date(item.dbDateStr) : new Date();

                // ✅ CÁLCULO CLAVE PARA ARREGLAR LA HORA:
                // Restamos el offset de minutos (ej. 300 min para Perú) para "engañar" al ZIP
                // y que al sumarle UTC internamente, quede en la hora visual correcta.
                const offsetMs = originalDate.getTimezoneOffset() * 60000;
                const visualDate = new Date(originalDate.getTime() - offsetMs);

                console.log(`🚨 [ZIP] Ajuste hora para ${fileName}: Original=${originalDate.toLocaleTimeString()} | VisualZIP=${visualDate.toLocaleTimeString()}`);

                zip.folder(folderPath).file(fileName, content, {
                    date: visualDate // Usamos la fecha con el offset restado
                });

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
            <Card title="Importación Masiva (Depuración Activa)" className="shadow-md">
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
                            <Button label="ZIP Original" icon="pi pi-download" severity="help" onClick={() => handleGenerateZip(false)} loading={zipLoading} disabled={localItems.length === 0 || zipLiteLoading} />
                            <Button label="ZIP Ligero" icon="pi pi-send" severity="info" onClick={() => handleGenerateZip(true)} loading={zipLiteLoading} disabled={localItems.length === 0 || zipLoading} tooltip="Para Correo (Baja Res)" />
                        </div>
                    }
                />
                <div className="mt-4">
                    <DataTable value={localItems} size="small" paginator rows={5} stripedRows emptyMessage="Seleccione carpetas para comenzar.">
                        <Column header="Ver" body={(r) => (
                            <div className="flex justify-center" title="Clic para ampliar">
                                <img src={r.preview} onClick={() => openImagePreview(r.preview)} className="h-24 w-auto object-contain border shadow-sm bg-gray-100 cursor-zoom-in hover:shadow-lg transition-all hover:scale-110" alt="prev" />
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
                                    </div>
                                </div>
                            );
                        }} />
                        <Column header="Datos Sincronizados" body={(r) => (
                            <div className="text-xs space-y-1">
                                <div className="text-gray-600 font-bold"> {r.dbDateStr ? new Date(r.dbDateStr).toLocaleString() : 'Sin Fecha'}</div>
                                <div className="text-xs text-gray-400">Lat: {r.lat.toFixed(6)}, Long: {r.long.toFixed(6)}</div>
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
        </div>
    );
}