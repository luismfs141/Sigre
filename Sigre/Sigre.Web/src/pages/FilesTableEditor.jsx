import React, { useState, useEffect } from 'react';
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
                .map(f => ({
                    tempId: `db-${f.archInterno}`,
                    isDatabase: true,
                    archInterno: f.archInterno,
                    previewUrl: `${API_STATIC_URL}${f.archNombre}`,
                    originalName: f.archNombre,
                    currentPath: f.archNombre,
                    
                    selectedDeficiencyId: f.archCodTabla, 
                    archTipo: parseInt(f.archTipo !== null ? f.archTipo : 1), 
                    
                    archFecha: new Date(f.archFecha),
                    // Convertimos a string para inputs
                    archLatitud: f.archLatitud !== null ? f.archLatitud : 0,
                    archLongitud: f.archLongitud !== null ? f.archLongitud : 0,
                }));
            setFileRows(mappedFiles);
        } else {
            setFileRows([]);
        }
    }, [existingFiles]);

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
        const { feeder, sed, structureCode, structureType, globalDate, globalLat, globalLon } = namingContext;

        // 1. Validaciones básicas
        const isPathUpdate = !!feeder; 
        if (isPathUpdate && !sed) {
            toast.current.show({ severity: 'warn', summary: 'Falta SED', detail: 'Para cambiar la ruta, el campo SED es obligatorio.' });
            return;
        }

        const isDateUpdate = !!globalDate;
        // Verificamos si hay coordenadas globales para aplicar
        const isGeoUpdate = (globalLat && String(globalLat).trim() !== '') || (globalLon && String(globalLon).trim() !== '');

        if (!isPathUpdate && !isDateUpdate && !isGeoUpdate) {
            toast.current.show({ severity: 'info', summary: 'Sin Cambios', detail: 'Ingrese datos globales para aplicar.' });
            return;
        }

        // 2. Preparar datos de Ruta
        const newFeeder = isPathUpdate ? resolveCurrentFeederName() : null;
        const newSed = isPathUpdate ? safeSeg(sed.sedCodigo || sed.value || sed) : null;
        const newType = isPathUpdate ? (structureType === 'VANO' ? 'VANO' : 'POSTE') : null;
        const newCode = isPathUpdate ? safeSeg(structureCode || "SIN_CODIGO") : null;

        // 3. 🔥 CALCULAR UTM GLOBAL (Una sola vez)
        let globalUtm = { northing: 0, easting: 0 };
        if (isGeoUpdate) {
            // Convertimos las entradas globales (Lat/Lon) a UTM (Norte/Este)
            globalUtm = latLonToUTM(parseFloat(globalLat), parseFloat(globalLon));
        }

        // 4. Aplicar a las filas
        const updatedRows = fileRows.map(row => {
            const isAudio = row.archTipo === 0;

            // Actualizar Fecha
            const finalDate = isDateUpdate ? new Date(globalDate) : row.archFecha;
            
            // 🔥 Actualizar GEO: Si hay update global y no es audio, usamos el valor convertido a UTM
            // Mapeamos: Latitud -> Norte (UTM Northing), Longitud -> Este (UTM Easting)
            const finalLat = (!isAudio && isGeoUpdate) ? globalUtm.northing : row.archLatitud;
            const finalLon = (!isAudio && isGeoUpdate) ? globalUtm.easting : row.archLongitud;

            // Actualizar Ruta (Nombre)
            let currentPathParts = row.currentPath.split('/');
            
            if (currentPathParts.length >= 5 && currentPathParts[0].includes("SIGRE.MOVIL")) {
                if (isPathUpdate) {
                    currentPathParts[1] = newFeeder; 
                    currentPathParts[2] = newSed;    
                    currentPathParts[3] = newType;   
                    currentPathParts[4] = newCode;   
                }

                let fileName = currentPathParts[currentPathParts.length - 1];
                if (fileName.startsWith("FOT-")) {
                    const effectiveSed  = isPathUpdate ? newSed : currentPathParts[2];
                    const effectiveCode = isPathUpdate ? newCode : currentPathParts[4];
                    
                    const targetDef = historicalData.find(d => d.defiInterno === row.selectedDeficiencyId);
                    const defCodeRaw = targetDef ? getCodeById(targetDef.tipiInterno) : "0000";
                    let defPart = safeSeg(defCodeRaw || "0000");
                    if (defPart === '7004') defPart = `7004_1`;

                    const compactDate = formatCompactDate(finalDate);

                    const newFileName = `FOT-${effectiveSed}-${effectiveCode}-${defPart}-${compactDate}-${row.archTipo}.jpg`;
                    currentPathParts[currentPathParts.length - 1] = newFileName;
                }
            }

            const newPath = currentPathParts.join('/');

            return { 
                ...row, 
                currentPath: newPath,
                archFecha: finalDate,     
                archLatitud: finalLat,     // Valor UTM
                archLongitud: finalLon     // Valor UTM
            };
        });

        setFileRows(updatedRows);

        const changes = [];
        if (isPathUpdate) changes.push("Rutas");
        if (isDateUpdate) changes.push("Fecha");
        if (isGeoUpdate) changes.push("Ubicación (UTM)");
        
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
        if (fileRows.length === 0) return;
        setSaving(true);
        let successCount = 0;
        let failCount = 0;
        const updatedRows = [...fileRows];

        const promises = updatedRows.map(async (row, index) => {
            
            const fechaParaGuardar = toLocalISOString(row.archFecha);

            const payload = {
                archTabla: "Deficiencias", 
                archInterno: row.archInterno, 
                archCodTabla: row.selectedDeficiencyId, 
                archTipo: String(row.archTipo),
                
                archFecha: fechaParaGuardar, 
                
                // Aseguramos float para el backend
                archLatitud: parseFloat(String(row.archLatitud).replace(',', '.')) || 0, 
                archLongitud: parseFloat(String(row.archLongitud).replace(',', '.')) || 0,
                
                archNombre: row.currentPath
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

    const defTemplate = (r) => {
        const def = historicalData.find(d => d.defiInterno === r.selectedDeficiencyId);
        const displayLabel = def ? `${def.defiInterno} | ${getCodeById(def.tipiInterno)}` : r.selectedDeficiencyId;
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
                
                {/* Deficiencia y Tipo (Solo Lectura) */}
                <Column header="Deficiencia" body={defTemplate} style={{ minWidth: '160px' }} />
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
        </Card>
    );
}
// ==========================================
// 🔥🔥🔥 HELPER FUNCTIONS 🔥🔥🔥
// ==========================================
// --- CONVERSIÓN LAT/LON A UTM (WGS84) ---
function latLonToUTM(lat, lon) {
    if (!lat || !lon) return { northing: 0, easting: 0, zone: 0 };

    const a = 6378137; // Semi-eje mayor WGS84
    const f = 1 / 298.257223563; // Aplanamiento
    const k0 = 0.9996; // Factor de escala

    const phi = lat * (Math.PI / 180);
    const lambda = lon * (Math.PI / 180);
    const zone = Math.floor((lon + 180) / 6) + 1;
    const lambda0 = ((zone - 1) * 6 - 180 + 3) * (Math.PI / 180);

    const e2 = 2 * f - f * f; // Excentricidad al cuadrado
    const N = a / Math.sqrt(1 - e2 * Math.sin(phi) * Math.sin(phi));
    const T = Math.tan(phi) * Math.tan(phi);
    const C = (e2 / (1 - e2)) * Math.cos(phi) * Math.cos(phi);
    const A = (lambda - lambda0) * Math.cos(phi);

    const M = a * ((1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256) * phi
        - (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 * e2 * e2 / 1024) * Math.sin(2 * phi)
        + (15 * e2 * e2 / 256 + 45 * e2 * e2 * e2 / 1024) * Math.sin(4 * phi)
        - (35 * e2 * e2 * e2 / 3072) * Math.sin(6 * phi));

    const easting = 500000 + k0 * N * (A + (1 - T + C) * A * A * A / 6
        + (5 - 18 * T + T * T + 72 * C - 58 * e2) * A * A * A * A * A / 120);

    const northing = k0 * (M + N * Math.tan(phi) * (A * A / 2
        + (5 - T + 9 * C + 4 * C * C) * A * A * A * A / 24
        + (61 - 58 * T + T * T + 600 * C - 330 * e2) * A * A * A * A * A * A / 720));

    // Para hemisferio sur (Latitud negativa), sumar 10,000,000 al norte
    const finalNorthing = lat < 0 ? northing + 10000000 : northing;

    return {
        easting: parseFloat(easting.toFixed(3)),
        northing: parseFloat(finalNorthing.toFixed(3)),
        zone: zone
    };
}