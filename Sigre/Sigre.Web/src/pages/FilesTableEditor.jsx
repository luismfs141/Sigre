import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Image } from 'primereact/image';
import { Card } from 'primereact/card';
import { Toolbar } from 'primereact/toolbar';
import { confirmPopup } from 'primereact/confirmpopup';
// 🔥 IMPORTACIONES FALTANTES AGREGADAS
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// --- UTILIDADES ---
const safeSeg = (val) => val ? val.toString().trim().toUpperCase().replace(/[\\/:*?"<>|]/g, '_') : "SIN_DATA";

const formatCompactDate = (d) => {
    if (!d || !(d instanceof Date) || isNaN(d)) return '00000000-000000';
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

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
    onAddFile 
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

        const isPathUpdate = !!feeder; 

        if (isPathUpdate && !sed) {
            toast.current.show({ severity: 'warn', summary: 'Falta SED', detail: 'Para cambiar la ruta, el campo SED es obligatorio.' });
            return;
        }

        const isDateUpdate = !!globalDate;
        const isGeoUpdate = (globalLat && String(globalLat).trim() !== '') || (globalLon && String(globalLon).trim() !== '');

        if (!isPathUpdate && !isDateUpdate && !isGeoUpdate) {
            toast.current.show({ severity: 'info', summary: 'Sin Cambios', detail: 'Ingrese datos globales para aplicar.' });
            return;
        }

        const newFeeder = isPathUpdate ? resolveCurrentFeederName() : null;
        const newSed = isPathUpdate ? safeSeg(sed.sedCodigo || sed.value || sed) : null;
        const newType = isPathUpdate ? (structureType === 'Vano' ? 'Vano' : 'Poste') : null;
        const newCode = isPathUpdate ? safeSeg(structureCode || "SIN_CODIGO") : null;

        const updatedRows = fileRows.map(row => {
            const isAudio = row.archTipo === 0;

            const finalDate = isDateUpdate ? new Date(globalDate) : row.archFecha;
            
            // Si es audio, no aplicamos geo global
            const finalLat = (!isAudio && globalLat && String(globalLat).trim() !== '') ? globalLat : row.archLatitud;
            const finalLon = (!isAudio && globalLon && String(globalLon).trim() !== '') ? globalLon : row.archLongitud;

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
                archLatitud: finalLat,    
                archLongitud: finalLon    
            };
        });

        setFileRows(updatedRows);

        const changes = [];
        if (isPathUpdate) changes.push("Rutas");
        if (isDateUpdate) changes.push("Fecha");
        if (isGeoUpdate) changes.push("Ubicación");
        
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
        confirmPopup({
            target: event.currentTarget, message: '¿Eliminar archivo?', icon: 'pi pi-exclamation-triangle', acceptLabel: 'Sí, eliminar',
            accept: async () => {
                const success = await onDeleteDbFile(row.archInterno);
                if (success) {
                    toast.current.show({ severity: 'success', summary: 'Eliminado', detail: 'Archivo desactivado.' });
                    setFileRows(prev => prev.filter(r => r.tempId !== row.tempId));
                } else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar.' });
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

    return (
        <Card title="Editor de Archivos (Files)" className="mt-4 shadow-sm">
            <Toolbar className="mb-4 p-2 border-none bg-transparent"
                left={
                    <div className="flex gap-2">
                        <Button label="Aplicar Cambios" icon="pi pi-refresh" severity="info" outlined onClick={applyPathUpdates} tooltip="Aplica Alim/SED y/o Metadatos globales" />
                        <Button label={saving ? "Guardando..." : "Guardar Cambios"} icon={saving ? "pi pi-spin pi-spinner" : "pi pi-save"} severity="success" onClick={handleSaveAll} disabled={fileRows.length === 0 || saving} />
                    </div>
                }
                right={<Button label="Descargar ZIP" icon={zipLoading ? "pi pi-spin pi-spinner" : "pi pi-download"} severity="help" outlined onClick={handleGenerateZip} disabled={fileRows.length === 0} />}
            />
            
            <DataTable value={fileRows} size="small" emptyMessage="No hay archivos asociados." loading={loadingFiles} stripedRows showGridlines className="text-sm">
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