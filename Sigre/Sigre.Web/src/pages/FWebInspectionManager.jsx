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

// Hooks
import { useDeficiencyByGis } from '../hooks/useDeficiency';
import { useFeeder, useSedsByFeeder } from '../hooks/useFeeder';
import { useTypification } from '../hooks/useTypification';
import { useFiles } from '../hooks/useFiles';
import { useElements } from '../hooks/useElement';

import FilesTableEditor from './FilesTableEditor'; 

export default function WebInspectionManager() {
    const toast = useRef(null);

    // --- ESTADOS ---
    const { feeders } = useFeeder();
    const [selectedFeeder, setSelectedFeeder] = useState(null);
    const [selectedSed, setSelectedSed] = useState(null);
    const [filteredSeds, setFilteredSeds] = useState([]);
    
    const feederId = (selectedFeeder?.value) || selectedFeeder;
    const { seds: sedsDelAlimentador } = useSedsByFeeder(feederId);

    const { fetchByGis, loading: searchLoading } = useDeficiencyByGis();
    const [structureCode, setStructureCode] = useState('');
    const [structureType, setStructureType] = useState('Poste'); 
    
    // Estados para selección de tabla histórica
    const [historicalData, setHistoricalData] = useState([]);
    const [selectedDeficiency, setSelectedDeficiency] = useState(null);

    // 🔥 NUEVOS ESTADOS: Datos Opcionales Globales (Fecha, Lat, Long)
    const [globalDate, setGlobalDate] = useState(null);
    const [globalLat, setGlobalLat] = useState('');
    const [globalLon, setGlobalLon] = useState('');
    const [suggestions, setSuggestions] = useState([]);     // La lista de resultados

    const { files: dbFiles, loadFiles, deleteFile, addFile, loadingFiles } = useFiles();
    const { getCodeById, fetchTypificationsByTypeElement, masterTypifications } = useTypification();
    const { fetchPostesChunk } = useElements();
    const {fetchVanosChunk} = useElements();

    useEffect(() => {
        if (masterTypifications.length > 0) fetchTypificationsByTypeElement(structureType === 'Poste' ? 8 : 9);
    }, [structureType, masterTypifications]);

    // --- HANDLERS ---
    const handleFeederChange = (e) => {
        setSelectedFeeder(e.value);
        setSelectedSed(null);
        setFilteredSeds([]);
    };

    const searchSeds = (event) => {
        const query = event.query.toLowerCase();
        if (sedsDelAlimentador) {
            setFilteredSeds(sedsDelAlimentador.filter(sed => (sed.sedCodigo||"").toLowerCase().includes(query)));
        }
    };

    // 🔥 BUSCAR (Carga inicial)
    const handleSearch = async () => {
        if (!structureCode.trim()) { 
            toast.current.show({ severity: 'warn', summary: 'Atención', detail: 'Ingrese código GIS.' }); 
            return; 
        }
        
        // 1. Buscar Deficiencias
        const data = await fetchByGis(structureCode);
        setHistoricalData(data || []);
        setSelectedDeficiency(null); // Reseteamos selección anterior
        
        if(data?.length > 0) {
            toast.current.show({ severity: 'success', summary: 'Encontrado', detail: `${data.length} registros.` });
            
            // 2. Por defecto seleccionamos la primera y cargamos sus archivos
            const firstDef = data[0];
            if (firstDef && firstDef.defiInterno) {
                setSelectedDeficiency(firstDef); // Marcamos visualmente la primera
                loadFiles(firstDef.defiInterno); // Cargamos sus archivos
            }
        } else {
            toast.current.show({ severity: 'info', summary: 'Sin Historial', detail: 'Puede cargar nuevos archivos.' });
        }
    };

    // 🔥 EVENTO AL HACER CLIC EN UNA FILA DE LA TABLA
    const onHistoryRowSelect = (e) => {
        const def = e.value; // La fila seleccionada
        setSelectedDeficiency(def);
        
        if (def && def.defiInterno) {
            toast.current.show({ severity: 'info', summary: 'Cargando Archivos', detail: `Deficiencia: ${getCodeById(def.tipiInterno)}`, life: 2000 });
            loadFiles(def.defiInterno);
        }
    };
    // --- BÚSQUEDA HÍBRIDA (POSTES Y VANOS) ---
    const searchNetworkElement = async (event) => {
        const query = event.query.toLowerCase();
        
        // 1. Buscar Postes (Backend)
        const responsePostes = await fetchPostesChunk(0, 15, query);
        
        // 2. Buscar Vanos (Backend - Asumiendo que tienes una función similar, si no, usa solo postes por ahora)
        const responseVanos = await fetchVanosChunk(0, 15, query); 
        
        const resultados = [];

        // A. Procesar Postes
        if (responsePostes.data) {
            resultados.push(...responsePostes.data.map(p => ({
                ...p,
                _tipo: 'POSTE',
                // 🔥 MAPEAMOS EL CÓDIGO AQUÍ PARA QUE SEA LA CLAVE PRINCIPAL
                codigo: p.postCodigoNodo, 
                label: p.postEtiqueta || 'S/N',
                lat: p.postLatitud,
                lng: p.postLongitud
            })));
        }

        // B. Procesar Vanos (Ejemplo si tuvieras la data)
        if (responseVanos.data) {
            resultados.push(...responseVanos.data.map(v => ({
                ...v,
                _tipo: 'VANO',
                codigo: v.vanoCodigo, // 🔥 CÓDIGO DEL VANO
                label: v.vanoEtiqueta || 'S/N',
                lat: v.vanoLatitudIni,
                lng: v.vanoLongitudIni
            })));
        } 
        

        setSuggestions(resultados);
    };
    const itemTemplate = (item) => {
        const esPoste = item._tipo === 'POSTE';
        
        return (
            <div className="flex flex-col border-b border-gray-100 p-2 hover:bg-blue-50 cursor-pointer">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* ICONO */}
                        <div className={`w-7 h-7 flex items-center justify-center rounded-full ${esPoste ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                            <i className={`pi ${esPoste ? 'pi-bolt' : 'pi-arrows-h'} text-sm`}></i>
                        </div>
                        
                        {/* DATOS: PRIORIDAD AL CÓDIGO */}
                        <div className="flex flex-col">
                            {/* CÓDIGO EN GRANDE */}
                            <span className="font-extrabold text-sm text-gray-800">
                                {item.codigo}
                            </span>
                            {/* Etiqueta / Tipo en pequeño */}
                            <span className="text-[10px] text-gray-500 font-medium">
                                {esPoste ? `POSTE: ${item.label}` : `VANO: ${item.label}`}
                            </span>
                        </div>
                    </div>

                    {/* Badge lateral */}
                    <span className={`text-[9px] px-1.5 rounded border ${esPoste ? 'border-blue-200 text-blue-600' : 'border-green-200 text-green-600'}`}>
                        {item._tipo}
                    </span>
                </div>
            </div>
        );
    };

    // Templates
    const dateTemplate = (r) => r.defiFecRegistro ? new Date(r.defiFecRegistro).toLocaleDateString() : '-';
    const typeBodyTemplate = (rowData) => {
        const codigoLegible = getCodeById(rowData.tipiInterno);
        return (
            <div className="flex flex-col">
                <span className="font-bold text-gray-700 text-xs">{codigoLegible || "Sin Código"}</span>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-700">
            <Toast ref={toast} />
            <ConfirmDialog />

            

{/* CONTENEDOR DE BÚSQUEDA */}
<div className="bg-white p-4 rounded-lg shadow-md mb-4 border border-slate-200 flex justify-center">
    <div className="flex flex-col w-full max-w-lg">
        <label className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Búsqueda por Código GIS</label>
        
        <div className="p-inputgroup">
            {/* --- INICIO DEL AUTOCOMPLETE --- */}
            <AutoComplete 
                // 1. Vinculamos al estado de tu buscador
                value={structureCode} 
                
                // 2. Propiedades de búsqueda (Asumiendo que tienes estas funciones en este archivo)
                suggestions={suggestions} 
                completeMethod={searchNetworkElement} 
                field="codigo"
                itemTemplate={itemTemplate} 
                
                // 3. LOGICA DE ESCRITURA (Tu corrección aplicada)
                onChange={(e) => {
                    // Si es objeto sacamos el código, si es texto lo usamos directo
                    const valor = e.value && e.value.codigo ? e.value.codigo : e.value;
                    
                    // Convertimos a Mayúsculas para mantener consistencia
                    setStructureCode(String(valor).toUpperCase());
                }}

                // 4. LOGICA DE SELECCIÓN
                onSelect={(e) => {
                    const item = e.value;
                    // Al hacer click, fijamos el código en el input
                    setStructureCode(item.codigo);
                    
                    // OPCIONAL: Si quieres que se ejecute la búsqueda automáticamente al seleccionar:
                    // handleSearch(); 
                }}
                
                // 5. Estilos y Eventos (Heredados de tu InputText anterior)
                placeholder="Ej: PTO000055182"
                className="w-full"
                inputClassName="w-full p-inputtext-lg font-bold text-blue-900 uppercase" // Mismos estilos que tenías
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            {/* --- FIN DEL AUTOCOMPLETE --- */}

            <Button icon="pi pi-search" onClick={handleSearch} loading={searchLoading} label="Buscar" />
        </div>
    </div>
</div>

            {/* 2. TABLA HISTÓRICA */}
            {historicalData.length > 0 && (
                <div className="card border-l-4 border-blue-500 shadow-md bg-white rounded-lg mb-6">
                    <div className="p-3 bg-blue-50 flex justify-between items-center border-b border-blue-100">
                        <div className="flex items-center gap-2">
                            <i className="pi pi-database text-blue-600"></i>
                            <h3 className="font-bold text-blue-800 m-0 text-sm">
                                Historial (Seleccione una fila para ver sus fotos)
                            </h3>
                        </div>
                        <Tag value={`${historicalData.length} Deficiencias`} severity="info" rounded />
                    </div>
                    
                    <DataTable 
                        value={historicalData} 
                        size="small" 
                        stripedRows 
                        rows={5} 
                        paginator 
                        className="text-sm"
                        selectionMode="single"
                        selection={selectedDeficiency}
                        onSelectionChange={onHistoryRowSelect}
                        metaKeySelection={false}
                        dataKey="defiInterno"
                    >
                        <Column field="defiInterno" header="ID Def." sortable style={{width:'80px', fontWeight:'bold'}} />
                        <Column field="defiCodigoElemento" header="Cód. GIS" style={{width:'120px'}} />
                        <Column field="defiFecRegistro" header="Fecha Reg." body={dateTemplate} style={{width:'100px'}} />
                        <Column header="Tipificacion" body={typeBodyTemplate} style={{width:'150px'}} />
                        <Column field="defiObservacion" header="Observación" className="truncate" style={{maxWidth:'300px'}} />
                    </DataTable>
                </div>
            )}

            {/* 3. EDITOR DE ARCHIVOS */}
            <Card className="border-t-4 border-indigo-500 shadow-sm">
                
                {/* 3.1 ZONA DE CONFIGURACIÓN GLOBAL */}
                <div className="mb-4 p-4 bg-indigo-50 rounded border border-indigo-100">
                    <h4 className="text-sm font-bold text-indigo-800 mb-3 flex items-center">
                        <i className="pi pi-cog mr-2"></i>Configuración de Ubicación
                    </h4>
                    
                    {/* FILA 1: CONTEXTO (Alim, SED, Tipo) */}
                    <div className="flex flex-wrap gap-4 items-end mb-3">
                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-indigo-700 uppercase">Alimentador</label>
                            <Dropdown value={selectedFeeder} onChange={handleFeederChange} options={feeders} optionLabel="label" filter placeholder="Seleccione..." className="w-56 p-inputtext-sm" />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-indigo-700 uppercase">SED</label>
                            <AutoComplete value={selectedSed} suggestions={filteredSeds} completeMethod={searchSeds} field="sedCodigo" dropdown onChange={(e) => setSelectedSed(e.value)} placeholder="Buscar SED..." className="w-40 p-inputtext-sm font-bold" forceSelection disabled={!selectedFeeder} />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-indigo-700 uppercase">Tipo Estructura</label>
                            <Dropdown value={structureType} options={[{label: 'Poste', value: 'Poste'}, {label: 'Vano', value: 'Vano'}]} onChange={(e) => setStructureType(e.value)} className="w-32 p-inputtext-sm" />
                        </div>
                    </div>

                    {/* 🔥 FILA 2: DATOS GLOBALES OPCIONALES (Sobrescritura) */}
                    <div className="flex flex-wrap gap-4 items-end pt-3 border-t border-indigo-200">
                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-slate-600 uppercase">Fecha Global </label>
                            <Calendar 
                                value={globalDate} 
                                onChange={(e) => setGlobalDate(e.value)} 
                                showTime showSeconds 
                                placeholder="Mantener original..." 
                                className="w-52 p-inputtext-sm" 
                                showIcon
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-slate-600 uppercase">Latitud </label>
                            <InputText 
                                value={globalLat} 
                                onChange={(e) => setGlobalLat(e.target.value)} 
                                placeholder="Ej: 8192675..." 
                                className="w-32 p-inputtext-sm" 
                                keyfilter={/^-?[\d\.]*$/} 
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-slate-600 uppercase">Longitud </label>
                            <InputText 
                                value={globalLon} 
                                onChange={(e) => setGlobalLon(e.target.value)} 
                                placeholder="Ej: 228542..." 
                                className="w-32 p-inputtext-sm" 
                                keyfilter={/^-?[\d\.]*$/} 
                            />
                        </div>
                        <div className="text-[10px] text-gray-400 italic pb-2">
                            * Si deja estos vacíos, se respetan los datos originales.
                        </div>
                    </div>
                </div>

                <h4 className="text-sm font-bold text-gray-700 mb-2">
                    Gestión de Archivos {selectedDeficiency ? `(Viendo ID: ${selectedDeficiency.defiInterno})` : ''}
                </h4>
                
                <FilesTableEditor 
                    namingContext={{
                        feeder: selectedFeeder,
                        feedersList: feeders,
                        sed: selectedSed,
                        structureCode: structureCode,
                        structureType: structureType,
                        // 🔥 Pasamos los nuevos valores al hijo
                        globalDate: globalDate,
                        globalLat: globalLat,
                        globalLon: globalLon
                    }}
                    historicalData={historicalData}
                    getCodeById={getCodeById}
                    toast={toast}
                    existingFiles={dbFiles}
                    onDeleteDbFile={deleteFile}
                    loadingFiles={loadingFiles}
                    onAddFile={addFile}
                />
            </Card>
        </div>
    );
}