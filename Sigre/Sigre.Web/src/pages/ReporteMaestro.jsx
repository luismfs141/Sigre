import React, { useState, useMemo } from 'react';
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

// =========================================================================
// 🔥 CSS INFALIBLE PARA LOS BOTONES Y CELDAS
// =========================================================================
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
    // --- ESTADOS ---
    const [selectedFeeder, setSelectedFeeder] = useState(null);
    const [selectedSed, setSelectedSed] = useState(null);
    const [elementosSed, setElementosSed] = useState([]); 
    const [isSearchingData, setIsSearchingData] = useState(false);

    const [elementModalOpen, setElementModalOpen] = useState(false);
    const [deficiencyModalOpen, setDeficiencyModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [fetchingRowId, setFetchingRowId] = useState(null); 

    // --- HOOKS ---
    const { feeders } = useFeeder();
    const { seds } = useSedsByFeeder(selectedFeeder); 
    const { deficiencies, fetchBySed } = useDeficienciesBySed();
    const { saveElement, loading: loadingElement, fetchPostesChunk, fetchVanosChunk } = useElements();
    const { getCodeById, loading: loadingTypos } = useTypification();
    const { getInspectorName, loading: loadingUsers } = useUsuario(true);
    
    // --- MAPEO DE DATOS ---
    const mappedDeficiencies = useMemo(() => {
        return deficiencies.map(item => {
            const critMap = { 1: 'LEVE', 2: 'MEDIO', 3: 'CRÍTICO' };
            const elementoReal = elementosSed.find(e => 
                e.postCodigoNodo === item.defiCodigoElemento || 
                e.vanoCodigo === item.defiCodigoElemento
            );

            return {
                ...item,
                etiquetaTabla: elementoReal?.postEtiqueta || elementoReal?.vanoEtiqueta || "-",
                nodoInicialTabla: elementoReal?.vanoNodoInicial || "-",
                nodoFinalTabla: elementoReal?.vanoNodoFinal || "-",
                tipificacionLabel: getCodeById(item.tipiInterno) || '',
                inspectorLabel: getInspectorName(item.defiUsuarioInic) || '',
                criticidadLabel: critMap[item.defiEstadoCriticidad] || 'N/A'
            };
        });
    }, [deficiencies, elementosSed, getCodeById, getInspectorName]);

    // --- BÚSQUEDA ---
    const handleSearch = async (e) => {
        e?.preventDefault();
        const sedIdToFetch = selectedSed?.value || selectedSed?.sedInterno || selectedSed?.id || selectedSed; 
        
        if (sedIdToFetch) {
            setIsSearchingData(true);
            try {
                await fetchBySed(Number(sedIdToFetch));
                const resPostes = await fetchPostesChunk(0, 2000, "", "", null, Number(sedIdToFetch));
                const resVanos = await fetchVanosChunk(0, 2000, "", "", null, Number(sedIdToFetch));

                const todosLosElementos = [...(resPostes?.data || []), ...(resVanos?.data || [])];
                setElementosSed(todosLosElementos);
            } catch (error) {
                console.error("Error cargando datos:", error);
            } finally {
                setIsSearchingData(false);
            }
        }
    };

    // --- CONSTRUCTOR DE EDICIÓN ---
    const openElementEdit = async (rowData) => {
        const isPoste = rowData.defiTipoElemento === 'POST' || rowData.defiTipoElemento === 'POSTE';
        const codigoGis = rowData.defiCodigoElemento;
        const currentSedId = selectedSed?.sedInterno || selectedSed?.value || selectedSed?.id || selectedSed;

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
                    // 🔥 CORRECCIÓN: Aseguramos que tipoElemento sea exacto
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
                    // 🔥 CORRECCIÓN: Aseguramos que tipoElemento sea exacto
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
            console.error(error);
        } finally {
            setFetchingRowId(null);
        }
    };

    const openDeficiencyEdit = (rowData) => {
        setSelectedRow(rowData);
        setDeficiencyModalOpen(true);
    };

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

    // --- TEMPLATES ---
    const actionTemplate = (rowData) => {
        const isFetchingThis = fetchingRowId === rowData.defiInterno;
        return (
            <div className="flex gap-2 justify-center">
                {/* BOTÓN ROSA */}
                <Button 
                    icon={isFetchingThis ? "pi pi-spin pi-spinner" : "pi pi-bolt"} 
                    className="p-button-rounded p-button-sm btn-rosa shadow-sm" 
                    tooltip="Editar Elemento (Rosa)" 
                    onClick={() => openElementEdit(rowData)} 
                    disabled={fetchingRowId !== null} 
                />
                {/* BOTÓN AMARILLO */}
                <Button 
                    icon="pi pi-clipboard" 
                    className="p-button-rounded p-button-sm btn-amarillo shadow-sm" 
                    tooltip="Editar Deficiencia (Amarillo)" 
                    onClick={() => openDeficiencyEdit(rowData)} 
                    disabled={fetchingRowId !== null} 
                />
            </div>
        );
    };

    const formatDate = (value) => {
        if (!value) return '-';
        return new Date(value).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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

    const styleElemento = { backgroundColor: '#fce7f3' }; // Rosa
    const styleDeficiencia = { backgroundColor: '#fef3c7' }; // Amarillo

    return (
        <div className="p-4 bg-white rounded-lg shadow-md w-full flex flex-col h-screen">
            {/* 🔥 INYECTAMOS LOS ESTILOS AQUÍ */}
            <style>{customStyles}</style>

            <h2 className="text-xl font-bold mb-4 text-gray-800 flex-none">Maestro de Elementos y Deficiencias</h2>

            {/* BARRA DE FILTROS */}
            <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-md flex-none">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex flex-col gap-1 w-full md:w-1/3">
                        <label className="text-xs font-bold text-gray-600">ALIMENTADOR</label>
                        <Dropdown 
                            value={selectedFeeder} onChange={(e) => { setSelectedFeeder(e.value); setSelectedSed(null); setElementosSed([]); }} 
                            options={feeders} optionLabel="label" optionValue="value" placeholder="Seleccione..." filter 
                            className="filtro-dropdown w-full p-inputtext-sm shadow-sm"
                        />
                    </div>

                    <div className="flex flex-col gap-1 w-full md:w-1/3">
                        <label className="text-xs font-bold text-gray-600">CÓDIGO SED</label>
                        <Dropdown 
                            value={selectedSed} options={seds} onChange={(e) => { setSelectedSed(e.value); setElementosSed([]); }} 
                            optionLabel="label" filter placeholder={selectedFeeder ? "Escribe o selecciona código..." : "Seleccione Alimentador primero..."}
                            className="filtro-dropdown w-full p-inputtext-sm shadow-sm" disabled={!selectedFeeder} emptyMessage="No hay SEDs"
                        />
                    </div>

                    <div className="w-full md:w-auto">
                        <Button 
                            label={isSearchingData ? "Cargando Reporte..." : "Generar Reporte"} 
                            icon={isSearchingData ? "pi pi-spin pi-spinner" : "pi pi-table"} 
                            onClick={handleSearch} disabled={isSearchingData || !selectedSed}
                            className="w-full md:w-auto px-5 font-bold shadow-sm" severity="primary"
                        />
                    </div>
                </div>
            </div>

            {/* TABLA DE DATOS */}
            <div className="card border rounded-lg overflow-hidden flex-grow flex flex-col">
                <DataTable 
                    value={mappedDeficiencies} loading={isSearchingData} 
                    scrollable scrollHeight="flex" size="small" stripedRows={false} 
                    emptyMessage="Seleccione un Alimentador y una SED para ver los registros cruzados." 
                    className="text-sm h-full p-datatable-gridlines"
                    paginator rows={30} rowsPerPageOptions={[15, 30, 50, 100]}
                >
                    <Column body={actionTemplate} header="Acciones" frozen alignFrozen="left" className="bg-white border-r-2" />
                    
                    {/* ZONA ROSADA */}
                    <Column field="defiCodigoElemento" header="Código" sortable style={{ ...styleElemento, fontWeight: 'bold', color: '#1d4ed8' }} />
                    <Column field="etiquetaTabla" header="Etiqueta" style={styleElemento} />
                    <Column field="defiTipoElemento" header="Tipo" style={styleElemento} />
                    <Column field="nodoInicialTabla" header="Nodo Inicial" style={styleElemento} />
                    <Column field="nodoFinalTabla" header="Nodo Final" style={styleElemento} />
                    <Column field="defiLatitud" header="Latitud" style={styleElemento} />
                    <Column field="defiLongitud" header="Longitud" style={styleElemento} />

                    {/* ZONA AMARILLA */}
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

            {/* MODALES */}
            <Dialog visible={elementModalOpen} onHide={() => setElementModalOpen(false)} header="Editar Elemento Maestro" style={{ width: '800px' }} modal className="p-fluid">
                {selectedRow && (
                    <StaticFormCard 
                        elementToEdit={selectedRow} 
                        // 🔥 CORRECCIÓN CRÍTICA: Le pasamos directamente la propiedad que creamos arriba
                        typeMode={selectedRow.tipoElemento} 
                        onClear={() => {}} 
                        onSave={handleSaveElement} 
                        saving={loadingElement} 
                    />
                )}
            </Dialog>

            {selectedRow && (
                <DeficiencyForm 
                    visible={deficiencyModalOpen} onHide={() => setDeficiencyModalOpen(false)} deficiencyToEdit={selectedRow}
                    alimentadorId={selectedRow.alimInterno || selectedFeeder} sedId={selectedRow.sedCodigo || selectedRow.vanoSubestacion || selectedRow.postSubestacion || selectedSed}
                    existingDeficiencies={deficiencies} onSave={handleSaveDeficiency}
                />
            )}
        </div>
    );
}