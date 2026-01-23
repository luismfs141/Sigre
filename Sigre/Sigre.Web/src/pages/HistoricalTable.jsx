import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { ConfirmPopup, confirmPopup } from 'primereact/confirmpopup';
import { Toast } from 'primereact/toast';

import { useFiles } from '../hooks/useFiles';

// --- SUB-COMPONENTE: MODAL DE EVIDENCIAS (SOLO LECTURA Y BORRADO) ---
const EvidenceModal = ({ visible, onHide, deficiency }) => {
    // Solo necesitamos cargar y borrar. Ya no 'addFile'.
    const { files, loadingFiles, loadFiles, deleteFile } = useFiles();
    const toast = useRef(null);

    // Cargar archivos al abrir el modal
    useEffect(() => {
        if (visible && deficiency) {
            loadFiles(deficiency.defiInterno);
        }
    }, [visible, deficiency, loadFiles]);

    // Filtro: Solo mostrar archivos activos
    const activeFiles = files.filter(f => f.archActivo === true);

    // --- ACCIONES ---
    const handleDelete = (event, id) => {
        confirmPopup({
            target: event.currentTarget,
            message: '¿Seguro de eliminar este archivo?',
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                const success = await deleteFile(id);
                if (success) {
                    toast.current.show({ severity: 'success', summary: 'Eliminado', detail: 'Archivo desactivado correctamente.' });
                } else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar.' });
                }
            }
        });
    };

    // Templates para la tabla
    const tipoTemplate = (r) => {
        const map = { "1": "Panorámica", "2": "Frontal", "3": "Izquierda", "4": "Derecha", "0": "Otro" };
        return <Tag value={map[r.archTipo] || r.archTipo} severity="info" />;
    };

    const actionTemplate = (rowData) => (
        <div className="flex justify-center">
            <Button 
                icon="pi pi-trash" 
                rounded 
                text 
                severity="danger" 
                onClick={(e) => handleDelete(e, rowData.archInterno)} 
                tooltip="Eliminar (Desactivar)"
            />
        </div>
    );

    return (
        <Dialog 
            header={`Gestión de Archivos | GIS: ${deficiency?.defiCodigoElemento}`} 
            visible={visible} 
            style={{ width: '90vw', maxWidth: '800px' }} 
            onHide={onHide}
        >
            <Toast ref={toast} />
            <ConfirmPopup />

            <div className="flex flex-col gap-4">
                
                {/* CABECERA SIMPLIFICADA */}
                <div className="flex justify-between items-center border-b pb-2">
                    <div>
                        <span className="font-bold text-gray-700 block">{activeFiles.length} Archivos Activos</span>
                        <small className="text-gray-500">ID Deficiencia: {deficiency.defiInterno}</small>
                    </div>
                    {/* Botón de "Subir Nuevo" ELIMINADO */}
                </div>

                {/* TABLA DE RESULTADOS */}
                <DataTable 
                    value={activeFiles} 
                    loading={loadingFiles} 
                    size="small" 
                    stripedRows 
                    paginator rows={5}
                    emptyMessage="No hay archivos activos para esta deficiencia."
                >
                    <Column field="archInterno" header="ID" sortable style={{width:'80px'}} />
                    <Column field="archTipo" header="Tipo" body={tipoTemplate} />
                    <Column field="archNombre" header="Ruta / Nombre" style={{maxWidth:'300px'}} className="truncate" />
                    <Column field="archFecha" header="Fecha" body={(r) => new Date(r.archFecha).toLocaleDateString()} />
                    <Column header="Acciones" body={actionTemplate} style={{width:'80px'}} />
                </DataTable>
            </div>
        </Dialog>
    );
};

// --- COMPONENTE PRINCIPAL (TABLA DE RESULTADOS DE BÚSQUEDA) ---
export default function HistoricalTable({ data }) {
    const [selectedDef, setSelectedDef] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const openModal = (row) => {
        setSelectedDef(row);
        setShowModal(true);
    };

    return (
        <div className="card border-l-4 border-blue-500 shadow-md bg-white rounded-lg mt-4">
            <div className="p-3 bg-blue-50 flex justify-between items-center border-b border-blue-100">
                <div className="flex items-center gap-2">
                    <i className="pi pi-database text-blue-600"></i>
                    <h3 className="font-bold text-blue-800 m-0 text-sm">Historial Registrado en BD</h3>
                </div>
                <Tag value={`${data.length} Deficiencias`} severity="info" />
            </div>

            <DataTable value={data} size="small" stripedRows rows={5} paginator className="text-sm">
                <Column field="defiInterno" header="ID Def." sortable style={{width:'80px'}} />
                <Column field="defiCodigoElemento" header="Cód. GIS" />
                <Column field="defiFecRegistro" header="Fecha Reg." body={(r)=> new Date(r.defiFecRegistro).toLocaleDateString()} />
                <Column field="defiObservacion" header="Observación" className="truncate" style={{maxWidth:'200px'}} />
                
                {/* Botón para abrir el modal de gestión de archivos */}
                <Column header="Archivos" body={(r) => (
                    <Button 
                        icon="pi pi-folder-open" 
                        label="Ver / Borrar" 
                        size="small" 
                        outlined 
                        onClick={() => openModal(r)} 
                        tooltip="Ver evidencias registradas"
                    />
                )} style={{textAlign:'center', width:'130px'}} />
            </DataTable>

            {/* Renderizado condicional del modal */}
            {selectedDef && (
                <EvidenceModal 
                    visible={showModal} 
                    onHide={() => setShowModal(false)} 
                    deficiency={selectedDef} 
                />
            )}
        </div>
    );
}