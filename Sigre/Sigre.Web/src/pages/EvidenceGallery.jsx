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

// 🔥 CONEXIÓN AL SERVIDOR CLOUDFLARE
//const API_BASE_URL = "https://capacity-preceding-skills-outline.trycloudflare.com";
const API_BASE_URL = "http://localhost:8080/";

// --- 📦 ALMACENAMIENTO LOCAL ---
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
        } catch (e) { return false; }
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
    if (feederProp) {
        const val = feederProp.label || feederProp.nombre || feederProp.value || (typeof feederProp === 'string' ? feederProp : null);
        if (val) return String(val).split(' - ')[0].trim().toUpperCase();
    }
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

// --- 🔥 COMPONENTE IMAGEN "WATERFALL" 🔥 ---
const ResilientImage = ({ file, index, onImageClick, onUrlResolved, typeName, currentSupply, defCode }) => {
    const offlinePlaceholder = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20150%20150%22%3E%3Crect%20fill%3D%22%23eeeeee%22%20width%3D%22150%22%20height%3D%22150%22%2F%3E%3Ctext%20fill%3D%22%23999999%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3ESIN%20IMAGEN%3C%2Ftext%3E%3C%2Fsvg%3E";
    
    const generateCandidates = (rawPath) => {
        if (!rawPath) return [];
        
        let base = rawPath.replace(/\\/g, '/')
                          .replace(/^.*SIGRE\.MOVIL\//i, '')
                          .replace(/^.*ELIMINADOS\//i, '')
                          .replace(/\/0000\//g, '/SINDEF/');
        
        const candidates = [];
        const parts = base.split('/');
        const originalFileName = parts.pop();
        const rootPathWithoutFile = parts.join('/') + '/';

        // 2. Extraer nombre corto
        let shortFileName = null;
        const typeMatch = originalFileName.match(/[-_](\d+)\.(jpg|jpeg|png|m4a)$/i);
        if (typeMatch) shortFileName = `${typeMatch[1]}.${typeMatch[2]}`;

        const addPathVariations = (folderPath) => {
            candidates.push(folderPath + originalFileName);
            if (shortFileName) candidates.push(folderPath + shortFileName);
        };

        const processDeficiencyFolder = (currentPath) => {
            const complexRegex = new RegExp(`\/(${defCode})\\.(\\d+)\\.([a-zA-Z0-9]+)\/`);
            const matchComplex = currentPath.match(complexRegex);
            
            addPathVariations(currentPath);

            // Inyección de Suministro actual
            if (currentSupply && currentSupply !== '0') {
                 if (matchComplex) {
                     const fullStr = matchComplex[0]; 
                     addPathVariations(currentPath.replace(fullStr, `/${defCode}.1.${currentSupply}/`));
                     addPathVariations(currentPath.replace(fullStr, `/${defCode}/${currentSupply}/`));
                 } else {
                     const simpleDefRegex = new RegExp(`\/${defCode}\/`);
                     if (currentPath.match(simpleDefRegex)) {
                         addPathVariations(currentPath.replace(simpleDefRegex, `/${defCode}.1.${currentSupply}/`));
                         addPathVariations(currentPath.replace(simpleDefRegex, `/${defCode}/${currentSupply}/`));
                     }
                 }
            }

            // Simplificación y Subíndices 1-20
            if (matchComplex) {
                const fullStr = matchComplex[0];
                addPathVariations(currentPath.replace(fullStr, `/${defCode}/`));
                for(let i=1; i<=20; i++) {
                     addPathVariations(currentPath.replace(fullStr, `/${defCode}/${i}/`));
                }
            } else {
                const simpleDefRegex = new RegExp(`\/${defCode}\/`);
                if (currentPath.match(simpleDefRegex)) {
                     for(let i=1; i<=20; i++) {
                         if (!currentPath.includes(`/${defCode}/${i}/`)) {
                            const split = currentPath.split(`/${defCode}/`);
                            if (split.length > 1) addPathVariations(`${split[0]}/${defCode}/${i}/${split[1]}`);
                         }
                     }
                }
            }
        };

        const pathNoType = rootPathWithoutFile.replace(/\/(?:Vano|Poste)\//gi, '/');
        processDeficiencyFolder(pathNoType);
        processDeficiencyFolder(rootPathWithoutFile);
        
        const pathUpper = rootPathWithoutFile.replace(/\/Vano\//i, '/VANO/').replace(/\/Poste\//i, '/POSTE/');
        if (pathUpper !== rootPathWithoutFile) processDeficiencyFolder(pathUpper);

        const len = candidates.length;
        for (let i = 0; i < len; i++) {
            const c = candidates[i];
            if (c.toLowerCase().endsWith('.jpg')) candidates.push(c.substring(0, c.length - 4));
        }

        // 🔥 USAR API_BASE_URL DE CLOUDFLARE 🔥
        return candidates.map(c => {
             // Quitamos cualquier slash inicial para evitar dobles slashes
             const cleanPath = c.startsWith('/') ? c.substring(1) : c;
             return `${API_BASE_URL}/${cleanPath.split('/').map(encodeURIComponent).join('/')}`;
        });
    };

    const candidates = useMemo(() => generateCandidates(file.archNombre || file.ARCH_Nombre), [file, currentSupply]);
    const [currentSrc, setCurrentSrc] = useState(candidates[0] || offlinePlaceholder);
    const [tryIndex, setTryIndex] = useState(0);

    useEffect(() => {
        setTryIndex(0);
        setCurrentSrc(candidates[0] || offlinePlaceholder);
    }, [candidates]);

    const handleLoad = () => {
        if (currentSrc !== offlinePlaceholder) onUrlResolved(index, currentSrc); 
    };

    const handleError = () => {
        const nextIndex = tryIndex + 1;
        if (nextIndex < candidates.length) {
            setTryIndex(nextIndex);
            setCurrentSrc(candidates[nextIndex]);
        } else {
            setCurrentSrc(offlinePlaceholder);
        }
    };

    return (
        <div className="h-24 w-24 rounded border overflow-hidden relative cursor-pointer group" onClick={() => onImageClick(index)}>
            <Image 
                src={currentSrc} 
                alt="Foto" 
                preview={false} 
                width="100%" 
                className="w-full h-full object-cover" 
                onError={handleError}
                onLoad={handleLoad} 
            />
            <div className="absolute bottom-0 w-full bg-black/70 text-white text-[9px] font-bold text-center py-0.5 uppercase tracking-tighter">
                {typeName}
            </div>
        </div>
    );
};

export default function EvidenceGallery({ deficiency, feeder, sed, onCountUpdate,suministro }) {
    const toast = useRef(null);
    const { files, loadingFiles, loadFiles, addFile } = useFiles();
    const [modalVisible, setModalVisible] = useState(false);
    const [zipLoading, setZipLoading] = useState(false);
    const [localCacheVersion, setLocalCacheVersion] = useState(0); 
    const resolvedUrlsRef = useRef({}); 

    const [lightboxIndex, setLightboxIndex] = useState(-1);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });

    useEffect(() => { 
        if (deficiency?.defiInterno) {
            loadFiles(deficiency.defiInterno);
            LocalFileStore.clear().then(() => {
                setLocalCacheVersion(v => v + 1);
                resolvedUrlsRef.current = {}; 
            });
        }
    }, [deficiency?.defiInterno, loadFiles]);

    const relevantFiles = useMemo(() => {
        if (!files || !deficiency) return [];
        const targetSuministro = String(suministro || "").trim();
        const targetElemento = String(deficiency.defiIdElemento);

        return files.filter(file => {
            const valActivo = file.archActivo ?? file.ARCH_Activo;
            if (valActivo != 1 && valActivo !== true) return false;
            
            if (String(file.archIdElemento || file.ARCH_IdElemento) !== targetElemento) return false;
            
            return true;
        });
    }, [files, deficiency,suministro]);

    const { photos } = useMemo(() => {
        return { photos: relevantFiles.filter(f => !(f.archNombre||"").toLowerCase().match(/\.(m4a|mp3)$/)) };
    }, [relevantFiles]);

    const handleUrlResolved = (index, url) => {
        resolvedUrlsRef.current[index] = url;
    };

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

    const handleUploadSave = async (dataToSave) => {
        const feederLbl = resolveFeederName(feeder, deficiency);
        const sedLbl = safeSeg(sed?.sedCodigo || sed?.codigo || "SIN_SED");
        const codeElemLbl = safeSeg(getValue('CodigoElemento')); 
        const tipoElemRaw = getValue('TipoElemento') || 'POST';
        const tipoElem = String(tipoElemRaw).toUpperCase() === 'VANO' ? 'Vano' : 'Poste'; 
        const idElem = getValue('IdElemento'); 
        
        const defCodeBase = safeSeg(deficiency.tipiCodigo || "7004");
        const is7004 = defCodeBase === "7004" || String(deficiency.tipiInterno) === "60";
        const suministro = String(deficiency.defiSuministro || deficiency.suministro || "").trim();

        let defFolder = defCodeBase;

        if (is7004) {
            let sumStr = (suministro && suministro !== '0' && suministro !== 'null') ? suministro : '0000';
            let maxCorrelativo = 1;
            let countInMax = 0;

            const photos7004 = photos.filter(p => (p.archNombre || p.ARCH_Nombre || "").includes("/7004/"));
            photos7004.forEach(p => {
                const match = (p.archNombre || p.ARCH_Nombre || "").match(/\/7004\/(\d+)\//);
                if (match) {
                    const corr = parseInt(match[1], 10);
                    if (corr > maxCorrelativo) { maxCorrelativo = corr; countInMax = 1; }
                    else if (corr === maxCorrelativo) { countInMax++; }
                }
            });

            if (countInMax >= 6) maxCorrelativo++;
            defFolder = `7004/${maxCorrelativo}`;
        } else {
             if (suministro && suministro !== '0') defFolder = `${defCodeBase}.1.${suministro}`;
        }
        
        const compactDate = formatCompactDate(dataToSave.date);
        
        let nameFolderPart = defFolder;
        if (is7004) {
             let sumStr = (suministro && suministro !== '0') ? suministro : '0000';
             nameFolderPart = `7004.1.${sumStr}`;
        } else {
             nameFolderPart = defFolder.replace(/\//g, '.');
        }

        const fileName = `FOT-${sedLbl}-${codeElemLbl}-${nameFolderPart}-${compactDate}-${dataToSave.tipo}.jpg`;
        const relativePath = `${feederLbl}/${sedLbl}/${tipoElem}/${codeElemLbl}/${defFolder}`;
        const dbPath = `SIGRE.MOVIL/${relativePath}/${fileName}`;

        try { await LocalFileStore.save(fileName, dataToSave.file); } catch (e) { console.error(e); }

        const payload = {
            archInterno: 0, archTipo: String(dataToSave.tipo), archNombre: dbPath.substring(0, 255),
            archTabla: "Deficiencias", archCodTabla: Number(getValue('Interno')),
            archLatitud: parseFloat(dataToSave.lat) || 0, archLongitud: parseFloat(dataToSave.long) || 0,
            archFecha: toLocalISOString(dataToSave.date), archTipoElemento: tipoElemRaw,
            archIdElemento: Number(idElem), tipiInterno: Number(deficiency.tipiInterno), archActivo: true 
        };

        if (await addFile(payload)) {
            toast.current.show({ severity: 'success', summary: 'Guardado', detail: 'Foto registrada.' });
            setModalVisible(false);
            loadFiles(deficiency.defiInterno);
            setLocalCacheVersion(v => v + 1);
        } else {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Fallo al registrar.' });
        }
    };

    // 🔥🔥🔥 GENERACIÓN DE ZIP EXACTA (SIN CARPETAS FANTASMA) 🔥🔥🔥
    const handleDownloadZip = async () => {
        if (photos.length === 0) return;
        setZipLoading(true);
        try {
            const zip = new JSZip();

            // 1. URL base de la API
            const getBestUrl = (f, idx) => {
                if (resolvedUrlsRef.current[idx]) return resolvedUrlsRef.current[idx];
                let r = (f.archNombre || f.ARCH_Nombre || "").replace(/\\/g, '/').replace(/^.*SIGRE\.MOVIL\//i, '').replace(/\/(?:Vano|Poste)\//gi, '/');
                return `${API_BASE_URL}/${r.split('/').map(encodeURIComponent).join('/')}`;
            }

            for (let i = 0; i < photos.length; i++) {
                const fileRec = photos[i];
                // Obtenemos la ruta CRUD de la BD: SIGRE.MOVIL/Alim/Sed/Tipo/Cod/7004/1/FOT.jpg
                const rawPath = (fileRec.archNombre || fileRec.ARCH_Nombre || "").replace(/\\/g, '/');
                const fileName = rawPath.split('/').pop();

                // 2. Extraer la estructura de carpetas EXACTA del archivo
                // Quitamos "SIGRE.MOVIL/" del inicio si existe
                let relativePath = rawPath.replace(/^.*SIGRE\.MOVIL\//i, '');
                
                // Quitamos el nombre del archivo para quedarnos solo con las carpetas
                // Ej: Mejia/8154/Vano/VBT.../7004/1
                let folderStructure = relativePath.substring(0, relativePath.lastIndexOf('/'));
                
                // Si la carpeta física tiene /Vano/ o /Poste/, lo respetamos en el ZIP
                // Si la carpeta física es .../7004/1, se creará así.
                // Si la carpeta física era .../6002/, se creará así. 
                // NO forzamos 6002 por defecto. Usamos lo que tiene el archivo.

                const targetFolder = zip.folder(folderStructure);

                // 3. Obtener Blob y guardar
                let fileBlob = await LocalFileStore.get(fileName);
                if (!fileBlob) {
                    const url = getBestUrl(fileRec, i);
                    if (url) fileBlob = await urlToBlob(url);
                }

                if (fileBlob) {
                    targetFolder.file(fileName, fileBlob);
                }
            }

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `Deficiencia_${getValue('CodigoElemento')}.zip`);
            toast.current.show({ severity: 'success', summary: 'ZIP Generado', detail: 'Descarga iniciada.' });

        } catch (e) {
            console.error("ZIP Error:", e);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el ZIP.' });
        } finally {
            setZipLoading(false);
        }
    };

    // --- VISOR ---
    const openLightbox = (index) => { setLightboxIndex(index); setZoomLevel(1); setPosition({ x: 0, y: 0 }); };
    const closeLightbox = () => { setLightboxIndex(-1); setZoomLevel(1); setPosition({ x: 0, y: 0 }); setIsDragging(false); };
    const navigate = (dir) => {
        setZoomLevel(1); setPosition({x:0,y:0});
        const newIndex = (lightboxIndex + dir + photos.length) % photos.length;
        setLightboxIndex(newIndex);
    };
    const handleZoomIn = (e) => { e?.stopPropagation(); setZoomLevel(prev => Math.min(prev + 0.5, 5)); };
    const handleZoomOut = (e) => { e?.stopPropagation(); setZoomLevel(prev => { const n = Math.max(prev - 0.5, 1); if (n===1) setPosition({x:0,y:0}); return n; }); };
    const handleMouseDown = (e) => { if (zoomLevel > 1) { e.preventDefault(); e.stopPropagation(); setIsDragging(true); dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y }; } };
    const handleMouseMove = (e) => { if (isDragging && zoomLevel > 1) { e.preventDefault(); e.stopPropagation(); setPosition({ x: e.clientX - dragStartRef.current.x, y: e.clientY - dragStartRef.current.y }); } };
    const handleMouseUp = () => { setIsDragging(false); };

    const renderLightbox = () => {
        if (lightboxIndex === -1 || !photos[lightboxIndex]) return null;
        let src = resolvedUrlsRef.current[lightboxIndex];
        if (!src) {
             const file = photos[lightboxIndex];
             let raw = (file.archNombre || file.ARCH_Nombre || "").replace(/\\/g, '/').replace(/^.*SIGRE\.MOVIL\//i, '').replace(/\/(?:Vano|Poste)\//gi, '/');
             src = `${API_BASE_URL}/${raw.split('/').map(encodeURIComponent).join('/')}`;
        }
        return ReactDOM.createPortal(
            <div className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center overflow-hidden" onClick={closeLightbox} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                <button onClick={(e) => { e.stopPropagation(); closeLightbox(); }} className="fixed top-4 right-4 z-[100002] bg-transparent text-white/80 hover:text-white rounded-full p-2"><i className="pi pi-times text-2xl"></i></button>
                <button onClick={(e) => { e.stopPropagation(); navigate(-1); }} className="fixed left-4 top-1/2 -translate-y-1/2 z-[100001] text-white/60 hover:text-white"><i className="pi pi-chevron-left text-4xl"></i></button>
                <button onClick={(e) => { e.stopPropagation(); navigate(1); }} className="fixed right-4 top-1/2 -translate-y-1/2 z-[100001] text-white/60 hover:text-white"><i className="pi pi-chevron-right text-4xl"></i></button>
                <div className="w-full h-full flex items-center justify-center overflow-hidden" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}>
                    <img src={src} alt="Full" draggable={false} className="max-w-none transition-transform duration-100 ease-out select-none" style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`, maxHeight: '100vh', maxWidth: '100vw', objectFit: 'contain' }} onClick={(e)=>e.stopPropagation()}
                        onError={(e) => { if (e.target.src.toLowerCase().endsWith('.jpg')) e.target.src = e.target.src.substring(0, e.target.src.length - 4); }} />
                </div>
            </div>, document.body
        );
    };

    if (!deficiency) return <div className="h-full flex items-center justify-center text-gray-400">Selecciona un registro</div>;
    const currentSupply = String(deficiency.defiSuministro || deficiency.suministro || "").trim();
    const defCode = String(deficiency.tipiCodigo || "7004").trim();

    return (
        <div className="flex flex-col h-full bg-white font-sans border-t border-gray-200">
            <Toast ref={toast} />
            <div className="flex-none p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-black text-gray-800 m-0 leading-none">{getValue('CodigoElemento') || "SIN CÓDIGO"}</h2>
                    <div className="flex gap-2 mt-1">
                        <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">ID: {getValue('Interno')}</span>
                        {currentSupply && currentSupply !== '0' && <Tag severity="warning" value={`SUM: ${currentSupply}`} className="text-[9px] py-0 px-1" />}
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    <Tag severity="info" value={`${photos.length} Fotos`} className="text-[10px]" />
                    <Button icon={zipLoading ? "pi pi-spin pi-spinner" : "pi pi-download"} className="p-button-rounded p-button-text p-button-sm w-8 h-8" tooltip="Descargar ZIP" onClick={handleDownloadZip} disabled={photos.length === 0} />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 bg-white">
                 <div className="flex flex-wrap gap-2">
                    <div onClick={() => setModalVisible(true)} className="h-24 w-24 rounded border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 group transition-colors">
                        <i className="pi pi-plus text-2xl text-gray-400 group-hover:text-blue-500"></i>
                        <span className="text-[10px] text-gray-500">Agregar</span>
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
            <PhotoUploadModal visible={modalVisible} onHide={() => setModalVisible(false)} onSave={handleUploadSave} isEditing={false} initialData={getInitialFormData()} currentPhotos={photos} deficiencyData={deficiency} forcedSupply={suministro}contextData={{feeder, sed, elementCode: getValue('CodigoElemento'), elementType: getValue('TipoElemento')}} />
        </div>
    );
}