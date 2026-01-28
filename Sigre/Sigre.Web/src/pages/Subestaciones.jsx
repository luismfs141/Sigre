import React, { useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Splitter, SplitterPanel } from 'primereact/splitter'; 
import { Skeleton } from 'primereact/skeleton';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'; 
import api from '../api/apiConfig';

// Custom Hooks
import { useTypification } from '../hooks/useTypification'
import { useUsuario } from '../hooks/useUsuario';
import { useDeficienciesBySed } from '../hooks/useDeficiencyBySed';
import { useFiles } from '../hooks/useFiles';

// Componentes
import EvidenceGallery from './EvidenceGallery';
import DeficiencyForm from '../components/Modals/DeficiencyForm'

export default function Subestaciones() {
    // --- ESTADOS ---
    const [sedId, setSedId] = useState('');
    const [selectedDeficiency, setSelectedDeficiency] = useState(null);
    
    const [formVisible, setFormVisible] = useState(false);
    const [deficiencyToEdit, setDeficiencyToEdit] = useState(null);

    const toast = useRef(null);
    
    // Hooks de Datos
    const { deficiencies, loading, fetchBySed, clearData, softDeleteDeficiency } = useDeficienciesBySed();
    const { getCodeById, loading: loadingTypos } = useTypification();
    const { getInspectorName, loading: loadingUsers } = useUsuario(true);
    const { updateCodTablaBySed } = useFiles();

    // --- ACCIONES GENERALES ---
    const handleSearch = async () => {
        if (!sedId.trim()) {
            toast.current.show({ severity: 'warn', summary: 'Atención', detail: 'Ingrese un código de SED.' });
            return;
        }
        setSelectedDeficiency(null);
        await fetchBySed(sedId);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSearch();
    };

    // --- LÓGICA CRUD ---
    const openNew = () => {
        if (!sedId) {
            toast.current.show({ severity: 'warn', summary: 'Requerido', detail: 'Primero busque una SED.' });
            return;
        }
        setDeficiencyToEdit(null); 
        setFormVisible(true);
    };

    const openEdit = (rowData) => {
        setDeficiencyToEdit({ ...rowData }); 
        setFormVisible(true);
    };

    const handleSaveSuccess = async (deficiencyData) => {
        try {
            // AQUÍ LLAMARÍAS A TU API REAL
            await api.call('/Deficiency/save', 'POST', deficiencyData);
            
            setFormVisible(false);
            toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Registro guardado.' });
            await fetchBySed(sedId); 

        } catch (error) {
            console.error(error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar.' });
        }
    };

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
                    toast.current.show({ severity: 'success', summary: 'Eliminado', detail: 'Registro desactivado correctamente.' });
                } else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el registro.' });
                }
            }
        });
    };

    // --- TEMPLATES DE COLUMNAS (Visualización Ajustada) ---
    
    const typeTemplate = (rowData) => {
        const isPost = rowData.defiTipoElemento === 'POST';
        return <Tag value={rowData.defiTipoElemento} severity={isPost ? 'info' : 'warning'} icon={isPost ? 'pi pi-arrows-v' : 'pi pi-arrows-h'} className="text-sm" />;
    };

    const activeTemplate = (rowData) => {
        const isActive = rowData.defiActivo === 1 || rowData.defiActivo === true;
        // Se alinea a la derecha visualmente si se requiere
        return <Tag value={isActive ? 'ACTIVO' : 'ELIMINADO'} severity={isActive ? 'success' : 'danger'} icon={isActive ? 'pi pi-check-circle' : 'pi pi-times-circle'} style={{ fontSize: '11px' }} />;
    };

    const criticidadTemplate = (rowData) => {
        const map = { 1: { l: 'LEVE', s: 'success' }, 2: { l: 'MEDIO', s: 'warning' }, 3: { l: 'CRÍTICO', s: 'danger' } };
        const conf = map[rowData.defiEstadoCriticidad] || { l: 'N/A', s: 'null' };
        return <Tag value={conf.l} severity={conf.s} style={{ fontSize: '11px' }} />;
    };

    const typificationTemplate = (rowData) => {
        if (loadingTypos) return <Skeleton width="40px" />;
        const code = getCodeById(rowData.tipiInterno); 
        return <Tag value={code || "S/D"} severity={code ? "info" : "warning"} style={{ fontSize: '12px', fontWeight: 'bold' }} />;
    };

    // ✅ Alineado a la derecha y letra más grande
    const inspectorTemplate = (rowData) => {
        if (loadingUsers) return <Skeleton width="80px" className="ml-auto" />;
        return <div className="text-right"><span className="text-gray-700 text-sm font-medium uppercase truncate">{getInspectorName(rowData.defiUsuarioInic)}</span></div>;
    };

    // ✅ Alineado a la derecha
    const dateTemplate = (rowData) => rowData.defiFecRegistro ? new Date(rowData.defiFecRegistro).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "-";

    // ✅ Alineado a la derecha (Flex justify-end) y letra más grande
    const suministroTemplate = (rowData) => {
        const val = rowData.defiNumSuministro;
        if (!val || val === '0') return <div className="text-right text-gray-300 text-sm italic">S/N</div>;
        return (
            <div className="flex items-center justify-end gap-1">
                <i className="pi pi-bolt text-yellow-500 text-sm"></i>
                <span className="font-mono font-bold text-gray-700 text-sm">{val}</span>
            </div>
        );
    };

    // ✅ Alineado a la derecha (Flex items-end) y letra más grande
    const distanciasTemplate = (rowData) => (
        <div className="flex flex-col items-end text-xs leading-tight">
            <span><b>DH:</b> {rowData.defiDistHorizontal ?? '-'}</span>
            <span><b>DV:</b> {rowData.defiDistVertical ?? '-'}</span>
        </div>
    );

    const handleUpdateCodTabla = async () => {
        if (!sedId) {
            toast.current.show({ severity: 'warn', summary: 'Atención', detail: 'Debe ingresar un código de SED.' });
            return;
        }

        confirmDialog({
            message: `¿Actualizar el código de tabla para todas las deficiencias de la SED ${sedId}?`,
            header: 'Confirmar actualización',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, actualizar',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-warning',
            accept: async () => {
                try {
                    await updateCodTablaBySed(sedId);
                    toast.current.show({ severity: 'success', summary: 'Actualizado', detail: 'Las deficiencias fueron actualizadas correctamente.' });
                    await fetchBySed(sedId);
                } catch (error) {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el código de tabla.' });
                }
            }
        });
    };

    const actionBodyTemplate = (rowData) => {
        const isDeleted = rowData.defiActivo === 0 || rowData.defiActivo === false;
        return (
            <div className="flex gap-1 justify-end"> {/* justify-end para derecha */}
                <Button 
                    icon="pi pi-pencil" rounded text severity="info" size="small"
                    onClick={() => openEdit(rowData)} 
                    disabled={isDeleted} 
                    tooltip="Editar"
                />
                <Button 
                    icon="pi pi-trash" rounded text severity="danger" size="small"
                    onClick={() => confirmDeleteDeficiency(rowData)}
                    disabled={isDeleted}
                    tooltip="Eliminar"
                />
            </div>
        );
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100 p-2 overflow-hidden">
            <Toast ref={toast} />
            <ConfirmDialog />

            {/* BARRA SUPERIOR */}
            <div className="bg-white p-3 rounded shadow-sm mb-2 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-100 p-2 rounded-full"><i className="pi pi-search text-blue-600 text-xl"></i></div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 m-0 leading-none">Revisión SED</h2>
                        <span className="text-sm text-gray-500">Gestión de Deficiencias</span>
                    </div>
                </div>

                <div className="flex gap-2 items-end">
                    <span className="p-float-label">
                        <InputText id="sed_input" value={sedId} onChange={(e) => setSedId(e.target.value)} onKeyDown={handleKeyDown} keyfilter="int" className="w-32 text-center font-bold text-lg" />
                        <label htmlFor="sed_input">Cód. SED</label>
                    </span>
                    <Button icon="pi pi-search" loading={loading} onClick={handleSearch} className="p-button-md" />
                        <div className="w-px h-10 bg-gray-300 mx-1"></div>
                        <Button label="Nuevo" icon="pi pi-plus" severity="success" onClick={openNew} disabled={!sedId} className="font-bold" />
                        <Button
                            label="Reordenar"
                            icon="pi pi-refresh"
                            severity="warning"
                            onClick={handleUpdateCodTabla}
                            disabled={!sedId || loading}
                            className="font-bold"
                        />
                    {deficiencies.length > 0 && (
                        <Button icon="pi pi-filter-slash" severity="secondary" outlined onClick={() => { setSedId(''); clearData(); }} className="ml-2" tooltip="Limpiar" />
                    )}
                </div>
            </div>

            {/* CONTENIDO PRINCIPAL */}
            <div className="flex-grow bg-white rounded shadow border border-gray-300 overflow-hidden">
                <Splitter style={{ height: '100%' }} className="border-0">
                    
                    {/* TABLA DE DATOS */}
                    <SplitterPanel size={65} minSize={30} className="overflow-auto flex flex-col">
                        <DataTable
                            value={deficiencies} loading={loading}
                            paginator rows={20} size="normal" stripedRows 
                            // 🟢 SE QUITÓ 'text-sm' para que la letra sea más grande (por defecto rem o text-base)
                            className="border-none"
                            sortField="defiCodigoElemento" sortOrder={1}
                            scrollable scrollHeight="flex"
                            selectionMode="single" selection={selectedDeficiency} onSelectionChange={(e) => setSelectedDeficiency(e.value)}
                            dataKey="defiInterno" rowHover emptyMessage="Sin resultados."
                        >
                            {/* COLUMNAS IZQUIERDA (Datos Principales) */}
                            <Column field="defiIdElemento" header="ID" sortable style={{ width: '70px' }} />
                            <Column field="defiTipoElemento" header="Tipo" body={typeTemplate} sortable style={{ width: '90px', textAlign: 'center' }} />
                            <Column field="defiCodigoElemento" header="GIS" sortable style={{ fontWeight: 'bold', color: '#1e40af', fontSize: '1.05em' }} />
                            <Column header="Tipificación" body={typificationTemplate} style={{ textAlign: 'center', width: '110px' }} />
                            
                            {/* OJO (Selección) */}
                            <Column body={(r) => selectedDeficiency?.defiInterno === r.defiInterno ? <i className="pi pi-eye text-blue-600 font-bold text-lg"></i> : null} style={{ width: '40px' }} />
                            
                            {/* COLUMNAS DERECHA (Datos Secundarios) - align="right" */}
                            <Column field="defiFecRegistro" header="Fecha" body={dateTemplate} sortable align="right" style={{ width: '110px' }} />
                            <Column header="Inspector" body={inspectorTemplate} align="right" style={{ minWidth: '140px' }} />
                            <Column field="defiActivo" header="Estado" body={activeTemplate} sortable align="right" style={{ width: '100px' }} />
                            <Column field="defiEstadoCriticidad" header="Crit." body={criticidadTemplate} sortable align="right" style={{ width: '80px' }} />
                            <Column field="defiNumSuministro" header="Sum." body={suministroTemplate} align="right" style={{ width: '100px' }} />
                            <Column header="Dist." body={distanciasTemplate} align="right" style={{ width: '90px' }} />
                            
                            {/* ACCIONES AL FINAL DERECHA */}
                            <Column header="Acciones" body={actionBodyTemplate} align="right" style={{ width: '100px' }} alignFrozen="right" frozen />
                        </DataTable>
                    </SplitterPanel>

                    {/* GALERÍA */}
                    <SplitterPanel size={35} minSize={20} className="bg-slate-50">
                        <EvidenceGallery deficiency={selectedDeficiency} />
                    </SplitterPanel>

                </Splitter>
            </div>

            {/* MODAL DEL FORMULARIO */}
            <DeficiencyForm 
                visible={formVisible}
                onHide={() => setFormVisible(false)}
                onSave={handleSaveSuccess}
                deficiencyToEdit={deficiencyToEdit}
                sedId={sedId}
                existingDeficiencies={deficiencies}
            />
        </div>
    );
}