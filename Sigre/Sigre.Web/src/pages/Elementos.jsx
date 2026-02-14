import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Splitter, SplitterPanel } from 'primereact/splitter'; // <--- IMPORTANTE
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

import { useElements } from '../hooks/useElement'; 
import StaticFormCard from '../components/Modals/StaticFormCard';

export default function Elementos() {
    const toast = useRef(null);

    // --- ESTADOS DE PAGINACIÓN ---
    const [lazyParamsPostes, setLazyParamsPostes] = useState({ first: 0, rows: 50, page: 0 });
    const [lazyParamsVanos, setLazyParamsVanos] = useState({ first: 0, rows: 50, page: 0 });

    // --- DATOS ---
    const [postes, setPostes] = useState([]);
    const [totalPostes, setTotalPostes] = useState(0);
    const [vanos, setVanos] = useState([]);
    const [totalVanos, setTotalVanos] = useState(0);
    const [globalFilter, setGlobalFilter] = useState("");
    const [searchTerm, setSearchTerm] = useState(""); 

    // --- ESTADOS DE SELECCIÓN ---
    const [selectedPoste, setSelectedPoste] = useState(null);
    const [selectedVano, setSelectedVano] = useState(null);

    const { loading, fetchPostesChunk, fetchVanosChunk, saveElement, deleteElement } = useElements();

    // --- CARGA ---
    useEffect(() => { loadPostes(); }, [lazyParamsPostes, searchTerm]);
    useEffect(() => { loadVanos(); }, [lazyParamsVanos, searchTerm]);

    const loadPostes = async () => {
        const data = await fetchPostesChunk(lazyParamsPostes.first, lazyParamsPostes.rows, searchTerm);
        setPostes(data.data || []);
        setTotalPostes(data.totalRecords || 0);
    };

    const loadVanos = async () => {
        const data = await fetchVanosChunk(lazyParamsVanos.first, lazyParamsVanos.rows, searchTerm);
        setVanos(data.data || []);
        setTotalVanos(data.totalRecords || 0);
    };

    // --- BÚSQUEDA ---
    const triggerSearch = () => {
        setLazyParamsPostes(prev => ({ ...prev, first: 0 }));
        setLazyParamsVanos(prev => ({ ...prev, first: 0 }));
        setSearchTerm(globalFilter);
    };

    // --- CRUD ---
    const handleSave = async (formData) => {
        const res = await saveElement(formData);
        if (res.success) {
            toast.current.show({ severity: 'success', summary: 'Guardado', detail: 'Registro actualizado' });
            if (formData.tipoElemento === 'POSTE') {
                loadPostes();
                setSelectedPoste(null); 
            } else {
                loadVanos();
                setSelectedVano(null); 
            }
        } else {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar' });
        }
    };

    const editPoste = (rowData) => {
        const normalized = { ...rowData, id: rowData.PostInterno, codigo: rowData.PostCodigoNodo, etiqueta: rowData.PostEtiqueta };
        setSelectedPoste(normalized);
    };

    const editVano = (rowData) => {
        const normalized = { ...rowData, id: rowData.VanoInterno, codigo: rowData.VanoCodigo };
        setSelectedVano(normalized);
    };

    const confirmDelete = (rowData, type) => {
        const id = type === 'POSTE' ? rowData.PostInterno : rowData.VanoInterno;
        confirmDialog({
           message: '¿Eliminar registro?',
           acceptClassName: 'p-button-danger',
           accept: async () => {
               await deleteElement(id, type);
               toast.current.show({ severity: 'success', summary: 'Eliminado', detail: 'Registro eliminado' });
               if(type === 'POSTE') loadPostes(); else loadVanos();
           }
       });
    };

    return (
        <div className="flex flex-col h-screen bg-slate-200 p-2 overflow-hidden">
            <Toast ref={toast} />
            <ConfirmDialog />

            {/* --- 1. CABECERA LIMPIA (Solo Buscador) --- */}
            <div className="bg-white p-2 rounded shadow-sm border mb-2 flex justify-between items-center flex-none">
                <div className="flex items-center gap-2 w-full">
                    <span className="p-input-icon-left w-full max-w-lg">
                        <i className="pi pi-search cursor-pointer text-blue-600 z-10" onClick={triggerSearch} />
                        <InputText 
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && triggerSearch()}
                            placeholder="Buscar Código GIS..." 
                            className="p-inputtext-sm w-full pl-10" 
                        />
                        {searchTerm && <i className="pi pi-times cursor-pointer absolute right-3 top-3 text-red-400" onClick={() => {setGlobalFilter(""); setSearchTerm("")}}/>}
                    </span>
                    <Button label="Buscar" size="small" onClick={triggerSearch} />
                </div>
            </div>

            {/* --- 2. CONTENEDOR SPLITTER (DIVISION 50/50 PERFECTA) --- */}
            <div className="flex-grow overflow-hidden bg-white rounded shadow border">
                <Splitter style={{ height: '100%' }}>
                    
                    {/* === PANEL IZQUIERDO: POSTES === */}
                    <SplitterPanel size={50} minSize={30} className="flex flex-col p-2 overflow-hidden">
                        {/* Formulario Fijo */}
                        <div className="flex-none">
                            <StaticFormCard 
                                elementToEdit={selectedPoste} 
                                typeMode="POSTE" 
                                onClear={() => setSelectedPoste(null)} 
                                onSave={handleSave} 
                            />
                        </div>
                        {/* Tabla */}
                        <div className="flex-grow flex flex-col border rounded overflow-hidden">
                            <div className="flex-none px-2 py-1 bg-blue-50 border-b flex justify-between items-center text-xs">
                                <span className="font-bold text-blue-800">LISTADO DE POSTES</span>
                                <span className="font-bold text-gray-500">Total: {totalPostes.toLocaleString()}</span>
                            </div>
                            <div className="flex-grow overflow-hidden">
                                <DataTable 
                                    value={postes} lazy paginator first={lazyParamsPostes.first} rows={lazyParamsPostes.rows} totalRecords={totalPostes} onPage={(e) => setLazyParamsPostes(e)}
                                    loading={loading} rowsPerPageOptions={[20, 50]} size="small" stripedRows scrollable scrollHeight="flex" className="h-full text-xs"
                                >
                                    <Column field="postCodigoNodo" header="Código" sortable style={{fontWeight:'bold', color:'#0ea5e9'}} />
                                    <Column field="postEtiqueta" header="Etiqueta" />
                                    <Column field="postLatitud" header="Latitud" />
                                    <Column field="postLongitud" header="Longitud" />
                                    <Column header="Acción" body={(r) => (
                                        <div className="flex gap-1 justify-end">
                                            <Button icon="pi pi-pencil" text size="small" onClick={() => editPoste(r)} />
                                        </div>
                                    )} style={{width:'80px'}} />
                                </DataTable>
                            </div>
                        </div>
                    </SplitterPanel>

                    {/* === PANEL DERECHO: VANOS === */}
                    <SplitterPanel size={50} minSize={30} className="flex flex-col p-2 overflow-hidden border-l">
                        {/* Formulario Fijo */}
                        <div className="flex-none">
                            <StaticFormCard 
                                elementToEdit={selectedVano} 
                                typeMode="VANO" 
                                onClear={() => setSelectedVano(null)} 
                                onSave={handleSave} 
                            />
                        </div>
                        {/* Tabla */}
                        <div className="flex-grow flex flex-col border rounded overflow-hidden">
                            <div className="flex-none px-2 py-1 bg-orange-50 border-b flex justify-between items-center text-xs">
                                <span className="font-bold text-orange-800">LISTADO DE VANOS</span>
                                <span className="font-bold text-gray-500">Total: {totalVanos.toLocaleString()}</span>
                            </div>
                            <div className="flex-grow overflow-hidden">
                                <DataTable 
                                    value={vanos} lazy paginator first={lazyParamsVanos.first} rows={lazyParamsVanos.rows} totalRecords={totalVanos} onPage={(e) => setLazyParamsVanos(e)}
                                    loading={loading} rowsPerPageOptions={[20, 50]} size="small" stripedRows scrollable scrollHeight="flex" className="h-full text-xs"
                                >
                                    <Column field="vanoCodigo" header="Código" sortable style={{fontWeight:'bold', color:'#ea580c'}} />
                                    <Column field="vanoNodoInicial" header="Inicio" />
                                    <Column field="vanoNodoFinal" header="Fin" />
                                    <Column header="Acción" body={(r) => (
                                        <div className="flex gap-1 justify-end">
                                            <Button icon="pi pi-pencil" text size="small" onClick={() => editVano(r)} />
                                            <Button icon="pi pi-trash" text size="small" severity="danger" onClick={() => confirmDelete(r, 'VANO')} />
                                        </div>
                                    )} style={{width:'80px'}} />
                                </DataTable>
                            </div>
                        </div>
                    </SplitterPanel>

                </Splitter>
            </div>
        </div>
    );
}