import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// --- HOOKS ---
import { useDeficiencyByGis } from '../hooks/useDeficiencyByGis';
import { useFiles } from '../hooks/useFiles'; // 👈 IMPORTANTE: Para guardar en BD

// --- COMPONENTES HIJOS ---
import HistoricalTable from './HistoricalTable';

// --- PRIMEREACT ---
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown'; // 👈 Necesario
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { Card } from 'primereact/card';

export default function WebInspectionManager() {
    // 1. HOOKS
    const { fetchByGis, loading: searchLoading } = useDeficiencyByGis();
    const { addFile } = useFiles(); // Hook para guardar en BD
    const toast = useRef(null);

    // 2. ESTADOS
    const [feederLabel, setFeederLabel] = useState('');
    const [sedCode, setSedCode] = useState('');
    const [structureType, setStructureType] = useState('Poste');
    const [structureCode, setStructureCode] = useState('');

    const [historicalData, setHistoricalData] = useState([]); 
    const [localItems, setLocalItems] = useState([]);         

    const [modalVisible, setModalVisible] = useState(false);
    const [zipLoading, setZipLoading] = useState(false);
    
    // Formulario Local Actualizado con 'tipo'
    const defaultForm = { 
        id: null, 
        deficiencyCode: '', // Usaremos esto como el código de deficiencia visual
        tipo: 1,            // Por defecto Panorámica
        date: new Date(), 
        lat: '', 
        long: '', 
        file: null, 
        preview: null 
    };
    const [formData, setFormData] = useState(defaultForm);
    const [isEdit, setIsEdit] = useState(false);

    // Opciones de Tipo de Foto
    const tiposFoto = [
        { label: '1 - Panorámica', value: 1 },
        { label: '2 - Frontal', value: 2 },
        { label: '3 - Izquierda', value: 3 },
        { label: '4 - Derecha', value: 4 },
        { label: '0 - Otro', value: 0 }
    ];

    // =================================================================
    // A. LÓGICA DE BÚSQUEDA
    // =================================================================
    const handleSearch = async () => {
        if (!structureCode.trim()) return;
        const data = await fetchByGis(structureCode);
        
        if (data && data.length > 0) {
            setHistoricalData(data);
            toast.current.show({ severity: 'success', summary: 'Encontrado', detail: `${data.length} registros en BD.` });
            
            // Auto-llenar datos globales si es posible (Opcional)
            // setFeederLabel(...)
        } else {
            setHistoricalData([]);
            toast.current.show({ severity: 'info', summary: 'Sin historial', detail: 'No hay deficiencias registradas para este GIS.' });
        }
    };

    // =================================================================
    // B. LÓGICA MIXTA (LOCAL + SERVIDOR)
    // =================================================================
    const openNewLocal = () => {
        let autoLat = '', autoLong = '';
        
        // Heredar coordenadas del último registro histórico
        if (historicalData.length > 0) {
            const last = historicalData[historicalData.length - 1];
            autoLat = last.defiLatitud || ''; 
            autoLong = last.defiLongitud || '';
        } else if (localItems.length > 0) {
            const lastLocal = localItems[localItems.length - 1];
            autoLat = lastLocal.lat;
            autoLong = lastLocal.long;
        }

        setFormData({ ...defaultForm, id: Date.now(), lat: autoLat, long: autoLong, date: new Date() });
        setIsEdit(false);
        setModalVisible(true);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) setFormData(prev => ({ ...prev, file: file, preview: URL.createObjectURL(file) }));
    };

    // --- FUNCIÓN PRINCIPAL: GUARDAR EN BD Y EN LISTA LOCAL ---
    const handleSaveAndSync = async () => {
        // 1. Validaciones
        if (!formData.file && !formData.preview) {
            toast.current.show({ severity: 'warn', summary: 'Foto requerida', detail: 'Debe seleccionar una imagen.' });
            return;
        }

        // 2. Obtener datos de la deficiencia padre (del historial de búsqueda)
        // Necesitamos saber a qué Deficiencia (ID BD) vamos a asociar esta foto.
        // Asumiremos que se asocia a la ÚLTIMA deficiencia encontrada, o a la primera.
        // Si no hay historial, NO PODEMOS GUARDAR EN BD (porque falta Foreign Key).
        
        const parentDeficiency = historicalData.length > 0 ? historicalData[historicalData.length - 1] : null;

        if (!parentDeficiency) {
            // Caso Borde: No hay historial. Solo guardamos local para ZIP.
            toast.current.show({ severity: 'warn', summary: 'Solo Local', detail: 'No hay deficiencia en BD para vincular. Se guardará solo para ZIP.' });
            saveToLocalList(); // Solo local
            return;
        }

        // 3. Construir Payload para el Servidor
        // Generamos un nombre de archivo ficticio o usamos el real
        const fileName = formData.file ? formData.file.name : `foto_${Date.now()}.jpg`;
        
        const payload = {
            archInterno: 0, // Insertar nuevo
            archTipo: formData.tipo.toString(),
            archNombre: `SigreMedios/Manual/${structureCode}/${fileName}`, // Ruta lógica
            
            archTabla: "Deficiencias",
            archCodTabla: parentDeficiency.defiInterno, // ID Deficiencia (FK)

            archLatitud: formData.lat || 0,
            archLongitud: formData.long || 0,
            archFecha: formData.date.toISOString(),

            // Datos heredados del elemento padre
            archTipoElemento: parentDeficiency.defiTipoElemento || "POST",
            archIdElemento: parentDeficiency.defiIdElemento || 0,
            tipiInterno: parentDeficiency.tipiInterno || 0,
            
            archActivo: true,
            estadoOffLine: 0
        };

        // 4. Enviar al Backend
        try {
            const success = await addFile(payload); // Llamamos a tu API

            if (success) {
                toast.current.show({ severity: 'success', summary: 'Guardado y Sincronizado', detail: 'Foto registrada en BD.' });
                
                // 5. Si tuvo éxito en BD, guardamos en lista local y refrescamos
                saveToLocalList();
                handleSearch(); // <--- ESTO REFRESCA LA TABLA DE HISTORIAL AUTOMÁTICAMENTE
            } else {
                toast.current.show({ severity: 'error', summary: 'Error Servidor', detail: 'Falló el guardado en BD.' });
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Función auxiliar para actualizar solo el estado visual (Lista ZIP)
    const saveToLocalList = () => {
        if (isEdit) {
            setLocalItems(prev => prev.map(i => i.id === formData.id ? formData : i));
        } else {
            setLocalItems(prev => [...prev, formData]);
        }
        setModalVisible(false);
    };

    const deleteLocalItem = (id) => setLocalItems(prev => prev.filter(i => i.id !== id));

    // =================================================================
    // C. GENERACIÓN ZIP (Sin cambios mayores)
    // =================================================================
    const safeSeg = (val) => val ? val.toString().trim().replace(/[\\/:*?"<>|]/g, '_') : "SIN_DATA";
    
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
                canvas.toBlob(b => resolve(b), 'image/jpeg', 0.8);
            };
            img.onerror = reject;
        });
    };

    const handleGenerateZip = async () => {
        if (localItems.length === 0) return;
        setZipLoading(true);
        try {
            const zip = new JSZip();
            const root = "SIGRE.MOVIL";
            // ... (Lógica de carpetas igual que antes) ...
            let c7004 = 0;
            for (const item of localItems) {
                const source = item.file ? URL.createObjectURL(item.file) : item.preview;
                try {
                    const blob = await processImageToBlob(source);
                    let extra = "";
                    if (item.deficiencyCode === '7004') { c7004++; extra = `/${c7004}`; }
                    const path = `${root}/${safeSeg(feederLabel)}/${safeSeg(sedCode)}/${structureType}/${safeSeg(structureCode)}/${safeSeg(item.deficiencyCode)}${extra}`;
                    const fname = `${safeSeg(structureCode)}_${safeSeg(item.deficiencyCode)}_${item.date.toISOString().slice(0,19).replace(/[:]/g, '-')}__Tipo${item.tipo}.jpg`;
                    zip.folder(path).file(fname, blob);
                } catch (e) { console.error(e); }
            }
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `Inspeccion_${structureCode}.zip`);
            toast.current.show({ severity: 'success', summary: 'ZIP Generado', detail: 'Descarga iniciada.' });
        } catch (e) { console.error(e); } finally { setZipLoading(false); }
    };

    // Template para mostrar el tipo en la tabla local
    const typeBody = (r) => {
        const labels = { 1: 'Panorámica', 2: 'Frontal', 3: 'Izquierda', 4: 'Derecha', 0: 'Otro' };
        return <Tag value={labels[r.tipo]} severity="info" />;
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-800">
            <Toast ref={toast} />
            <ConfirmDialog />

            {/* HEADER CONFIG */}
            <Card className="mb-4 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <InputText value={feederLabel} onChange={(e) => setFeederLabel(e.target.value)} placeholder="Alimentador" />
                    <InputText value={sedCode} onChange={(e) => setSedCode(e.target.value)} placeholder="SED" />
                    <Dropdown value={structureType} options={['Poste', 'Vano']} onChange={(e) => setStructureType(e.value)} />
                    <div className="p-inputgroup">
                        <InputText value={structureCode} onChange={(e) => setStructureCode(e.target.value)} placeholder="Código GIS" onKeyDown={(e)=>e.key==='Enter' && handleSearch()} />
                        <Button icon="pi pi-search" loading={searchLoading} onClick={handleSearch} />
                    </div>
                </div>
            </Card>

            {/* SECCIÓN 1: HISTORIAL (BD) */}
            {historicalData.length > 0 && (
                <div className="mb-8">
                    <HistoricalTable data={historicalData} />
                </div>
            )}

            {/* SECCIÓN 2: CARGA LOCAL Y GUARDADO EN BD */}
            <Card title="Gestión de Fotos (Local + BD)" className="border-t-4 border-purple-500">
                <Toolbar className="mb-4" 
                    left={<Button label="Agregar Foto (Guardar en BD)" icon="pi pi-plus" severity="success" onClick={openNewLocal} disabled={!structureCode} />} 
                    right={<Button label="Descargar ZIP" icon="pi pi-download" severity="help" onClick={handleGenerateZip} loading={zipLoading} disabled={localItems.length === 0} />} 
                />
                <DataTable value={localItems} size="small" emptyMessage="No hay fotos agregadas en esta sesión.">
                    <Column header="Vista" body={(r)=><img src={r.preview} alt="img" className="w-10 h-10 rounded object-cover"/>} />
                    <Column field="tipo" header="Tipo" body={typeBody} />
                    <Column field="deficiencyCode" header="Cód. Def." />
                    <Column header="Fecha" body={(r)=> r.date.toLocaleString()} />
                    <Column header="Coords" body={(r)=><small>{r.lat}, {r.long}</small>} />
                    <Column body={(r) => <Button icon="pi pi-trash" rounded text severity="danger" onClick={()=>deleteLocalItem(r.id)} />} />
                </DataTable>
            </Card>

            {/* MODAL DE AGREGAR */}
            <Dialog visible={modalVisible} onHide={() => setModalVisible(false)} header="Nueva Foto" style={{ width: '90vw', maxWidth: '450px' }} modal>
                <div className="flex flex-col gap-4 pt-2">
                    
                    {/* TIPO DE FOTO (Nuevo) */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-600">Tipo de Foto</label>
                        <Dropdown 
                            value={formData.tipo} 
                            options={tiposFoto} 
                            onChange={(e) => setFormData({...formData, tipo: e.value})} 
                            className="w-full"
                        />
                    </div>

                    <InputText placeholder="Código Deficiencia (Ej: 6002)" value={formData.deficiencyCode} onChange={(e)=>setFormData({...formData, deficiencyCode:e.target.value})} />
                    
                    {/* Input File */}
                    <div className="border border-dashed p-3 rounded bg-gray-50 text-center">
                        <input type="file" onChange={handleFileSelect} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"/>
                        {formData.preview && <img src={formData.preview} className="mt-2 h-20 object-contain mx-auto" alt="preview"/>}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500">Fecha</label>
                        <Calendar value={formData.date} onChange={(e) => setFormData({...formData, date: e.value})} showTime showIcon />
                    </div>

                    <div className="flex gap-2">
                        <InputText placeholder="Latitud" value={formData.lat} onChange={(e)=>setFormData({...formData, lat:e.target.value})} className="w-full"/>
                        <InputText placeholder="Longitud" value={formData.long} onChange={(e)=>setFormData({...formData, long:e.target.value})} className="w-full"/>
                    </div>
                    
                    <Button label="Guardar en BD y Lista" icon="pi pi-check" onClick={handleSaveAndSync} />
                </div>
            </Dialog>
        </div>
    );
}