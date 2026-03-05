import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';

const API_BASE_URL = "https://capacity-preceding-skills-outline.trycloudflare.com";

// --- UTILIDADES ---
const safeSeg = (val) => {
    if (!val) return "SIN_DATA";
    return val.toString().trim().toUpperCase().replace(/[\\/:*?"<>|]/g, '_');
};

const formatCompactDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};


export default function PhotoUploadModal({ 
    visible, 
    onHide, 
    onSave, 
    isEditing, 
    initialData, 
    currentPhotos = [], 
    deficiencyData, 
    contextData ,
    forcedSupply,
    forcedCorrelativo
}) {
    const toast = useRef(null);
    const [formData, setFormData] = useState(initialData);
    const [isSaving, setIsSaving] = useState(false);
useEffect(() => {
        if (visible) {
            console.group("🕵️‍♀️ DEBUG: DATOS RECIBIDOS EN MODAL");
            console.log("--------------------------------------------------");
            console.log("👉 forcedSupply (Suministro):", forcedSupply);
            console.log("👉 forcedCorrelativo (Conteo/Carpeta):", forcedCorrelativo);
            console.log("--------------------------------------------------");

            if (forcedCorrelativo === undefined || forcedCorrelativo === null) {
                console.error("❌ ERROR: 'forcedCorrelativo' llegó UNDEFINED. Revisa EvidenceGallery.");
            } else {
                console.log("✅ OK: El correlativo llegó correctamente.");
            }
            console.groupEnd();
        }
    }, [visible, forcedSupply, forcedCorrelativo]);
    const tiposBase = [
        { label: '1 - Panorámica', value: 1 },
        { label: '2 - Frontal', value: 2 },
        { label: '3 - Izquierda', value: 3 },
        { label: '4 - Derecha', value: 4 },
        { label: '5 - Medidor', value: 5 },
        { label: '6 - Adicional', value: 6 }
    ];

    const tiposDisponibles = useMemo(() => {
        const tiposUsados = currentPhotos.map(foto => {
            const tipo = foto.archTipo || foto.ARCH_Tipo;
            return tipo ? parseInt(tipo, 10) : null;
        });

        return tiposBase.map(t => {
            const estaUsado = tiposUsados.includes(t.value);
            const esElMismo = isEditing && parseInt(initialData.tipo, 10) === t.value;
            if (estaUsado && !esElMismo) {
                return { ...t, disabled: true, label: `${t.label} (Existente)` };
            }
            return { ...t, disabled: false };
        });
    }, [currentPhotos, isEditing, initialData]);

    useEffect(() => { setFormData(initialData); }, [initialData, visible]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) setFormData(prev => ({ ...prev, file: file, preview: URL.createObjectURL(file) }));
    };

    // 🔥🔥🔥 CÁLCULO DE RUTA: 7004, SUMINISTRO REAL Y CORRELATIVOS 🔥🔥🔥
    const calculatePathAndName = () => {
        const { feeder, sed, elementType, elementCode } = contextData || {};
        
        // Segmentos Base
        const sAlim = safeSeg(feeder || "SIN_ALIM");
        const sSed = safeSeg(sed || "SIN_SED");
        const sTipo = safeSeg(elementType || "VANO");
        const sCod = safeSeg(elementCode || "SIN_COD");
        const elementBaseRel = `SIGRE.MOVIL/${sAlim}/${sSed}/${sTipo}/${sCod}`;

        // 1. Detección CORRECTA de 7004
        const tipInterno = String(deficiencyData?.tipiInterno || "");
        let tipCode = safeSeg(deficiencyData?.tipiCodigo || "0000");

        if (tipInterno === "60") {
            tipCode = "7004";
        }

        // 2. OBTENCIÓN ROBUSTA DEL SUMINISTRO (Prioridad al dato real)
        let rawSupply = contextData?.forcedSupply 
                      || deficiencyData?.defiNumSuministro 
                      || deficiencyData?.suministro 
                      || deficiencyData?.Suministro;

        // Limpieza: Aseguramos que sea string y quitamos espacios
        let cleanSupply = String(rawSupply || "").trim();

        // Evitamos valores "basura" del sistema
        if (cleanSupply === "null" || cleanSupply === "undefined" || cleanSupply === "") {
            cleanSupply = "00000"; 
        }

        const currentSupply = safeSeg(cleanSupply);

        let finalFolderSegment = tipCode; 
        let defNamePart = tipCode;

        // --- LÓGICA ESPECÍFICA PARA 7004 ---
        if (tipCode === "7004") {
          

            // -------------------------------------------------------------
            // LÓGICA SIMPLIFICADA: SOLO BUSCAR MÁXIMO CORRELATIVO + 1
            // -------------------------------------------------------------
let targetIndex = 1;

            // 🔥 3. AQUÍ ESTÁ EL CAMBIO CLAVE 🔥
            // Si recibimos el conteo desde Subestaciones (forcedCorrelativo), LO USAMOS.
            if (forcedCorrelativo) {
                console.log("✅ Usando Correlativo Forzado desde BD:", forcedCorrelativo);
                targetIndex = forcedCorrelativo;
            } 
            else {
                // FALLBACK: Si no viene el dato, escaneamos las fotos locales (Lógica antigua)
                let maxFolderIndex = 0;
                currentPhotos.forEach(p => {
                    const path = (p.archNombre || p.ARCH_Nombre || "");
                    const matchFolder = path.match(/\/7004\/(\d+)\//);
                    if (matchFolder) {
                        const folderIndex = parseInt(matchFolder[1], 10);
                        if (folderIndex > maxFolderIndex) maxFolderIndex = folderIndex;
                    }
                });
                targetIndex = maxFolderIndex + 1;
            }

            finalFolderSegment = `7004/${targetIndex}`;
            
            // 🔥 AQUÍ SE PONE EL SUMINISTRO EN EL NOMBRE (PARA BORRAR LUEGO) 🔥
            // Formato actual: 7004_CORRELATIVO-SUMINISTRO
            // Ej: 7004_5-123456
            defNamePart = `7004_${targetIndex}-${currentSupply}`;

        } else {
            // Lógica para otras deficiencias (NO 7004)
            if (currentSupply !== "00000" && currentSupply !== "0") {
                defNamePart = `${tipCode}.1.${currentSupply}`;
            } else {
                defNamePart = tipCode;
            }
        }

        const dateStr = formatCompactDate(formData.date);
        
        // Nombre Final: FOT-SED-COD-7004_N-SUM-FECHA-TIPO.jpg
        const fileName = `FOT-${sSed}-${sCod}-${defNamePart}-${dateStr}-${formData.tipo}.jpg`;
        const dbPath = `${elementBaseRel}/${finalFolderSegment}/${fileName}`;
        
        return { dbPath, fileName };
    };
    // 🔥 1. Convertimos a async
    const handleSaveClick = async () => {
        if (!formData.file && !formData.preview) { 
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Falta seleccionar foto.' }); 
            return; 
        }
        if (!formData.tipo) { 
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Seleccione Tipo.' }); 
            return; 
        }
        
        const opcion = tiposDisponibles.find(t => t.value === formData.tipo);
        if (opcion?.disabled) {
            toast.current.show({ severity: 'warn', summary: 'Aviso', detail: 'Ese tipo de foto ya existe.' });
            return;
        }

        const { dbPath, fileName } = calculatePathAndName();

        const dataToSave = {
            ...formData,
            generatedPath: dbPath,
            generatedName: fileName
        };

        // 🔥 2. Bloqueamos el botón
        setIsSaving(true); 
        
        try {
            // 🔥 3. Esperamos a que la función padre (EvidenceGallery) termine de guardar en BD y subir el archivo
            await onSave(dataToSave);
        } catch (error) {
            console.error("Error al guardar:", error);
        } finally {
            // 🔥 4. Desbloqueamos por si la ventana no se cierra por algún error
            setIsSaving(false); 
        }
    };

    return (
        <>
            <Toast ref={toast} />
            <Dialog visible={visible} onHide={onHide} header={isEditing ? "Editar Foto" : "Nueva Evidencia"} style={{ width: '90vw', maxWidth: '400px' }} modal className="p-fluid">
                <div className="flex flex-col gap-4 pt-2">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-600">Tipo de Foto</label>
                        <Dropdown 
                            value={formData.tipo} 
                            options={tiposDisponibles} 
                            optionLabel="label"
                            optionValue="value"
                            optionDisabled="disabled" 
                            onChange={(e) => setFormData({...formData, tipo: e.value})} 
                            className="w-full" 
                            placeholder="Seleccione..."
                        />
                    </div>
                    <div className="border-2 border-dashed border-gray-300 p-4 rounded bg-gray-50 text-center relative cursor-pointer hover:bg-gray-100 group">
                        <input type="file" accept="image/*" onChange={handleFileSelect} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"/>
                        {formData.preview ? (
                            <img src={formData.preview} className="h-40 mx-auto object-contain rounded shadow-sm" alt="prev"/>
                        ) : (
                            <div className="flex flex-col items-center py-4 text-gray-400 group-hover:text-blue-500">
                                <i className="pi pi-camera text-3xl mb-2"></i>
                                <span className="font-semibold text-sm">Toque para subir</span>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-blue-700">Fecha Registro</label>
                        <Calendar value={formData.date} onChange={(e) => setFormData({...formData, date: e.value})} showTime showIcon className="w-full" dateFormat="dd/mm/yy" />
                    </div>
                    <div className="flex gap-2">
                        <div className="w-1/2">
                            <label className="text-xs font-bold text-gray-500">Latitud</label>
                            <InputText value={formData.lat} onChange={(e)=>setFormData({...formData, lat:e.target.value})} className="p-inputtext-sm font-mono text-xs"/>
                        </div>
                        <div className="w-1/2">
                            <label className="text-xs font-bold text-gray-500">Longitud</label>
                            <InputText value={formData.long} onChange={(e)=>setFormData({...formData, long:e.target.value})} className="p-inputtext-sm font-mono text-xs"/>
                        </div>
                    </div>
<Button 
                        label={isSaving ? "Guardando..." : (isEditing ? "Actualizar" : "Guardar Evidencia")} 
                        icon="pi pi-save" 
                        onClick={handleSaveClick} 
                        // Desactivar si no hay foto O si ya se está guardando
                        disabled={(!formData.file && !formData.preview) || isSaving} 
                        // Mostrar spinner de PrimeReact
                        loading={isSaving} 
                        severity="success" 
                        className="mt-2" 
                    />
                </div>
            </Dialog>
        </>
    );
}