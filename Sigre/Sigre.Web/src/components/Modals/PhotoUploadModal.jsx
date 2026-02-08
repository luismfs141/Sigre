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
    contextData 
}) {
    const toast = useRef(null);
    const [formData, setFormData] = useState(initialData);

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

        // 1. Detección CORRECTA de 7004 (Corregimos error de lectura de 6002)
        // Si tipiInterno es 60, ES una 7004, sin importar qué diga tipiCodigo.
        const tipInterno = String(deficiencyData?.tipiInterno || "");
        let tipCode = safeSeg(deficiencyData?.tipiCodigo || "0000");

        if (tipInterno === "60") {
            tipCode = "7004";
        }

        // 2. Extracción ROBUSTA del Suministro (Para evitar el 0000)
        // Buscamos en todas las posibles propiedades donde puede venir el dato
        let sumStr = "0000";
        if (deficiencyData?.defiSuministro) sumStr = String(deficiencyData.defiSuministro);
        else if (deficiencyData?.suministro) sumStr = String(deficiencyData.suministro);
        else if (deficiencyData?.Suministro) sumStr = String(deficiencyData.Suministro);
        
        sumStr = sumStr.trim();
        if (sumStr === "null" || sumStr === "" || sumStr === "undefined") sumStr = "0000";

        let finalFolderSegment = tipCode; 
        let defNamePart = tipCode;

        // --- LÓGICA ESPECÍFICA PARA 7004 ---
        if (tipCode === "7004") {
            let maxFolderIndex = 0;
            let photosInMaxFolder = 0;
            let folderBySupply = {}; 

            // Escanear fotos existentes
            currentPhotos.forEach(p => {
                const path = (p.archNombre || p.ARCH_Nombre || "");
                // Regex para detectar .../7004/N/...
                const matchFolder = path.match(/\/7004\/(\d+)\//);
                
                if (matchFolder) {
                    const folderIndex = parseInt(matchFolder[1], 10);
                    
                    if (folderIndex > maxFolderIndex) {
                        maxFolderIndex = folderIndex;
                        photosInMaxFolder = 0;
                    }
                    if (folderIndex === maxFolderIndex) {
                        photosInMaxFolder++;
                    }

                    // Asociar Suministro con Carpeta existente
                    // Buscamos 7004.1.SUMINISTRO en el nombre del archivo
                    const matchSupply = path.match(/7004\.1\.(\d+)/);
                    if (matchSupply) {
                        const supplyFound = matchSupply[1];
                        folderBySupply[supplyFound] = folderIndex;
                    }
                }
            });

            // Determinar carpeta destino
            let targetIndex;

            // A. Si este suministro YA tiene carpeta, úsala
            if (sumStr !== "0000" && folderBySupply[sumStr]) {
                targetIndex = folderBySupply[sumStr];
            } 
            // B. Si es nuevo o no tiene suministro
            else {
                if (maxFolderIndex === 0) {
                    targetIndex = 1; // Primera vez
                } else if (photosInMaxFolder >= 6) {
                    targetIndex = maxFolderIndex + 1; // Carpeta llena, nueva
                } else {
                    targetIndex = maxFolderIndex; // Cabe en la actual
                }
            }

            finalFolderSegment = `7004/${targetIndex}`;
            // El nombre SIEMPRE lleva el suministro: 7004.1.SUMINISTRO
            defNamePart = `7004.1.${sumStr}`;
        } else {
            // Lógica para otras deficiencias (no 7004)
            if (sumStr !== "0000") defNamePart = `${tipCode}.1.${sumStr}`;
        }

        const dateStr = formatCompactDate(formData.date);
        const fileName = `FOT-${sSed}-${sCod}-${defNamePart}-${dateStr}-${formData.tipo}.jpg`;
        const dbPath = `${elementBaseRel}/${finalFolderSegment}/${fileName}`;
        
        return { dbPath, fileName };
    };

    const handleSaveClick = () => {
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

        onSave(dataToSave);
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
                    <Button label={isEditing ? "Actualizar" : "Guardar Evidencia"} icon="pi pi-save" onClick={handleSaveClick} disabled={!formData.file && !formData.preview} severity="success" className="mt-2" />
                </div>
            </Dialog>
        </>
    );
}