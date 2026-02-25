import React, { useEffect, useMemo, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Image } from 'primereact/image';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useFiles } from '../hooks/useFiles'; 
import PhotoUploadModal from '../components/Modals/PhotoUploadModal';
import { useTypification } from '../hooks/useTypification';

// 🔥 CONEXIÓN AL SERVIDOR CLOUDFLARE
//cloudflare con túnel directo a tu servidor local (recomendado para desarrollo):
//const API_BASE_URL = "https://capacity-preceding-skills-outline.trycloudflare.com";
//ngrok con túnel directo a tu servidor local (recomendado para desarrollo):
const API_BASE_URL="https://subobscure-hilda-audacious.ngrok-free.dev"; 
//servidor estatico enlocal
//const API_BASE_URL = "http://localhost:8080/";

// --- ALMACENAMIENTO LOCAL ---
const LocalFileStore = {
    dbName: "SigreTempPhotos", storeName: "photos",
    async open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onupgradeneeded = (e) => { if (!e.target.result.objectStoreNames.contains(this.storeName)) e.target.result.createObjectStore(this.storeName); };
            request.onsuccess = (e) => resolve(e.target.result); request.onerror = (e) => reject(e);
        });
    },
    async save(fileName, fileBlob) {
        try { const db = await this.open(); const tx = db.transaction(this.storeName, "readwrite"); tx.objectStore(this.storeName).put(fileBlob, fileName); return true; } catch (e) { return false; }
    },
    async get(fileName) {
        try { const db = await this.open(); return new Promise((resolve) => { const req = db.transaction(this.storeName, "readonly").objectStore(this.storeName).get(fileName); req.onsuccess = () => resolve(req.result); req.onerror = () => resolve(null); }); } catch (e) { return null; }
    },
    async clear() {
        try { const db = await this.open(); const tx = db.transaction(this.storeName, "readwrite"); tx.objectStore(this.storeName).clear(); return true; } catch (e) { return false; }
    }
};

// --- UTILS ---
const safeSeg = (val) => val ? val.toString().trim().toUpperCase().replace(/[\\/:*?"<>|]/g, '_') : "SIN_DATA";
const resolveFeederName = (feederProp, deficiencyObj) => {
    if (feederProp) { const val = feederProp.label || feederProp.nombre || feederProp.value || (typeof feederProp === 'string' ? feederProp : null); if (val) return String(val).split(' - ')[0].trim().toUpperCase(); }
    if (deficiencyObj) { const candidate = deficiencyObj.alimentador || deficiencyObj.Alimentador || deficiencyObj.defiAlimentador || deficiencyObj.nombreAlimentador; if (candidate) return String(candidate).split(' - ')[0].trim().toUpperCase(); }
    return "SIN_FEEDER";
};
const getPhotoTypeName = (typeId) => { const types = { 1: 'Panorámica', 2: 'Frontal', 3: 'Izquierda', 4: 'Derecha', 5: 'Medidor', 6: 'Adicional', 0: 'Otro' }; return types[typeId] || `Tipo ${typeId}`; };
const toLocalISOString = (date) => { const d = new Date(date); const pad = (n) => n.toString().padStart(2, '0'); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.000`; };
const formatCompactDate = (date) => { const d = new Date(date); const pad = (n) => n.toString().padStart(2, '0'); return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`; };
const urlToBlob = async (url) => { try { const response = await fetch(url); if (!response.ok) throw new Error("404"); return await response.blob(); } catch { return null; } };

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
        // 🟢 CAMBIO AQUÍ: Usamos toFixed(2) para 2 decimales y parseFloat para que siga siendo número
        easting: parseFloat(easting.toFixed(2)),
        northing: parseFloat(northing.toFixed(2))
    };
};

// --- COMPONENTE IMAGEN ---
const ResilientImage = ({ file, index, onImageClick, onUrlResolved, typeName, currentSupply, defCode,onDelete }) => {
    const offlinePlaceholder = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20150%20150%22%3E%3Crect%20fill%3D%22%23eeeeee%22%20width%3D%22150%22%20height%3D%22150%22%2F%3E%3Ctext%20fill%3D%22%23999999%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3ESIN%20IMAGEN%3C%2Ftext%3E%3C%2Fsvg%3E";
    const generateCandidates = (rawPath) => {
        if (!rawPath) return [];
        let base = rawPath.replace(/\\/g, '/').replace(/^.*SIGRE\.MOVIL\//i, '').replace(/^.*ELIMINADOS\//i, '').replace(/\/0000\//g, '/SINDEF/');
        const candidates = [];
        const parts = base.split('/');
        const originalFileName = parts.pop();
        const rootPathWithoutFile = parts.join('/') + '/';
        let shortFileName = null;
        const typeMatch = originalFileName.match(/[-_](\d+)\.(jpg|jpeg|png|m4a)$/i);
        if (typeMatch) shortFileName = `${typeMatch[1]}.${typeMatch[2]}`;

        const addPathVariations = (folderPath) => { candidates.push(folderPath + originalFileName); if (shortFileName) candidates.push(folderPath + shortFileName); };
        const processDeficiencyFolder = (currentPath) => {
            const complexRegex = new RegExp(`\/(${defCode})\\.(\\d+)\\.([a-zA-Z0-9]+)\/`);
            const matchComplex = currentPath.match(complexRegex);
            addPathVariations(currentPath);
            if (currentSupply && currentSupply !== '0') {
                 if (matchComplex) { const fullStr = matchComplex[0]; addPathVariations(currentPath.replace(fullStr, `/${defCode}.1.${currentSupply}/`)); addPathVariations(currentPath.replace(fullStr, `/${defCode}/${currentSupply}/`)); } 
                 else { const simpleDefRegex = new RegExp(`\/${defCode}\/`); if (currentPath.match(simpleDefRegex)) { addPathVariations(currentPath.replace(simpleDefRegex, `/${defCode}.1.${currentSupply}/`)); addPathVariations(currentPath.replace(simpleDefRegex, `/${defCode}/${currentSupply}/`)); } }
            }
            if (matchComplex) { const fullStr = matchComplex[0]; addPathVariations(currentPath.replace(fullStr, `/${defCode}/`)); for(let i=1; i<=20; i++) addPathVariations(currentPath.replace(fullStr, `/${defCode}/${i}/`)); } 
            else { const simpleDefRegex = new RegExp(`\/${defCode}\/`); if (currentPath.match(simpleDefRegex)) { for(let i=1; i<=20; i++) { if (!currentPath.includes(`/${defCode}/${i}/`)) { const split = currentPath.split(`/${defCode}/`); if (split.length > 1) addPathVariations(`${split[0]}/${defCode}/${i}/${split[1]}`); } } } }
        };

        const pathNoType = rootPathWithoutFile.replace(/\/(?:Vano|Poste)\//gi, '/');
        processDeficiencyFolder(pathNoType); processDeficiencyFolder(rootPathWithoutFile);
        const pathUpper = rootPathWithoutFile.replace(/\/Vano\//i, '/VANO/').replace(/\/Poste\//i, '/POSTE/');
        if (pathUpper !== rootPathWithoutFile) processDeficiencyFolder(pathUpper);

        return candidates.map(c => `${API_BASE_URL}/${(c.startsWith('/') ? c.substring(1) : c).split('/').map(encodeURIComponent).join('/')}`);
    };
    const candidates = useMemo(() => generateCandidates(file.archNombre || file.ARCH_Nombre), [file, currentSupply]);
    const [currentSrc, setCurrentSrc] = useState(candidates[0] || offlinePlaceholder);
    const [tryIndex, setTryIndex] = useState(0);

    useEffect(() => { setTryIndex(0); setCurrentSrc(candidates[0] || offlinePlaceholder); }, [candidates]);
    const handleLoad = () => { if (currentSrc !== offlinePlaceholder) onUrlResolved(index, currentSrc); };
    const handleError = () => { const next = tryIndex + 1; if (next < candidates.length) { setTryIndex(next); setCurrentSrc(candidates[next]); } else setCurrentSrc(offlinePlaceholder); };
    
    return (
        <div className="h-24 w-24 rounded border overflow-hidden relative cursor-pointer group hover:shadow-lg transition-all" onClick={() => onImageClick(index)}>
            <Image src={currentSrc} alt="Foto" preview={false} width="100%" className="w-full h-full object-cover" onError={handleError} onLoad={handleLoad} />
            {/* 🔴 BOTÓN DE ELIMINAR AÑADIDO */}
            <button 
                onClick={(e) => {
                    e.stopPropagation(); // Evita que se abra el Lightbox al borrar
                    onDelete(file);
                }}
                // SE HAN HECHO LOS SIGUIENTES CAMBIOS PARA RESALTARLO:
                // 1. !bg-red-600 y hover:!bg-red-700: El signo '!' fuerza el color rojo intenso.
                // 2. w-7 h-7: Se aumentó el tamaño (antes era w-6 h-6).
                // 3. border-2 border-white: Se añade un borde blanco para contraste.
                // 4. shadow-md: Añade una pequeña sombra para que "flote".
                // 5. z-20: Aseguramos que esté por encima de todo.
                className="absolute top-0 right-0 !bg-red-600 text-white w-7 h-7 border-2 border-white flex items-center justify-center rounded-bl-md shadow-md hover:!bg-red-700 transition-all z-20"
                title="Eliminar foto"
            >
                {/* Se aumentó ligeramente el tamaño del icono (de text-[10px] a text-xs) */}
                <i className="pi pi-trash text-xs font-bold"></i>
            </button>
            <div className="absolute bottom-0 w-full bg-black/70 text-white text-[9px] font-bold text-center py-0.5 uppercase tracking-tighter">{typeName}</div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
export default function EvidenceGallery({ deficiency, feeder, sed, suministro, element7004Count, my7004Correlativo }) {
    const toast = useRef(null);
    const { files, loadFiles, addFile,deleteFile } = useFiles();
    const [modalVisible, setModalVisible] = useState(false);
    const [zipLoading, setZipLoading] = useState(false);
    const resolvedUrlsRef = useRef({}); 
    const { getCodeById } = useTypification();
    const [lightboxIndex, setLightboxIndex] = useState(-1);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });

    useEffect(() => { 
        if (deficiency?.defiInterno) { 
            loadFiles(deficiency.defiInterno); 
            LocalFileStore.clear().then(() => { resolvedUrlsRef.current = {}; }); 
        } 
    }, [deficiency?.defiInterno, loadFiles]);

    const relevantFiles = useMemo(() => {
        if (!files || !deficiency) return [];
        const targetElemento = String(deficiency.defiIdElemento);
        return files.filter(file => (file.archActivo === 1 || file.archActivo === true) && String(file.archIdElemento || file.ARCH_IdElemento) === targetElemento).filter(f => !(f.archNombre||"").toLowerCase().match(/\.(m4a|mp3)$/));
    }, [files, deficiency, suministro]);
    const photos = relevantFiles;

    const handleUrlResolved = (index, url) => { resolvedUrlsRef.current[index] = url; };
    const getValue = (k) => deficiency ? (deficiency[`defi${k}`] ?? deficiency[`Defi${k}`] ?? deficiency[k] ?? deficiency[k.toLowerCase()] ?? null) : null;
    const currentSupply = String(suministro || deficiency?.defiNumSuministro || deficiency?.suministro || "0").trim();
    const defCode = String(deficiency?.tipiCodigo || "7004").trim();

const getInitialFormData = () => {
        // 1. Buscamos la fecha directamente en el objeto de la deficiencia seleccionada.
        // Cubrimos las posibles variaciones de serialización del backend (camelCase, PascalCase o el nombre exacto de la DB).
        const _fechaRaw =  deficiency?.defiFecRegistro || deficiency?.FecRegistro || getValue('FecRegistro') || getValue('Fecha');
        
        let _fecha = new Date(); 
        
        // 2. Validamos que la fecha extraída sea válida antes de asignarla.
        if (_fechaRaw) {
            const parsedDate = new Date(_fechaRaw);
            if (!isNaN(parsedDate.getTime())) {
                _fecha = parsedDate;
            }
        }

        return { 
            id: Date.now(), 
            deficiencyCode: "", 
            tipo: null, 
            date: _fecha, 
            lat: getValue('Latitud') || deficiency?.defiLatitud || '', 
            long: getValue('Longitud') || deficiency?.defiLongitud || '', 
            file: null, 
            preview: null 
        };
    };

const handleUploadSave = async (dataToSave) => {
        const feederLbl = resolveFeederName(feeder, deficiency);
        const sedLbl = safeSeg(sed?.sedCodigo || sed?.codigo || "SIN_SED");
        const codeElemLbl = safeSeg(getValue('CodigoElemento')); 
        const tipoElemRaw = getValue('TipoElemento') || 'POST';
        const tipoElem = String(tipoElemRaw).toUpperCase() === 'VANO' ? 'VANO' : 'POSTE'; 
        
        const defCodeRaw = deficiency.tipiCodigo || getCodeById(deficiency.tipiInterno) || "0000";
        const defCodeBase = String(defCodeRaw).trim();
        
        const is7004 = defCodeBase === "7004" || String(deficiency.tipiInterno) === "60";
        const isSinDef = defCodeBase === "0000" || defCodeBase === "0" || String(deficiency.tipiInterno) === "0";
        let defFolder = "", namePart = "";
        
        if (is7004) { 
            const folderNum = my7004Correlativo > 0 ? my7004Correlativo : 1; 
            defFolder = `7004/${folderNum}`; 
            // 🟢 CAMBIO: Se eliminó la parte del suministro, queda solo 7004_Correlativo
            namePart = `7004_${folderNum}`; 
        } 
        else if (isSinDef) { defFolder = "SINDEF"; namePart = "0000"; } 
        else { defFolder = defCodeBase; namePart = defCodeBase; }
        
        const fileName = `FOT-${sedLbl}-${codeElemLbl}-${namePart}-${formatCompactDate(dataToSave.date)}-${dataToSave.tipo}.jpg`;
        const dbPath = `SIGRE.MOVIL/${feederLbl}/${sedLbl}/${tipoElem}/${codeElemLbl}/${defFolder}/${fileName}`;
        
        await LocalFileStore.save(fileName, dataToSave.file);

        // 🔥🔥🔥 CONVERSIÓN A UTM ANTES DE GUARDAR 🔥🔥🔥
        const rawLat = parseFloat(dataToSave.lat) || 0;
        const rawLon = parseFloat(dataToSave.long) || 0;
        
        // Usamos la función matemática que tienes al final del archivo
        const utmCoords = latLonToUTM(rawLat, rawLon);

        const payload = { 
            archTabla: "Deficiencias",
            archInterno: 0, 
            archTipo: String(dataToSave.tipo), 
            archNombre: dbPath.substring(0, 255), 
            archCodTabla: Number(getValue('Interno')), 
            // 🟢 CAMBIO AQUÍ: Guardamos UTM Norte en latitud y UTM Este en longitud
            archLatitud: utmCoords.northing, 
            archLongitud: utmCoords.easting,
            archFecha: toLocalISOString(dataToSave.date), 
            archTipoElemento: tipoElemRaw, 
            archIdElemento: Number(getValue('IdElemento')), 
            tipiInterno: Number(deficiency.tipiInterno), 
            archActivo: true 
        };

        if (await addFile(payload)) { 
            toast.current.show({ severity: 'success', summary: 'OK', detail: 'Foto guardada (UTM)' }); 
            setModalVisible(false); 
            loadFiles(deficiency.defiInterno); 
        } 
        else {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Fallo al registrar' });
        }
    };
    const handleDeleteImage = async (file) => {
        // Confirmación simple del navegador (puedes usar confirmDialog de PrimeReact si prefieres)
        if (!window.confirm("¿Estás seguro de que deseas eliminar esta evidencia?")) return;

        const idToDelete = file.archInterno || file.ARCH_Interno;
        if (!idToDelete) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se puede eliminar una imagen sin ID' });
            return;
        }

        const success = await deleteFile(idToDelete);
        
        if (success) {
            toast.current.show({ severity: 'success', summary: 'Eliminado', detail: 'Evidencia eliminada correctamente' });
            // No necesitas recargar manualmente si tu useFiles ya hace setFiles filter
        } else {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la imagen' });
        }
    };

    // 🔥🔥🔥 FUNCIÓN ZIP CORREGIDA PARA USAR getCodeById 🔥🔥🔥
    const handleDownloadZip = async () => {
        if (photos.length === 0) return;
        setZipLoading(true);
        try {
            const zip = new JSZip();
            const getBestUrl = (f, i) => resolvedUrlsRef.current[i] || `${API_BASE_URL}/${(f.archNombre || "").replace(/\\/g, '/').replace(/^.*SIGRE\.MOVIL\//i, '').replace(/\/(?:Vano|Poste)\//gi, '/').split('/').map(encodeURIComponent).join('/')}`;
            const feederLbl = resolveFeederName(feeder, deficiency); const sedLbl = safeSeg(sed?.sedCodigo || "SIN_SED"); const codeElemLbl = safeSeg(getValue('CodigoElemento'));
            const tipoElem = (getValue('TipoElemento') || 'POST').toUpperCase() === 'VANO' ? 'VANO' : 'POSTE';
            
            // ✅ AQUÍ ESTÁ LA CORRECCIÓN: Usamos getCodeById como respaldo si tipiCodigo es null
            const defCodeRaw = deficiency.tipiCodigo || getCodeById(deficiency.tipiInterno) || "0000";
            const defCodeBase = String(defCodeRaw).trim();
            
            const is7004 = defCodeBase === "7004" || String(deficiency.tipiInterno) === "60";
            
            for (let i = 0; i < photos.length; i++) {
                const f = photos[i];
                let pathStr = "";
                
                // Si es 7004, usamos la carpeta correcta con el correlativo
                if (is7004 && my7004Correlativo > 0) {
                    pathStr = `${feederLbl}/${sedLbl}/${tipoElem}/${codeElemLbl}/7004/${my7004Correlativo}`;
                } 
                else {
                    // Si no es 7004, usamos el código base (que ahora SÍ tiene el código correcto gracias a getCodeById)
                    pathStr = `${feederLbl}/${sedLbl}/${tipoElem}/${codeElemLbl}/${defCodeBase}`;
                }
                
                const blob = await LocalFileStore.get(f.archNombre.split('/').pop()) || await urlToBlob(getBestUrl(f, i));
                if (blob) zip.folder(pathStr).file(f.archNombre.split('/').pop(), blob);
            }
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `Deficiencia_${getValue('CodigoElemento')}.zip`);
            toast.current.show({ severity: 'success', summary: 'ZIP', detail: 'Descargando...' });
        } catch { toast.current.show({ severity: 'error', summary: 'Error', detail: 'Fallo ZIP' }); } finally { setZipLoading(false); }
    };

    // Lightbox Logic (Igual que antes)
    const openLightbox = (index) => { setLightboxIndex(index); setZoomLevel(1); setPosition({ x: 0, y: 0 }); };
    const closeLightbox = () => { setLightboxIndex(-1); setZoomLevel(1); setIsDragging(false); };
    const navigate = (d) => { setZoomLevel(1); setPosition({x:0,y:0}); setLightboxIndex((lightboxIndex + d + photos.length) % photos.length); };
    const zoom = (delta) => { setZoomLevel(p => Math.min(Math.max(p + delta, 1), 5)); if(zoomLevel<=1) setPosition({x:0,y:0}); };
    const renderLightbox = () => {
        if (lightboxIndex === -1) return null;
        let src = resolvedUrlsRef.current[lightboxIndex] || `${API_BASE_URL}/${photos[lightboxIndex].archNombre.replace(/\\/g, '/').replace(/^.*SIGRE\.MOVIL\//i, '').split('/').map(encodeURIComponent).join('/')}`;
        return ReactDOM.createPortal(
            <div className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center" onClick={closeLightbox}>
                 <button onClick={(e) => { e.stopPropagation(); closeLightbox(); }} className="fixed top-4 right-4 z-[100] text-white/80 hover:text-white p-2"><i className="pi pi-times text-2xl"></i></button>
                 <button onClick={(e) => { e.stopPropagation(); navigate(-1); }} className="fixed left-4 top-1/2 z-[100] text-white/60 hover:text-white"><i className="pi pi-chevron-left text-4xl"></i></button>
                 <button onClick={(e) => { e.stopPropagation(); navigate(1); }} className="fixed right-4 top-1/2 z-[100] text-white/60 hover:text-white"><i className="pi pi-chevron-right text-4xl"></i></button>
                 <div className="fixed bottom-10 z-[100] flex gap-4 bg-black/50 px-4 py-2 rounded-full"><button onClick={(e)=>{e.stopPropagation(); zoom(-0.5);}} className="text-white"><i className="pi pi-minus"></i></button><span className="text-white font-bold">{Math.round(zoomLevel*100)}%</span><button onClick={(e)=>{e.stopPropagation(); zoom(0.5);}} className="text-white"><i className="pi pi-plus"></i></button></div>
                 <img src={src} className="max-w-none transition-transform duration-100 ease-out" style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`, maxHeight: '100vh', maxWidth: '100vw', objectFit: 'contain' }} onClick={(e)=>e.stopPropagation()} 
                      onMouseDown={(e)=>{if(zoomLevel>1){setIsDragging(true); dragStartRef.current={x:e.clientX-position.x, y:e.clientY-position.y};}}} 
                      onMouseMove={(e)=>{if(isDragging && zoomLevel>1){e.preventDefault(); setPosition({x:e.clientX-dragStartRef.current.x, y:e.clientY-dragStartRef.current.y});}}} 
                      onMouseUp={()=>setIsDragging(false)} />
            </div>, document.body
        );
    };

    if (!deficiency) return <div className="h-full flex items-center justify-center text-gray-400">Selecciona un registro</div>;

    return (
        <div className="flex flex-col h-full bg-white font-sans">
            <Toast ref={toast} />
            <div className="flex-none p-2 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-700 uppercase"><i className="pi pi-images mr-1"></i>Galería</span>
                    <Tag severity="info" value={`${photos.length} Fotos`} className="text-[10px] px-2" rounded />
                    {currentSupply && currentSupply !== '0' && (
                        <Tag severity="warning" className="text-[10px] px-2" rounded>
                            <i className="pi pi-bolt mr-1 text-[9px]"></i>
                            SUM: {currentSupply}
                        </Tag>
                    )}
                    {my7004Correlativo > 0 && (
                        <Tag severity="success" className="text-[10px] px-2" rounded>
                            <i className="pi pi-folder mr-1 text-[9px]"></i>
                            CARPETA: {my7004Correlativo}
                        </Tag>
                    )}
                </div>
                <Button 
                    onClick={handleDownloadZip} 
                    disabled={photos.length === 0 || zipLoading}
                    tooltip="Descargar todas las fotos en ZIP"
                    className="p-button-sm px-3 h-10 shadow-md border-none flex items-center gap-2 hover:scale-105 transition-transform"
                    style={{ 
                        background: (photos.length === 0 || zipLoading) 
                            ? undefined 
                            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
                        color: '#fff' 
                    }}
                >
                    <i className={`pi ${zipLoading ? "pi-spin pi-spinner" : "pi-download"} text-lg font-bold`}></i>
                    <div className="flex flex-col items-start leading-none">
                        <span className="font-extrabold text-[10px] tracking-wide">
                            {zipLoading ? "CREANDO..." : "DESCARGAR"}
                        </span>
                        <span className="text-[9px] font-medium opacity-90">
                            FOTOS ZIP
                        </span>
                    </div>
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 bg-gray-100/50">
                 <div className="flex flex-wrap gap-2 content-start">
                    <div onClick={() => setModalVisible(true)} className="h-24 w-24 rounded border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-white group transition-colors bg-gray-50">
                        <i className="pi pi-camera text-2xl text-gray-400 group-hover:text-blue-500"></i>
                        <span className="text-[9px] text-gray-500 font-bold mt-1 uppercase">Agregar</span>
                    </div>
                    {photos.map((f, i) => (
                        <ResilientImage 
                            key={f.archInterno ? f.archInterno : `temp-${i}-${currentSupply}`}
                            index={i} file={f} 
                            onDelete={handleDeleteImage}
                            onImageClick={openLightbox} onUrlResolved={handleUrlResolved} 
                            typeName={getPhotoTypeName(parseInt(f.archTipo || f.ARCH_Tipo, 10))}
                            currentSupply={currentSupply} defCode={defCode}
                        />
                    ))}
                 </div>
            </div>
            {renderLightbox()}
            <PhotoUploadModal visible={modalVisible} onHide={() => setModalVisible(false)} onSave={handleUploadSave} isEditing={false} initialData={getInitialFormData()} currentPhotos={photos} deficiencyData={deficiency} forcedSupply={suministro} forcedCorrelativo={my7004Correlativo} contextData={{feeder, sed, elementCode: getValue('CodigoElemento'), elementType: getValue('TipoElemento')}} />
        </div>
    );
}