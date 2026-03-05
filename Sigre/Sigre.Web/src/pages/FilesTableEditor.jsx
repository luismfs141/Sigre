import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Image } from 'primereact/image';
import { Card } from 'primereact/card';
import { Toolbar } from 'primereact/toolbar';
import { confirmPopup, ConfirmPopup } from 'primereact/confirmpopup';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { latLonToUTM } from '../utils/geoUtils';

// 🔥 CONEXIÓN AL SERVIDOR NGROK / CLOUDFLARE
//const API_BASE_URL = "https://subobscure-hilda-audacious.ngrok-free.dev"; 
const API_BASE_URL = "http://localhost:8080/";
// --- UTILIDADES ---
const safeSeg = (val) => val ? val.toString().trim().toUpperCase().replace(/[\\/:*?"<>|]/g, '_') : "SIN_DATA";

function formatCompactDate(date) {
    if (!date) return "00000000-000000";
    const d = new Date(date);
    if(isNaN(d.getTime())) return "00000000-000000";
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`; 
}

const toLocalISOString = (date) => {
    if (!date) return null;
    const tzOffset = date.getTimezoneOffset() * 60000; 
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, -1);
};

const photoTypes = { 1: 'Panorámica', 2: 'Frontal', 3: 'Izquierda', 4: 'Derecha', 5: 'Medidor', 6: 'Adicional', 0: 'Otro' };

export default function FilesTableEditor({ 
    namingContext, historicalData, getCodeById, toast, 
    existingFiles, onDeleteDbFile, loadingFiles, 
    onAddFile, viewMode, sessionBlobs, onOpenUploadModal 
}) {
    const [fileRows, setFileRows] = useState([]);
    const [zipLoading, setZipLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // ========================================================================
    // 1. CARGA INICIAL
    // ========================================================================
    useEffect(() => {
        if (existingFiles && existingFiles.length > 0) {
            const mappedFiles = existingFiles
                .filter(f => f.archActivo === true)
                .map((f) => {
                    const safeHistoricalData = historicalData || [];
                    const parentDef = safeHistoricalData.find(d => d.defiInterno === f.archCodTabla);
                    const tipiActual = parentDef ? parentDef.tipiInterno : 0;
                    const idElementoRecuperado = parentDef ? parentDef.defiIdElemento : (f.archIdElemento || f.IdElemento || 0);

                    return {
                        tempId: `db-${f.archInterno}`,
                        isDatabase: true,
                        archInterno: f.archInterno,
                        archIdElemento: idElementoRecuperado,
                        originalName: f.archNombre,
                        currentPath: f.archNombre,
                        selectedDeficiencyId: f.archCodTabla, 
                        archTipo: parseInt(f.archTipo !== null ? f.archTipo : 1), 
                        archFecha: new Date(f.archFecha),
                        archLatitud: f.archLatitud !== null ? f.archLatitud : 0,
                        archLongitud: f.archLongitud !== null ? f.archLongitud : 0,
                        tipiInterno: tipiActual,
                    };
                });
            setFileRows(mappedFiles);
        } else {
            setFileRows([]);
        }
    }, [existingFiles, historicalData]);

    const resolveCurrentFeederName = () => {
        const { feeder, feedersList } = namingContext;
        let rawFeederLabel = "SIN_FEEDER";
        if (feeder && typeof feeder === 'object' && feeder.label) rawFeederLabel = feeder.label;
        else if (feeder && feedersList) {
            const found = feedersList.find(f => f.value === feeder);
            if (found) rawFeederLabel = found.label; 
        } else if (feeder) rawFeederLabel = String(feeder);
        return String(rawFeederLabel).split(' - ')[0].trim().toUpperCase();
    };


    // ========================================================================
    // 🔥 BUSCADOR UNIVERSAL DE RUTAS (Clon de ResilientImage)
    // ========================================================================
    const getCandidateUrls = (row) => {
        if (!row.originalName) return [];
        
        let base = row.originalName.replace(/\\/g, '/').replace(/^.*SIGRE\.MOVIL\//i, '').replace(/^.*ELIMINADOS\//i, '').replace(/\/0000\//g, '/SINDEF/');
        base = base.replace(/^\/+/, ''); // Limpiar barra inicial
        
        const candidates = new Set();
        const parts = base.split('/');
        const originalFileName = parts.pop();
        const rootPathWithoutFile = parts.length > 0 ? parts.join('/') + '/' : '';
        
        // Extraer nombre corto (ej: "1.jpg" o "2.m4a")
        let shortFileName = null;
        const typeMatch = originalFileName.match(/[-_](\d+)\.(jpg|jpeg|png|m4a)$/i);
        if (typeMatch) shortFileName = `${typeMatch[1]}.${typeMatch[2]}`;

        const addPathVariations = (folderPath) => {
            if (!folderPath) return;
            const formatUrl = (pathStr) => `${API_BASE_URL}${pathStr.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/')}`;
            
            candidates.add(formatUrl(folderPath + originalFileName));
            if (shortFileName) candidates.add(formatUrl(folderPath + shortFileName));
        };

        // Obtenemos el código y el suministro de la BD
        const fileDef = historicalData?.find(d => d.defiInterno === row.selectedDeficiencyId);
        const dbCodeRaw = fileDef ? getCodeById(fileDef.tipiInterno) : "0000";
        let dbCode = String(dbCodeRaw || "0000").trim();
        if (dbCode === "0000" || dbCode === "0") dbCode = "SINDEF";

        const currentSupply = fileDef?.defiNumSuministro || '0';

        const processDeficiencyFolder = (currentPath) => {
            // Evaluar formato complejo ej: /7004.1.1111/
            const complexRegex = new RegExp(`\/(${dbCode})\\.(\\d+)\\.([a-zA-Z0-9]+)\/`);
            const matchComplex = currentPath.match(complexRegex);
            
            addPathVariations(currentPath);
            
            if (currentSupply && currentSupply !== '0') {
                if (matchComplex) { 
                    const fullStr = matchComplex[0]; 
                    addPathVariations(currentPath.replace(fullStr, `/${dbCode}.1.${currentSupply}/`)); 
                    addPathVariations(currentPath.replace(fullStr, `/${dbCode}/${currentSupply}/`)); 
                } else { 
                    const simpleDefRegex = new RegExp(`\/${dbCode}\/`); 
                    if (currentPath.match(simpleDefRegex)) { 
                        addPathVariations(currentPath.replace(simpleDefRegex, `/${dbCode}.1.${currentSupply}/`)); 
                        addPathVariations(currentPath.replace(simpleDefRegex, `/${dbCode}/${currentSupply}/`)); 
                    } 
                }
            }
            
            if (matchComplex) { 
                const fullStr = matchComplex[0]; 
                addPathVariations(currentPath.replace(fullStr, `/${dbCode}/`)); 
                for(let i=1; i<=20; i++) {
                    addPathVariations(currentPath.replace(fullStr, `/${dbCode}/${i}/`)); 
                }
            } else { 
                const simpleDefRegex = new RegExp(`\/${dbCode}\/`); 
                if (currentPath.match(simpleDefRegex)) { 
                    for(let i=1; i<=20; i++) { 
                        if (!currentPath.includes(`/${dbCode}/${i}/`)) { 
                            const split = currentPath.split(`/${dbCode}/`); 
                            if (split.length > 1) {
                                addPathVariations(`${split[0]}/${dbCode}/${i}/${split[1]}`); 
                            }
                        } 
                    } 
                } 
            }
        };

        const pathNoType = rootPathWithoutFile.replace(/\/(?:Vano|Poste)\//gi, '/');
        processDeficiencyFolder(pathNoType); 
        processDeficiencyFolder(rootPathWithoutFile);
        
        const pathUpper = rootPathWithoutFile.replace(/\/Vano\//i, '/VANO/').replace(/\/Poste\//i, '/POSTE/');
        if (pathUpper !== rootPathWithoutFile) {
            processDeficiencyFolder(pathUpper);
        }

        // Caso extremo: si la ruta física es 7004.x.x pero el DB Code cambió a otra tipificación
        const match7004 = rootPathWithoutFile.match(/\/(7004)\.(\d+)\.([a-zA-Z0-9]+)\//);
        if (match7004 && dbCode !== "7004") {
            const tempDbCode = dbCode;
            dbCode = "7004";
            processDeficiencyFolder(rootPathWithoutFile);
            dbCode = tempDbCode; // restaurar
        }

        return Array.from(candidates);
    };

    // ========================================================================
    // 2. LÓGICA DE APLICACIÓN DE CAMBIOS
    // ========================================================================
    const applyPathUpdates = () => {
        const { feeder, sed, structureCode, structureType, globalDate, globalLat, globalLon, globalTipificacion } = namingContext;

        const isPathUpdate = !!feeder; 
        if (isPathUpdate && !sed) {
            toast.current.show({ severity: 'warn', summary: 'Falta SED', detail: 'Para cambiar la ruta, el campo SED es obligatorio.' });
            return;
        }

        const isDateUpdate = !!globalDate;
        const isGeoUpdate = (globalLat && String(globalLat).trim() !== '') || (globalLon && String(globalLon).trim() !== '');
        const isTipiUpdate = !!globalTipificacion;

        if (!isPathUpdate && !isDateUpdate && !isGeoUpdate && !isTipiUpdate) {
            toast.current.show({ severity: 'info', summary: 'Sin Cambios', detail: 'Ingrese datos globales para aplicar.' });
            return;
        }

        const newFeeder = isPathUpdate ? resolveCurrentFeederName() : null;
        const newSed = isPathUpdate ? safeSeg(sed.sedCodigo || sed.value || sed) : null;
        const newType = isPathUpdate ? (structureType === 'VANO' ? 'VANO' : 'POSTE') : null;
        const newCode = isPathUpdate ? safeSeg(structureCode || "SIN_CODIGO") : null;

        let globalTipiFolder = ""; let globalTipiFilePart = "";
        if (isTipiUpdate) {
            const tipiCodeStr = String(getCodeById(globalTipificacion) || "0000").trim();
            if (tipiCodeStr === "7004") { globalTipiFolder = "7004/1"; globalTipiFilePart = "7004_1"; } 
            else if (tipiCodeStr === "0000" || tipiCodeStr === "0") { globalTipiFolder = "SINDEF"; globalTipiFilePart = "0000"; } 
            else { globalTipiFolder = safeSeg(tipiCodeStr); globalTipiFilePart = safeSeg(tipiCodeStr); }
        }

        let globalUtm = { northing: 0, easting: 0 };
        if (isGeoUpdate) globalUtm = latLonToUTM(parseFloat(globalLat), parseFloat(globalLon));

        const updatedRows = fileRows.map(row => {
            const isAudio = parseInt(row.archTipo) === 0;
            const finalDate = isDateUpdate ? new Date(globalDate) : row.archFecha;
            const finalLat = isAudio ? 0 : (isGeoUpdate ? globalUtm.northing : row.archLatitud);
            const finalLon = isAudio ? 0 : (isGeoUpdate ? globalUtm.easting : row.archLongitud);

            let currentPathParts = row.currentPath.split('/');
            let newPath = row.currentPath; 

            if (currentPathParts.length >= 5 && currentPathParts[0].includes("SIGRE.MOVIL")) {
                const effectiveFeeder = isPathUpdate ? newFeeder : currentPathParts[1];
                const effectiveSed = isPathUpdate ? newSed : currentPathParts[2];
                const effectiveType = isPathUpdate ? newType : currentPathParts[3];
                const effectiveCode = isPathUpdate ? newCode : currentPathParts[4];

                let fileName = currentPathParts[currentPathParts.length - 1];
                
                if (fileName.startsWith("FOT-") || fileName.startsWith("AUD-")) {
                    const filePrefix = isAudio ? "AUD" : "FOT";
                    const fileExt = isAudio ? "m4a" : "jpg";

                    // 🔥 1. FUNCIÓN INTERNA PARA CALCULAR CORRELATIVO 7004
                    const getCorrelativo = (defId) => {
                        const defs7004 = (historicalData || []).filter(d => {
                            const code = d.tipiCodigo || getCodeById(d.tipiInterno) || "";
                            return String(code).trim() === "7004" || String(d.tipiInterno) === "60";
                        });
                        defs7004.sort((a, b) => a.defiInterno - b.defiInterno);
                        const idx = defs7004.findIndex(d => d.defiInterno === defId);
                        return idx !== -1 ? idx + 1 : (defs7004.length > 0 ? defs7004.length + 1 : 1);
                    };

                    // 🔥 2. DETERMINAR EL CÓDIGO FINAL (Global o el que ya tenía)
                    const targetDef = historicalData.find(d => d.defiInterno === row.selectedDeficiencyId);
                    const originalTipi = targetDef ? getCodeById(targetDef.tipiInterno) : "0000";
                    const tipiCodeStr = isTipiUpdate ? String(getCodeById(globalTipificacion) || "0000").trim() : String(originalTipi).trim();

                    let folderPart = ""; let fileTipiPart = "";

                    // 🔥 3. ASIGNACIÓN DE CARPETAS Y NOMBRES
                    if (tipiCodeStr === "7004") {
                        const correlativo = getCorrelativo(row.selectedDeficiencyId);
                        folderPart = `7004/${correlativo}`; 
                        fileTipiPart = `7004_${correlativo}`;
                    } 
                    else if (tipiCodeStr === "0000" || tipiCodeStr === "0" || tipiCodeStr === "") {
                        folderPart = "0000"; 
                        fileTipiPart = "0000";
                    } 
                    else {
                        folderPart = safeSeg(tipiCodeStr); 
                        fileTipiPart = safeSeg(tipiCodeStr);
                    }

                    const compactDate = formatCompactDate(finalDate);
                    const newFileName = `${filePrefix}-${effectiveSed}-${effectiveCode}-${fileTipiPart}-${compactDate}-${row.archTipo}.${fileExt}`;
                    newPath = `SIGRE.MOVIL/${effectiveFeeder}/${effectiveSed}/${effectiveType}/${effectiveCode}/${folderPart}/${newFileName}`;
                }
            }

            return { ...row, currentPath: newPath, archFecha: finalDate, archLatitud: finalLat, archLongitud: finalLon };
        });

        setFileRows(updatedRows);

        const changes = [];
        if (isPathUpdate) changes.push("Rutas base");
        if (isDateUpdate) changes.push("Fecha");
        if (isGeoUpdate) changes.push("Ubicación (UTM)");
        if (isTipiUpdate) changes.push("Tipificación");
        toast.current.show({ severity: 'success', summary: 'Actualizado', detail: `Aplicado: ${changes.join(', ')}.` });
    };

    // ========================================================================
    // 3. HANDLERS
    // ========================================================================
    const updateFileField = (tempId, field, value) => {
        setFileRows(prev => prev.map(row => row.tempId === tempId ? { ...row, [field]: value } : row));
    };

    const handleRemoveRequest = (event, row) => {
        confirmPopup({
            target: event.currentTarget,
            message: '¿Eliminar archivo permanentemente?',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                let success = false;
                if (row.archInterno && row.archInterno > 0) {
                    if (onDeleteDbFile) success = await onDeleteDbFile(row.archInterno);
                } else success = true;

                if (success) {
                    toast.current.show({ severity: 'success', summary: 'Eliminado', detail: 'Archivo eliminado.' });
                    setFileRows(prev => prev.filter(r => r.tempId !== row.tempId));
                } else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar de la BD.' });
                }
            }
        });
    };
    
    const handleSaveAll = async () => {
        const { elementId } = namingContext;
        if (fileRows.length === 0) return;
        setSaving(true);

        // 🔥 1. DESCARGAMOS EL ZIP AUTOMÁTICAMENTE ANTES DE CAMBIAR LAS RUTAS
        toast.current.show({ severity: 'info', summary: 'Preparando', detail: 'Empaquetando fotos antes de guardar...' });
        await handleDownloadRenamedZip(); // Esperamos a que el ZIP se genere y descargue

        // 🔥 2. AHORA SÍ GUARDAMOS EN LA BASE DE DATOS
        let successCount = 0; let failCount = 0;
        const updatedRows = [...fileRows];

        const promises = updatedRows.map(async (row, index) => {
            const payload = {
                archTabla: "Deficiencias", archInterno: row.archInterno, archCodTabla: row.selectedDeficiencyId, 
                archTipo: String(row.archTipo), archIdElemento: row.archIdElemento || elementId,
                archFecha: toLocalISOString(row.archFecha), archLatitud: parseFloat(String(row.archLatitud).replace(',', '.')) || 0, 
                archLongitud: parseFloat(String(row.archLongitud).replace(',', '.')) || 0, 
                archNombre: row.currentPath, tipiInterno: row.tipiInterno
            };
            const success = await onAddFile(payload);
            if (success) { 
                successCount++; 
                updatedRows[index] = { ...row, originalName: row.currentPath }; 
            } else {
                failCount++;
            }
        });

        await Promise.all(promises);
        setFileRows(updatedRows);
        setSaving(false);

        if (failCount === 0) {
            toast.current.show({ severity: 'success', summary: 'Guardado', detail: `${successCount} archivos actualizados en BD.` });
        } else {
            toast.current.show({ severity: 'warn', summary: 'Atención', detail: `Guardados: ${successCount}. Errores: ${failCount}` });
        }
    };

// ========================================================================
    // 🔥 4. DESCARGA ZIP CON RECONSTRUCCIÓN DE RUTAS (CORREGIDO)
    // ========================================================================
    const handleDownloadRenamedZip = async () => {
        if (fileRows.length === 0) return;
        setZipLoading(true);
        
        try {
            const zip = new JSZip();

            for (let i = 0; i < fileRows.length; i++) {
                const row = fileRows[i];
                const zipPath = row.currentPath.replace(/^.*?SIGRE\.MOVIL\//, '');
                
                // Extraemos el nombre final del archivo (Ej: FOT-1887-PTO...-1.jpg)
                const originalFileName = (row.originalName || "").split(/[/\\]/).pop();

                // 🔥 PASO 1: Verificar si es una FOTO NUEVA (está en memoria)
                if (sessionBlobs && sessionBlobs[originalFileName]) {
                    // Si está en memoria, la metemos directamente al ZIP
                    zip.file(zipPath, sessionBlobs[originalFileName]);
                    continue; // Saltamos al siguiente archivo del bucle
                }

                // 🔥 PASO 2: Si no es nueva, buscarla en el servidor físico (Fotos viejas)
                const urlsToTry = getCandidateUrls(row);
                let downloaded = false;

                for (const url of urlsToTry) {
                    try {
                        const response = await fetch(url);
                        if (response.ok) {
                            const blob = await response.blob();
                            zip.file(zipPath, blob); 
                            downloaded = true;
                            break; 
                        }
                    } catch (e) { }
                }

                if (!downloaded) console.warn(`No se pudo encontrar la foto en disco: ${row.originalName}`);
            }

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `Evidencias_Renombradas_${namingContext.structureCode || "LOTE"}.zip`);
            toast.current.show({ severity: 'success', summary: 'ZIP Descargado', detail: 'Fotos empaquetadas correctamente.' });
        } catch (error) {
            console.error(error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Fallo al empaquetar el ZIP.' });
        } finally {
            setZipLoading(false);
        }
    };

    // ========================================================================
    // 5. TEMPLATES Y VISTAS
    // ========================================================================
    const pathTemplate = (r) => {
        const isModified = r.originalName !== r.currentPath;
        return (
            <div className="flex flex-col" style={{maxWidth:'450px'}}>
                <code className={`text-[10px] p-1 border rounded break-all font-mono leading-tight ${isModified ? 'bg-yellow-50 border-yellow-300 text-yellow-900' : 'bg-white border-gray-200 text-gray-600'}`}>
                    {r.currentPath}
                </code>
                {isModified && <span className="text-[9px] text-orange-600 font-bold mt-1"><i className="pi pi-pencil mr-1"></i>Cambio pendiente</span>}
            </div>
        );
    };

    const typeTemplate = (r) => <span className="text-xs font-medium text-gray-600">{photoTypes[r.archTipo] || `Tipo ${r.archTipo}`} ({r.archTipo})</span>;
    const defiInternoTemplate = (r) => <span className="text-xs font-bold text-slate-700">{r.selectedDeficiencyId}</span>;
    const defiTipiTemplate = (r) => {
        const def = historicalData.find(d => d.defiInterno === r.selectedDeficiencyId);
        return <span className="text-xs font-bold text-slate-700">{def ? getCodeById(def.tipiInterno) : r.selectedDeficiencyId}</span>;
    };

    // 🔥 COMPONENTE DE IMAGEN CON FALLBACK AUTOMÁTICO
    // 🔥 COMPONENTE DE IMAGEN CORREGIDO (CSS Ajustado)
    const FallbackImage = ({ row }) => {
        const isAudio = parseInt(row.archTipo) === 0;
        const urls = getCandidateUrls(row);
        const [srcIndex, setSrcIndex] = useState(0);

        const originalFileName = (row.originalName || "").split(/[/\\]/).pop();
        
        if (sessionBlobs && sessionBlobs[originalFileName]) {
            return <Image 
                src={URL.createObjectURL(sessionBlobs[originalFileName])} 
                alt="Foto" 
                preview 
                className="absolute inset-0 w-full h-full block" 
                imageClassName="w-full h-full object-cover block" 
            />;
        } 

        if (isAudio) return <i className="pi pi-volume-up text-4xl text-gray-400"></i>;

        return (
            <Image 
                src={urls[srcIndex]} 
                alt="Foto" 
                preview 
                // Le damos el tamaño al contenedor externo
                className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-100"
                // Le damos el estilo de ajuste a la imagen interna
                imageClassName="w-full h-full object-cover block"
                onError={(e) => {
                    if (srcIndex < urls.length - 1) {
                        setSrcIndex(srcIndex + 1);
                    } else { 
                        e.target.onerror = null; 
                        e.target.src = 'https://via.placeholder.com/100?text=Sin+Foto'; 
                    }
                }}
            />
        );
    };

    // 🔥 VISTA DE GALERÍA
    const renderGalleryView = () => {
        return (
            <div className="flex-1 overflow-y-auto p-3 bg-gray-100/50 rounded-md border border-gray-200 mt-2">
                 <div className="flex flex-wrap gap-3 content-start">
                    <div onClick={onOpenUploadModal} className="h-28 w-28 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 group transition-all bg-white shadow-sm">
                        <i className="pi pi-camera text-3xl text-gray-400 group-hover:text-blue-500 mb-1 transition-colors"></i>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider group-hover:text-blue-600">Agregar</span>
                    </div>

                    {fileRows.map((row) => (
                        <div key={row.tempId} className="h-28 w-28 rounded-lg border border-gray-200 overflow-hidden relative group hover:shadow-md transition-shadow bg-white flex flex-col">
                            <div className="flex-1 flex items-center justify-center bg-gray-50 relative">
                                <FallbackImage row={row} />
                                <button onClick={(e) => { e.stopPropagation(); handleRemoveRequest(e, row); }} className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white w-7 h-7 rounded border border-white flex items-center justify-center shadow-md transition-all z-10" title="Eliminar archivo">
                                    <i className="pi pi-trash text-[10px] font-bold"></i>
                                </button>
                            </div>
                            <div className="h-6 w-full bg-slate-800 text-white text-[9px] font-bold flex items-center justify-center uppercase tracking-tighter shrink-0 z-10 relative">
                                {photoTypes[row.archTipo] || `Tipo ${row.archTipo}`}
                            </div>
                        </div>
                    ))}
                 </div>
            </div>
        );
    };

    return (
        <Card title="Editor de Archivos (Files)" className="mt-4 shadow-sm">
            <ConfirmPopup />
            <Toolbar className="mb-4 p-2 border-none bg-transparent"
                left={
                    <div className="flex gap-2">
                        <Button label="Aplicar Cambios" icon="pi pi-refresh" severity="info" outlined onClick={applyPathUpdates} tooltip="Aplica Alim/SED y/o Metadatos globales" />
                        <Button label={saving ? "Guardando..." : "Guardar Cambios"} icon={saving ? "pi pi-spin pi-spinner" : "pi pi-save"} severity="success" onClick={handleSaveAll} disabled={fileRows.length === 0 || saving} />
                    </div>
                }
            />
            
            {/* 🔥 CONTENEDOR FLEX PARA MOSTRAR AMBOS A LA VEZ */}
            <div className="flex flex-col gap-6">
                
                {/* 1. SECCIÓN DE GALERÍA (Arriba) */}
                <div>
                    <h5 className="text-sm font-bold text-gray-700 mb-2 border-b pb-1"><i className="pi pi-images mr-2"></i>Vista de Evidencias</h5>
                    {renderGalleryView()}
                </div>

                {/* 2. SECCIÓN DE TABLA DE DATOS (Abajo) */}
                <div>
                    <h5 className="text-sm font-bold text-gray-700 mb-2 border-b pb-1"><i className="pi pi-list mr-2"></i>Detalle de Metadatos</h5>
                    <DataTable value={fileRows} size="small" emptyMessage="No hay archivos asociados." loading={loadingFiles} stripedRows showGridlines className="text-sm">
                        <Column header="Id" body={(r) => <span className="text-xs">{r.archInterno}</span>} style={{ width: '60px' }} />
                        <Column header="DefiInterno" body={defiInternoTemplate} style={{ minWidth: '160px' }} />
                        <Column header="Tipificacion" body={defiTipiTemplate} style={{ minWidth: '160px' }} />
                        <Column header="Tipo" body={typeTemplate} style={{ width: '120px' }} />
                        <Column header="Fecha" body={(r) => <Calendar value={r.archFecha} onChange={(e) => updateFileField(r.tempId, 'archFecha', e.value)} showTime showSeconds className="w-full" inputClassName="text-xs p-1" appendTo="self" />} style={{ width: '170px' }} />
                        <Column header="Lat" body={(r) => <InputText value={r.archLatitud} onChange={(e) => updateFileField(r.tempId, 'archLatitud', e.target.value)} className="w-full text-xs p-1" />} style={{ width: '110px' }} />
                        <Column header="Long" body={(r) => <InputText value={r.archLongitud} onChange={(e) => updateFileField(r.tempId, 'archLongitud', e.target.value)} className="w-full text-xs p-1" />} style={{ width: '110px' }} />
                        <Column header="Nombre (Ruta)" body={pathTemplate} />
                        <Column body={(r) => <Button icon="pi pi-trash" rounded text severity="danger" onClick={(e) => handleRemoveRequest(e, r)} />} style={{ width: '50px' }} />
                    </DataTable>
                </div>

            </div>

            <div className="mt-6 flex flex-col md:flex-row items-center justify-between border-t border-gray-200 pt-4 bg-blue-50 p-4 rounded-b-md">
                <div className="flex flex-col mb-4 md:mb-0">
                    <span className="font-bold text-sm text-blue-900"><i className="pi pi-sync mr-2 text-lg"></i>Descargar ZIP con Rutas Corregidas</span>
                    <span className="text-xs text-gray-600 mt-1 max-w-2xl">El sistema buscará las fotos físicas en todas las rutas históricas, y generará un ZIP con las <strong className="text-blue-800"> rutas y nombres actualizados </strong> automáticamente.</span>
                </div>
                <Button label={zipLoading ? "Empaquetando..." : "Descargar ZIP Renombrado"} icon={zipLoading ? "pi pi-spin pi-spinner" : "pi pi-cloud-download"} severity="info" className="p-button-sm font-bold shadow-sm hover:scale-105 transition-transform px-4" onClick={handleDownloadRenamedZip} disabled={zipLoading || fileRows.length === 0} tooltip={fileRows.length === 0 ? "No hay evidencias" : "Descarga usando las rutas de la tabla"} />
            </div>
        </Card>
    );
}