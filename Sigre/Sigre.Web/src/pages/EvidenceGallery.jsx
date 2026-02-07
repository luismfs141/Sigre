import React, { useEffect, useMemo, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Image } from 'primereact/image';
import { Tag } from 'primereact/tag';
import { Skeleton } from 'primereact/skeleton';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useFiles } from '../hooks/useFiles'; 
import PhotoUploadModal from '../components/Modals/PhotoUploadModal';

// --- 📦 ALMACENAMIENTO LOCAL (IndexedDB) ---
const LocalFileStore = {
    dbName: "SigreTempPhotos",
    storeName: "photos",
    async open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onupgradeneeded = (e) => {
                if (!e.target.result.objectStoreNames.contains(this.storeName)) {
                    e.target.result.createObjectStore(this.storeName);
                }
            };
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e);
        });
    },
    async save(fileName, fileBlob) {
        try {
            const db = await this.open();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.storeName, "readwrite");
                tx.objectStore(this.storeName).put(fileBlob, fileName);
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => reject(false);
            });
        } catch (e) { console.error("Error DB Save:", e); return false; }
    },
    async get(fileName) {
        try {
            const db = await this.open();
            return new Promise((resolve) => {
                const tx = db.transaction(this.storeName, "readonly");
                const req = tx.objectStore(this.storeName).get(fileName);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => resolve(null);
            });
        } catch (e) { return null; }
    },
    async clear() {
        try {
            const db = await this.open();
            return new Promise((resolve) => {
                const tx = db.transaction(this.storeName, "readwrite");
                tx.objectStore(this.storeName).clear();
                tx.oncomplete = () => resolve(true);
            });
        } catch (e) { return false; }
    }
};

// --- UTILIDADES ---
const safeSeg = (val) => val ? val.toString().trim().toUpperCase().replace(/[\\/:*?"<>|]/g, '_') : "SIN_DATA";

const resolveFeederName = (feederProp, deficiencyObj) => {
    // 1. Intentar Prop
    if (feederProp) {
        const val = feederProp.label || feederProp.nombre || feederProp.value || (typeof feederProp === 'string' ? feederProp : null);
        if (val) return String(val).split(' - ')[0].trim().toUpperCase();
    }
    // 2. Intentar Deficiencia
    if (deficiencyObj) {
        const candidate = deficiencyObj.alimentador || deficiencyObj.Alimentador || deficiencyObj.defiAlimentador || deficiencyObj.nombreAlimentador;
        if (candidate) return String(candidate).split(' - ')[0].trim().toUpperCase();
    }
    return "SIN_FEEDER";
};

const getPhotoTypeName = (typeId) => {
    const types = { 1: 'Panorámica', 2: 'Frontal', 3: 'Izquierda', 4: 'Derecha', 5: 'Medidor', 6: 'Adicional', 0: 'Otro' };
    return types[typeId] || `Tipo ${typeId}`;
};

const toLocalISOString = (date) => {
    const d = new Date(date);
    const pad = (n) => n.toString().padStart(2, '0');
    const pad3 = (n) => n.toString().padStart(3, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad3(d.getMilliseconds())}`;
};

const formatCompactDate = (date) => {
    const d = new Date(date);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

const urlToBlob = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("404");
        return await response.blob();
    } catch { return null; }
};

export default function EvidenceGallery({ deficiency, feeder, sed, onCountUpdate }) {
    
    // Logs de depuración (puedes quitarlos si ya funciona bien el feeder)
    useEffect(() => {
        console.groupCollapsed("🚀 RENDER EVIDENCE GALLERY");
        console.log("Feeder:", resolveFeederName(feeder, deficiency));
        console.groupEnd();
    }, [feeder, deficiency]);

    const toast = useRef(null);
    const { files, loadingFiles, loadFiles, addFile } = useFiles();
    const [modalVisible, setModalVisible] = useState(false);
    const [zipLoading, setZipLoading] = useState(false);
    const [localCacheVersion, setLocalCacheVersion] = useState(0); 

    useEffect(() => { 
        if (deficiency?.defiInterno) {
            loadFiles(deficiency.defiInterno);
            LocalFileStore.clear().then(() => setLocalCacheVersion(v => v + 1));
        }
    }, [deficiency?.defiInterno, loadFiles]);

    const relevantFiles = useMemo(() => {
        if (!files || !deficiency) return [];
        return files.filter(file => {
            const valActivo = file.archActivo ?? file.ARCH_Activo;
            return (valActivo === 1 || valActivo === true) && 
                   String(file.archIdElemento || file.ARCH_IdElemento) === String(deficiency.defiIdElemento) &&
                   String(file.archTipoElemento || file.ARCH_TipoElemento).toUpperCase() === String(deficiency.defiTipoElemento).toUpperCase();
        });
    }, [files, deficiency]);

    // 🔥🔥 AQUÍ ESTÁ LA CORRECCIÓN PARA "SINDEF" 🔥🔥
    const getFileUrl = (file) => {
        let rawName = file.archNombre || file.ARCH_Nombre || "";
        if (!rawName) return null;
        
        // 1. Normalizar slashes
        rawName = rawName.replace(/\\/g, '/');
        
        // 2. Quitar raíz
        rawName = rawName.replace(/^.*SIGRE\.MOVIL\//i, '');
        
        // 3. 🚨 RESTAURADO: Traducción de códigos históricos
        // Si la BD dice ".../0000/...", lo cambiamos a ".../SINDEF/..." para que el servidor lo encuentre
        rawName = rawName.replace(/\/0000\//g, '/SINDEF/');
        
        // 4. Normalizar mayúsculas de carpetas clave (por si acaso)
        rawName = rawName.replace(/\/Vano\//i, '/VANO/').replace(/\/Poste\//i, '/POSTE/');

        return `${process.env.REACT_APP_FOTOS_URL || "https://capacity-preceding-skills-outline.trycloudflare.com/"}${rawName.split('/').map(encodeURIComponent).join('/')}`;
    };

    const { audios, photos } = useMemo(() => {
        const a = [], p = [];
        relevantFiles.forEach(f => (f.archNombre||"").toLowerCase().match(/\.(m4a|mp3)$/) ? a.push(f) : p.push(f));
        return { audios: a, photos: p };
    }, [relevantFiles]);

    const getValue = (keyBase) => {
        if (!deficiency) return null;
        return deficiency[`defi${keyBase}`] ?? deficiency[`Defi${keyBase}`] ?? deficiency[keyBase] ?? deficiency[keyBase.toLowerCase()] ?? null;
    };

    const getInitialFormData = () => {
        const _fechaRaw = getValue('FecRegistro') || getValue('Fecha');
        let _fecha = new Date(); 
        if (_fechaRaw && !isNaN(new Date(_fechaRaw).getTime())) _fecha = new Date(_fechaRaw);
        return { 
            id: Date.now(), deficiencyCode: "", tipo: null, date: _fecha, 
            lat: getValue('Latitud') || '', long: getValue('Longitud') || '', file: null, preview: null 
        };
    };

    // ------------------------------------------------------------------
    // GUARDADO
    // ------------------------------------------------------------------
    const handleUploadSave = async (dataToSave) => {
        const feederLbl = resolveFeederName(feeder, deficiency);
        const sedLbl = safeSeg(sed?.sedCodigo || sed?.codigo || "SIN_SED");
        const codeElemLbl = safeSeg(getValue('CodigoElemento')); 
        const tipoElemRaw = getValue('TipoElemento') || 'POST';
        const tipoElem = String(tipoElemRaw).toUpperCase() === 'VANO' ? 'Vano' : 'Poste'; 
        const idElem = getValue('IdElemento');                   
        
        let defCodeFolder = safeSeg(deficiency.tipiCodigo || "6002"); 
        
        // Si el código es 0000 (S/D), podemos forzar SINDEF en la ruta si lo deseas, 
        // pero la corrección visual en getFileUrl ya debería bastar para verlas.
        
        const compactDate = formatCompactDate(dataToSave.date);
        const fileName = `FOT-${sedLbl}-${codeElemLbl}-${defCodeFolder}-${compactDate}-${dataToSave.tipo}.jpg`;
        const relativePath = `${feederLbl}/${sedLbl}/${tipoElem}/${codeElemLbl}/${defCodeFolder}`;
        const dbPath = `SIGRE.MOVIL/${relativePath}/${fileName}`;

        try { await LocalFileStore.save(fileName, dataToSave.file); } catch (e) { console.error(e); }

        const payload = {
            archInterno: 0,
            archTipo: String(dataToSave.tipo),
            archNombre: dbPath.substring(0, 150),
            archTabla: "Deficiencias",
            archCodTabla: Number(getValue('Interno')),
            archLatitud: parseFloat(dataToSave.lat) || 0,
            archLongitud: parseFloat(dataToSave.long) || 0,
            archFecha: toLocalISOString(dataToSave.date),
            archTipoElemento: tipoElemRaw,
            archIdElemento: Number(idElem),
            tipiInterno: Number(deficiency.tipiInterno),
            archActivo: true 
        };

        const success = await addFile(payload);
        if (success) {
            toast.current.show({ severity: 'success', summary: 'Registrado', detail: 'Foto guardada.' });
            setModalVisible(false);
            loadFiles(deficiency.defiInterno);
            setLocalCacheVersion(v => v + 1);
        } else {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Fallo al registrar.' });
        }
    };

    // ------------------------------------------------------------------
    // ZIP GENERATOR
    // ------------------------------------------------------------------
    const handleDownloadZip = async () => {
        if (photos.length === 0) return;
        setZipLoading(true);
        try {
            const zip = new JSZip();

            const feederLbl = resolveFeederName(feeder, deficiency);
            const sedLbl = safeSeg(sed?.sedCodigo || sed?.codigo || "SIN_SED");
            const codeElemLbl = safeSeg(getValue('CodigoElemento'));
            const tipoElem = String(getValue('TipoElemento') || 'POST').toUpperCase() === 'VANO' ? 'Vano' : 'Poste';
            let defCodeFolder = safeSeg(deficiency.tipiCodigo || "6002");
            
            const serverFolderPath = `SIGRE.MOVIL/${feederLbl}/${sedLbl}/${tipoElem}/${codeElemLbl}/${defCodeFolder}`;
            const targetFolder = zip.folder(serverFolderPath);

            for (let i = 0; i < photos.length; i++) {
                const fileRec = photos[i];
                const fileName = (fileRec.archNombre || fileRec.ARCH_Nombre || "").split(/[/\\]/).pop();
                
                let fileBlob = await LocalFileStore.get(fileName);
                if (!fileBlob) {
                    const url = getFileUrl(fileRec);
                    if (url) fileBlob = await urlToBlob(url);
                }

                if (fileBlob) {
                    targetFolder.file(decodeURIComponent(fileName), fileBlob);
                }
            }

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `Deficiencia_${getValue('CodigoElemento')}.zip`);
            toast.current.show({ severity: 'success', summary: 'ZIP Listo', detail: 'Descarga iniciada.' });

        } catch (e) {
            console.error(e);
            toast.current.show({ severity: 'error', summary: 'Error ZIP', detail: 'Falló la generación.' });
        } finally {
            setZipLoading(false);
        }
    };

    // --- VISOR ---
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(-1);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });

    const openLightbox = (index) => { setSelectedPhotoIndex(index); setZoomLevel(1); setPosition({ x: 0, y: 0 }); };
    const closeLightbox = () => { setSelectedPhotoIndex(-1); setZoomLevel(1); setPosition({ x: 0, y: 0 }); setIsDragging(false); };
    const handleNext = (e) => { e?.stopPropagation(); setZoomLevel(1); setPosition({x:0,y:0}); setSelectedPhotoIndex((prev) => (prev + 1) % photos.length); };
    const handlePrev = (e) => { e?.stopPropagation(); setZoomLevel(1); setPosition({x:0,y:0}); setSelectedPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length); };
    const handleZoomIn = (e) => { e?.stopPropagation(); setZoomLevel(prev => Math.min(prev + 0.5, 5)); };
    const handleZoomOut = (e) => { e?.stopPropagation(); setZoomLevel(prev => { const n = Math.max(prev - 0.5, 1); if (n===1) setPosition({x:0,y:0}); return n; }); };
    const handleMouseDown = (e) => { if (zoomLevel > 1) { e.preventDefault(); e.stopPropagation(); setIsDragging(true); dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y }; } };
    const handleMouseMove = (e) => { if (isDragging && zoomLevel > 1) { e.preventDefault(); e.stopPropagation(); setPosition({ x: e.clientX - dragStartRef.current.x, y: e.clientY - dragStartRef.current.y }); } };
    const handleMouseUp = () => { setIsDragging(false); };

    const renderLightbox = () => {
        if (selectedPhotoIndex === -1 || !photos[selectedPhotoIndex]) return null;
        return ReactDOM.createPortal(
            <div className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center overflow-hidden" onClick={closeLightbox} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                <button onClick={(e) => { e.stopPropagation(); closeLightbox(); }} className="fixed top-4 right-4 z-[100002] bg-transparent text-white/80 hover:text-white rounded-full p-2"><i className="pi pi-times text-2xl"></i></button>
                <button onClick={handlePrev} className="fixed left-4 top-1/2 -translate-y-1/2 z-[100001] text-white/60 hover:text-white"><i className="pi pi-chevron-left text-4xl"></i></button>
                <button onClick={handleNext} className="fixed right-4 top-1/2 -translate-y-1/2 z-[100001] text-white/60 hover:text-white"><i className="pi pi-chevron-right text-4xl"></i></button>
                <div className="w-full h-full flex items-center justify-center overflow-hidden" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}>
                    <img src={getFileUrl(photos[selectedPhotoIndex])} alt="Full" draggable={false} className="max-w-none transition-transform duration-100 ease-out select-none" style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`, maxHeight: '100vh', maxWidth: '100vw', objectFit: 'contain' }} onClick={(e)=>e.stopPropagation()}/>
                </div>
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100001] flex gap-4 bg-black/40 px-4 py-2 rounded-full" onClick={(e)=>e.stopPropagation()}>
                    <button onClick={handleZoomOut} disabled={zoomLevel<=1} className="text-white"><i className="pi pi-minus"></i></button>
                    <span className="text-white text-sm">{Math.round(zoomLevel*100)}%</span>
                    <button onClick={handleZoomIn} disabled={zoomLevel>=5} className="text-white"><i className="pi pi-plus"></i></button>
                </div>
            </div>, document.body
        );
    };

    const offlinePlaceholder = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22150%22%20height%3D%22150%22%20viewBox%3D%220%200%20150%20150%22%3E%3Crect%20fill%3D%22%23eeeeee%22%20width%3D%22150%22%20height%3D%22150%22%2F%3E%3Ctext%20fill%3D%22%23999999%22%20font-family%3D%22sans-serif%22%20font-size%3D%2212%22%20dy%3D%2210.5%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3ESIN%20IMAGEN%3C%2Ftext%3E%3C%2Fsvg%3E";

    if (!deficiency) return <div className="h-full flex items-center justify-center text-gray-400">Selecciona un registro</div>;
    
    return (
        <div className="flex flex-col h-full bg-white font-sans border-t border-gray-200">
            <Toast ref={toast} />
            <div className="flex-none p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-black text-gray-800 m-0 leading-none">{getValue('CodigoElemento') || "SIN CÓDIGO"}</h2>
                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">ID: {getValue('Interno')} • {getValue('TipoElemento')}</span>
                </div>
                <div className="flex gap-2 items-center">
                    <Tag severity="info" value={`${photos.length} Fotos`} className="text-[10px]" />
                    <Button icon={zipLoading ? "pi pi-spin pi-spinner" : "pi pi-download"} className="p-button-rounded p-button-text p-button-sm w-8 h-8" tooltip="Descargar ZIP" onClick={handleDownloadZip} disabled={photos.length === 0} />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 bg-white">
                 <div className="flex flex-wrap gap-2">
                    <div onClick={() => setModalVisible(true)} className="h-24 w-24 rounded border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 group">
                        <i className="pi pi-plus text-2xl text-gray-400 group-hover:text-blue-500"></i>
                        <span className="text-[10px] text-gray-500">Agregar</span>
                    </div>
                    {photos.map((f, i) => {
                        const tipoNum = parseInt(f.archTipo || f.ARCH_Tipo, 10);
                        return (
                            <div key={i} className="h-24 w-24 rounded border overflow-hidden relative cursor-pointer group" onClick={() => openLightbox(i)}>
                                {/* Placeholder si la imagen falla */}
                                <Image src={getFileUrl(f)} alt="Foto" preview={false} width="100%" className="w-full h-full object-cover" 
                                    onError={(e) => { 
                                        e.target.onerror = null; 
                                        e.target.src = offlinePlaceholder;
                                    }} 
                                />
                                <div className="absolute bottom-0 w-full bg-black/70 text-white text-[9px] font-bold text-center py-0.5 uppercase tracking-tighter">
                                    {getPhotoTypeName(tipoNum)}
                                </div>
                            </div>
                        );
                    })}
                 </div>
            </div>

            {renderLightbox()}

            <PhotoUploadModal 
                visible={modalVisible}
                onHide={() => setModalVisible(false)}
                onSave={handleUploadSave}
                isEditing={false} 
                initialData={getInitialFormData()} 
                currentPhotos={photos} 
            />
        </div>
    );
}