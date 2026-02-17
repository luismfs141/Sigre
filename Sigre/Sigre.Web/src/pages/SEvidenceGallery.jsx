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

// --- COMPONENTE IMAGEN ---
const ResilientImage = ({ file, index, onImageClick, onUrlResolved, typeName, currentSupply, defCode }) => {
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
            <div className="absolute bottom-0 w-full bg-black/70 text-white text-[9px] font-bold text-center py-0.5 uppercase tracking-tighter">{typeName}</div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
export default function EvidenceGallery({ deficiency, feeder, sed, suministro, element7004Count, my7004Correlativo }) {
    const toast = useRef(null);
    const { files, loadFiles, addFile } = useFiles();
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
        const _fechaRaw = getValue('FecRegistro') || getValue('Fecha');
        let _fecha = new Date(); 
        if (_fechaRaw && !isNaN(new Date(_fechaRaw).getTime())) _fecha = new Date(_fechaRaw);
        return { 
            id: Date.now(), 
            deficiencyCode: "", 
            tipo: null, 
            date: _fecha, 
            lat: getValue('Latitud') || '', 
            long: getValue('Longitud') || '', 
            file: null, 
            preview: null 
        };
    };

    const handleUploadSave = async (dataToSave) => {
        const feederLbl = resolveFeederName(feeder, deficiency);
        const sedLbl = safeSeg(sed?.sedCodigo || sed?.codigo || "SIN_SED");
        const codeElemLbl = safeSeg(getValue('CodigoElemento')); 
        const tipoElemRaw = getValue('TipoElemento') || 'POST';
        const tipoElem = String(tipoElemRaw).toUpperCase() === 'VANO' ? 'Vano' : 'Poste'; 
        
        // CORRECCIÓN TAMBIÉN AQUÍ PARA CONSISTENCIA
        const defCodeRaw = deficiency.tipiCodigo || getCodeById(deficiency.tipiInterno) || "0000";
        const defCodeBase = String(defCodeRaw).trim();
        
        const is7004 = defCodeBase === "7004" || String(deficiency.tipiInterno) === "60";
        const isSinDef = defCodeBase === "0000" || defCodeBase === "0" || String(deficiency.tipiInterno) === "0";
        let defFolder = "", namePart = "";
        
        if (is7004) { 
            const folderNum = my7004Correlativo > 0 ? my7004Correlativo : 1; 
            defFolder = `7004/${folderNum}`; 
            namePart = `7004_${folderNum}-${(currentSupply && currentSupply !== '0') ? currentSupply : "00000"}`; 
        } 
        else if (isSinDef) { defFolder = "SINDEF"; namePart = "0000"; } 
        else { defFolder = defCodeBase; namePart = defCodeBase; }
        
        const fileName = `FOT-${sedLbl}-${codeElemLbl}-${namePart}-${formatCompactDate(dataToSave.date)}-${dataToSave.tipo}.jpg`;
        const dbPath = `SIGRE.MOVIL/${feederLbl}/${sedLbl}/${tipoElem}/${codeElemLbl}/${defFolder}/${fileName}`;
        await LocalFileStore.save(fileName, dataToSave.file);

        const payload = { archTabla: "Deficiencias",archInterno: 0, archTipo: String(dataToSave.tipo), archNombre: dbPath.substring(0, 255), archTabla: "Deficiencias", archCodTabla: Number(getValue('Interno')), archLatitud: parseFloat(dataToSave.lat)||0, archLongitud: parseFloat(dataToSave.long)||0, archFecha: toLocalISOString(dataToSave.date), archTipoElemento: tipoElemRaw, archIdElemento: Number(getValue('IdElemento')), tipiInterno: Number(deficiency.tipiInterno), archActivo: true };
        if (await addFile(payload)) { toast.current.show({ severity: 'success', summary: 'OK', detail: 'Foto guardada' }); setModalVisible(false); loadFiles(deficiency.defiInterno); } 
        else toast.current.show({ severity: 'error', summary: 'Error', detail: 'Fallo al registrar' });
    };

    // 🔥🔥🔥 FUNCIÓN ZIP CORREGIDA PARA USAR getCodeById 🔥🔥🔥
    const handleDownloadZip = async () => {
        if (photos.length === 0) return;
        setZipLoading(true);
        try {
            const zip = new JSZip();
            const getBestUrl = (f, i) => resolvedUrlsRef.current[i] || `${API_BASE_URL}/${(f.archNombre || "").replace(/\\/g, '/').replace(/^.*SIGRE\.MOVIL\//i, '').replace(/\/(?:Vano|Poste)\//gi, '/').split('/').map(encodeURIComponent).join('/')}`;
            const feederLbl = resolveFeederName(feeder, deficiency); const sedLbl = safeSeg(sed?.sedCodigo || "SIN_SED"); const codeElemLbl = safeSeg(getValue('CodigoElemento'));
            const tipoElem = (getValue('TipoElemento') || 'POST').toUpperCase() === 'VANO' ? 'Vano' : 'Poste';
            
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