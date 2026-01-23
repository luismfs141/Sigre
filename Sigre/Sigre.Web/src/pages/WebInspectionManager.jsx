import React, { useState } from 'react';
import { useInspectionManager } from '../hooks/useInspectionManager'; // Asegúrate que la ruta sea correcta

// Librerías de ZIP y Descarga
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// PrimeReact & Iconos
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';

export default function WebInspectionManager() {
    // Hook de Lógica (CRUD y Estado)
    const { items, loading, loadInspections, deleteInspection, saveInspection, toastRef } = useInspectionManager();
    
    // --- ESTADOS DE CONTEXTO (Configuración Global para Búsqueda y ZIP) ---
    const [feederLabel, setFeederLabel] = useState('');
    const [sedCode, setSedCode] = useState('');
    const [structureType, setStructureType] = useState('Poste'); 
    const [structureCode, setStructureCode] = useState(''); // Código GIS del elemento

    // --- ESTADOS DE UI (Modales y Carga) ---
    const [modalVisible, setModalVisible] = useState(false);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [zipLoading, setZipLoading] = useState(false);
    
    // --- FORMULARIO (Edición/Creación) ---
    const defaultForm = {
        deficiencyCode: '',
        detail: '', // Opcional si quieres guardar observaciones
        date: null, // Objeto Date
        lat: '',
        long: '',
        file: null, // El Blob/File crudo (para nuevas subidas)
        preview: null // URL para mostrar en pantalla
    };
    const [formData, setFormData] = useState(defaultForm);

    // =================================================================
    // 1. UTILIDADES DEL ZIP (Lógica de Carpetas y Procesamiento)
    // =================================================================
    
    const safeSeg = (val, def = "SIN_DATA") => {
        if (!val || val.toString().trim() === "") return def;
        return val.toString().trim().replace(/[\\/:*?"<>|]/g, '_');
    };

    const processImage = (file) => {
        return new Promise((resolve, reject) => {
            if (!file) return reject("No file provided");
            const img = new Image();
            // Soporta tanto File Object (nuevo) como URL string (existente en BD)
            img.src = typeof file === 'object' ? URL.createObjectURL(file) : file;
            
            // Configurar CORS si las imágenes vienen de un servidor externo
            img.crossOrigin = "Anonymous"; 

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxWidth = 800; // Redimensionar para optimizar peso
                const scale = maxWidth / img.width;
                const width = scale < 1 ? maxWidth : img.width;
                const height = scale < 1 ? img.height * scale : img.height;
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', 0.6);
            };
            img.onerror = (err) => reject(err);
        });
    };

    const handleGenerateZip = async () => {
        if (items.length === 0) {
            toastRef.current.show({ severity: 'warn', summary: 'Vacío', detail: 'No hay ítems para generar.' });
            return;
        }
        if (!feederLabel || !structureCode) {
            toastRef.current.show({ severity: 'error', summary: 'Faltan Datos', detail: 'Complete Alimentador y Código GIS.' });
            return;
        }

        setZipLoading(true);
        try {
            const zip = new JSZip();
            const rootFolder = "SIGRE.MOVIL";
            
            // Lógica para 7004: Reiniciar contador
            let correlative7004 = 0;

            for (const item of items) {
                // Solo procesamos si hay archivo físico cargado o una URL válida (preview)
                if (!item.file && !item.preview) continue;

                // Preferimos el archivo 'raw' si existe (nueva carga), sino usamos el preview (edición/existente)
                const sourceImage = item.file || item.preview;
                
                try {
                    const compressedBlob = await processImage(sourceImage);
                    
                    // Lógica excepción 7004 (Crea subcarpetas numeradas)
                    let extraFolder = "";
                    if (String(item.deficiencyCode).trim() === '7004') {
                        correlative7004 += 1;
                        extraFolder = `/${correlative7004}`;
                    }

                    // Ruta EXACTA solicitada: SIGRE.MOVIL/Alim/Sed/Tipo/CodEstructura/CodDeficiencia(/Correlativo)
                    const path = `${rootFolder}/${safeSeg(feederLabel)}/${safeSeg(sedCode, "SINSED")}/${structureType === "Vano" ? "Vano" : "Poste"}/${safeSeg(structureCode)}/${safeSeg(item.deficiencyCode, "SINDEF")}${extraFolder}`;

                    // Formato de Fecha y Nombre Archivo
                    const dateObj = new Date(item.date);
                    // Ajuste simple para obtener formato local y evitar cambio de día por UTC
                    const dateStr = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000)).toISOString().slice(0, 19);
                    const safeDate = dateStr.replace(/[:\s]/g, '-');
                    
                    const fileName = `${safeSeg(structureCode)}_${safeSeg(item.deficiencyCode)}_${safeDate}_${item.lat}_${item.long}.jpg`;
                    
                    zip.folder(path).file(fileName, compressedBlob);

                } catch (err) {
                    console.error("Error procesando imagen individual:", err);
                    // Continuamos con el siguiente archivo aunque uno falle
                }
            }

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `Audit_Report__${structureCode}.zip`);
            toastRef.current.show({ severity: 'success', summary: 'ZIP Generado', detail: 'Descarga iniciada' });

        } catch (error) {
            console.error("Error generating ZIP:", error);
            toastRef.current.show({ severity: 'error', summary: 'Error ZIP', detail: 'Falló la generación del archivo.' });
        } finally {
            setZipLoading(false);
        }
    };

    // =================================================================
    // 2. MANEJADORES UI & BD (Conexión con el Hook)
    // =================================================================

    // A) BÚSQUEDA DE DATOS
    const handleSearch = () => {
        if(!structureCode) return;
        
        // Pasamos el contexto global al hook para que pueda (opcionalmente) filtrar mejor
        // o simplemente para validar que tenemos datos
        loadInspections({
            feederLabel,
            sedCode,
            structureType,
            structureCode
        });
    };

    // B) SUBIDA DE ARCHIVOS (Input File)
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                file: file,
                preview: URL.createObjectURL(file),
                // Si es nuevo, sugerimos la fecha actual
                date: prev.date || new Date()
            }));
        }
    };

    // C) ABRIR MODALES
    const openNew = () => {
        setFormData({ ...defaultForm, date: new Date() });
        setIsEdit(false);
        setModalVisible(true);
    };

    const openEdit = (rowData) => {
        setFormData({ 
            ...rowData, 
            date: new Date(rowData.date), // Asegurar objeto Date para Calendar
            file: null // Reseteamos file raw, mantenemos preview existente
        });
        setIsEdit(true);
        setModalVisible(true);
    };

    // D) PRE-VALIDACIÓN
    const handlePreSubmit = () => {
        if (!formData.deficiencyCode || !formData.lat) {
            toastRef.current.show({ severity: 'warn', summary: 'Faltan datos', detail: 'Código y Coordenadas requeridos' });
            return;
        }
        setModalVisible(false);
        setPreviewVisible(true);
    };

    // E) CONFIRMACIÓN FINAL (GUARDAR EN BD)
    const handleFinalConfirm = async () => {
        // 🔥 IMPORTANTE: Recopilamos el Contexto Global actual
        const globalContext = {
            feederLabel,
            sedCode,
            structureType,
            structureCode
        };

        // Llamamos al hook pasando Data + Modo + Contexto
        const success = await saveInspection(formData, isEdit, globalContext);
        
        if (success) {
            setPreviewVisible(false);
            // El hook se encarga de actualizar la tabla visualmente
        } else {
            setPreviewVisible(false);
            setModalVisible(true); // Reabrir modal si falló para corregir
        }
    };

    // =================================================================
    // 3. RENDERIZADO (UI)
    // =================================================================
    
    // Botones de la barra de herramientas de la tabla
    const leftToolbarTemplate = () => {
        return (
            <div className="flex gap-2">
                <Button label="Nuevo Registro" icon="pi pi-plus" severity="secondary" onClick={openNew} disabled={!structureCode} />
            </div>
        );
    };

    const rightToolbarTemplate = () => {
        return (
            <Button 
                label={zipLoading ? "Procesando..." : "Descargar ZIP"} 
                icon={zipLoading ? "pi pi-spin pi-spinner" : "pi pi-folder-open"} 
                severity="help" 
                onClick={handleGenerateZip}
                disabled={items.length === 0 || zipLoading || !feederLabel}
                tooltip="Genera estructura de carpetas local"
            />
        );
    };

    const imageBodyTemplate = (rowData) => {
        return rowData.preview ? (
            <img src={rowData.preview} alt="evidencia" className="w-16 h-16 object-cover border-round border-1 border-300 shadow-1" />
        ) : <i className="pi pi-image text-2xl text-400"></i>;
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-800">
            <Toast ref={toastRef} />
            <ConfirmDialog />

            {/* SECCIÓN 1: CONFIGURACIÓN GLOBAL (CRUCIAL PARA ZIP Y BD) */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-4">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                    <i className="pi pi-cog text-blue-600"></i>
                    <h2 className="text-sm font-bold uppercase text-slate-600 m-0">1. Configuración Global (Búsqueda y ZIP)</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500">Alimentador</label>
                        <InputText 
                            value={feederLabel} 
                            onChange={(e) => setFeederLabel(e.target.value)} 
                            placeholder="Ej. MEJIA" 
                            className="p-inputtext-sm w-full"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500">Código SED</label>
                        <InputText 
                            value={sedCode} 
                            onChange={(e) => setSedCode(e.target.value)} 
                            placeholder="Ej. 8201" 
                            className="p-inputtext-sm w-full"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500">Tipo Estructura</label>
                        <Dropdown 
                            value={structureType} 
                            options={[{label: 'POSTE', value: 'Poste'}, {label: 'VANO', value: 'Vano'}]} 
                            onChange={(e) => setStructureType(e.value)} 
                            className="p-inputtext-sm w-full"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500">Código GIS (Elemento)</label>
                        <div className="p-inputgroup">
                            <InputText 
                                value={structureCode} 
                                onChange={(e) => setStructureCode(e.target.value)} 
                                placeholder="Ej. PTO000271179" 
                                className="p-inputtext-sm"
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <Button 
                                icon="pi pi-search" 
                                onClick={handleSearch} 
                                loading={loading} 
                                tooltip="Cargar de Base de Datos"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: TABLA DE DATOS */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <Toolbar className="border-none bg-white p-4" left={leftToolbarTemplate} right={rightToolbarTemplate} />
                
                <DataTable value={items} size="small" stripedRows emptyMessage="No hay evidencias. Ingrese un código GIS y busque." className="p-datatable-sm">
                    <Column header="Vista" body={imageBodyTemplate} style={{ width: '80px' }}></Column>
                    
                    <Column field="deficiencyCode" header="Código" sortable body={(rowData) => (
                        <Tag value={rowData.deficiencyCode} severity={rowData.deficiencyCode === '0000' ? 'success' : 'warning'} />
                    )}></Column>
                    
                    {/* Columna Opcional para ver el ID interno mapeado */}
                    <Column field="tipiInterno" header="ID Tipi" className="text-xs text-gray-400" style={{ width: '80px' }}></Column>

                    <Column field="date" header="Fecha Foto" body={(r) => new Date(r.date).toLocaleString()} sortable></Column>
                    
                    <Column header="Coords" body={(r) => (
                        <div className="flex flex-col text-xs font-mono">
                           <span>Lat: {r.lat}</span>
                           <span>Lon: {r.long}</span>
                        </div>
                    )}></Column>

                    <Column body={(rowData) => (
                        <div className="flex gap-2 justify-end">
                            <Button icon="pi pi-pencil" rounded text severity="info" onClick={() => openEdit(rowData)} tooltip="Editar" />
                            <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => {
                                confirmDialog({
                                    message: '¿Estás seguro de eliminar este registro de la base de datos?',
                                    header: 'Confirmar Eliminación',
                                    icon: 'pi pi-exclamation-triangle',
                                    acceptClassName: 'p-button-danger',
                                    accept: () => deleteInspection(rowData.id)
                                });
                            }} tooltip="Eliminar" />
                        </div>
                    )} header="Acciones" alignHeader={'right'}></Column>
                </DataTable>
            </div>

            {/* ================= MODALES ================= */}

            {/* 1. Modal Formulario */}
            <Dialog visible={modalVisible} style={{ width: '90vw', maxWidth: '600px' }} header={isEdit ? "Editar Evidencia" : "Nueva Evidencia"} modal className="p-fluid" onHide={() => setModalVisible(false)}>
                <div className="grid grid-cols-1 gap-4">
                    
                    {/* INPUT CÓDIGO */}
                    <div className="field">
                        <label className="font-bold text-slate-700">Código Deficiencia</label>
                        <InputText 
                            value={formData.deficiencyCode} 
                            onChange={(e) => setFormData({ ...formData, deficiencyCode: e.target.value })} 
                            placeholder="Ej. 6002 o 0000"
                            autoFocus
                        />
                        <small className="text-slate-500 block mt-1">
                            Si ingresa <strong>7004</strong>, se generará una carpeta numerada en el ZIP.
                        </small>
                    </div>

                    {/* INPUT ARCHIVO */}
                    <div className="field">
                        <label className="font-bold text-slate-700 mb-2 block">Evidencia Fotográfica</label>
                        <div className="border border-dashed border-slate-300 rounded-lg p-4 bg-slate-50 text-center relative hover:bg-slate-100 transition-colors h-48 flex items-center justify-center">
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleFileSelect} 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {formData.preview ? (
                                <img src={formData.preview} alt="Preview" className="h-full w-full object-contain" />
                            ) : (
                                <div className="text-slate-400">
                                    <i className="pi pi-camera text-3xl mb-2"></i>
                                    <p className="m-0">Click o arrastra imagen aquí</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* INPUTS FECHA Y COORDS */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="field">
                            <label className="font-bold text-slate-700">Fecha Manual</label>
                            <Calendar value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.value })} showTime showIcon />
                        </div>
                        <div className="field">
                            <label className="font-bold text-slate-700">Latitud</label>
                            <InputText value={formData.lat} onChange={(e) => setFormData({ ...formData, lat: e.target.value })} placeholder="-12.000" />
                        </div>
                        <div className="field col-start-2">
                            <label className="font-bold text-slate-700">Longitud</label>
                            <InputText value={formData.long} onChange={(e) => setFormData({ ...formData, long: e.target.value })} placeholder="-77.000" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6 border-t pt-4">
                    <Button label="Cancelar" icon="pi pi-times" text onClick={() => setModalVisible(false)} className="p-button-secondary" />
                    <Button label="Revisar" icon="pi pi-arrow-right" onClick={handlePreSubmit} />
                </div>
            </Dialog>

            {/* 2. Modal Preview (Confirmación) */}
            <Dialog visible={previewVisible} style={{ width: '90vw', maxWidth: '450px' }} header="Confirmar Envío a BD" modal onHide={() => setPreviewVisible(false)}>
                <div className="flex flex-col items-center mb-4">
                    <div className="w-full bg-slate-50 p-4 rounded border mb-4">
                        <ul className="m-0 p-0 list-none space-y-2 text-sm">
                            <li className="flex justify-between border-b pb-2">
                                <span className="font-semibold text-slate-600">Elemento:</span>
                                <span className="font-mono font-bold">{structureCode}</span>
                            </li>
                            <li className="flex justify-between border-b pb-2">
                                <span className="font-semibold text-slate-600">Código Def:</span>
                                <Tag value={formData.deficiencyCode} severity={formData.deficiencyCode === '0000' ? 'success' : 'warning'} />
                            </li>
                            <li className="flex justify-between border-b pb-2">
                                <span className="font-semibold text-slate-600">Fecha:</span>
                                <span>{formData.date?.toLocaleString()}</span>
                            </li>
                            <li className="flex justify-between border-b pb-2">
                                <span className="font-semibold text-slate-600">Ubicación:</span>
                                <span className="font-mono">{formData.lat}, {formData.long}</span>
                            </li>
                        </ul>
                    </div>
                    <p className="text-center text-slate-500 text-sm m-0">
                        Esta acción insertará/actualizará el registro en SQL Server.
                    </p>
                </div>
                <div className="flex justify-end gap-2">
                    <Button label="Volver" icon="pi pi-arrow-left" text onClick={() => { setPreviewVisible(false); setModalVisible(true); }} />
                    <Button label="Confirmar y Guardar" icon="pi pi-check" severity="success" onClick={handleFinalConfirm} autoFocus />
                </div>
            </Dialog>
        </div>
    );
}