import React, { useState, useEffect, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Skeleton } from 'primereact/skeleton';

// Tus hooks
import { useDeficienciesBySed } from '../hooks/useDeficiency'; 
import { useElements } from '../hooks/useElement'; 
import { useFeeder, useSedsByFeeder } from '../hooks/useFeeder';
import { useTypification } from '../hooks/useTypification';
import { useUsuario } from '../hooks/useUsuario';

// Tus Modales/Formularios
import StaticFormCard from '../components/Modals/StaticFormCard';
import DeficiencyForm from '../components/Modals/DeficiencyForm';
const customStyles = `
  /* Botón Rosa (Elementos) */
  .btn-rosa { background-color: #fce7f3 !important; color: #be185d !important; border-color: #f9a8d4 !important; transition: transform 0.2s; }
  .btn-rosa:hover:not(:disabled) { background-color: #fbcfe8 !important; transform: scale(1.1); }
  
  /* Botón Amarillo (Deficiencias) */
  .btn-amarillo { background-color: #fef3c7 !important; color: #b45309 !important; border-color: #fde047 !important; transition: transform 0.2s; }
  .btn-amarillo:hover:not(:disabled) { background-color: #fde68a !important; transform: scale(1.1); }

  /* Ajuste para que el texto del Dropdown no se aplaste */
  .filtro-dropdown .p-dropdown-label { display: flex; align-items: center; }
`;
export default function ReporteMaestro() {
    // --- ESTADOS DE BÚSQUEDA JERÁRQUICA ---
    const [selectedFeeder, setSelectedFeeder] = useState(null);
    const [selectedSed, setSelectedSed] = useState(null);

    // --- HOOKS DE DATOS ---
    const { feeders } = useFeeder();
    const { seds } = useSedsByFeeder(selectedFeeder); 
    
    const { deficiencies, loading: loadingDef, fetchBySed } = useDeficienciesBySed();
    
    // 🔥 AQUÍ TRAEMOS LAS FUNCIONES DE BÚSQUEDA DE ELEMENTOS
    const { saveElement, loading: loadingElement, fetchPostesChunk, fetchVanosChunk } = useElements();
    
    const { getCodeById, loading: loadingTypos } = useTypification();
    const { getInspectorName, loading: loadingUsers } = useUsuario(true);

    // --- ESTADOS DE MODALES Y UI ---
    const [elementModalOpen, setElementModalOpen] = useState(false);
    const [deficiencyModalOpen, setDeficiencyModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [fetchingRowId, setFetchingRowId] = useState(null); 
    
    // =========================================================================
    // 🔥 MAPEO DE DATOS (Para la Grilla)
    // =========================================================================
    const mappedDeficiencies = useMemo(() => {
        return deficiencies.map(item => {
            const critMap = { 1: 'LEVE', 2: 'MEDIO', 3: 'CRÍTICO' };
            return {
                ...item,
                tipificacionLabel: getCodeById(item.tipiInterno) || '',
                inspectorLabel: getInspectorName(item.defiUsuarioInic) || '',
                criticidadLabel: critMap[item.defiEstadoCriticidad] || 'N/A'
            };
        });
    }, [deficiencies, getCodeById, getInspectorName]);

    // --- DISPARADOR DE BÚSQUEDA ---
    const handleSearch = (e) => {
        e?.preventDefault();
        const sedIdToFetch = selectedSed?.value || selectedSed?.sedInterno || selectedSed; 
        if (sedIdToFetch) {
            fetchBySed(Number(sedIdToFetch));
        }
    };


    // =========================================================================
    // 🔥 CONSTRUCTOR: Buscar el Elemento REAL en BD antes de editar
    // =========================================================================
    const openElementEdit = async (rowData) => {
        const isPoste = rowData.defiTipoElemento === 'POST' || rowData.defiTipoElemento === 'POSTE';
        const codigoGis = rowData.defiCodigoElemento;
        const currentSedId = selectedSed?.sedInterno || selectedSed?.value || selectedSed?.id;

        setFetchingRowId(rowData.defiInterno);

        try {
            let realElement = null;

            if (isPoste) {
                const res = await fetchPostesChunk(0, 1, codigoGis);
                if (res?.data?.length > 0) realElement = res.data[0];
            } else {
                const res = await fetchVanosChunk(0, 1, codigoGis);
                if (res?.data?.length > 0) realElement = res.data[0];
            }

            let mappedElement = {};

            if (realElement) {
                mappedElement = {
                    ...realElement, 
                    id: isPoste ? realElement.postInterno : realElement.vanoInterno,
                    tipoElemento: isPoste ? 'POSTE' : 'VANO',
                    codigo: codigoGis,
                    
                    alimInterno: realElement.alimInterno || selectedFeeder,
                    postSubestacion: isPoste ? (realElement.postSubestacion || currentSedId) : null,
                    vanoSubestacion: !isPoste ? (realElement.vanoSubestacion || currentSedId) : null,
                };
            } else {
                mappedElement = {
                    ...rowData,
                    id: rowData.defiIdElemento || rowData.idInterno,
                    tipoElemento: isPoste ? 'POSTE' : 'VANO',
                    codigo: codigoGis,
                    alimInterno: rowData.alimInterno || selectedFeeder,
                    postInterno: isPoste ? rowData.defiIdElemento : null,
                    postSubestacion: currentSedId,
                    vanoInterno: !isPoste ? rowData.defiIdElemento : null,
                    vanoSubestacion: currentSedId,
                };
            }

            setSelectedRow(mappedElement);
            setElementModalOpen(true);

        } catch (error) {
            console.error("Error al traer elemento de la BD:", error);
        } finally {
            setFetchingRowId(null);
        }
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
            handleSearch(); 
        }
    };

    const handleSaveDeficiency = async (payloadToSend) => {
        setDeficiencyModalOpen(false);
        handleSearch(); 
    };

    // --- TEMPLATES DE ACCIONES Y FORMATOS ---
    // --- TEMPLATES DE ACCIONES Y FORMATOS ---
    // --- TEMPLATES DE ACCIONES Y FORMATOS ---
    const actionTemplate = (rowData) => {
        const isFetchingThis = fetchingRowId === rowData.defiInterno;
        
        return (
            <div className="flex gap-2 justify-center">
                {/* BOTÓN ROSA: ELEMENTO (Rayo) */}
                <Button 
                    icon={isFetchingThis ? "pi pi-spin pi-spinner" : "pi pi-bolt"} 
                    // Usamos ! para forzar el color de fondo, texto y borde de Tailwind
                    className="p-button-rounded p-button-sm !bg-pink-100 !text-pink-700 !border-pink-300 hover:!bg-pink-200 hover:scale-110 transition-all shadow-sm" 
                    tooltip="Editar Elemento"
                    onClick={() => openElementEdit(rowData)} 
                    disabled={fetchingRowId !== null} 
                />
                
                {/* BOTÓN AMARILLO: DEFICIENCIA (Clipboard) */}
                <Button 
                    icon="pi pi-clipboard" 
                    // Usamos ! para forzar los colores amarillos
                    className="p-button-rounded p-button-sm !bg-yellow-100 !text-yellow-700 !border-yellow-400 hover:!bg-yellow-200 hover:scale-110 transition-all shadow-sm" 
                    tooltip="Editar Deficiencia"
                    onClick={() => openDeficiencyEdit(rowData)} 
                    disabled={fetchingRowId !== null}
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
    
    const getCriticidadConfig = (val) => {
        const num = parseInt(val);
        switch (num) {
            case 3: return { label: 'CRÍTICO', severity: 'danger' };
            case 2: return { label: 'MEDIO', severity: 'warning' };
            case 1: return { label: 'LEVE', severity: 'info' };
            case 0: return { label: 'SIN DEFICIENCIA', severity: 'success' };
            default: return { label: 'N/A', severity: 'secondary' };
        }
    };

    const criticidadTemplate = (rowData) => { 
        if (rowData.defiEstadoCriticidad === null || rowData.defiEstadoCriticidad === undefined) return "-";
        const conf = getCriticidadConfig(rowData.defiEstadoCriticidad);
        return <Tag value={conf.label} severity={conf.severity} style={{ fontSize: '10px' }} />; 
    };

    const typificationTemplate = (rowData) => { if (loadingTypos) return <Skeleton width="40px" />; return <Tag value={rowData.tipificacionLabel || "S/D"} severity={rowData.tipificacionLabel ? "info" : "warning"} style={{ fontSize: '11px', fontWeight: 'bold' }} />; };
    const inspectorTemplate = (rowData) => { if (loadingUsers) return <Skeleton width="80px" />; return <span className="text-gray-700 text-xs font-medium uppercase truncate">{rowData.inspectorLabel}</span>; };

    // =========================================================================
    // 🔥 ESTILOS PARA CELDAS (Rosado y Amarillo)
    // =========================================================================
    const styleElemento = { backgroundColor: '#fce7f3' }; // bg-pink-100
    const styleDeficiencia = { backgroundColor: '#fef3c7' }; // bg-yellow-100

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
                                setSelectedSed(null); 
                            }} 
                            options={feeders} optionLabel="label" optionValue="value" 
                            placeholder="Seleccione..." filter 
                            className="w-full h-10 flex items-center p-inputtext-sm shadow-sm"
                        />
                    </div>

                    {/* 2. CÓDIGO SED */}
                    <div className="flex flex-col gap-1 w-full md:w-1/3">
                        <label className="text-xs font-bold text-gray-600">CÓDIGO SED</label>
                        <Dropdown 
                            value={selectedSed} options={seds} 
                            onChange={(e) => setSelectedSed(e.value)} 
                            optionLabel="label" filter 
                            placeholder={selectedFeeder ? "Escribe o selecciona código..." : "Seleccione Alimentador primero..."}
                            className="w-full h-10 flex items-center p-inputtext-sm shadow-sm"
                            disabled={!selectedFeeder} emptyMessage="No hay SEDs para este alimentador"
                        />
                    </div>

                    {/* 3. BOTÓN DE BÚSQUEDA */}
                    <div className="w-full md:w-auto">
                        <Button 
                            label={loadingDef ? "Cargando..." : "Generar Reporte"} 
                            icon={loadingDef ? "pi pi-spin pi-spinner" : "pi pi-table"} 
                            onClick={handleSearch} disabled={loadingDef || !selectedSed}
                            className="w-full md:w-auto h-10 px-5 font-bold" severity="primary"
                        />
                    </div>
                </div>
            </div>

            {/* TABLA DE DATOS */}
            <div className="card border rounded-lg overflow-hidden">
                <DataTable 
                    value={mappedDeficiencies} 
                    loading={loadingDef} 
                    scrollable 
                    scrollHeight="600px" 
                    size="small" 
                    stripedRows={false} // Desactivamos stripedRows para que se noten los colores de las columnas
                    emptyMessage="Seleccione un Alimentador y una SED para ver los registros." 
                    className="text-sm p-datatable-gridlines" // Añadimos gridlines para mejor separación
                    
                    // 🔥 AGREGAMOS PAGINACIÓN DE 30 EN 30
                    paginator 
                    rows={30} 
                    rowsPerPageOptions={[15, 30, 50, 100]}
                >
                    <Column body={actionTemplate} header="Acciones" frozen alignFrozen="left" className="bg-gray-50 border-r-2" />
                    
                    {/* --- ZONA ROSADA (DATOS DEL ELEMENTO) --- */}
                    <Column field="defiCodigoElemento" header="Código" sortable style={{ ...styleElemento, fontWeight: 'bold', color: '#1d4ed8' }} />
                    <Column field="etiqueta" header="Etiqueta" style={styleElemento} />
                    <Column field="defiTipoElemento" header="Tipo" style={styleElemento} />
                    <Column field="vanoNodoInicial" header="Nodo Inicial" style={styleElemento} />
                    <Column field="vanoNodoFinal" header="Nodo Final" style={styleElemento} />
                    <Column field="defiLatitud" header="Latitud" style={styleElemento} />
                    <Column field="defiLongitud" header="Longitud" style={styleElemento} />

                    {/* --- ZONA AMARILLA (DATOS DE LA DEFICIENCIA) --- */}
                    <Column field="defiEstadoCriticidad" header="Criticidad" body={criticidadTemplate} style={styleDeficiencia} />
                    <Column header="Tipificación" body={typificationTemplate} style={styleDeficiencia} />
                    <Column field="defiCol2" header="Responsable" style={styleDeficiencia} />
                    <Column field="defiNumSuministro" header="Suministro" style={styleDeficiencia} />
                    <Column field="defiDistHorizontal" header="Dist. Horiz." style={styleDeficiencia} />
                    <Column field="defiDistVertical" header="Dist. Vert." style={styleDeficiencia} />
                    <Column field="defiFecRegistro" header="Fecha Registro" body={(r) => formatDate(r.defiFecRegistro)} style={styleDeficiencia} />
                    <Column field="defiObservacion" header="Observación" style={{ ...styleDeficiencia, maxWidth: '150px' }} className="truncate" />
                    <Column field="defiComentario" header="Comentario" style={{ ...styleDeficiencia, maxWidth: '150px' }} className="truncate" />
                    <Column header="Inspector" body={inspectorTemplate} style={styleDeficiencia} />
                </DataTable>
            </div>

            {/* MODALES DE EDICIÓN */}
            <Dialog 
                visible={elementModalOpen} 
                onHide={() => setElementModalOpen(false)}
                header="Editar Elemento Maestro"
                style={{ width: '800px' }}
                modal className="p-fluid"
            >
                {selectedRow && (
                    <StaticFormCard 
                        elementToEdit={selectedRow} 
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
                    sedId={selectedRow.sedCodigo || selectedRow.vanoSubestacion || selectedRow.postSubestacion || selectedSed}
                    existingDeficiencies={deficiencies} 
                    onSave={handleSaveDeficiency}
                />
            )}
        </div>
    );
}