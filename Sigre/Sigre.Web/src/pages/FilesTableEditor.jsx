import React, { useState, useEffect} from 'react';
import { useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Image } from 'primereact/image';
import { Card } from 'primereact/card';
import { Toolbar } from 'primereact/toolbar';
import { confirmPopup, ConfirmPopup } from 'primereact/confirmpopup';
// 🔥 IMPORTACIONES FALTANTES AGREGADAS
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { latLonToUTM } from '../utils/geoUtils';

const API_BASE_URL="https://subobscure-hilda-audacious.ngrok-free.dev"; 
//servidor estatico enlocal
//const API_BASE_URL = "http://localhost:8080/";


// --- UTILIDADES ---
const safeSeg = (val) => val ? val.toString().trim().toUpperCase().replace(/[\\/:*?"<>|]/g, '_') : "SIN_DATA";

// --- AL FINAL DE WebInspectionManager.js ---

function formatCompactDate(date) {
    if (!date) return "00000000-000000";
    const d = new Date(date);
    if(isNaN(d.getTime())) return "00000000-000000";
    
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    // 🔥 DESCOMENTADO Y CORREGIDO:
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    
    return `${y}${m}${day}-${h}${min}${s}`; // Ej: 20260218-143005
}

const toLocalISOString = (date) => {
    if (!date) return null;
    const tzOffset = date.getTimezoneOffset() * 60000; 
    const localTime = new Date(date.getTime() - tzOffset); 
    return localTime.toISOString().slice(0, -1);
};

const API_STATIC_URL = "http://localhost:5000/StaticFiles/"; 

const photoTypes = {
    1: 'Panorámica',
    2: 'Frontal',
    3: 'Izquierda',
    4: 'Derecha',
    5: 'Medidor',
    6: 'Adicional',
    0: 'Otro'
};

export default function FilesTableEditor({ 
    namingContext, historicalData, getCodeById, toast, 
    existingFiles, onDeleteDbFile, loadingFiles, 
    onAddFile ,viewMode, sessionBlobs
}) {
    console.log("=== 🕵️‍♂️ DEBUG: ENTRADA A FILES TABLE EDITOR ===");
    console.log("👉 namingContext:", namingContext);
    console.log("👉 historicalData (array):", historicalData);
    console.log("👉 existingFiles (array):", existingFiles);
    console.log("=================================================");
    const [fileRows, setFileRows] = useState([]);
    const [zipLoading, setZipLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    // 🔥 NUEVOS: Para la migración directa a ZIP
    const [isZippingFolder, setIsZippingFolder] = useState(false);
    const folderZipInputRef = useRef(null);
    

    // ========================================================================
    // 1. CARGA INICIAL
    // ========================================================================
// ========================================================================
    // 1. CARGA INICIAL CON DEBUG
    // ========================================================================
    useEffect(() => {
        if (existingFiles && existingFiles.length > 0) {
            
            const mappedFiles = existingFiles
                .filter(f => f.archActivo === true)
                .map((f, index) => {
                    // 1. Protegemos el find() por si historicalData llega undefined o null
                    const safeHistoricalData = historicalData || [];
                    
                    // 2. Declaramos parentDef ESTRICTAMENTE dentro del map
                    const parentDef = safeHistoricalData.find(d => d.defiInterno === f.archCodTabla);

                    // 4. Intentamos recuperar el ID
                    const idElementoRecuperado = parentDef ? parentDef.defiIdElemento : (f.archIdElemento || f.IdElemento || 0);

                    // 5. Retornamos el objeto para fileRows
                    return {
                        tempId: `db-${f.archInterno}`,
                        isDatabase: true,
                        archInterno: f.archInterno,
                        
                        // 🔥 Aquí inyectamos el ID que salvamos
                        archIdElemento: idElementoRecuperado,
                        
                        previewUrl: `${API_STATIC_URL}${f.archNombre}`,
                        originalName: f.archNombre,
                        currentPath: f.archNombre,
                        selectedDeficiencyId: f.archCodTabla, 
                        archTipo: parseInt(f.archTipo !== null ? f.archTipo : 1), 
                        archFecha: new Date(f.archFecha),
                        archLatitud: f.archLatitud !== null ? f.archLatitud : 0,
                        archLongitud: f.archLongitud !== null ? f.archLongitud : 0,
                    };
                });
                
            setFileRows(mappedFiles);
        } else {
            setFileRows([]);
        }
    }, [existingFiles, historicalData]);

    // ========================================================================
    // HELPER: RESOLVER NOMBRE DE ALIMENTADOR
    // ========================================================================
    const resolveCurrentFeederName = () => {
        const { feeder, feedersList } = namingContext;
        let rawFeederLabel = "SIN_FEEDER";

        if (feeder && typeof feeder === 'object' && feeder.label) {
            rawFeederLabel = feeder.label;
        } else if (feeder && feedersList) {
            const found = feedersList.find(f => f.value === feeder);
            if (found) rawFeederLabel = found.label; 
        } else if (feeder) {
            rawFeederLabel = String(feeder);
        }
        return String(rawFeederLabel).split(' - ')[0].trim().toUpperCase();
    };

    // ========================================================================
    // 2. LÓGICA DE APLICACIÓN DE CAMBIOS (Ruta y Metadatos)
    // ========================================================================
const applyPathUpdates = () => {
    // 1. 🔥 EXTRAEMOS globalTipificacion del contexto
    const { feeder, sed, structureCode, structureType, globalDate, globalLat, globalLon, globalTipificacion } = namingContext;

    // 2. Validaciones básicas de actualización
    const isPathUpdate = !!feeder; 
    if (isPathUpdate && !sed) {
        toast.current.show({ severity: 'warn', summary: 'Falta SED', detail: 'Para cambiar la ruta, el campo SED es obligatorio.' });
        return;
    }

    const isDateUpdate = !!globalDate;
    const isGeoUpdate = (globalLat && String(globalLat).trim() !== '') || (globalLon && String(globalLon).trim() !== '');
    
    // 🔥 NUEVO: Verificamos si se solicitó un cambio de Tipificación
    const isTipiUpdate = !!globalTipificacion;

    // Si no hay NINGÚN cambio
    if (!isPathUpdate && !isDateUpdate && !isGeoUpdate && !isTipiUpdate) {
        toast.current.show({ severity: 'info', summary: 'Sin Cambios', detail: 'Ingrese datos globales para aplicar.' });
        return;
    }

    // 3. Preparar datos base de Ruta
    const newFeeder = isPathUpdate ? resolveCurrentFeederName() : null;
    const newSed = isPathUpdate ? safeSeg(sed.sedCodigo || sed.value || sed) : null;
    const newType = isPathUpdate ? (structureType === 'VANO' ? 'VANO' : 'POSTE') : null;
    const newCode = isPathUpdate ? safeSeg(structureCode || "SIN_CODIGO") : null;

    // 4. 🔥 PREPARAR CARPETAS DE TIPIFICACIÓN
    let globalTipiFolder = "";
    let globalTipiFilePart = "";
    
    if (isTipiUpdate) {
        const tipiCodeStr = String(getCodeById(globalTipificacion) || "0000").trim();
        
        if (tipiCodeStr === "7004") {
            globalTipiFolder = "7004/1"; // Asumimos subcarpeta 1 para aplicación global
            globalTipiFilePart = "7004_1";
        } else if (tipiCodeStr === "0000" || tipiCodeStr === "0") {
            globalTipiFolder = "SINDEF";
            globalTipiFilePart = "0000";
        } else {
            globalTipiFolder = safeSeg(tipiCodeStr);
            globalTipiFilePart = safeSeg(tipiCodeStr);
        }
    }

    // 5. Calcular UTM Global (Una sola vez)
    let globalUtm = { northing: 0, easting: 0 };
    if (isGeoUpdate) {
        globalUtm = latLonToUTM(parseFloat(globalLat), parseFloat(globalLon));
    }

    // 6. Aplicar a las filas y RECONSTRUIR LA RUTA
const updatedRows = fileRows.map(row => {
        const isAudio = parseInt(row.archTipo) === 0;

        const finalDate = isDateUpdate ? new Date(globalDate) : row.archFecha;
        const finalLat = isAudio ? 0 : (isGeoUpdate ? globalUtm.northing : row.archLatitud);
        const finalLon = isAudio ? 0 : (isGeoUpdate ? globalUtm.easting : row.archLongitud);

        let currentPathParts = row.currentPath.split('/');
        let newPath = row.currentPath; // Fallback por si acaso

        if (currentPathParts.length >= 5 && currentPathParts[0].includes("SIGRE.MOVIL")) {
            
            // A. Valores efectivos (Si hay cambio global usamos el nuevo, sino el actual)
            const effectiveFeeder = isPathUpdate ? newFeeder : currentPathParts[1];
            const effectiveSed = isPathUpdate ? newSed : currentPathParts[2];
            const effectiveType = isPathUpdate ? newType : currentPathParts[3];
            const effectiveCode = isPathUpdate ? newCode : currentPathParts[4];

            let fileName = currentPathParts[currentPathParts.length - 1];
            
            if (fileName.startsWith("FOT-") || fileName.startsWith("AUD-")) {
                
                // 🔥 SEGURIDAD MÁXIMA: Forzar prefijo y extensión basado en archTipo
                const filePrefix = isAudio ? "AUD" : "FOT";
                const fileExt = isAudio ? "m4a" : "jpg";

                let folderPart = "";
                let fileTipiPart = "";

                // B. Definir Tipificación Efectiva
                if (isTipiUpdate) {
                    folderPart = globalTipiFolder;
                    fileTipiPart = globalTipiFilePart;
                } else {
                    // Rescatar la tipificación histórica si no hay update global
                    const targetDef = historicalData.find(d => d.defiInterno === row.selectedDeficiencyId);
                    const defCodeRaw = targetDef ? getCodeById(targetDef.tipiInterno) : "0000";
                    fileTipiPart = safeSeg(defCodeRaw || "0000");
                    
                    if (fileTipiPart === '7004') {
                        folderPart = "7004/1";
                        fileTipiPart = "7004_1";
                    } else if (fileTipiPart === '0000') {
                        folderPart = "SINDEF";
                    } else {
                        folderPart = fileTipiPart;
                    }
                }

                // C. Armar el nuevo nombre de archivo (Usando el prefijo y extensión correctos)
                const compactDate = formatCompactDate(finalDate);
                const newFileName = `${filePrefix}-${effectiveSed}-${effectiveCode}-${fileTipiPart}-${compactDate}-${row.archTipo}.${fileExt}`;
                
                // D. Reconstruir la ruta completa (Evita errores de índices con 7004)
                newPath = `SIGRE.MOVIL/${effectiveFeeder}/${effectiveSed}/${effectiveType}/${effectiveCode}/${folderPart}/${newFileName}`;
            }
        }

        return { 
            ...row, 
            currentPath: newPath,
            archFecha: finalDate,     
            archLatitud: finalLat,    
            archLongitud: finalLon    
        };
    });

    setFileRows(updatedRows);

    // 7. Notificación dinámica
    const changes = [];
    if (isPathUpdate) changes.push("Rutas base");
    if (isDateUpdate) changes.push("Fecha");
    if (isGeoUpdate) changes.push("Ubicación (UTM)");
    if (isTipiUpdate) changes.push("Tipificación");
    
    toast.current.show({ severity: 'success', summary: 'Actualizado', detail: `Aplicado: ${changes.join(', ')}.` });
};

    // ========================================================================
    // 🔥 3. HANDLERS (AQUÍ ESTÁ LA FUNCIÓN QUE FALTABA)
    // ========================================================================
    
    // Esta función permite actualizar una celda específica manualmente
    const updateFileField = (tempId, field, value) => {
        setFileRows(prev => prev.map(row => 
            row.tempId === tempId ? { ...row, [field]: value } : row
        ));
    };

const handleRemoveRequest = (event, row) => {
        // Esta función confirmPopup NO funcionará si no está el componente <ConfirmPopup /> renderizado abajo
        confirmPopup({
            target: event.currentTarget,
            message: '¿Eliminar archivo permanentemente?',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                let success = false;

                // CASO A: Archivo de Base de Datos
                if (row.archInterno && row.archInterno > 0) {
                    if (onDeleteDbFile) {
                        success = await onDeleteDbFile(row.archInterno);
                    } else {
                        console.error("onDeleteDbFile prop no está definida");
                    }
                } 
                // CASO B: Archivo Local (recién agregado)
                else {
                    success = true;
                }

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
        // 1. TRAZA DEL PADRE: ¿Qué está enviando realmente WebInspectionManager?
        console.log("🛠️ [FilesTableEditor] namingContext recibido completo:", namingContext);
        
        const { elementId } = namingContext;
        
        if (fileRows.length === 0) return;
        setSaving(true);
        let successCount = 0;
        let failCount = 0;
        const updatedRows = [...fileRows];

        const promises = updatedRows.map(async (row, index) => {
            const fechaParaGuardar = toLocalISOString(row.archFecha);

            // 2. TRAZA DE LA FILA: ¿Qué ID tiene guardado el estado local para esta foto?
            console.log(`🛠️ [Fila ${index} - Archivo ${row.archInterno}] Evaluación de IDs:`, { 
                archIdElemento_EnFila: row.archIdElemento, 
                elementId_EnContextoPadre: elementId,
                idFinalQueSeUsara: row.archIdElemento || elementId
            });

            const payload = {
                archTabla: "Deficiencias", 
                archInterno: row.archInterno, 
                archCodTabla: row.selectedDeficiencyId, 
                archTipo: String(row.archTipo),
                
                // Asignación del ID
                archIdElemento: row.archIdElemento || elementId,
                
                // 🔥 NOTA DE SENIOR: Si ves en el console.log que el payload tiene el ID correcto, 
                // pero en la Base de Datos sigue llegando 0, significa que tu API de C# 
                // NO está mapeando la propiedad "archIdElemento".
                // En ese caso, comenta la línea de arriba y usa esta:
                // IdElemento: row.archIdElemento || elementId,

                archFecha: fechaParaGuardar, 
                archLatitud: parseFloat(String(row.archLatitud).replace(',', '.')) || 0, 
                archLongitud: parseFloat(String(row.archLongitud).replace(',', '.')) || 0,
                archNombre: row.currentPath
            };
            
            // 3. TRAZA DEL PAYLOAD: Esto es exactamente lo que se envía a la función onAddFile
            console.log(`🚀 [Payload Final - Archivo ${payload.archInterno}]:`, payload);
            
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

        if (failCount === 0) toast.current.show({ severity: 'success', summary: 'Guardado', detail: `${successCount} archivos actualizados.` });
        else toast.current.show({ severity: 'warn', summary: 'Atención', detail: `Guardados: ${successCount}. Errores: ${failCount}` });
    };

    const handleGenerateZip = async () => {
        if (fileRows.length === 0) return;
        setZipLoading(true);
        try {
            const zip = new JSZip();
            const promises = fileRows.map(async (row) => {
                const zipPath = row.currentPath.replace(/^.*?SIGRE\.MOVIL\//, '');
                try {
                    const response = await fetch(row.previewUrl);
                    if (!response.ok) throw new Error("404");
                    const blob = await response.blob();
                    zip.file(zipPath, blob);
                } catch (e) { console.warn("Error zip img"); }
            });
            await Promise.all(promises);
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `Evidencias_${namingContext.structureCode || "LOTE"}.zip`);
            toast.current.show({ severity: 'success', summary: 'ZIP Creado', detail: 'Descarga iniciada' });
        } catch (e) { toast.current.show({ severity: 'error', summary: 'Error', detail: 'Fallo ZIP' }); } finally { setZipLoading(false); }
    };

    // ========================================================================
    // 4. TEMPLATES
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

    const typeTemplate = (r) => {
        const typeName = photoTypes[r.archTipo] || `Tipo ${r.archTipo}`;
        return (
            <span className="text-xs font-medium text-gray-600">
                {typeName} ({r.archTipo})
            </span>
        );
    };
        const defiInternoTemplate = (r) => {
        const def = historicalData.find(d => d.defiInterno === r.selectedDeficiencyId);
        const displayLabel = def ? `${def.defiInterno}` : r.selectedDeficiencyId;
        return (
            <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-700">{displayLabel}</span>
            </div>
        );
    };

    const defiTipiTemplate = (r) => {
        const def = historicalData.find(d => d.defiInterno === r.selectedDeficiencyId);
        const displayLabel = def ? ` ${getCodeById(def.tipiInterno)}` : r.selectedDeficiencyId;
        return (
            <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-700">{displayLabel}</span>
            </div>
        );
    };
const imageBodyTemplate = (rowData) => {
        // Extraemos solo el nombre del archivo de la ruta completa
        const fileName = (rowData.currentPath || "").split(/[/\\]/).pop();
        let imgSrc = null;

        // A. Prioridad: Buscar en memoria (foto recién subida, blob local)
        if (sessionBlobs && sessionBlobs[fileName]) {
            imgSrc = URL.createObjectURL(sessionBlobs[fileName]);
        } 
        // B. Respaldo: Usar URL del servidor (foto histórica)
        else {
            imgSrc = rowData.previewUrl; 
        }

        return (
            <div className="flex justify-center items-center h-16 w-16 bg-gray-50 rounded border overflow-hidden">
                <Image 
                    src={imgSrc} 
                    alt="Foto" 
                    width="50" 
                    preview 
                    imageClassName="object-cover h-full w-full"
                    onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = 'https://via.placeholder.com/50?text=N/A';
                    }}
                />
            </div>
        );
    };
    // ========================================================================
    // 🔥 HERRAMIENTA DIRECTA: DE CARPETA A ZIP RENOMBRADO (Sin Base de Datos)
    // ========================================================================
    const handleFolderToZip = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        setIsZippingFolder(true);
        try {
            // Obtenemos el SED de tu formulario superior
            const { sed } = namingContext;
            const newSed = safeSeg(sed?.sedCodigo || sed?.value || sed || "SIN_SED");

            const zip = new JSZip();

            files.forEach(file => {
                // Filtramos para que solo meta imágenes al ZIP
                if (!file.name.toLowerCase().match(/\.(jpg|jpeg|png)$/)) return;

                // webkitRelativePath nos da la ruta original: "1709/VANO/SGRVBT640231/7002/FOT-1709-..."
                const parts = file.webkitRelativePath.split('/');
                
                // 1. Reemplazar la carpeta raíz (Ej: '1709' se vuelve '8227')
                if (parts.length > 0) {
                    parts[0] = newSed; 
                }

                // 2. Reemplazar el SED en el nombre del archivo final
                let filename = parts[parts.length - 1];
                // Cambia FOT-XXXX-resto por FOT-NUEVO_SED-resto
                filename = filename.replace(/^FOT-[^-]+-/, `FOT-${newSed}-`);
                parts[parts.length - 1] = filename;

                // 3. Unir todo para formar la nueva ruta interna del ZIP
                const zipPath = parts.join('/');

                // 4. Agregar el archivo físico directo al ZIP
                zip.file(zipPath, file);
            });

            // Generar y descargar el ZIP
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `Fotos_Migradas_SED_${newSed}.zip`);
            
            toast.current.show({ severity: 'success', summary: '¡ZIP Listo!', detail: `Carpeta convertida al SED ${newSed}.` });
        } catch (error) {
            console.error(error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Hubo un problema al generar el ZIP.' });
        } finally {
            setIsZippingFolder(false);
            // Limpiamos el input por si quiere subir la misma carpeta de nuevo
            if (folderZipInputRef.current) folderZipInputRef.current.value = "";
        }
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
            
            <DataTable value={fileRows} size="small" emptyMessage="No hay archivos asociados." loading={loadingFiles} stripedRows showGridlines className="text-sm">
                {viewMode === 'gallery' && (
                    <Column header="Foto" body={imageBodyTemplate} style={{width:'80px'}} />
                )}
                <Column header="Id" body={(r) => <span className="text-xs">{r.archInterno}</span>} style={{ width: '60px' }} />
                <Column header="DefiInterno" body={defiInternoTemplate} style={{ minWidth: '160px' }} />
                {/* Deficiencia y Tipo (Solo Lectura) */}
                <Column header="Tipificacion" body={defiTipiTemplate} style={{ minWidth: '160px' }} />
                <Column header="Tipo" body={typeTemplate} style={{ width: '120px' }} />
                
                {/* 🔥 FECHA EDITABLE */}
                <Column 
                    header="Fecha" 
                    body={(r) => (
                        <Calendar 
                            value={r.archFecha} 
                            onChange={(e) => updateFileField(r.tempId, 'archFecha', e.value)} 
                            showTime 
                            showSeconds
                            className="w-full" 
                            inputClassName="text-xs p-1" 
                            appendTo="self"
                        />
                    )} 
                    style={{ width: '170px' }} 
                />
                
                {/* 🔥 LATITUD EDITABLE */}
                <Column 
                    header="Lat" 
                    body={(r) => (
                        <InputText 
                            value={r.archLatitud} 
                            onChange={(e) => updateFileField(r.tempId, 'archLatitud', e.target.value)} 
                            className="w-full text-xs p-1" 
                        />
                    )} 
                    style={{ width: '110px' }} 
                />
                
                {/* 🔥 LONGITUD EDITABLE */}
                <Column 
                    header="Long" 
                    body={(r) => (
                        <InputText 
                            value={r.archLongitud} 
                            onChange={(e) => updateFileField(r.tempId, 'archLongitud', e.target.value)} 
                            className="w-full text-xs p-1" 
                        />
                    )} 
                    style={{ width: '110px' }} 
                />
                
                <Column header="Nombre (Ruta)" body={pathTemplate} />
                <Column body={(r) => <Button icon="pi pi-trash" rounded text severity="danger" onClick={(e) => handleRemoveRequest(e, r)} />} style={{ width: '50px' }} />
            </DataTable>
            {/* ... Aquí termina tu <DataTable> ... */}

            {/* 🔥 SECCIÓN INFERIOR: MIGRACIÓN DIRECTA A ZIP */}
            <div className="mt-6 flex flex-col md:flex-row items-center justify-between border-t border-gray-200 pt-4 bg-purple-50 p-4 rounded-b-md">
                <div className="flex flex-col mb-4 md:mb-0">
                    <span className="font-bold text-sm text-purple-900">
                        <i className="pi pi-file-zip mr-2 text-lg"></i>Convertir Carpeta a Nuevo SED
                    </span>
                    <span className="text-xs text-gray-600 mt-1">
                        Sube una carpeta completa. El sistema cambiará las rutas y nombres al SED actual 
                        <strong className="mx-1 text-purple-700">({safeSeg(namingContext?.sed?.sedCodigo || namingContext?.sed || "FALTA SED")})</strong> 
                        y te descargará el ZIP corregido al instante. No altera la base de datos.
                    </span>
                </div>
                
                <input 
                    type="file" 
                    webkitdirectory="true" 
                    directory="true" 
                    multiple 
                    ref={folderZipInputRef} 
                    style={{ display: 'none' }} 
                    onChange={handleFolderToZip} 
                />
                
                <Button 
                    label={isZippingFolder ? "Empaquetando..." : "Subir Carpeta y Descargar ZIP"} 
                    icon={isZippingFolder ? "pi pi-spin pi-spinner" : "pi pi-cloud-download"} 
                    severity="help" 
                    className="p-button-sm font-bold shadow-sm hover:scale-105 transition-transform px-4"
                    onClick={() => folderZipInputRef.current.click()} 
                    disabled={isZippingFolder || !namingContext?.sed}
                    tooltip={!namingContext?.sed ? "Selecciona un SED en el formulario primero" : ""}
                />
            </div>
        </Card>
    );
}

