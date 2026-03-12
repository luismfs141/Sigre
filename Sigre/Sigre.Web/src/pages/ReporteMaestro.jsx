import React, { useState, useEffect,useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { AutoComplete } from 'primereact/autocomplete';
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

export default function ReporteMaestro() {
    // --- ESTADOS DE BÚSQUEDA JERÁRQUICA ---
    const [selectedFeeder, setSelectedFeeder] = useState(null);
    const [selectedSed, setSelectedSed] = useState(null);

    // --- HOOKS DE DATOS ---
    const { feeders } = useFeeder();
    const { seds } = useSedsByFeeder(selectedFeeder); 
    
    const { deficiencies, loading: loadingDef, fetchBySed } = useDeficienciesBySed();
    const { saveElement, loading: loadingElement } = useElements();
    const { getCodeById, loading: loadingTypos } = useTypification();
    // --- ESTADOS DE MODALES ---
    const [elementModalOpen, setElementModalOpen] = useState(false);
    const [deficiencyModalOpen, setDeficiencyModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const { getInspectorName, loading: loadingUsers } = useUsuario(true);
    
    // =========================================================================
    // 🔥 EL SECRETO: MAPEO DE DATOS AL IGUAL QUE EN SUBESTACIONES
    // =========================================================================
    const mappedDeficiencies = useMemo(() => {
        return deficiencies.map(item => {
            const critMap = { 1: 'LEVE', 2: 'MEDIO', 3: 'CRÍTICO' };
            return {
                ...item,
                // Inyectamos las etiquetas que los templates están buscando
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
    // 🔥 CONSTRUCTOR ESTRICTO: Aislamos datos de Poste y Vano
    // =========================================================================
    const openElementEdit = (rowData) => {
        const isPoste = rowData.defiTipoElemento === 'POST' || rowData.defiTipoElemento === 'POSTE';
        
        // 1. EXTRAER ID DE LA SUBESTACIÓN (Venga de donde venga)
        let sedIdLimpio = selectedSed?.sedInterno || selectedSed?.value || selectedSed?.id;
        
        if (!sedIdLimpio) {
            // Si falla el filtro de arriba, lo buscamos dentro del objeto anidado que manda el backend
            if (isPoste && rowData.postSubestacion?.sedInterno) {
                sedIdLimpio = rowData.postSubestacion.sedInterno;
            } else if (!isPoste && rowData.vanoSubestacion?.sedInterno) {
                sedIdLimpio = rowData.vanoSubestacion.sedInterno;
            }
        }

        // 2. EXTRAER TEXTOS BUSCANDO EN TODAS LAS VARIANTES POSIBLES DE TU BACKEND
        const etiquetaReal = rowData.etiqueta || rowData.DefiEtiqueta || rowData.defiEtiqueta || rowData.postEtiqueta || rowData.vanoEtiqueta || "";
        const nodoIniReal = rowData.DefiNodoInicial || rowData.defiNodoInicial || rowData.nodoInicial || rowData.vanoNodoInicial || "";
        const nodoFinReal = rowData.DefiNodoFinal || rowData.defiNodoFinal || rowData.nodoFinal || rowData.vanoNodoFinal || "";

        let mappedElement = {};

        // 3. CONSTRUIMOS EL OBJETO EXACTO SEGÚN EL TIPO
        if (isPoste) {
            mappedElement = {
                // Props genéricas que usa tu StaticFormCard en el useEffect
                id: rowData.defiIdElemento || rowData.postInterno,
                tipoElemento: 'POSTE',
                codigo: rowData.defiCodigoElemento || rowData.postCodigoNodo,
                etiqueta: etiquetaReal,
                alimentadorId: selectedFeeder || rowData.alimInterno,
                sedId: Number(sedIdLimpio),
                latitud: Number(rowData.defiLatitud || rowData.postLatitud || 0),
                longitud: Number(rowData.defiLongitud || rowData.postLongitud || 0),

                // Props específicas legacy
                postInterno: rowData.defiIdElemento || rowData.postInterno,
                postCodigoNodo: rowData.defiCodigoElemento || rowData.postCodigoNodo,
                postEtiqueta: etiquetaReal,
                postSubestacion: Number(sedIdLimpio),
                alimInterno: selectedFeeder || rowData.alimInterno,
                postLatitud: Number(rowData.defiLatitud || rowData.postLatitud || 0),
                postLongitud: Number(rowData.defiLongitud || rowData.postLongitud || 0),
            };
        } else {
            mappedElement = {
                // Props genéricas que usa tu StaticFormCard en el useEffect
                id: rowData.defiIdElemento || rowData.vanoInterno,
                tipoElemento: 'VANO',
                codigo: rowData.defiCodigoElemento || rowData.vanoCodigo,
                etiqueta: etiquetaReal,
                alimentadorId: selectedFeeder || rowData.alimInterno,
                sedId: Number(sedIdLimpio),
                nodoInicial: nodoIniReal,
                nodoFinal: nodoFinReal,

                // Props específicas legacy
                vanoInterno: rowData.defiIdElemento || rowData.vanoInterno,
                vanoCodigo: rowData.defiCodigoElemento || rowData.vanoCodigo,
                vanoEtiqueta: etiquetaReal,
                vanoSubestacion: Number(sedIdLimpio),
                alimInterno: selectedFeeder || rowData.alimInterno,
                vanoNodoInicial: nodoIniReal,
                vanoNodoFinal: nodoFinReal,
            };
        }

        console.log("✅ Objeto limpio enviado al formulario:", mappedElement);

        setSelectedRow(mappedElement);
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
            handleSearch(); 
        }
    };

    const handleSaveDeficiency = async (payloadToSend) => {
        // Lógica de guardado API aquí...
        setDeficiencyModalOpen(false);
        handleSearch(); 
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
  const criticidadTemplate = (rowData) => { const conf = { 'LEVE': 'success', 'MEDIO': 'warning', 'CRÍTICO': 'danger', 'N/A': 'null' }; return <Tag value={rowData.criticidadLabel} severity={conf[rowData.criticidadLabel] || 'null'} style={{ fontSize: '10px' }} />; };
        const typificationTemplate = (rowData) => { if (loadingTypos) return <Skeleton width="40px" />; return <Tag value={rowData.tipificacionLabel || "S/D"} severity={rowData.tipificacionLabel ? "info" : "warning"} style={{ fontSize: '11px', fontWeight: 'bold' }} />; };
            const inspectorTemplate = (rowData) => { if (loadingUsers) return <Skeleton width="80px" />; return <span className="text-gray-700 text-xs font-medium uppercase truncate">{rowData.inspectorLabel}</span>; };

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
                            options={feeders} 
                            optionLabel="label" 
                            optionValue="value" 
                            placeholder="Seleccione..." 
                            filter 
                            className="w-full h-10 flex items-center p-inputtext-sm shadow-sm"
                        />
                    </div>

                    {/* 2. CÓDIGO SED */}
                    <div className="flex flex-col gap-1 w-full md:w-1/3">
                        <label className="text-xs font-bold text-gray-600">CÓDIGO SED</label>
                        <Dropdown 
                            value={selectedSed} 
                            options={seds} 
                            onChange={(e) => setSelectedSed(e.value)} 
                            optionLabel="label" 
                            filter 
                            placeholder={selectedFeeder ? "Escribe o selecciona código..." : "Seleccione Alimentador primero..."}
                            className="w-full h-10 flex items-center p-inputtext-sm shadow-sm"
                            disabled={!selectedFeeder}
                            emptyMessage="No hay SEDs para este alimentador"
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
                {/* 🔥 CAMBIAMOS value={deficiencies} por value={mappedDeficiencies} */}
                <DataTable 
                    value={mappedDeficiencies} 
                    loading={loadingDef} scrollable scrollHeight="600px" size="small" stripedRows emptyMessage="Seleccione un Alimentador y una SED para ver los registros." className="text-sm"
                >
                    <Column body={actionTemplate} header="Acciones" frozen alignFrozen="left" className="bg-gray-50 border-r-2" />
                    
                    <Column field="defiCodigoElemento" header="Código" sortable className="font-bold text-blue-700" />
                    <Column field="etiqueta" header="Etiqueta" />
                    <Column field="defiTipoElemento" header="Tipo" />
                    <Column field="nodoInicial" header="Nodo Inicial" />
                    <Column field="nodoFinal" header="Nodo Final" />

                    <Column field="defiLatitud" header="Latitud" />
                    <Column field="defiLongitud" header="Longitud" />

                    <Column field="defiEstadoCriticidad" header="Criticidad" body={criticidadTemplate} />
                    <Column header="Tipificación" body={typificationTemplate} />
                    <Column field="defiCol2" header="Responsable" />
                    <Column field="defiNumSuministro" header="Suministro" />
                    <Column field="defiDistHorizontal" header="Dist. Horiz." />
                    <Column field="defiDistVertical" header="Dist. Vert." />
                    <Column field="defiFecRegistro" header="Fecha Registro" body={(r) => formatDate(r.defiFecRegistro)} />
                    <Column field="defiObservacion" header="Observación" style={{ maxWidth: '150px' }} className="truncate" />
                    <Column field="defiComentario" header="Comentario" style={{ maxWidth: '150px' }} className="truncate" />
                    {/* 🔥 TEMPLATES APLICADOS AQUÍ */}
                    <Column header="Inspector" body={inspectorTemplate} />
                    
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
                        elementToEdit={selectedRow} // Ahora le pasamos el objeto mapeado perfecto
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