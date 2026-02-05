import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// --- HOOKS ---
import { useDeficiencyByGis } from '../hooks/useDeficiency';
import { useFiles } from '../hooks/useFiles'; 
import { useTypification } from '../hooks/useTypification'; 

// --- COMPONENTES ---
import HistoricalTable from './HistoricalTable';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { Card } from 'primereact/card';

// ✅ FUNCIÓN UTILITARIA
const safeSeg = (val) => val ? val.toString().trim().toUpperCase().replace(/[\\/:*?"<>|]/g, '_') : "SIN_DATA";

// ✅ FORMATEO DE FECHA VISUAL
const formatDateTime = (date) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('es-PE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false
    }).format(new Date(date));
};

export default function WebInspectionManager() {
    // 1. HOOKS
    const { fetchByGis, loading: searchLoading } = useDeficiencyByGis();
    const { addFile } = useFiles();
    const { getCodeById, masterTypifications, fetchTypificationsByTypeElement } = useTypification();
    
    const toast = useRef(null);

    // 2. ESTADOS
    const [feederLabel, setFeederLabel] = useState('');
    const [sedCode, setSedCode] = useState('');
    const [structureType, setStructureType] = useState('Poste');
    const [structureCode, setStructureCode] = useState('');

    const [historicalData, setHistoricalData] = useState([]); 
    const [localItems, setLocalItems] = useState([]);        
    const [manualTypoOptions, setManualTypoOptions] = useState([]); 

    const [modalVisible, setModalVisible] = useState(false);
    const [zipLoading, setZipLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    
    const defaultForm = { 
        id: null, 
        selectedDeficiencyId: null, 
        deficiencyCode: '', 
        tipo: 1, 
        date: new Date(), 
        lat: '', 
        long: '', 
        comment: '', 
        file: null, 
        preview: null 
    };
    const [formData, setFormData] = useState(defaultForm);

    const tiposFoto = [
        { label: '1 - Panorámica', value: 1 },
        { label: '2 - Frontal', value: 2 },
        { label: '3 - Izquierda', value: 3 },
        { label: '4 - Derecha', value: 4 },
        { label: '0 - Otro', value: 0 }
    ];

    useEffect(() => {
        if (masterTypifications.length > 0) {
            const tableId = structureType === 'Poste' ? 8 : 9;
            setManualTypoOptions(fetchTypificationsByTypeElement(tableId));
        }
    }, [structureType, masterTypifications, fetchTypificationsByTypeElement]);

    // =================================================================
    // 🔄 AUTO-COMPLETADO INTELIGENTE (LAT/LONG/FECHA/CODIGO)
    // =================================================================
    useEffect(() => {
        if (formData.selectedDeficiencyId && historicalData.length > 0) {
            const def = historicalData.find(d => d.defiInterno === formData.selectedDeficiencyId);
            
            if (def) {
                // 1. Resolver el código visual
                const realCode = def.tipiInterno ? getCodeById(def.tipiInterno) : '';
                
                // 2. Resolver la fecha (Si existe en BD se usa, si no, actual)
                const originalDate = def.defiFecha ? new Date(def.defiFecha) : new Date();

                // 3. Actualizar formulario heredando datos del padre
                setFormData(prev => ({
                    ...prev,
                    deficiencyCode: realCode || prev.deficiencyCode,
                    lat: def.defiLatitud || '',     // Hereda Latitud
                    long: def.defiLongitud || '',   // Hereda Longitud
                    date: originalDate              // Hereda Fecha
                }));
            }
        }
    }, [formData.selectedDeficiencyId, historicalData, getCodeById]);


    // --- ACCIONES ---

    const handleSearch = async () => {
        if (!structureCode.trim()) return;
        const data = await fetchByGis(structureCode);
        if (data && data.length > 0) {
            setHistoricalData(data);
            toast.current.show({ severity: 'success', summary: 'Encontrado', detail: `${data.length} registros.` });
        } else {
            setHistoricalData([]);
        }
    };

    const openNewLocal = () => {
        let autoLat = '', autoLong = '';
        if (historicalData.length > 0) {
            // Intento de pre-llenado básico si no selecciona deficiencia específica aún
            const last = historicalData[historicalData.length - 1];
            autoLat = last.defiLatitud || ''; 
            autoLong = last.defiLongitud || '';
        }
        setIsEditing(false);
        setFormData({ ...defaultForm, id: Date.now(), lat: autoLat, long: autoLong, date: new Date() });
        setModalVisible(true);
    };

    const openEditLocal = (item) => {
        setIsEditing(true);
        setFormData({ ...item });
        setModalVisible(true);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) setFormData(prev => ({ ...prev, file: file, preview: URL.createObjectURL(file) }));
    };

    const deleteLocalItem = (id) => setLocalItems(prev => prev.filter(i => i.id !== id));

    // =================================================================
    // 💾 GUARDAR (LÓGICA SQL ROBUSTA)
    // =================================================================
    const handleSaveAndSync = async () => {
        if (!formData.file && !formData.preview) return;
        
        if (!feederLabel.trim() || !sedCode.trim()) {
            toast.current.show({ severity: 'error', summary: 'Faltan Datos', detail: 'Ingrese ALIMENTADOR y SED arriba.' });
            return;
        }
        if (!formData.deficiencyCode) {
             toast.current.show({ severity: 'error', summary: 'Error', detail: 'Falta el código de deficiencia.' });
             return;
        }

        // --- MODO EDICIÓN LOCAL ---
        if (isEditing) {
            setLocalItems(prev => prev.map(item => item.id === formData.id ? formData : item));
            setModalVisible(false);
            toast.current.show({ severity: 'info', summary: 'Actualizado', detail: 'Item actualizado localmente.' });
            return;
        }

        // --- MODO NUEVO (Guardar en BD) ---
        
        // 1. CÁLCULO DE COLUMNAS SQL CRÍTICAS
        let finalTipiInterno = 0;
        let finalIdElemento = 0;
        let finalTipoElemento = structureType === 'Poste' ? 'POST' : 'VANO';
        let targetDeficiency = null;

        if (formData.selectedDeficiencyId) {
            // Caso A: Seleccionó del historial
            targetDeficiency = historicalData.find(d => d.defiInterno === formData.selectedDeficiencyId);
            if (targetDeficiency) {
                finalTipiInterno  = targetDeficiency.tipiInterno;
                finalIdElemento   = targetDeficiency.defiIdElemento;
                finalTipoElemento = targetDeficiency.defiTipoElemento; 
            }
        } else {
            // Caso B: Modo Manual
            if (historicalData.length > 0) {
                // Heredamos el ID del elemento del historial cargado
                finalIdElemento = historicalData[0].defiIdElemento;
            }
            // Buscamos el ID de la tipificación manualmente
            const foundTypo = masterTypifications.find(t => 
                t.tipiCodigo === formData.deficiencyCode || t.code === formData.deficiencyCode
            );
            if (foundTypo) {
                finalTipiInterno = foundTypo.tipiInterno || foundTypo.id;
            }
        }

        const dateStr = formData.date.toISOString().slice(0,19).replace(/[:]/g, '-');
        const standardizedName = `${safeSeg(structureCode)}_${safeSeg(formData.deficiencyCode)}_${dateStr}_Tipo${formData.tipo}.jpg`;
        const relativePath = `${safeSeg(feederLabel)}/${safeSeg(sedCode)}/${safeSeg(structureType)}/${safeSeg(structureCode)}/${safeSeg(formData.deficiencyCode)}`;
        const dbPath = `SIGREMOVIL/${relativePath}/${standardizedName}`;

        const payload = {
            archInterno: 0,
            archTipo: formData.tipo.toString(),
            archNombre: dbPath,
            archTabla: "Deficiencias",
            archCodTabla: targetDeficiency ? targetDeficiency.defiInterno : 0,
            
            // Usamos los datos heredados/editados del form
            archLatitud: formData.lat || 0,
            archLongitud: formData.long || 0,
            archFecha: formData.date.toISOString(), 

            // Datos Relacionales
            archTipoElemento: finalTipoElemento,
            archIdElemento: finalIdElemento,
            tipiInterno: finalTipiInterno,
            archActivo: 1, // Siempre activo
            estadoOffLine: 0
            
            // 🚫 COMENTARIO ELIMINADO DEL PAYLOAD
        };

        const success = await addFile(payload);
        
        if (success) {
            handleSearch();
            setLocalItems(prev => [...prev, formData]); 
            setModalVisible(false);
            toast.current.show({ severity: 'success', summary: 'Guardado', detail: 'Ruta SIGREMOVIL generada.' });
        } else {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar en BD.' });
        }
    };

    // =================================================================
    // 📦 GENERAR ZIP
    // =================================================================
    const processImageToBlob = (src) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                canvas.toBlob(b => resolve(b), 'image/jpeg', 0.85);
            };
            img.onerror = reject;
        });
    };

    const handleGenerateZip = async () => {
        if (!feederLabel.trim() || !sedCode.trim()) {
            toast.current.show({ severity: 'error', summary: 'Faltan Datos', detail: 'Ingrese ALIMENTADOR y SED.' });
            return; 
        }
        if (localItems.length === 0) return;

        setZipLoading(true);
        try {
            const zip = new JSZip();
            const root = "SIGREMOVIL";
            let c7004 = 0; 

            for (const item of localItems) {
                const source = item.file ? URL.createObjectURL(item.file) : item.preview;
                try {
                    const blob = await processImageToBlob(source);
                    
                    let extraFolder = "";
                    if (item.deficiencyCode === '7004') { c7004++; extraFolder = `/${c7004}`; }
                    
                    const path = `${root}/${safeSeg(feederLabel)}/${safeSeg(sedCode)}/${safeSeg(structureType)}/${safeSeg(structureCode)}/${safeSeg(item.deficiencyCode)}${extraFolder}`;
                    
                    const dateStr = item.date.toISOString().slice(0,19).replace(/[:]/g, '-');
                    const fname = `${safeSeg(structureCode)}_${safeSeg(item.deficiencyCode)}_${dateStr}_Tipo${item.tipo}.jpg`;
                    
                    // Comentario solo en ZIP local (TXT)
                    if(item.comment){
                          zip.folder(path).file(fname.replace('.jpg','.txt'), item.comment);
                    }

                    zip.folder(path).file(fname, blob);
                } catch (e) { console.error(e); }
            }
            
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `Inspeccion_${structureCode}.zip`);
            toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'ZIP Generado.' });
        } catch (e) { console.error(e); } finally { setZipLoading(false); }
    };

    // ... [RENDERIZADO] ...
    
    const deficiencyOptions = historicalData.map(d => {
        const realCode = getCodeById(d.tipiInterno); 
        return {
            label: `ID BD: ${d.defiInterno} | ${realCode ? 'Cód: '+realCode : 'S/C'} | ${d.defiObservacion || '-'}`,
            value: d.defiInterno
        };
    });

    return (
        <div className="min-h-screen bg-slate-50 p-4">
            <Toast ref={toast} />
            <ConfirmDialog />

            {/* 1. CABECERA */}
            <Card className="mb-4 shadow-sm border-t-4 border-blue-600" title="1. Configuración Global">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="font-bold text-xs text-blue-800">Alimentador *</label>
                        <InputText value={feederLabel} onChange={(e) => setFeederLabel(e.target.value.toUpperCase())} placeholder="Ej. CHACHANI" className={!feederLabel ? 'p-invalid' : ''} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="font-bold text-xs text-blue-800">SED *</label>
                        <InputText value={sedCode} onChange={(e) => setSedCode(e.target.value.toUpperCase())} placeholder="Ej. 1709" className={!sedCode ? 'p-invalid' : ''} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="font-bold text-xs">Tipo Estructura</label>
                        <Dropdown value={structureType} options={['Poste', 'Vano']} onChange={(e) => setStructureType(e.value)} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="font-bold text-xs text-blue-600">Buscar GIS</label>
                        <div className="p-inputgroup">
                            <InputText value={structureCode} onChange={(e) => setStructureCode(e.target.value.toUpperCase())} placeholder="PTO..." onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
                            <Button icon="pi pi-search" loading={searchLoading} onClick={handleSearch} />
                        </div>
                    </div>
                </div>
            </Card>

            {/* 2. HISTORIAL */}
            {historicalData.length > 0 && (
                <div className="mb-8">
                    <HistoricalTable data={historicalData} />
                </div>
            )}

            {/* 3. GESTOR LOCAL */}
            <Card title="2. Carga de Fotos (ZIP + BD)" className="border-t-4 border-purple-500">
                <Toolbar className="mb-4" 
                    left={<Button label="Agregar Foto Local" icon="pi pi-plus" severity="success" onClick={openNewLocal} disabled={!structureCode} />} 
                    right={<Button label="Descargar ZIP" icon="pi pi-download" severity="help" onClick={handleGenerateZip} loading={zipLoading} disabled={localItems.length === 0} />} 
                />
                
                <DataTable value={localItems} size="small" emptyMessage="Lista vacía." stripedRows>
                    <Column header="Vista" body={(r)=><img src={r.preview} alt="img" className="w-10 h-10 rounded border object-cover"/>} style={{width:'60px'}} />
                    <Column field="deficiencyCode" header="Cód. Def" body={(r)=><span className="font-mono font-bold text-blue-700">{r.deficiencyCode}</span>} />
                    <Column header="Fecha Toma" body={(r)=> formatDateTime(r.date)} style={{minWidth: '130px'}} />
                    <Column header="Comentario" body={(r) => <span className="text-xs italic text-gray-600">{r.comment || '-'}</span>} />
                    <Column body={(r) => (
                        <div className="flex gap-1">
                             <Button icon="pi pi-pencil" rounded text severity="info" onClick={() => openEditLocal(r)} tooltip="Editar" />
                             <Button icon="pi pi-trash" rounded text severity="danger" onClick={()=>deleteLocalItem(r.id)} tooltip="Eliminar" />
                        </div>
                    )} style={{width:'100px'}} />
                </DataTable>
            </Card>

            {/* MODAL (Create / Edit) */}
            <Dialog 
                visible={modalVisible} 
                onHide={() => setModalVisible(false)} 
                header={isEditing ? "Editar Foto" : "Nueva Evidencia"} 
                style={{ width: '90vw', maxWidth: '450px' }} 
                modal
            >
                <div className="flex flex-col gap-4 pt-2">
                    
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-600">Asignar a Deficiencia</label>
                        {historicalData.length > 0 ? (
                            <Dropdown 
                                value={formData.selectedDeficiencyId} 
                                options={deficiencyOptions} 
                                onChange={(e) => setFormData({...formData, selectedDeficiencyId: e.value})} 
                                placeholder="Seleccione del historial..." 
                                className="w-full"
                            />
                        ) : (
                            <small className="text-orange-500">Sin historial (Modo Manual)</small>
                        )}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-600">Código Carpeta (Auto)</label>
                        <div className="p-inputgroup">
                            <InputText 
                                value={formData.deficiencyCode} 
                                onChange={(e) => setFormData({...formData, deficiencyCode: e.target.value})} 
                                placeholder="Ej: 6002"
                            />
                            <Button icon="pi pi-sync" disabled className="p-button-secondary"/>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-600">Tipo de Foto</label>
                        <Dropdown value={formData.tipo} options={tiposFoto} onChange={(e) => setFormData({...formData, tipo: e.value})} className="w-full" />
                    </div>

                     <div className="border-2 border-dashed border-gray-300 p-4 rounded bg-gray-50 text-center relative cursor-pointer hover:bg-gray-100">
                        <input type="file" accept="image/*" onChange={handleFileSelect} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"/>
                        {formData.preview ? <img src={formData.preview} className="h-32 mx-auto object-contain" alt="prev"/> : <span className="text-gray-400">Toque para subir</span>}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-blue-700">Fecha y Hora</label>
                        <Calendar 
                            value={formData.date} 
                            onChange={(e) => setFormData({...formData, date: e.value})} 
                            showTime 
                            showIcon 
                            className="w-full"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-600">Comentario</label>
                        <InputTextarea 
                            value={formData.comment} 
                            onChange={(e) => setFormData({...formData, comment: e.target.value})} 
                            rows={2}
                            placeholder="Observación de la foto..."
                        />
                    </div>

                    <div className="flex gap-2">
                        <div className="w-1/2">
                            <label className="text-xs font-bold text-gray-500">Latitud</label>
                            <InputText 
                                value={formData.lat} 
                                onChange={(e)=>setFormData({...formData, lat:e.target.value})} 
                                className="w-full p-inputtext-sm"
                            />
                        </div>
                        <div className="w-1/2">
                            <label className="text-xs font-bold text-gray-500">Longitud</label>
                            <InputText 
                                value={formData.long} 
                                onChange={(e)=>setFormData({...formData, long:e.target.value})} 
                                className="w-full p-inputtext-sm"
                            />
                        </div>
                    </div>

                    <Button 
                        label={isEditing ? "Actualizar Cambios" : "Guardar en BD"} 
                        icon={isEditing ? "pi pi-refresh" : "pi pi-check"} 
                        onClick={handleSaveAndSync} 
                        disabled={!formData.file && !formData.preview} 
                        className="mt-2" 
                        severity={isEditing ? "info" : "primary"}
                    />
                </div>
            </Dialog>
        </div>
    );
}