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
import { Calendar } from 'primereact/calendar'; // 🔥 IMPORTANTE

// Hooks
import { useDeficiencyByGis } from '../hooks/useDeficiency';
import { useFeeder, useSedsByFeeder } from '../hooks/useFeeder';
import { useTypification } from '../hooks/useTypification';
import { useFiles } from '../hooks/useFiles';

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

    const { files: dbFiles, loadFiles, deleteFile, addFile, loadingFiles } = useFiles();
    const { getCodeById, fetchTypificationsByTypeElement, masterTypifications } = useTypification();

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

            {/* 1. BUSCADOR */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-4 border border-slate-200 flex justify-center">
                <div className="flex flex-col w-full max-w-lg">
                    <label className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Búsqueda por Código GIS</label>
                    <div className="p-inputgroup">
                        <InputText 
                            value={structureCode} 
                            onChange={(e) => setStructureCode(e.target.value.toUpperCase())} 
                            placeholder="Ej: PTO000055182" 
                            className="p-inputtext-lg font-bold text-blue-900" 
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()} 
                        />
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