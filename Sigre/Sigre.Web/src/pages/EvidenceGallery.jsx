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

// --- UTILIDADES ---
const safeSeg = (val) => val ? val.toString().trim().toUpperCase().replace(/[\\/:*?"<>|]/g, '_') : "SIN_DATA";
const cleanFeederName = (label) => label ? label.split(' - ')[0].trim().toUpperCase() : "SIN_FEEDER";

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
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error loading ${url}`);
    return response.blob();
};

export default function EvidenceGallery({ deficiency, feeder, sed, onCountUpdate }) {
    const toast = useRef(null);
    const { files, loadingFiles, loadFiles, addFile } = useFiles();
    const [modalVisible, setModalVisible] = useState(false);
    const [zipLoading, setZipLoading] = useState(false);

    useEffect(() => { if (deficiency?.defiInterno) loadFiles(deficiency.defiInterno); }, [deficiency, loadFiles]);

    const relevantFiles = useMemo(() => {
        if (!files || !deficiency) return [];
        return files.filter(file => {
            const valActivo = file.archActivo ?? file.ARCH_Activo;
            return (valActivo === 1 || valActivo === true) && 
                   String(file.archIdElemento || file.ARCH_IdElemento) === String(deficiency.defiIdElemento) &&
                   String(file.archTipoElemento || file.ARCH_TipoElemento).toUpperCase() === String(deficiency.defiTipoElemento).toUpperCase();
        });
    }, [files, deficiency]);

    const getFileUrl = (file) => {
        let raw = file.archNombre || file.ARCH_Nombre || "";
        if (!raw) return null;
        raw = raw.replace(/\\/g, '/').replace(/^.*SIGRE\.MOVIL\//i, '');
        return `${process.env.REACT_APP_FOTOS_URL || "https://capacity-preceding-skills-outline.trycloudflare.com/"}${raw.split('/').map(encodeURIComponent).join('/')}`;
    };

    const { audios, photos } = useMemo(() => {
        const a = [], p = [];
        relevantFiles.forEach(f => (f.archNombre||"").toLowerCase().match(/\.(m4a|mp3)$/) ? a.push(f) : p.push(f));
        return { audios: a, photos: p };
    }, [relevantFiles]);

    const getValue = (keyBase) => {
        if (!deficiency) return null;
        return deficiency[`defi${keyBase}`] ?? 
               deficiency[`Defi${keyBase}`] ?? 
               deficiency[keyBase] ?? 
               deficiency[keyBase.toLowerCase()] ?? 
               null;
    };

    const getInitialFormData = () => {
        const _fechaRaw = getValue('FecRegistro') || getValue('Fecha');
        let _fecha = new Date(); 
        if (_fechaRaw) {
            const parsed = new Date(_fechaRaw);
            if (!isNaN(parsed.getTime())) _fecha = parsed;
        }

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

    // ------------------------------------------------------------------
    // 💾 GUARDADO SIMPLE (SOLO DATOS JSON)
    // ------------------------------------------------------------------
    const handleUploadSave = async (dataToSave) => {
        if (!feeder || !sed) return toast.current.show({ severity: 'error', summary: 'Error', detail: 'Falta contexto.' });

        const feederLbl = cleanFeederName(feeder.label || feeder.nombre || feeder.value);
        const sedLbl = safeSeg(sed.sedCodigo || sed.codigo || sed);
        const codeElemLbl = safeSeg(getValue('CodigoElemento')); 
        const tipoElem = getValue('TipoElemento') || 'POST';     
        const idElem = getValue('IdElemento');                   
        
        let defCodeFolder = safeSeg(deficiency.tipiCodigo || "6002"); 
        
        // Lógica de nombre de archivo (igual que antes para mantener consistencia)
        const compactDate = formatCompactDate(dataToSave.date);
        const fileName = `FOT-${sedLbl}-${codeElemLbl}-${defCodeFolder}-${compactDate}-${dataToSave.tipo}.jpg`;
        const relativePath = `${feederLbl}/${sedLbl}/${tipoElem === 'Vano' ? 'VANO' : 'POSTE'}/${codeElemLbl}/${defCodeFolder}`;
        const dbPath = `SIGRE.MOVIL/${relativePath}/${fileName}`;

        // ⚠️ AQUÍ ESTÁ EL CAMBIO: Payload JSON plano
        const payload = {
            archInterno: 0,
            archTipo: String(dataToSave.tipo),
            archNombre: dbPath.substring(0, 150),
            archTabla: "Deficiencias",
            archCodTabla: Number(deficiency.defiInterno),
            archLatitud: parseFloat(dataToSave.lat) || 0,
            archLongitud: parseFloat(dataToSave.long) || 0,
            archFecha: toLocalISOString(dataToSave.date),
            archTipoElemento: tipoElem,
            archIdElemento: Number(idElem),
            tipiInterno: Number(deficiency.tipiInterno),
            archActivo: true // O el valor que tu BD acepte (1 o true)
        };

        // Al enviar un objeto simple, tu hook usa 'application/json' y no da error 415
        const success = await addFile(payload); 
        
        if (success) {
            toast.current.show({ severity: 'success', summary: 'Registrado', detail: 'Datos guardados (Sin archivo).' });
            setModalVisible(false);
            loadFiles(deficiency.defiInterno);
        } else {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Fallo al guardar.' });
        }
    };

    const handleDownloadZip = async () => { /* ... */ };
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(-1);
    const renderLightbox = () => { /* ... */ }; 

    if (!deficiency) return <div className="h-full flex items-center justify-center text-gray-400">Selecciona un registro</div>;
    if (loadingFiles) return <div className="p-4"><Skeleton height="100%" /></div>;

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
                        const nombreBonito = getPhotoTypeName(tipoNum);
                        return (
                            <div key={i} className="h-24 w-24 rounded border overflow-hidden relative cursor-pointer group">
                                <Image src={getFileUrl(f)} alt="Foto" preview width="100%" />
                                <div className="absolute bottom-0 w-full bg-black/70 text-white text-[9px] font-bold text-center py-0.5 uppercase tracking-tighter">
                                    {nombreBonito}
                                </div>
                            </div>
                        );
                    })}
                 </div>
            </div>

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