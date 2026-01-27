import React, { useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Splitter, SplitterPanel } from 'primereact/splitter'; 
import { Skeleton } from 'primereact/skeleton';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'; // Importante

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
    
    // Estados para el Modal CRUD
    const [formVisible, setFormVisible] = useState(false);
    const [deficiencyToEdit, setDeficiencyToEdit] = useState(null);

    const toast = useRef(null);
    
    // Hooks de Datos
    // Asegúrate de que useDeficienciesBySed exponga una forma de actualizar (refresh o setDeficiencies)
    const { deficiencies, loading, fetchBySed, clearData } = useDeficienciesBySed();
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

    // 1. ABRIR NUEVO
    const openNew = () => {
        if (!sedId) {
            toast.current.show({ severity: 'warn', summary: 'Requerido', detail: 'Primero busque una SED.' });
            return;
        }
        setDeficiencyToEdit(null); // Null indica creación
        setFormVisible(true);
    };

    // 2. ABRIR EDICIÓN
    const openEdit = (rowData) => {
        setDeficiencyToEdit({ ...rowData }); // Copia para evitar mutación
        setFormVisible(true);
    };

    // 3. GUARDAR (Callback desde el Modal)
    const handleSaveSuccess = async (deficiencyData) => {
        try {
            // AQUÍ LLAMARÍAS A TU API REAL
            // const method = deficiencyData.defiInterno ? 'PUT' : 'POST';
            // await api.call('/api/Deficiency/save', method, deficiencyData);
            
            // Simulación:
            console.log("Guardando en BD:", deficiencyData);
            
            setFormVisible(false);
            toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Registro guardado.' });
            
            // Refrescar tabla
            await fetchBySed(sedId); 

        } catch (error) {
            console.error(error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar.' });
        }
    };

    // 4. ELIMINAR (Soft Delete)
    const confirmDeleteDeficiency = (rowData) => {
        confirmDialog({
            message: `¿Desactivar la deficiencia del elemento ${rowData.defiCodigoElemento}?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, Eliminar',
            rejectLabel: 'Cancelar',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    // LLAMADA API SOFT DELETE
                    // await api.post('/api/Deficiency/softDelete', { id: rowData.defiInterno });
                    
                    toast.current.show({ severity: 'info', summary: 'Eliminado', detail: 'Registro desactivado.' });
                    await fetchBySed(sedId); // Recargar tabla
                } catch (e) {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Falló la eliminación.' });
                }
            }
        });
    };

    // --- TEMPLATES DE COLUMNAS (Visualización) ---
    const typeTemplate = (rowData) => {
        const isPost = rowData.defiTipoElemento === 'POST';
        return <Tag value={rowData.defiTipoElemento} severity={isPost ? 'info' : 'warning'} icon={isPost ? 'pi pi-arrows-v' : 'pi pi-arrows-h'} />;
    };

    const activeTemplate = (rowData) => {
        const isActive = rowData.defiActivo === 1 || rowData.defiActivo === true;
        return <Tag value={isActive ? 'ACTIVO' : 'ELIMINADO'} severity={isActive ? 'success' : 'danger'} icon={isActive ? 'pi pi-check-circle' : 'pi pi-times-circle'} style={{ fontSize: '10px' }} />;
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

    const suministroTemplate = (rowData) => {
        const val = rowData.defiNumSuministro;
        if (!val || val === '0') return <span className="text-gray-300 text-xs italic">S/N</span>;
        return <div className="flex items-center gap-1"><i className="pi pi-bolt text-yellow-500 text-[10px]"></i><span className="font-mono font-bold text-gray-700">{val}</span></div>;
    };

    const distanciasTemplate = (rowData) => (
        <div className="flex flex-col text-[10px] leading-tight">
            <span><b>DH:</b> {rowData.defiDistHorizontal ?? '-'}</span>
            <span><b>DV:</b> {rowData.defiDistVertical ?? '-'}</span>
        </div>
    );

    const handleUpdateCodTabla = async () => {
        if (!sedId) {
            toast.current.show({
                severity: 'warn',
                summary: 'Atención',
                detail: 'Debe ingresar un código de SED.'
            });
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

                    toast.current.show({
                        severity: 'success',
                        summary: 'Actualizado',
                        detail: 'Las deficiencias fueron actualizadas correctamente.'
                    });

                    await fetchBySed(sedId);
                } catch (error) {
                    toast.current.show({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo actualizar el código de tabla.'
                    });
                }
            }
        });
    };



    // TEMPLATE DE ACCIONES (Editar / Borrar)
    const actionBodyTemplate = (rowData) => {
        const isDeleted = rowData.defiActivo === 0 || rowData.defiActivo === false;
        return (
            <div className="flex gap-1 justify-center">
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
            <div className="bg-white p-2 rounded shadow-sm mb-2 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-100 p-2 rounded-full"><i className="pi pi-search text-blue-600 text-lg"></i></div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 m-0 leading-none">Revisión SED</h2>
                        <span className="text-xs text-gray-500">Gestión de Deficiencias</span>
                    </div>
                </div>

                <div className="flex gap-2 items-end">
                    <span className="p-float-label">
                        <InputText id="sed_input" value={sedId} onChange={(e) => setSedId(e.target.value)} onKeyDown={handleKeyDown} keyfilter="int" className="w-32 text-center font-bold p-inputtext-sm" />
                        <label htmlFor="sed_input">Cód. SED</label>
                    </span>
                     {/* BOTON ACTUALIZAR Y NUEVO*/}
                    <Button icon="pi pi-search" loading={loading} onClick={handleSearch} className="p-button-sm" />
                        <div className="w-px h-8 bg-gray-300 mx-1"></div>
                        <Button label="Nuevo" icon="pi pi-plus" severity="success" onClick={openNew} disabled={!sedId} className="p-button-sm font-bold" />
                        <Button
                            label="Reordenar"
                            icon="pi pi-refresh"
                            severity="warning"
                            onClick={handleUpdateCodTabla}
                            disabled={!sedId || loading}
                            className="p-button-sm font-bold"
                        />
                    {deficiencies.length > 0 && (
                        <Button icon="pi pi-filter-slash" severity="secondary" outlined onClick={() => { setSedId(''); clearData(); }} className="p-button-sm ml-2" tooltip="Limpiar" />
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
                            paginator rows={20} size="small" stripedRows
                            className="text-sm border-none"
                            sortField="defiCodigoElemento" sortOrder={1}
                            scrollable scrollHeight="flex"
                            selectionMode="single" selection={selectedDeficiency} onSelectionChange={(e) => setSelectedDeficiency(e.value)}
                            dataKey="defiInterno" rowHover emptyMessage="Sin resultados."
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
                            <Column field="defiNumSuministro" header="Sum." body={suministroTemplate} style={{ width: '90px' }} />
                            <Column header="Dist." body={distanciasTemplate} style={{ width: '80px' }} />
                            
                            {/* COLUMNA ACCIONES */}
                            <Column header="Acciones" body={actionBodyTemplate} style={{ width: '90px', textAlign: 'center' }} alignFrozen="right" frozen />
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