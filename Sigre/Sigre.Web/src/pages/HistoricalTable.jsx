import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { ConfirmPopup, confirmPopup } from 'primereact/confirmpopup';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';

import { useFiles } from '../hooks/useFiles';

// --- SUB-COMPONENTE: MODAL DE EVIDENCIAS ---
const EvidenceModal = ({ visible, onHide, deficiency }) => {
    const { files, loadingFiles, loadFiles, deleteFile, addFile } = useFiles();
    const toast = useRef(null);

    // Estado para el formulario de "Nuevo Archivo"
    const [showAddForm, setShowAddForm] = useState(false);
    const [newFile, setNewFile] = useState({
        tipo: 1, // 1: Panorámica por defecto
        nombre: ''
    });

    // Cargar archivos al abrir
    useEffect(() => {
        if (visible && deficiency) {
            loadFiles(deficiency.defiInterno);
        }
    }, [visible, deficiency, loadFiles]);

    // Filtro activo
    const activeFiles = files.filter(f => f.archActivo === true);

    // --- ACCIONES ---

    const handleDelete = (event, id) => {
        confirmPopup({
            target: event.currentTarget,
            message: '¿Seguro de eliminar este archivo?',
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                const success = await deleteFile(id);
                if (success) toast.current.show({ severity: 'success', summary: 'Eliminado', detail: 'Archivo desactivado.' });
                else toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar.' });
            }
        });
    };

    const handleSaveNew = async () => {
        if (!newFile.nombre) {
            toast.current.show({ severity: 'warn', summary: 'Falta nombre', detail: 'Ingrese un nombre de archivo.' });
            return;
        }

        // Construcción del JSON EXACTO según tu Swagger
        const payload = {
            archInterno: 0, // Nuevo
            archTipo: newFile.tipo.toString(),
            archTabla: "Deficiencias",
            archCodTabla: deficiency.defiInterno,
            archNombre: `SigreMedios/Manual/${deficiency.defiCodigoElemento}/${newFile.nombre}`, // Generamos ruta simulada
            archLatitud: deficiency.defiLatitud || 0,
            archLongitud: deficiency.defiLongitud || 0,
            archFecha: new Date().toISOString(),
            archTipoElemento: deficiency.defiTipoElemento || "POST",
            archIdElemento: deficiency.defiIdElemento || 0, // Asumiendo que tienes este dato en 'deficiency'
            tipiInterno: deficiency.tipiInterno || 0,
            archActivo: true,
            estadoOffLine: 0
        };

        const success = await addFile(payload);
        if (success) {
            toast.current.show({ severity: 'success', summary: 'Guardado', detail: 'Registro creado correctamente.' });
            setShowAddForm(false);
            setNewFile({ tipo: 1, nombre: '' });
            loadFiles(deficiency.defiInterno); // Recargar lista
        } else {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Fallo al guardar en BD.' });
        }
    };

    // Opciones para el dropdown de tipo
    const tiposFoto = [
        { label: 'Panorámica', value: 1 },
        { label: 'Frontal', value: 2 },
        { label: 'Izquierda', value: 3 },
        { label: 'Derecha', value: 4 }
    ];

    // Templates de Tabla
    const tipoTemplate = (r) => {
        const map = { "1": "Panorámica", "2": "Frontal", "3": "Izquierda", "4": "Derecha" };
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
                tooltip="Eliminar"
            />
        </div>
    );

    return (
        <Dialog 
            header={`Gestión de Archivos | GIS: ${deficiency?.defiCodigoElemento}`} 
            visible={visible} 
            style={{ width: '90vw', maxWidth: '900px' }} 
            onHide={onHide}
        >
            <Toast ref={toast} />
            <ConfirmPopup />

            <div className="flex flex-col gap-4">
                
                {/* BARRA SUPERIOR: Botón Agregar */}
                <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-bold text-gray-700">{activeFiles.length} Archivos Activos</span>
                    <Button 
                        label={showAddForm ? "Cancelar" : "Subir Nuevo"} 
                        icon={showAddForm ? "pi pi-times" : "pi pi-plus"} 
                        size="small" 
                        severity={showAddForm ? "secondary" : "success"}
                        onClick={() => setShowAddForm(!showAddForm)}
                    />
                </div>

                {/* FORMULARIO DE AGREGAR (Visible condicionalmente) */}
                {showAddForm && (
                    <div className="bg-green-50 p-4 rounded border border-green-200 animate-fade-in grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-600">Tipo de Foto</label>
                            <Dropdown 
                                value={newFile.tipo} 
                                options={tiposFoto} 
                                onChange={(e) => setNewFile({...newFile, tipo: e.value})} 
                                className="p-inputtext-sm w-full"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-600">Nombre de Archivo</label>
                            <InputText 
                                value={newFile.nombre} 
                                onChange={(e) => setNewFile({...newFile, nombre: e.target.value})} 
                                placeholder="ej. foto_extra.jpg" 
                                className="p-inputtext-sm w-full"
                            />
                        </div>
                        <Button label="Guardar Registro" icon="pi pi-save" size="small" onClick={handleSaveNew} />
                    </div>
                )}

                {/* TABLA DE DATOS */}
                <DataTable 
                    value={activeFiles} 
                    loading={loadingFiles} 
                    size="small" 
                    stripedRows 
                    paginator rows={5}
                    emptyMessage="No hay archivos activos."
                >
                    <Column field="archInterno" header="ID" sortable style={{width:'80px'}} />
                    <Column field="archTipo" header="Tipo" body={tipoTemplate} />
                    <Column field="archNombre" header="Ruta / Nombre" style={{maxWidth:'200px'}} className="truncate" />
                    <Column field="archFecha" header="Fecha" body={(r) => new Date(r.archFecha).toLocaleDateString()} />
                    <Column header="Acciones" body={actionTemplate} style={{width:'80px'}} />
                </DataTable>
            </div>
        </Dialog>
    );
};

// --- COMPONENTE PRINCIPAL (HISTORIAL) ---
export default function HistoricalTable({ data }) {
    const [selectedDef, setSelectedDef] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const openModal = (row) => {
        setSelectedDef(row);
        setShowModal(true);
    };

    return (
        <div className="card border-l-4 border-blue-500 shadow-md bg-white rounded-lg">
            <div className="p-3 bg-blue-50 flex justify-between items-center border-b border-blue-100">
                <div className="flex items-center gap-2">
                    <i className="pi pi-database text-blue-600"></i>
                    <h3 className="font-bold text-blue-800 m-0 text-sm">Historial Registrado (BD)</h3>
                </div>
                <Tag value={`${data.length} Deficiencias`} severity="info" />
            </div>

            <DataTable value={data} size="small" stripedRows rows={5} paginator className="text-sm">
                <Column field="defiInterno" header="ID" sortable style={{width:'70px'}} />
                <Column field="defiCodigoElemento" header="GIS" />
                <Column field="defiFecRegistro" header="Fecha" body={(r)=> new Date(r.defiFecRegistro).toLocaleDateString()} />
                <Column field="defiObservacion" header="Observación" className="truncate" style={{maxWidth:'150px'}} />
                <Column header="Archivos" body={(r) => (
                    <Button 
                        icon="pi pi-folder-open" 
                        label="Gestionar" 
                        size="small" 
                        outlined 
                        onClick={() => openModal(r)} 
                    />
                )} style={{textAlign:'center', width:'120px'}} />
            </DataTable>

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