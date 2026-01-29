import React, { useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { AutoComplete } from 'primereact/autocomplete';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { Skeleton } from 'primereact/skeleton';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

// --- API ---
import api from '../api/apiConfig';

// --- CUSTOM HOOKS ---
// 🔥 CORRECCIÓN 1: Importamos desde useFeeders (PLURAL) y extraemos useFeeders
import { useFeeder, useSedsByFeeder } from '../hooks/useFeeder'; 

// 🔥 CORRECCIÓN 2: Importamos useDeficienciesBySed (que ya incluye saveDeficiency)
import { useDeficienciesBySed } from '../hooks/useDeficiency';

import { useTypification } from '../hooks/useTypification';
import { useUsuario } from '../hooks/useUsuario';
import { useFiles } from '../hooks/useFiles';

// --- COMPONENTES ---
import EvidenceGallery from './EvidenceGallery';
import DeficiencyForm from '../components/Modals/DeficiencyForm';

export default function Subestaciones() {
    // -------------------------------------------------------------------
    // 1. ESTADOS Y REFERENCIAS
    // -------------------------------------------------------------------
    const toast = useRef(null);

    // Estados de Filtros (Cascada)
    const [selectedFeeder, setSelectedFeeder] = useState(null);
    const [selectedSed, setSelectedSed] = useState(null);
    const [filteredSeds, setFilteredSeds] = useState([]);

    // Estados de Selección y Modal
    const [selectedDeficiency, setSelectedDeficiency] = useState(null);
    const [formVisible, setFormVisible] = useState(false);
    const [deficiencyToEdit, setDeficiencyToEdit] = useState(null);

    // -------------------------------------------------------------------
    // 2. USO DE HOOKS
    // -------------------------------------------------------------------
    
    // Carga inicial de Alimentadores
    const { feeders, loading: loadingFeeders } = useFeeder();

    // Carga de SEDs dependiente del Alimentador seleccionado
    const { seds: sedsDelAlimentador, loading: loadingSeds } = useSedsByFeeder(selectedFeeder);

    // Gestión de Deficiencias (Tabla principal)
    // Extraemos saveDeficiency aquí
    const { 
        deficiencies, 
        loading: loadingDef, 
        fetchBySed, 
        clearData, 
        saveDeficiency, 
        softDeleteDeficiency 
    } = useDeficienciesBySed();

    // Hooks Auxiliares (Tablas Maestras y Usuarios)
    const { getCodeById, loading: loadingTypos } = useTypification();
    const { getInspectorName, loading: loadingUsers } = useUsuario(true);

    // -------------------------------------------------------------------
    // 3. LÓGICA DE FILTROS (AUTOCOMPLETE)
    // -------------------------------------------------------------------
    
    // Filtra localmente la lista de SEDs que ya trajo el hook useSedsByFeeder
    const searchSeds = (event) => {
        const query = event.query.toLowerCase();
        let _filtered = sedsDelAlimentador.filter((sed) => {
            const codigo = String(sed.sedCodigo || "").toLowerCase();
            const etiqueta = String(sed.sedEtiqueta || "").toLowerCase();
            return codigo.includes(query) || etiqueta.includes(query);
        });
        setFilteredSeds(_filtered);
    };

    // Al cambiar el alimentador, limpiamos la SED seleccionada y la tabla
    const handleFeederChange = (e) => {
        setSelectedFeeder(e.value);
        setSelectedSed(null); 
        setFilteredSeds([]);
        clearData(); 
    };

    // -------------------------------------------------------------------
    // 4. ACCIONES PRINCIPALES (CRUD)
    // -------------------------------------------------------------------

   const handleSearch = async () => {
        if (!selectedSed) {
            toast.current.show({ severity: 'warn', summary: 'Atención', detail: 'Seleccione una SED.' });
            return;
        }
        setSelectedDeficiency(null);
        
        // Enviamos: selectedSed.sedInterno (1696)
        const idParaBackend = selectedSed.sedInterno || selectedSed.SedInterno || selectedSed.id;
        
        console.log("Enviando ID al backend:", idParaBackend); 
        
        await fetchBySed(idParaBackend);
    };

    const openNew = () => {
        if (!selectedSed) return;
        setDeficiencyToEdit(null);
        setFormVisible(true);
    };

    const openEdit = (rowData) => {
        setDeficiencyToEdit({ ...rowData });
        setFormVisible(true);
    };

    // 🔥 CORRECCIÓN 3: Sintaxis arreglada y recarga correcta
    const handleSaveSuccess = async (deficiencyData) => {
        // Llamamos a la función del hook
        const result = await saveDeficiency(deficiencyData);
        
        if (result.success) {
            // ÉXITO
            setFormVisible(false);
            toast.current.show({ severity: 'success', summary: 'Guardado', detail: 'Registro procesado correctamente.' });
            
            // Recargar tabla si hay SED seleccionada
            if (selectedSed) {
                const idSed = selectedSed.sedInterno || selectedSed.SedInterno || selectedSed.id;
                await fetchBySed(idSed);
            }
        } else {
            // ERROR
            console.error("Error al guardar:", result.message);
            toast.current.show({ severity: 'error', summary: 'Error', detail: result.message });
        }
    }; // <--- Faltaba esta llave de cierre

    const confirmDeleteDeficiency = (rowData) => {
        confirmDialog({
            message: `¿Desactivar la deficiencia del elemento ${rowData.defiCodigoElemento}?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, Eliminar',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                const success = await softDeleteDeficiency(rowData.defiInterno);
                if (success) {
                    toast.current.show({ severity: 'success', summary: 'Eliminado', detail: 'Registro desactivado.' });
                } else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar.' });
                }
            }
        });
    };

    // -------------------------------------------------------------------
    // 5. TEMPLATES DE LA TABLA
    // -------------------------------------------------------------------
    const typeTemplate = (rowData) => {
        const isPost = rowData.defiTipoElemento === 'POST';
        return <Tag value={rowData.defiTipoElemento} severity={isPost ? 'info' : 'warning'} icon={isPost ? 'pi pi-arrows-v' : 'pi pi-arrows-h'} />;
    };

    const activeTemplate = (rowData) => {
        const isActive = rowData.defiActivo === true || rowData.defiActivo === 1;
        return <Tag value={isActive ? 'ACTIVO' : 'ELIMINADO'} severity={isActive ? 'success' : 'danger'} style={{ fontSize: '10px' }} />;
    };

    const criticidadTemplate = (rowData) => {
        const map = { 1: { l: 'LEVE', s: 'success' }, 2: { l: 'MEDIO', s: 'warning' }, 3: { l: 'CRÍTICO', s: 'danger' } };
        const conf = map[rowData.defiEstadoCriticidad] || { l: 'N/A', s: 'null' };
        return <Tag value={conf.l} severity={conf.s} style={{ fontSize: '10px' }} />;
    };

    const typificationTemplate = (rowData) => {
        if (loadingTypos) return <Skeleton width="40px" />;
        const code = getCodeById(rowData.tipiInterno); 
        return <Tag value={code || "S/D"} severity={code ? "info" : "warning"} style={{ fontSize: '11px', fontWeight: 'bold' }} />;
    };

    const inspectorTemplate = (rowData) => {
        if (loadingUsers) return <Skeleton width="80px" />;
        return <span className="text-gray-700 text-xs font-medium uppercase truncate">{getInspectorName(rowData.defiUsuarioInic)}</span>;
    };

    const dateTemplate = (rowData) => rowData.defiFecRegistro ? new Date(rowData.defiFecRegistro).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "-";

    const actionBodyTemplate = (rowData) => {
        const isDeleted = rowData.defiActivo === false || rowData.defiActivo === 0;
        return (
            <div className="flex gap-1 justify-center">
                <Button icon="pi pi-pencil" rounded text severity="info" size="small" onClick={() => openEdit(rowData)} disabled={isDeleted} tooltip="Editar" />
                <Button icon="pi pi-trash" rounded text severity="danger" size="small" onClick={() => confirmDeleteDeficiency(rowData)} disabled={isDeleted} tooltip="Eliminar" />
            </div>
        );
    };

    // -------------------------------------------------------------------
    // 6. RENDERIZADO
    // -------------------------------------------------------------------
    return (
        <div className="flex flex-col h-screen bg-gray-100 p-2 overflow-hidden">
            <Toast ref={toast} />
            <ConfirmDialog />

            {/* --- BARRA SUPERIOR (FILTROS Y ACCIONES) --- */}
            <div className="bg-white p-2 rounded shadow-sm mb-2 flex items-center justify-between shrink-0">
                
                {/* Título */}
                <div className="flex items-center gap-2">
                    <div className="bg-blue-100 p-2 rounded-full"><i className="pi pi-search text-blue-600 text-lg"></i></div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 m-0 leading-none">Revisión SED</h2>
                        <span className="text-xs text-gray-500">Gestión de Deficiencias</span>
                    </div>
                </div>

                {/* Zona de Inputs (Cascada) */}
                <div className="flex gap-3 items-end">
                    
                    {/* 1. Selector de Alimentador */}
                    <div className="flex flex-col">
                        <label className="text-xs font-bold text-gray-500 ml-1">Alimentador</label>
                        <Dropdown 
                            value={selectedFeeder} 
                            onChange={handleFeederChange} 
                            options={feeders} 
                            optionLabel="label" 
                            filter 
                            placeholder="Seleccione..." 
                            className="w-60 p-inputtext-sm"
                            disabled={loadingFeeders}
                            emptyMessage="No hay datos"
                        />
                    </div>

                    {/* 2. Buscador de SED (AutoComplete) */}
                    <div className="flex flex-col">
                        <label className="text-xs font-bold text-gray-500 ml-1">Cód. SED</label>
                        <div className="p-inputgroup">
                            <AutoComplete 
                                value={selectedSed} 
                                suggestions={filteredSeds} 
                                completeMethod={searchSeds} 
                                field="sedCodigo" // IMPORTANTE: Muestra el código (ej. "8155")
                                dropdown 
                                onChange={(e) => setSelectedSed(e.value)} 
                                itemTemplate={(item) => (
                                    <div className="flex flex-col">
                                        <span className="font-bold">{item.sedCodigo}</span>
                                        <span className="text-xs text-gray-500">{item.sedEtiqueta}</span>
                                    </div>
                                )}
                                placeholder={loadingSeds ? "Cargando..." : "Buscar SED..."}
                                className="w-44 p-inputtext-sm font-bold"
                                forceSelection
                                disabled={!selectedFeeder || loadingSeds} // Bloqueado si no hay alimentador
                            />
                            <Button 
                                icon="pi pi-search" 
                                onClick={handleSearch} 
                                loading={loadingDef}
                                disabled={!selectedSed} 
                                className="p-button-primary" 
                                tooltip="Buscar Deficiencias"
                            />
                        </div>
                    </div>

                    <div className="w-px h-8 bg-gray-300 mx-1 self-center"></div>
                    
                    {/* Botones de Acción */}
                    <Button 
                        label="Nuevo" 
                        icon="pi pi-plus" 
                        severity="success" 
                        onClick={openNew} 
                        disabled={!selectedSed} 
                        className="p-button-sm font-bold h-10" 
                    />
                    
                    {(deficiencies.length > 0 || selectedFeeder) && (
                        <Button 
                            icon="pi pi-filter-slash" 
                            severity="secondary" 
                            outlined 
                            onClick={() => { 
                                setSelectedFeeder(null); 
                                setSelectedSed(null); 
                                clearData(); 
                            }} 
                            className="p-button-sm h-10" 
                            tooltip="Limpiar Todo" 
                        />
                    )}
                </div>
            </div>

            {/* --- CONTENIDO PRINCIPAL --- */}
            <div className="flex-grow bg-white rounded shadow border border-gray-300 overflow-hidden">
                <Splitter style={{ height: '100%' }} className="border-0">
                    
                    {/* Panel Izquierdo: Tabla */}
                    <SplitterPanel size={65} minSize={30} className="overflow-auto flex flex-col">
                        <DataTable 
                            value={deficiencies} 
                            loading={loadingDef}
                            paginator rows={20} 
                            size="small" 
                            stripedRows
                            className="text-sm border-none"
                            sortField="defiCodigoElemento" sortOrder={1}
                            scrollable scrollHeight="flex"
                            selectionMode="single" 
                            selection={selectedDeficiency} 
                            onSelectionChange={(e) => setSelectedDeficiency(e.value)}
                            dataKey="defiInterno" 
                            rowHover 
                            emptyMessage="No hay deficiencias registradas."
                        >
                            <Column field="defiIdElemento" header="ID" sortable style={{ width: '60px' }} />
                            <Column field="defiTipoElemento" header="Tipo" body={typeTemplate} sortable style={{ width: '80px', textAlign: 'center' }} />
                            <Column field="defiCodigoElemento" header="GIS" sortable style={{ fontWeight: 'bold', color: '#1e40af' }} />
                            <Column header="Tipificación" body={typificationTemplate} style={{ textAlign: 'center', width: '100px' }} />
                            
                            <Column body={(r) => selectedDeficiency?.defiInterno === r.defiInterno ? <i className="pi pi-eye text-blue-600 font-bold"></i> : null} style={{ width: '30px' }} />
                            
                            <Column field="defiFecRegistro" header="Fecha" body={dateTemplate} sortable style={{ width: '100px' }} />
                            <Column header="Inspector" body={inspectorTemplate} style={{ minWidth: '120px' }} />
                            <Column field="defiActivo" header="Estado" body={activeTemplate} sortable style={{ width: '90px', textAlign: 'center' }} />
                            <Column field="defiEstadoCriticidad" header="Crit." body={criticidadTemplate} sortable style={{ width: '70px', textAlign: 'center' }} />
                            
                            <Column header="Acciones" body={actionBodyTemplate} style={{ width: '90px', textAlign: 'center' }} alignFrozen="right" frozen />
                        </DataTable>
                    </SplitterPanel>

                    {/* Panel Derecho: Galería de Fotos */}
                    <SplitterPanel size={35} minSize={20} className="bg-slate-50">
                        <EvidenceGallery deficiency={selectedDeficiency} />
                    </SplitterPanel>

                </Splitter>
            </div>

            {/* --- MODAL FORMULARIO --- */}
            <DeficiencyForm 
                visible={formVisible}
                onHide={() => setFormVisible(false)}
                onSave={handleSaveSuccess}
                deficiencyToEdit={deficiencyToEdit}
                sedId={selectedSed?.sedCodigo || ''}
                existingDeficiencies={deficiencies}
            />
        </div>
    );
}