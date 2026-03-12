import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { AutoComplete } from 'primereact/autocomplete';
import { Dropdown } from 'primereact/dropdown';

// Tus hooks
import { useDeficienciesBySed } from '../hooks/useDeficiency'; 
import { useElements } from '../hooks/useElement'; 
import { useFeeder, useSedsByFeeder } from '../hooks/useFeeder';

// Tus Modales/Formularios
import StaticFormCard from '../components/Modals/StaticFormCard';
import DeficiencyForm from '../components/Modals/DeficiencyForm';

export default function ReporteMaestro() {
    // --- ESTADOS DE BÚSQUEDA JERÁRQUICA ---
    const [selectedFeeder, setSelectedFeeder] = useState(null);
    const [selectedSed, setSelectedSed] = useState(null);
    const [filteredSeds, setFilteredSeds] = useState([]);

    // --- HOOKS DE DATOS ---
    const { feeders } = useFeeder();
    const { seds } = useSedsByFeeder(selectedFeeder); // Se actualiza solo al elegir Alimentador
    
    const { deficiencies, loading: loadingDef, fetchBySed } = useDeficienciesBySed();
    const { saveElement, loading: loadingElement } = useElements();

    // --- ESTADOS DE MODALES ---
    const [elementModalOpen, setElementModalOpen] = useState(false);
    const [deficiencyModalOpen, setDeficiencyModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);

    // --- LÓGICA DE AUTOCOMPLETADO LOCAL ---
    const searchSedsLocal = (event) => {
        const query = event.query.toLowerCase();
        // Filtramos la lista de SEDs que ya trajo el hook basado en el texto del usuario
        const _filteredSeds = seds.filter(sed => 
            sed.label.toLowerCase().includes(query)
        );
        setFilteredSeds(_filteredSeds);
    };

    // --- DISPARADOR DE BÚSQUEDA (Generar Reporte) ---
    const handleSearch = (e) => {
        e?.preventDefault();
        
        // Dependiendo de cómo mapea useSedsByFeeder, el ID suele venir en 'value' o 'sedInterno'
        const sedIdToFetch = selectedSed?.value || selectedSed?.sedInterno; 
        
        if (sedIdToFetch) {
            fetchBySed(Number(sedIdToFetch));
        }
    };

    // --- MANEJADORES DE APERTURA DE MODALES ---
    const openElementEdit = (rowData) => {
        setSelectedRow(rowData);
        setElementModalOpen(true);
    };

    const openDeficiencyEdit = (rowData) => {
        setSelectedRow(rowData);
        setDeficiencyModalOpen(true);
    };

    // --- ACCIONES DE GUARDADO ---
    const handleSaveElement = async (payloadToSend) => {
        const res = await saveElement(payloadToSend);
        if (res.success) {
            setElementModalOpen(false);
            handleSearch(); // Recargamos usando el estado actual
        }
    };

    const handleSaveDeficiency = async (payloadToSend) => {
        // Asumiendo que DeficiencyForm maneja el guardado por dentro o llama a tu API
        // const res = await saveDeficiency(payloadToSend);
        
        setDeficiencyModalOpen(false);
        handleSearch(); // Recargamos la grilla
    };

    const actionTemplate = (rowData) => {
        return (
            <div className="flex gap-2">
                <Button 
                    icon="pi pi-bolt" 
                    className="p-button-rounded p-button-outlined p-button-info p-button-sm" 
                    tooltip="Editar Elemento (GIS, Nodos)"
                    onClick={() => openElementEdit(rowData)} 
                />
                <Button 
                    icon="pi pi-clipboard" 
                    className="p-button-rounded p-button-outlined p-button-warning p-button-sm" 
                    tooltip="Editar Deficiencia (Fallas, Obs)"
                    onClick={() => openDeficiencyEdit(rowData)} 
                />
            </div>
        );
    };

    const formatDate = (value) => {
        if (!value) return '-';
        return new Date(value).toLocaleDateString('es-PE', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow-md w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Maestro de Elementos y Deficiencias</h2>

            {/* BARRA DE FILTROS (Alimentador -> SED) */}
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    
                    {/* 1. ALIMENTADOR */}
                    <div className="flex flex-col gap-1 w-full md:w-1/3">
                        <label className="text-xs font-bold text-gray-600">ALIMENTADOR</label>
                        <Dropdown 
                            value={selectedFeeder} 
                            onChange={(e) => { 
                                setSelectedFeeder(e.value); 
                                setSelectedSed(null); // Reseteamos SED al cambiar alimentador
                            }} 
                            options={feeders} 
                            optionLabel="label" 
                            optionValue="value" // Asegúrate de que extraiga el ID correctamente
                            placeholder="Seleccione..." 
                            filter 
                            className="w-full h-10 flex items-center p-inputtext-sm shadow-sm"
                        />
                    </div>

                    {/* 2. CÓDIGO SED */}
                    <div className="flex flex-col gap-1 w-full md:w-1/3">
                        <label className="text-xs font-bold text-gray-600">CÓDIGO SED</label>
                        <AutoComplete 
                            value={selectedSed} 
                            suggestions={filteredSeds} 
                            completeMethod={searchSedsLocal} 
                            field="label" 
                            onChange={(e) => setSelectedSed(e.value)}
                            placeholder={selectedFeeder ? "Escribe código..." : "Seleccione Alimentador primero..."}
                            dropdown
                            forceSelection
                            className="w-full p-inputtext-sm shadow-sm"
                            inputClassName="h-10"
                            disabled={!selectedFeeder}
                        />
                    </div>

                    {/* 3. BOTÓN DE BÚSQUEDA */}
                    <div className="w-full md:w-auto">
                        <Button 
                            label={loadingDef ? "Cargando..." : "Generar Reporte"} 
                            icon={loadingDef ? "pi pi-spin pi-spinner" : "pi pi-table"} 
                            onClick={handleSearch}
                            disabled={loadingDef || !selectedSed}
                            className="w-full md:w-auto h-10 px-5 font-bold"
                            severity="primary"
                        />
                    </div>
                </div>
            </div>

            {/* TABLA DE DATOS */}
            <div className="card border rounded-lg overflow-hidden">
                <DataTable 
                    value={deficiencies} 
                    loading={loadingDef} 
                    scrollable 
                    scrollHeight="600px" 
                    size="small"
                    stripedRows 
                    emptyMessage="Seleccione un Alimentador y una SED para ver los registros."
                    className="text-sm"
                >
                    <Column body={actionTemplate} header="Acciones" frozen alignFrozen="left" className="bg-gray-50 border-r-2" />
                    
                    <Column field="defiCodigoElemento" header="Código" sortable className="font-bold text-blue-700" />
                    <Column field="etiqueta" header="Etiqueta" />
                    <Column field="defiTipoElemento" header="Tipo" />
                    <Column field="nodoInicial" header="Nodo Inicial" />
                    <Column field="nodoFinal" header="Nodo Final" />
                    <Column field="alimentador" header="Alimentador" />
                    <Column field="sedCodigo" header="SED" />
                    <Column field="defiLatitud" header="Latitud" />
                    <Column field="defiLongitud" header="Longitud" />

                    <Column field="defiEstadoCriticidad" header="Criticidad" body={(r) => r.defiEstadoCriticidad === 3 ? 'CRÍTICO' : r.defiEstadoCriticidad === 2 ? 'MEDIO' : 'LEVE'} />
                    <Column field="tipiInterno" header="Tipificación (ID)" />
                    <Column field="defiCol2" header="Responsable" />
                    <Column field="defiNumSuministro" header="Suministro" />
                    <Column field="defiDistHorizontal" header="Dist. Horiz." />
                    <Column field="defiDistVertical" header="Dist. Vert." />
                    <Column field="defiFecRegistro" header="Fecha Registro" body={(r) => formatDate(r.defiFecRegistro)} />
                    <Column field="defiObservacion" header="Observación" style={{ maxWidth: '150px' }} className="truncate" />
                    <Column field="defiComentario" header="Comentario" style={{ maxWidth: '150px' }} className="truncate" />
                    <Column field="defiUsuarioInic" header="Inspector" />
                </DataTable>
            </div>

            {/* MODALES DE EDICIÓN */}
            <Dialog 
                visible={elementModalOpen} 
                onHide={() => setElementModalOpen(false)}
                header="Editar Elemento Maestro"
                style={{ width: '800px' }}
                modal
                className="p-fluid"
            >
                {selectedRow && (
                    <StaticFormCard 
                        elementToEdit={{ ...selectedRow, id: selectedRow.defiIdElemento || selectedRow.idInterno, codigo: selectedRow.defiCodigoElemento }}
                        typeMode={selectedRow.defiTipoElemento === 'POST' ? 'POSTE' : 'VANO'}
                        onClear={() => {}} 
                        onSave={handleSaveElement}
                        saving={loadingElement}
                    />
                )}
            </Dialog>

            {selectedRow && (
                <DeficiencyForm 
                    visible={deficiencyModalOpen}
                    onHide={() => setDeficiencyModalOpen(false)}
                    deficiencyToEdit={selectedRow}
                    alimentadorId={selectedRow.alimInterno || selectedFeeder} 
                    sedId={selectedRow.sedCodigo || (selectedSed?.value || selectedSed?.sedInterno)}
                    existingDeficiencies={deficiencies} 
                    onSave={handleSaveDeficiency}
                />
            )}
        </div>
    );
}