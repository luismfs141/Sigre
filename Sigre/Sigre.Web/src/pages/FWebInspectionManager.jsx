import React, { useState, useRef, useEffect } from 'react';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Dropdown } from 'primereact/dropdown';
import { AutoComplete } from 'primereact/autocomplete';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { Calendar } from 'primereact/calendar';
import JSZip from 'jszip'; // 📦 Requiere: npm install jszip
import { saveAs } from 'file-saver'; // 📦 Requiere: npm install file-saver
import { SelectButton } from 'primereact/selectbutton'; // 👈 AGREGAR ESTO

// --- HOOKS (Tus hooks existentes) ---
import { useDeficiencyByGis } from '../hooks/useDeficiency';
import { useFeeder, useSedsByFeeder } from '../hooks/useFeeder';
import { useTypification } from '../hooks/useTypification';
import { useFiles } from '../hooks/useFiles';
import { useElements } from '../hooks/useElement';

// --- COMPONENTES HIJOS ---
import FilesTableEditor from './FilesTableEditor'; 
import PhotoUploadModal from '../components/Modals/PhotoUploadModal'; 


// --- UTILIDADES ---
// URL base para descargas si no es local (ajusta según tu config)
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"; 

export default function WebInspectionManager() {
    const toast = useRef(null);

    // --- 1. ESTADOS DE DATOS ---
    const { feeders } = useFeeder();
    const [selectedFeederId, setSelectedFeederId] = useState(null);
    const [selectedSed, setSelectedSed] = useState(null);
    const [filteredSeds, setFilteredSeds] = useState([]);
    const [pendingSedId, setPendingSedId] = useState(null); 

    const { seds: sedsDelAlimentador } = useSedsByFeeder(selectedFeederId);

    // --- 2. ESTADOS GIS ---
    const { fetchByGis, loading: searchLoading } = useDeficiencyByGis();
    const [structureCode, setStructureCode] = useState('');
    const [structureType, setStructureType] = useState('Poste'); 
    // Para guardar ID numérico del elemento si es necesario
    const [structureIdInt, setStructureIdInt] = useState(0); 
    
    // Datos Globales
    const [globalDate, setGlobalDate] = useState(''); 
    const [globalLat, setGlobalLat] = useState('');
    const [globalLon, setGlobalLon] = useState('');
    const [gisSuggestions, setGisSuggestions] = useState([]);

    // --- 3. ESTADOS DE ARCHIVOS Y MODAL ---
    const { files: dbFiles, loadFiles, deleteFile, addFile, loadingFiles } = useFiles();
    const { getCodeById, fetchTypificationsByTypeElement, masterTypifications } = useTypification();
    const { fetchPostesChunk, fetchVanosChunk } = useElements();

    const [historicalData, setHistoricalData] = useState([]);
    const [selectedDeficiency, setSelectedDeficiency] = useState(null);

    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [zipLoading, setZipLoading] = useState(false);
    // 🔥 A. MODO DE VISTA (Nuevo: Toggle Lista/Galería)
    const [viewMode, setViewMode] = useState('list'); 
    const viewOptions = [
        { label: 'Datos', value: 'list', icon: 'pi pi-list' },
        { label: 'Galería', value: 'gallery', icon: 'pi pi-images' }
    ];

    // 🔥 B. MEMORIA DE SESIÓN (Nuevo: Para ZIP instantáneo y Preview)
    const sessionBlobs = useRef({});
    const debounceTimer = useRef(null);
    

const LocalFileStore = {
    dbName: "SigreTempPhotos", storeName: "photos",
    async open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onupgradeneeded = (e) => { if (!e.target.result.objectStoreNames.contains(this.storeName)) e.target.result.createObjectStore(this.storeName); };
            request.onsuccess = (e) => resolve(e.target.result); request.onerror = (e) => reject(e);
        });
    },
    async save(fileName, fileBlob) {
        try { const db = await this.open(); const tx = db.transaction(this.storeName, "readwrite"); tx.objectStore(this.storeName).put(fileBlob, fileName); return true; } catch (e) { return false; }
    },
    async get(fileName) {
        try { const db = await this.open(); return new Promise((resolve) => { const req = db.transaction(this.storeName, "readonly").objectStore(this.storeName).get(fileName); req.onsuccess = () => resolve(req.result); req.onerror = () => resolve(null); }); } catch (e) { return null; }
    },
    async clear() {
        try { const db = await this.open(); const tx = db.transaction(this.storeName, "readwrite"); tx.objectStore(this.storeName).clear(); return true; } catch (e) { return false; }
    }
};

    // --- 4. EFECTOS ---
    useEffect(() => {
        if (masterTypifications.length > 0) fetchTypificationsByTypeElement(structureType === 'Poste' ? 8 : 9);
    }, [structureType, masterTypifications]);

    useEffect(() => {
        if (pendingSedId && sedsDelAlimentador && sedsDelAlimentador.length > 0) {
            const sedEncontrada = sedsDelAlimentador.find(s => 
                String(s.sedInterno) === String(pendingSedId) || 
                String(s.value) === String(pendingSedId) ||
                String(s.id) === String(pendingSedId)
            );
            if (sedEncontrada) {
                setSelectedSed(sedEncontrada); 
                setPendingSedId(null); 
            }
        }
    }, [sedsDelAlimentador, pendingSedId]);

    // --- 5. LÓGICA GIS ---
    const searchNetworkElement = async (event) => {
        const query = event.query.toLowerCase();
        // Limpiamos el timeout anterior si el usuario sigue escribiendo
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    // Esperamos 500ms después de la última tecla antes de hacer el fetch
    debounceTimer.current = setTimeout(async () => {
        try {
            const [postesRes, vanosRes] = await Promise.allSettled([
                fetchPostesChunk(0, 10, query),
                fetchVanosChunk ? fetchVanosChunk(0, 10, query) : Promise.resolve({ data: [] })
            ]);

            const resultados = [];

            if (postesRes.status === 'fulfilled' && postesRes.value?.data) {
                resultados.push(...postesRes.value.data.map(p => ({
                    label: `POSTE: ${p.postCodigoNodo} - ${p.postEtiqueta || 'S/N'}`,
                    codigo: p.postCodigoNodo,
                    idInterno: p.postInterno, // Capturamos ID interno
                    _tipo: 'Poste',
                    lat: p.postLatitud,
                    lng: p.postLongitud,
                    alimentadorId: p.alimInterno, 
                    sedId: p.postSubestacion
                })));
            }

            if (vanosRes.status === 'fulfilled' && vanosRes.value?.data) {
                resultados.push(...vanosRes.value.data.map(v => ({
                    label: `VANO: ${v.vanoCodigo} - ${v.vanoEtiqueta || 'S/N'}`,
                    codigo: v.vanoCodigo, 
                    idInterno: v.vanoInterno, // Capturamos ID interno
                    _tipo: 'Vano',
                    lat: v.vanoLatitudIni,
                    lng: v.vanoLongitudIni,
                    alimentadorId: v.alimInterno,           
                    sedId: v.vanoSubestacion                
                })));
            }
            setGisSuggestions(resultados);
        } catch (e) {
            console.error("Error búsqueda GIS:", e);
        }
    }, 500);
};

    const handleGisSelection = (e) => {
        const item = e.value; 
        if (!item) return;

        setStructureCode(item.codigo);
        setStructureType(item._tipo);
        setStructureIdInt(item.idInterno || 0); // Guardamos el ID interno

        if(item.lat) setGlobalLat(item.lat.toString());
        if(item.lng) setGlobalLon(item.lng.toString());

        if (item.alimentadorId) {
            setSelectedFeederId(item.alimentadorId); 
            setSelectedSed(null); 
            if (item.sedId) setPendingSedId(item.sedId); 
        }
    };

    const handleFeederChange = (e) => {
        setSelectedFeederId(e.value);
        setSelectedSed(null);
        setFilteredSeds([]);
    };

    const searchSeds = (event) => {
        const query = event.query.toLowerCase();
        if (sedsDelAlimentador) {
            setFilteredSeds(sedsDelAlimentador.filter(sed => 
                (sed.label||"").toLowerCase().includes(query) || 
                (sed.sedCodigo||"").toLowerCase().includes(query)
            ));
        }
    };

const handleSearchDeficiencies = async () => {
        const cod = typeof structureCode === 'object' ? structureCode.codigo : structureCode;
        if (!cod) {
            toast.current.show({ severity: 'warn', summary: 'Atención', detail: 'Ingrese un código GIS' });
            return;
        }
        
        const data = await fetchByGis(cod);
        
        // 🔥 CAMBIO: Filtramos solo las deficiencias donde defiActivo no sea 0 ni false
        const activeData = (data || []).filter(d => d.defiActivo !== 0 && d.defiActivo !== false);
        
        setHistoricalData(activeData);
        
        if(activeData.length > 0) {
            setSelectedDeficiency(activeData[0]);
            loadFiles(activeData[0].defiInterno);
            toast.current.show({severity:'success', summary:'Encontrado', detail:`${activeData.length} registros activos`});
        } else {
             toast.current.show({severity:'info', summary:'Sin historial', detail:`0 registros activos`});
        }
    };


    // --- 6. LÓGICA DE GUARDADO (Corrección: Correlativo basado en conteo de la tabla) ---
    const handlePhotoSave = async (dataToSave) => {
        try {
            // A. Contexto y Nombres
            const feederObj = feeders.find(f => f.value === selectedFeederId);
            const feederLbl = resolveFeederName(feederObj);
            
            let sedLbl = selectedSed ? (selectedSed.sedCodigo || selectedSed.label || selectedSed.codigo || "SIN_SED") : "SIN_SED";
            if(sedLbl.includes(" - ")) sedLbl = sedLbl.split(" - ")[0];
            sedLbl = safeSeg(sedLbl);

            const codeElemLbl = safeSeg(typeof structureCode === 'object' ? structureCode.codigo : structureCode);
            const tipoElemRaw = structureType || 'Poste';
            const tipoElem = String(tipoElemRaw).toUpperCase() === 'VANO' ? 'VANO' : 'POSTE';

            // B. Datos Deficiencia Actual
            const defId = selectedDeficiency ? selectedDeficiency.defiInterno : 0;
            const defTipiInterno = selectedDeficiency ? selectedDeficiency.tipiInterno : 0;
            const defCodeRaw = selectedDeficiency?.tipiCodigo || getCodeById(defTipiInterno) || "0000";
            const defCodeBase = String(defCodeRaw).trim();
            
            // Identificar tipos especiales
            const is7004 = defCodeBase === "7004" || String(defTipiInterno) === "60";
            const isSinDef = defCodeBase === "0000" || defCodeBase === "0" || String(defTipiInterno) === "0";
            
            // C. Lógica de Carpetas
            let defFolder = "", namePart = "";
            
            if (is7004) {
                // 🔥 LÓGICA CORREGIDA: Contar deficiencias en la tabla histórica
                
                // 1. Filtramos de la tabla 'historicalData' solo las que sean 7004
                const defs7004 = historicalData.filter(d => {
                    const code = d.tipiCodigo || getCodeById(d.tipiInterno) || "";
                    return String(code).trim() === "7004" || String(d.tipiInterno) === "60";
                });

                // 2. Ordenamos por ID (antiguo a nuevo) para que el orden sea consistente
                // Así la deficiencia más vieja siempre será la carpeta 1
                defs7004.sort((a, b) => a.defiInterno - b.defiInterno);

                // 3. Buscamos en qué posición está la deficiencia que tenemos seleccionada
                const index = defs7004.findIndex(d => d.defiInterno === defId);

                // 4. El número de carpeta es su posición + 1
                // Si la deficiencia es la única (índice 0), la carpeta será 1.
                const folderNum = index !== -1 ? index + 1 : (defs7004.length + 1);

                defFolder = `7004/${folderNum}`; 
                namePart = `7004_${folderNum}`; 
            } 
            else if (isSinDef) { 
                defFolder = "SINDEF"; 
                namePart = "0000"; 
            } 
            else { 
                defFolder = defCodeBase; 
                namePart = defCodeBase; 
            }

            // --- (Resto igual) ---
            const fileName = `FOT-${sedLbl}-${codeElemLbl}-${namePart}-${formatCompactDate(dataToSave.date || new Date())}-${dataToSave.tipo}.jpg`;
            const dbPath = `SIGRE.MOVIL/${feederLbl}/${sedLbl}/${tipoElem}/${codeElemLbl}/${defFolder}/${fileName}`;

            const rawLat = parseFloat(dataToSave.lat) || 0;
            const rawLon = parseFloat(dataToSave.long) || 0;
            const utmCoords = latLonToUTM(rawLat, rawLon);

            if (typeof LocalFileStore !== 'undefined' && LocalFileStore.save) {
                 await LocalFileStore.save(fileName, dataToSave.file);
            }

            if (dataToSave.file) {
                const pureName = dbPath.split('/').pop();
                sessionBlobs.current[pureName] = dataToSave.file;
            }

            const payload = {
                archTabla: "Deficiencias", archInterno: 0, archTipo: String(dataToSave.tipo),
                archNombre: dbPath.substring(0, 255), archCodTabla: Number(defId),
                archLatitud: utmCoords.northing, archLongitud: utmCoords.easting,
                archFecha: dataToSave.date ? new Date(dataToSave.date).toISOString() : new Date().toISOString(),
                archTipoElemento: tipoElem, archIdElemento: Number(structureIdInt),
                tipiInterno: Number(defTipiInterno), archActivo: true, file: dataToSave.file 
            };

            const result = await addFile(payload);
            if (result) {
                toast.current.show({ severity: 'success', summary: 'OK', detail: 'Foto guardada' });
                setShowPhotoModal(false);
                setViewMode('gallery'); 
                if (selectedDeficiency) loadFiles(selectedDeficiency.defiInterno);
            }
        } catch (error) {
            console.error(error); toast.current.show({ severity: 'error', summary: 'Error', detail: 'Fallo al guardar' });
        }
    };
    // --- 7. LÓGICA ZIP ---
    // --- 7. LÓGICA ZIP CORREGIDA (Agrupación Correcta 7004) ---
    const handleDownloadZip = async () => {
        if (dbFiles.length === 0) { 
            toast.current.show({ severity: 'warn', summary: 'Vacío', detail: 'Sin fotos' }); 
            return; 
        }
        setZipLoading(true);
        try {
            const zip = new JSZip();
            
            // A. Preparar Contexto Global (Una sola vez)
            const feederObj = feeders.find(f => f.value === selectedFeederId);
            const feederLbl = resolveFeederName(feederObj);
            
            let sedLbl = selectedSed ? (selectedSed.sedCodigo || selectedSed.label || "SIN_SED") : "SIN_SED";
            if(sedLbl.includes(" - ")) sedLbl = sedLbl.split(" - ")[0];
            sedLbl = safeSeg(sedLbl);
            
            const codeElemLbl = safeSeg(typeof structureCode === 'object' ? structureCode.codigo : structureCode);
            const tipoElem = (structureType || 'Poste').toUpperCase() === 'VANO' ? 'VANO' : 'POSTE';
            
            // B. Datos de la Deficiencia
            const defTipiInterno = selectedDeficiency ? selectedDeficiency.tipiInterno : 0;
            const defCodeRaw = selectedDeficiency?.tipiCodigo || getCodeById(defTipiInterno) || "0000";
            const defCodeBase = String(defCodeRaw).trim();
            const is7004 = defCodeBase === "7004" || String(defTipiInterno) === "60";

            // 🔥 C. CALCULAR NÚMERO DE CARPETA (FUERA DEL BUCLE)
            // Calculamos 'folderNum' una sola vez para todas las fotos de esta deficiencia.
            let folderNum = 1; 

            if (is7004) {
                // 1. Filtramos las 7004 del historial
                const defs7004 = historicalData.filter(d => {
                    const code = d.tipiCodigo || getCodeById(d.tipiInterno) || "";
                    return String(code).trim() === "7004" || String(d.tipiInterno) === "60";
                });
                // 2. Ordenamos
                defs7004.sort((a, b) => a.defiInterno - b.defiInterno);
                // 3. Buscamos índice de la actual
                const index = defs7004.findIndex(d => d.defiInterno === selectedDeficiency?.defiInterno);
                // 4. Asignamos número
                folderNum = index !== -1 ? index + 1 : 1;
            }

            // D. Iterar archivos y agregar al ZIP
            for (let i = 0; i < dbFiles.length; i++) {
                const f = dbFiles[i];
                let folderPath = "";

                if (is7004) {
                    // Usamos el 'folderNum' calculado arriba (EJ: 7004/1 para TODAS las fotos)
                    folderPath = `${feederLbl}/${sedLbl}/${tipoElem}/${codeElemLbl}/7004/${folderNum}`;
                } else {
                    folderPath = `${feederLbl}/${sedLbl}/${tipoElem}/${codeElemLbl}/${defCodeBase}`;
                }

                const originalName = (f.archNombre || `foto_${i}.jpg`).split(/[/\\]/).pop();
                const fullPathInZip = `${folderPath}/${originalName}`;

                // Intentar Memoria o Red
                const sessionFile = sessionBlobs.current[originalName];

                if (sessionFile) {
                    zip.file(fullPathInZip, sessionFile);
                } else {
                    const fileUrl = f.url || `${API_BASE_URL}/api/files/download/${f.archInterno}`; 
                    try {
                        const response = await fetch(fileUrl);
                        if(response.ok) {
                            const blob = await response.blob();
                            zip.file(fullPathInZip, blob);
                        }
                    } catch (err) { console.warn(`Error zip fetch ${i}`, err); }
                }
            }

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `Deficiencia_${codeElemLbl}.zip`);
            toast.current.show({ severity: 'success', summary: 'ZIP', detail: 'Descarga iniciada' });

        } catch (e) {
            console.error("ZIP Error:", e); 
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Fallo generando ZIP' });
        } finally { 
            setZipLoading(false); 
        }
    };

    // --- TEMPLATES Y RENDER ---
    const contextData = {
        feeder: feeders.find(f => f.value === selectedFeederId),
        sed: selectedSed,
        elementType: structureType,
        elementCode: structureCode,
        structureType, structureCode
    };

    const initialPhotoData = {
        tipo: 1, lat: globalLat, long: globalLon, 
        date: globalDate || new Date(), file: null, preview: null
    };

    const itemTemplate = (item) => {
        const esPoste = item._tipo === 'Poste';
        return (
            <div className={`flex flex-col border-b border-gray-100 p-2 ${esPoste ? 'hover:bg-blue-50' : 'hover:bg-green-50'}`}>
                <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-gray-700">{item.codigo}</span>
                    <Tag value={item._tipo} severity={esPoste ? 'info' : 'success'} className="text-[10px]" />
                </div>
                <span className="text-[10px] text-gray-400">{item.label}</span>
            </div>
        );
    };

    const dateTemplate = (r) => r.defiFecRegistro ? new Date(r.defiFecRegistro).toLocaleDateString() : '-';
    const typeBodyTemplate = (rowData) => <span className="font-bold text-gray-700 text-xs">{getCodeById(rowData.tipiInterno) || "Sin Def"}</span>;

    return (
        <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-700">
            <Toast ref={toast} />
            <ConfirmDialog />

            {/* A. BÚSQUEDA */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-4 border border-slate-200 flex justify-center">
                <div className="w-full max-w-lg">
                    <label className="text-xs font-bold text-gray-500 mb-1 uppercase block">Búsqueda por Código GIS</label>
                    <div className="p-inputgroup">
                        <AutoComplete 
                            value={structureCode} suggestions={gisSuggestions} completeMethod={searchNetworkElement} 
                            field="codigo" itemTemplate={itemTemplate} onChange={(e) => setStructureCode(e.value)} onSelect={handleGisSelection} 
                            placeholder="Ej: VBT0000372026..." className="w-full" inputClassName="w-full p-inputtext-lg font-bold text-blue-900 uppercase"
                        />
                        <Button icon="pi pi-search" onClick={handleSearchDeficiencies} loading={searchLoading} />
                    </div>
                </div>
            </div>

            {/* B. HISTORIAL */}
             {historicalData.length > 0 && (
                <div className="card border-l-4 border-blue-500 shadow-md bg-white rounded-lg mb-6">
                    <div className="p-3 bg-blue-50 flex justify-between items-center border-b border-blue-100">
                        <h3 className="font-bold text-blue-800 m-0 text-sm">Historial</h3>
                        <Tag value={`${historicalData.length} Reg.`} severity="info" rounded />
                    </div>
                    <DataTable 
                        value={historicalData} size="small" stripedRows rows={5} paginator selectionMode="single" selection={selectedDeficiency} 
                        onSelectionChange={(e) => { setSelectedDeficiency(e.value); if(e.value) loadFiles(e.value.defiInterno); }}
                        dataKey="defiInterno" className="text-sm"
                    >
                        <Column field="defiInterno" header="ID" style={{width:'70px'}} />
                        <Column field="defiCodigoElemento" header="Cód. GIS" />
                        <Column field="defiFecRegistro" header="Fecha" body={dateTemplate} />
                        <Column header="Tipificacion" body={typeBodyTemplate} />
                        <Column field="defiObservacion" header="Obs" className="truncate" style={{maxWidth:'150px'}} />
                    </DataTable>
                </div>
            )}

            {/* C. FORMULARIO PRINCIPAL */}
            <Card className="border-t-4 border-indigo-500 shadow-sm">
                
                {/* C.1 UBICACIÓN */}
                <div className="mb-4 p-4 bg-indigo-50 rounded border border-indigo-100">
                    <h4 className="text-sm font-bold text-indigo-800 mb-3 flex items-center">
                        <i className="pi pi-map-marker mr-2"></i>Configuración de Ubicación
                    </h4>
                    <div className="flex flex-wrap gap-4 items-end mb-3">
                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-indigo-700 uppercase">Alimentador</label>
                            <Dropdown value={selectedFeederId} onChange={handleFeederChange} options={feeders} optionLabel="label" optionValue="value" filter placeholder="Seleccione..." className="w-64 p-inputtext-sm" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-indigo-700 uppercase">SED</label>
                            <AutoComplete value={selectedSed} suggestions={filteredSeds} completeMethod={searchSeds} field="label" dropdown onChange={(e) => setSelectedSed(e.value)} placeholder="Buscar SED..." className="w-56 p-inputtext-sm font-bold" disabled={!selectedFeederId} />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-indigo-700 uppercase">Tipo Estructura</label>
                            <Dropdown value={structureType} options={[{label: 'Poste', value: 'Poste'}, {label: 'Vano', value: 'Vano'}]} onChange={(e) => setStructureType(e.value)} className="w-32 p-inputtext-sm" />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4 items-end pt-3 border-t border-indigo-200">
                        <div className="flex flex-col"><label className="text-[10px] font-bold text-slate-600 uppercase">Fecha Global</label><Calendar value={globalDate} onChange={(e) => setGlobalDate(e.value)} showTime showSeconds placeholder="Original..." className="w-48 p-inputtext-sm" showIcon /></div>
                        <div className="flex flex-col"><label className="text-[10px] font-bold text-slate-600 uppercase">Latitud</label><InputText value={globalLat} onChange={(e) => setGlobalLat(e.target.value)} placeholder="-16.35..." className="w-36 p-inputtext-sm" /></div>
                        <div className="flex flex-col"><label className="text-[10px] font-bold text-slate-600 uppercase">Longitud</label><InputText value={globalLon} onChange={(e) => setGlobalLon(e.target.value)} placeholder="-71.54..." className="w-36 p-inputtext-sm" /></div>
                    </div>
                </div>

                {/* HEADER Y BOTONES DE ACCIÓN */}
                <div className="flex justify-between items-center mb-2 mt-6 border-t border-gray-100 pt-4">
                    <h4 className="text-sm font-bold text-gray-700 m-0">
                        Gestión de Archivos / Fotos
                    </h4>
                    <div className="flex gap-2">
                        {/* Botón ZIP */}
                        <Button 
                            label="Descargar ZIP" 
                            icon="pi pi-download" 
                            className="p-button-sm p-button-secondary p-button-outlined" 
                            onClick={handleDownloadZip}
                            loading={zipLoading}
                            disabled={dbFiles.length === 0}
                        />
                        {/* Botón Upload */}
                        <Button 
                            label="Añadir Fotos" 
                            icon="pi pi-camera" 
                            className="p-button-sm p-button-success" 
                            onClick={() => setShowPhotoModal(true)} 
                        />
                        <SelectButton 
            value={viewMode} 
            onChange={(e) => e.value && setViewMode(e.value)} 
            options={viewOptions} 
            itemTemplate={(option) => <i className={`${option.icon} mr-2`}>{option.label}</i>} 
        />
                    </div>
                </div>
                
                <FilesTableEditor 
                    namingContext={contextData}
                    historicalData={historicalData}
                    getCodeById={getCodeById}
                    toast={toast}
                    existingFiles={dbFiles}
                    onDeleteDbFile={deleteFile}
                    loadingFiles={loadingFiles}
                    viewMode={viewMode} 
    sessionBlobs={sessionBlobs.current}
                />
            </Card>

            {/* MODAL CON EL MANEJADOR PERSONALIZADO */}
            {showPhotoModal && (
                <PhotoUploadModal 
                    visible={showPhotoModal}
                    onHide={() => setShowPhotoModal(false)}
                    initialData={initialPhotoData}
                    contextData={contextData}
                    onSave={handlePhotoSave} // 🔥 Usamos la función con lógica de Nombrado y UTM
                    deficiencyData={selectedDeficiency}
                    currentPhotos={dbFiles}
                />
            )}
        </div>
    );
}

// ==========================================
// 🔥🔥🔥 HELPER FUNCTIONS 🔥🔥🔥
// ==========================================

function resolveFeederName(feederObj) {
    if (!feederObj) return "SIN_ALIMENTADOR";
    let lbl = feederObj.label || "";

    // 🔥 CAMBIO AQUÍ: 
    // 1. .replace(/[0-9]/g, '') -> Elimina TODOS los números (0, 1, 2...)
    // 2. .replace(/[-]/g, '')   -> Elimina los guiones
    // 3. .trim()                -> Quita los espacios que sobren al inicio o final
    lbl = lbl.replace(/[0-9]/g, '').replace(/-/g, '').trim();

    return safeSeg(lbl);
}

function safeSeg(str) {
    if (!str) return "XXX";
    return String(str)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_') // Reemplazar caracteres raros con _
        .replace(/_+/g, '_');       // Evitar _____
}

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