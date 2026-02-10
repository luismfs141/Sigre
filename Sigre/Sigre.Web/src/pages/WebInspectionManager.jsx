import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// --- HOOKS ---
import { useDeficiencyByGis } from '../hooks/useDeficiency';
import { useFiles } from '../hooks/useFiles'; 
import { useTypification } from '../hooks/useTypification';
import { useFeeder, useSedsByFeeder } from '../hooks/useFeeder'; 

// --- COMPONENTES ---
import HistoricalTable from './HistoricalTable';
import PhotoUploadModal from '../components/Modals/PhotoUploadModal';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { AutoComplete } from 'primereact/autocomplete';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { Card } from 'primereact/card';
import { Image } from 'primereact/image'; // ✅ COMPONENTE PARA ZOOM

// --- UTILIDADES ---

const safeSeg = (val) => val ? val.toString().trim().toUpperCase().replace(/[\\/:*?"<>|]/g, '_') : "SIN_DATA";

// Limpia "CHACHANI - 1701" -> "CHACHANI"
const cleanFeederName = (label) => {
    if (!label) return "SIN_FEEDER";
    return label.split(' - ')[0].trim().toUpperCase();
};

// Formato para nombre de archivo: YYYYMMDD-HHMMSS
const formatCompactDate = (dateInput) => {
    if (!dateInput) return '00000000-000000';
    const d = new Date(dateInput);
    const pad = (n) => n.toString().padStart(2, '0');
    // ✅ Usa la hora exacta del objeto fecha, no la del sistema
    return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

// Formato visual para tabla
const formatDateTime = (date) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date));
};

export default function WebInspectionManager() {
    const toast = useRef(null);

    // --- 1. INFRAESTRUCTURA ---
    const { feeders, loading: loadingFeeders } = useFeeder();
    const [selectedFeeder, setSelectedFeeder] = useState(null); 
    const [selectedSed, setSelectedSed] = useState(null);       
    const [filteredSeds, setFilteredSeds] = useState([]);
    
    // Hook SEDs
    const feederIdForHook = (selectedFeeder && typeof selectedFeeder === 'object') ? selectedFeeder.value : selectedFeeder;
    const { seds: sedsDelAlimentador, loading: loadingSeds } = useSedsByFeeder(feederIdForHook);
    
    // --- 2. DATOS ---
    const { fetchByGis, loading: searchLoading } = useDeficiencyByGis();
    const { addFile } = useFiles();
    const { getCodeById, fetchTypificationsByTypeElement, masterTypifications } = useTypification();

    const [structureType, setStructureType] = useState('Poste');
    const [structureCode, setStructureCode] = useState('');
    const [historicalData, setHistoricalData] = useState([]); 
    const [localItems, setLocalItems] = useState([]);        
    
    // --- 3. MODAL Y ZIP ---
    const defaultForm = { id: null, selectedDeficiencyId: null, deficiencyCode: '', tipo: 1, date: new Date(), lat: '', long: '', file: null, preview: null };
    const [modalData, setModalData] = useState(defaultForm);
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [zipLoading, setZipLoading] = useState(false); // Spinner para el botón ZIP

    // --- HANDLERS UI ---
    const handleFeederChange = (e) => { setSelectedFeeder(e.value); setSelectedSed(null); setFilteredSeds([]); };
    
    const searchSeds = (event) => {
        const query = event.query.toLowerCase();
        if (sedsDelAlimentador) {
            setFilteredSeds(sedsDelAlimentador.filter(sed => (sed.sedCodigo||"").toLowerCase().includes(query)));
        }
    };

    const handleSearch = async () => {
        if (!structureCode.trim()) { toast.current.show({ severity: 'warn', summary: 'Atención', detail: 'Ingrese código GIS.' }); return; }
        const data = await fetchByGis(structureCode);
        setHistoricalData(data || []);
        if (data?.length > 0) toast.current.show({ severity: 'success', summary: 'Encontrado', detail: `${data.length} registros.` });
        else toast.current.show({ severity: 'info', summary: 'Sin Datos', detail: 'No hay historial.' });
    };

    useEffect(() => {
        if (masterTypifications.length > 0) fetchTypificationsByTypeElement(structureType === 'Poste' ? 8 : 9);
    }, [structureType, masterTypifications, fetchTypificationsByTypeElement]);

    // -------------------------------------------------------------------
    // 📦 GENERAR ZIP (Lógica Idéntica al Guardado)
    // -------------------------------------------------------------------
    const handleGenerateZip = async () => {
        if (localItems.length === 0) return;
        
        // Validar contexto para armar carpetas
        if (!selectedFeeder || !selectedSed) {
            toast.current.show({ severity: 'error', summary: 'Faltan Datos', detail: 'Seleccione Alimentador y SED para estructurar el ZIP.' });
            return;
        }

        setZipLoading(true);
        try {
            const zip = new JSZip();
            
            // --- PREPARAR NOMBRES DE CARPETAS BASE ---
            
            // 1. Alimentador Limpio
            let rawFeederLabel = "SIN_FEEDER";
            if (typeof selectedFeeder === 'object' && selectedFeeder !== null) rawFeederLabel = selectedFeeder.label || selectedFeeder.value;
            else { const f = feeders.find(x => x.value === selectedFeeder); rawFeederLabel = f ? f.label : String(selectedFeeder); }
            const feederFolder = cleanFeederName(rawFeederLabel); // Ej: "EL FISCAL"

            // 2. SED
            let sedCodigo = "SIN_SED";
            if (typeof selectedSed === 'object' && selectedSed !== null) sedCodigo = selectedSed.sedCodigo;
            else sedCodigo = String(selectedSed);
            const sedFolder = safeSeg(sedCodigo); // Ej: "8258"

            // 3. Tipo y Código Elemento
            const typeElemFolder = structureType === 'Poste' ? 'POSTE' : 'VANO';
            const codeElemFolder = safeSeg(structureCode); // Ej: "VBT000021566"

            // --- RECORRER FOTOS LOCALES ---
            
            // Reiniciamos contadores para el ZIP
            let count7004 = 0;

            for (const item of localItems) {
                if (!item.file) continue; // Solo procesamos si hay archivo real

                // 4. Lógica de Deficiencia (Igual que en Save)
                let defCodeFolder = safeSeg(item.deficiencyCode);
                let defNamePart = defCodeFolder;

                if (defCodeFolder === '7004') {
                    count7004++;
                    defCodeFolder = `7004/${count7004}`;
                    defNamePart = `7004_${count7004}`;
                }

                // 5. Nombre Archivo (Usando la fecha del item, no la actual)
                const compactDate = formatCompactDate(item.date);
                const fileName = `FOT-${sedFolder}-${codeElemFolder}-${defNamePart}-${compactDate}-${item.tipo}.jpg`;

                // 6. Ruta Completa dentro del ZIP
                const fullPath = `SIGRE.MOVIL/${feederFolder}/${sedFolder}/${typeElemFolder}/${codeElemFolder}/${defCodeFolder}`;
                
                // 7. Insertar en ZIP
                zip.folder(fullPath).file(fileName, item.file);
            }

            // --- DESCARGAR ---
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `Evidencias_${codeElemFolder}.zip`);
            toast.current.show({ severity: 'success', summary: 'ZIP Creado', detail: 'Descarga iniciada.' });

        } catch (e) {
            console.error("Error ZIP:", e);
            toast.current.show({ severity: 'error', summary: 'Error ZIP', detail: 'No se pudo comprimir.' });
        } finally {
            setZipLoading(false);
        }
    };

    // -------------------------------------------------------------------
    // 💾 GUARDADO BD
    // -------------------------------------------------------------------
    const handleSavePhoto = async (dataToSave) => {
        if (!selectedFeeder || !selectedSed) { toast.current.show({ severity: 'error', summary: 'Error', detail: 'Seleccione Alimentador/SED.' }); return; }
        if (!dataToSave.selectedDeficiencyId) { toast.current.show({ severity: 'error', summary: 'Requerido', detail: 'Asigne una deficiencia.' }); return; }

        const targetDeficiency = historicalData.find(d => d.defiInterno === dataToSave.selectedDeficiencyId);
        if (!targetDeficiency) { toast.current.show({ severity: 'error', summary: 'Error', detail: 'Deficiencia no encontrada.' }); return; }

        if (isEditing) {
            setLocalItems(prev => prev.map(item => item.id === dataToSave.id ? dataToSave : item));
            setModalVisible(false);
            return;
        }

        // --- LÓGICA DE NOMBRES (Debe coincidir con ZIP) ---
        let rawFeederLabel = "SIN_FEEDER";
        if (typeof selectedFeeder === 'object' && selectedFeeder !== null) rawFeederLabel = selectedFeeder.label || selectedFeeder.value;
        else { const f = feeders.find(x => x.value === selectedFeeder); rawFeederLabel = f ? f.label : String(selectedFeeder); }
        const feederFolder = cleanFeederName(rawFeederLabel); // ✅ Limpieza aplicada

        let sedCodigo = "SIN_SED";
        if (typeof selectedSed === 'object' && selectedSed !== null) sedCodigo = selectedSed.sedCodigo;
        else sedCodigo = String(selectedSed);
        const sedFolder = safeSeg(sedCodigo);

        const typeElemFolder = structureType === 'Poste' ? 'POSTE' : 'VANO';
        const codeElemFolder = safeSeg(structureCode);
        
        let defCodeFolder = safeSeg(dataToSave.deficiencyCode);
        let defNamePart = defCodeFolder;

        if (defCodeFolder === '7004') {
            const count7004 = localItems.filter(i => i.deficiencyCode === '7004').length + 1;
            defCodeFolder = `7004/${count7004}`;
            defNamePart = `7004_${count7004}`;
        }

        // ✅ Usamos la fecha del formulario (dataToSave.date), NO la actual
        const compactDate = formatCompactDate(dataToSave.date); 
        
        const fileName = `FOT-${sedFolder}-${codeElemFolder}-${defNamePart}-${compactDate}-${dataToSave.tipo}.jpg`;
        const relativePath = `${feederFolder}/${sedFolder}/${typeElemFolder}/${codeElemFolder}/${defCodeFolder}`;
        const dbPath = `SIGRE.MOVIL/${relativePath}/${fileName}`;

        const lat = parseFloat(dataToSave.lat);
        const long = parseFloat(dataToSave.long);

        const payload = {
            archInterno: 0,
            archTipo: String(dataToSave.tipo),
            archNombre: dbPath.substring(0, 150),
            archTabla: "Deficiencias",
            archCodTabla: Number(targetDeficiency.defiInterno),
            archLatitud: isNaN(lat) ? 0 : lat,
            archLongitud: isNaN(long) ? 0 : long,
            archFecha: dataToSave.date.toISOString(),
            archTipoElemento: targetDeficiency.defiTipoElemento,
            archIdElemento: Number(targetDeficiency.defiIdElemento),
            tipiInterno: Number(targetDeficiency.tipiInterno),
            archActivo: true
        };

        const success = await addFile(payload);
        if (success) {
            handleSearch();
            setLocalItems(prev => [...prev, { ...dataToSave, id: Date.now() }]);
            setModalVisible(false);
            toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Foto guardada.' });
        } else {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Fallo en BD.' });
        }
    };

    // --- ACCIONES AUXILIARES ---
    const openNewLocal = () => {
        let autoLat = '', autoLong = '';
        if (historicalData.length > 0) { const last = historicalData[0]; autoLat = last.defiLatitud || ''; autoLong = last.defiLongitud || ''; }
        setModalData({ ...defaultForm, id: Date.now(), lat: autoLat, long: autoLong });
        setIsEditing(false);
        setModalVisible(true);
    };
    const openEditLocal = (item) => { setModalData(item); setIsEditing(true); setModalVisible(true); };
    const deleteLocalItem = (id) => setLocalItems(prev => prev.filter(i => i.id !== id));

    return (
        <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-700">
            <Toast ref={toast} />
            <ConfirmDialog />

            {/* BARRA SUPERIOR */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-4 flex flex-wrap items-center justify-between gap-4 border border-slate-200">
                <div className="flex items-end gap-3">
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-blue-800 uppercase">Alimentador</label>
                        <Dropdown value={selectedFeeder} onChange={handleFeederChange} options={feeders} optionLabel="label" filter placeholder="Seleccione..." className="w-48 p-inputtext-sm" disabled={loadingFeeders} />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-blue-800 uppercase">SED</label>
                        <AutoComplete value={selectedSed} suggestions={filteredSeds} completeMethod={searchSeds} field="sedCodigo" dropdown onChange={(e) => setSelectedSed(e.value)} placeholder="Buscar SED..." className="w-40 p-inputtext-sm font-bold" forceSelection disabled={!feederIdForHook || loadingSeds} />
                    </div>
                </div>
                <div className="flex items-end gap-2 border-l pl-4 border-slate-300">
                     <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-gray-600">CÓDIGO GIS</label>
                        <div className="p-inputgroup">
                            <InputText value={structureCode} onChange={(e) => setStructureCode(e.target.value.toUpperCase())} placeholder="Ej: PTO..." className="w-32 p-inputtext-sm font-bold" onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
                            <Button icon="pi pi-search" onClick={handleSearch} loading={searchLoading} disabled={!structureCode} />
                        </div>
                    </div>
                </div>
            </div>

            {historicalData.length > 0 && <div className="mb-6"><HistoricalTable data={historicalData} /></div>}

            {/* GESTOR LOCAL */}
            <Card title="Carga de Evidencias" className="border-t-4 border-purple-500 shadow-sm">
                <Toolbar className="mb-4" 
                    left={<Button label="Agregar Foto" icon="pi pi-camera" severity="success" onClick={openNewLocal} disabled={!structureCode || historicalData.length === 0} />} 
                    // ✅ Botón ZIP funcionando
                    right={
                        <Button 
                            label="Descargar ZIP" 
                            icon={zipLoading ? "pi pi-spin pi-spinner" : "pi pi-download"} 
                            severity="help" 
                            onClick={handleGenerateZip} 
                            disabled={localItems.length === 0} 
                            tooltip="Descargar evidencias con estructura SIGRE.MOVIL"
                        />
                    }
                />
                
                <DataTable value={localItems} size="small" emptyMessage="Sin fotos." stripedRows>
                    
                    {/* ✅ VISTA CON ZOOM Y MINIATURA */}
                    <Column 
                        header="Vista" 
                        body={(r) => (
                            <div className="flex justify-center">
                                <Image 
                                    src={r.preview} 
                                    alt="Evidencia" 
                                    preview // 🔥 Esto activa el lightbox al hacer click
                                    width="60" // 🔥 Tamaño "achicado" en la tabla
                                    className="rounded shadow-sm border border-gray-200 overflow-hidden" 
                                    imageStyle={{ objectFit: 'cover', height: '60px' }}
                                />
                            </div>
                        )} 
                        style={{ width: '90px' }}
                    />
                    
                    <Column field="deficiencyCode" header="Carpeta" />
                    <Column header="Fecha Toma" body={(r)=> formatDateTime(r.date)} />
                    <Column body={(r) => (
                        <div className="flex gap-1 justify-center">
                             <Button icon="pi pi-pencil" rounded text severity="info" onClick={() => openEditLocal(r)} tooltip="Editar" />
                             <Button icon="pi pi-trash" rounded text severity="danger" onClick={()=>deleteLocalItem(r.id)} tooltip="Quitar" />
                        </div>
                    )} style={{ width: '100px' }} />
                </DataTable>
            </Card>

            <PhotoUploadModal 
                visible={modalVisible}
                onHide={() => setModalVisible(false)}
                onSave={handleSavePhoto}
                isEditing={isEditing}
                initialData={modalData}
                deficiencyOptions={historicalData.map(d => ({ label: `ID:${d.defiInterno} | ${getCodeById(d.tipiInterno)} | ${d.defiObservacion?.substring(0, 40)}`, value: d.defiInterno }))}
                historicalData={historicalData}
                localItems={localItems}
                getCodeById={getCodeById}
            />
        </div>
    );
}