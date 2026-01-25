import React, { useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Splitter, SplitterPanel } from 'primereact/splitter'; 
import { Skeleton } from 'primereact/skeleton';

import { useTypification } from '../hooks/useTypification';
import { useUsuario } from '../hooks/useUsuario';
import { useDeficienciesBySed } from '../hooks/useDeficiencyBySed';

// Tu componente nuevo
import EvidenceGallery from './EvidenceGallery';


export default function Subestaciones() {
    const [sedId, setSedId] = useState('');
    const [selectedDeficiency, setSelectedDeficiency] = useState(null); // 👈 Estado para la selección

    const toast = useRef(null);
    const { deficiencies, loading, fetchBySed, clearData } = useDeficienciesBySed();
    const { getCodeById, loading: loadingTypos } = useTypification();
    
    // useUsuario con autoFetch=true para tener la lista lista
    const { getInspectorName, loading: loadingUsers } = useUsuario(true);

    // Acción de buscar
    const handleSearch = async () => {
        if (!sedId.trim()) {
            toast.current.show({ severity: 'warn', summary: 'Atención', detail: 'Ingrese un código de SED.' });
            return;
        }
        setSelectedDeficiency(null); // Limpiar selección al buscar nuevo
        await fetchBySed(sedId);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSearch();
    };


    // --- TEMPLATES (Tus mismos templates) ---
    const typeTemplate = (rowData) => {
        const isPost = rowData.defiTipoElemento === 'POST';
        return <Tag value={rowData.defiTipoElemento} severity={isPost ? 'info' : 'warning'} icon={isPost ? 'pi pi-arrows-v' : 'pi pi-arrows-h'} />;
    };

    const dateTemplate = (rowData) => {
        if (!rowData.defiFecRegistro) return "-";
        return new Date(rowData.defiFecRegistro).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const criticidadTemplate = (rowData) => {
        const valor = rowData.defiEstadoCriticidad;
        let severity = 'null';
        let label = 'S/D';
        switch (valor) {
            case 1: severity = 'success'; label = 'LEVE'; break;
            case 2: severity = 'warning'; label = 'MEDIO'; break;
            case 3: severity = 'danger'; label = 'CRÍTICO'; break;
            default: return <span className="text-gray-300 text-[10px] font-bold">N/A</span>;
        }
        return <Tag value={label} severity={severity} style={{ fontSize: '10px', minWidth: '50px' }} />;
    };
    // Template para Estado de Registro (1: Activo, 0: Eliminado)
    const activeTemplate = (rowData) => {
        // A veces viene como número 1/0 o como booleano true/false, cubrimos ambos casos
        const isActive = rowData.defiActivo === 1 || rowData.defiActivo === true;

        return (
            <Tag
                value={isActive ? 'ACTIVO' : 'ELIMINADO'}
                severity={isActive ? 'success' : 'danger'}
                icon={isActive ? 'pi pi-check-circle' : 'pi pi-times-circle'}
                style={{ fontSize: '10px', minWidth: '70px' }}
            />
        );
    };
    // Template para Número de Suministro (Maneja NULL, vacío o "0")
    const suministroTemplate = (rowData) => {
        const val = rowData.defiNumSuministro;

        // Validamos si es nulo, undefined, vacío o cero string/number
        if (!val || val === '0' || val === 0) {
            return <span className="text-gray-300 text-xs italic">S/N</span>; // Sin Número
        }

        return (
            <div className="flex items-center gap-1">
                <i className="pi pi-bolt text-yellow-500 text-[10px]"></i>
                <span className="font-mono font-bold text-gray-700">{val}</span>
            </div>
        );
    };

    // Template Combinado para Distancias (Horizontal y Vertical)
    const distanciasTemplate = (rowData) => {
        // Helper simple para formatear: si es null muestra "-", si no, el valor
        const fmt = (v) => (v !== null && v !== undefined) ? v : '-';

        return (
            <div className="flex flex-col text-[10px] leading-tight">
                <span className="whitespace-nowrap">
                    <span className="font-bold text-gray-500">DH:</span> {fmt(rowData.defiDistHorizontal)}
                </span>
                <span className="whitespace-nowrap">
                    <span className="font-bold text-gray-500">DV:</span> {fmt(rowData.defiDistVertical)}
                </span>
            </div>
        );
    };
    // . Template para Tipificación (ID -> Código 6002)
    const typificationTemplate = (rowData) => {
        if (loadingTypos) return <Skeleton width="40px" />;
        
        // Asumiendo que 'tipiInterno' es tu FK en la tabla deficiencias
        const code = getCodeById(rowData.tipiInterno); 
        
        return (
            <Tag 
                value={code || "S/D"} 
                severity={code ? "info" : "warning"} 
                style={{ fontSize: '11px', fontWeight: 'bold' }}
            />
        );
    };

    // . Template para Inspector (ID -> Nombre Juan Perez)
    const inspectorTemplate = (rowData) => {
        if (loadingUsers) return <Skeleton width="80px" />;

       
        const idUsuario = rowData.defiUsuarioInic; 

        const nombreInspector = getInspectorName(idUsuario);

        return (
            <div className="flex items-center gap-2">
                <i className="pi pi-user text-gray-400"></i>
                <span className="text-gray-700 text-xs font-medium uppercase truncate">
                    {nombreInspector}
                </span>
            </div>
        );
    };
    return (
        <div className="flex flex-col h-screen bg-gray-100 p-2 overflow-hidden">
            <Toast ref={toast} />

            {/* --- 1. BARRA SUPERIOR (Buscador) --- */}
            <div className="bg-white p-2 rounded shadow-sm mb-2 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-100 p-2 rounded-full">
                        <i className="pi pi-search text-blue-600 text-lg"></i>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 m-0 leading-none">Revisión SED</h2>
                        <span className="text-xs text-gray-500">Deficiencias y Evidencias</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <span className="p-float-label">
                        <InputText
                            id="sed_input"
                            value={sedId}
                            onChange={(e) => setSedId(e.target.value)}
                            onKeyDown={handleKeyDown}
                            keyfilter="int"
                            className="w-32 text-center font-bold p-inputtext-sm"
                        />
                        <label htmlFor="sed_input">Cód. SED</label>
                    </span>
                    <Button icon="pi pi-search" loading={loading} onClick={handleSearch} className="p-button-sm" />
                    {deficiencies.length > 0 && (
                        <Button icon="pi pi-trash" severity="secondary" outlined onClick={() => { setSedId(''); clearData(); }} tooltip="Limpiar" className="p-button-sm" />
                    )}
                </div>
            </div>

            {/* --- 2. ÁREA DE TRABAJO (SPLITTER) --- */}
            <div className="flex-grow bg-white rounded shadow border border-gray-300 overflow-hidden">
                <Splitter style={{ height: '100%' }} className="border-0">

                    {/* PANEL IZQUIERDO: TABLA */}
                    <SplitterPanel size={65} minSize={30} className="overflow-auto flex flex-col">
                        <DataTable
                            value={deficiencies}
                            loading={loading}
                            paginator
                            rows={20}
                            size="small"
                            stripedRows
                            className="text-sm border-none"
                            sortField="defiCodigoElemento"
                            sortOrder={1}
                            scrollable
                            scrollHeight="flex"
                            // PROPIEDADES DE SELECCIÓN
                            selectionMode="single"
                            selection={selectedDeficiency}
                            onSelectionChange={(e) => setSelectedDeficiency(e.value)}
                            dataKey="defiInterno"
                            rowHover
                            emptyMessage="Ingrese un código SED para ver resultados."
                        >
                            {/* COLUMNA DE SELECCIÓN VISUAL (Opcional, ayuda a saber cuál ves) */}
                            <Column field="defiIdElemento" header="ID" sortable style={{ width: '60px' }} />
                            <Column field="defiTipoElemento" header="Tipo" body={typeTemplate} sortable style={{ width: '90px', textAlign: 'center' }} />
                            <Column field="defiCodigoElemento" header="GIS" sortable style={{ fontWeight: 'bold', color: '#1e40af' }} />
                            <Column
                                header="Cód. Tipificación"
                                body={typificationTemplate}
                                style={{ textAlign: 'center', width: '120px' }}
                            />
                            <Column body={(r) => selectedDeficiency?.defiInterno === r.defiInterno ? <i className="pi pi-eye text-blue-600 font-bold"></i> : null} style={{ width: '30px' }} />
                            <Column field="defiFecRegistro" header="Fecha" body={dateTemplate} sortable style={{ width: '120px' }} />
                            <Column
                                header="Inspector"
                                body={inspectorTemplate}
                                style={{ minWidth: '150px' }}
                            />
                            <Column field="defiObservacion" header="Obs" style={{ maxWidth: '200px' }} className="truncate" />
                            <Column
                                field="defiActivo"
                                header="Estado del Registro"
                                body={activeTemplate}
                                sortable
                                style={{ width: '100px', textAlign: 'center' }}
                            />
                            <Column field="defiEstadoCriticidad" header="Crit." body={criticidadTemplate} sortable style={{ width: '80px', textAlign: 'center' }} />
                            {/* Columna Suministro */}
                            <Column
                                field="defiNumSuministro"
                                header="Suministro"
                                body={suministroTemplate}
                                sortable
                                style={{ width: '110px' }}
                            />

                            {/* Columna Distancias (Horizontal / Vertical) */}
                            <Column
                                header="Distancias"
                                body={distanciasTemplate}
                                style={{ width: '90px' }}
                            />
                        </DataTable>
                    </SplitterPanel>

                    {/* PANEL DERECHO: GALERÍA DE FOTOS */}
                    <SplitterPanel size={35} minSize={20} className="bg-slate-50">
                        <EvidenceGallery deficiency={selectedDeficiency} />
                    </SplitterPanel>

                </Splitter>
            </div>
        </div>
    );
}