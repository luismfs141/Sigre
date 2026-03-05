import React, { useState, useRef, useMemo } from 'react';
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
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import * as XLSX from 'xlsx';

// --- API ---
import api from '../api/apiConfig';

// --- CUSTOM HOOKS ---
import { useFeeder, useSedsByFeeder } from '../hooks/useFeeder';
import { useDeficienciesBySed } from '../hooks/useDeficiency';
import { useTypification } from '../hooks/useTypification';
import { useUsuario } from '../hooks/useUsuario';

// --- COMPONENTES ---
import EvidenceView from './SEvidenceView';
import DeficiencyForm from '../components/Modals/DeficiencyForm';
import EstadoBadge from '../utils/estadoBadge';
import DuplicateDeficiencyModal from '../components/Modals/DuplicateDeficiencyModal';
// --- ESTILOS CSS PARA LA FILA SELECCIONADA (High Contrast) ---
const highContrastStyle = `
  .p-datatable .p-datatable-tbody > tr.p-highlight {
      background-color: #bfdbfe !important; /* Azul más fuerte */
      color: #1e3a8a !important; /* Texto azul oscuro */
      font-weight: bold;
      border-left: 6px solid #2563eb; /* Borde lateral */
  }
  .p-datatable .p-datatable-tbody > tr.p-highlight .p-tag {
      border: 1px solid #1e3a8a; 
  }
  .p-datatable-wrapper {
      cursor: default;
  }
`;

export default function Subestaciones() {
    // -------------------------------------------------------------------
    // 1. ESTADOS Y REFERENCIAS
    // -------------------------------------------------------------------
    const toast = useRef(null);

    // Estados de Filtros de Datos
    const [selectedFeeder, setSelectedFeeder] = useState(null);
    const [selectedSed, setSelectedSed] = useState(null);
    const [filteredSeds, setFilteredSeds] = useState([]);

    // Estados de Selección y Modal
    const [selectedDeficiency, setSelectedDeficiency] = useState(null);
    const [formVisible, setFormVisible] = useState(false);
    const [deficiencyToEdit, setDeficiencyToEdit] = useState(null);
    const [duplicateVisible, setDuplicateVisible] = useState(false);
    const [duplicateId, setDuplicateId] = useState(null);

    // Estado para exportación WYSIWYG
    const [filteredData, setFilteredData] = useState(null);
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [evidenceCount, setEvidenceCount] = useState(0);
    

    // --- FILTROS INICIALES ---
    const initialFilters = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        defiCodigoElemento: { value: null, matchMode: FilterMatchMode.CONTAINS },
        defiTipoElemento: { value: null, matchMode: FilterMatchMode.CONTAINS },
        defiActivo: { value: true, matchMode: FilterMatchMode.EQUALS },
        tipificacionLabel: { value: null, matchMode: FilterMatchMode.CONTAINS },
        inspectorLabel: { value: null, matchMode: FilterMatchMode.CONTAINS },
        criticidadLabel: { value: null, matchMode: FilterMatchMode.CONTAINS },
        DefiTipoMaterial: { value: null, matchMode: FilterMatchMode.CONTAINS },
        DefiNodoInicial: { value: null, matchMode: FilterMatchMode.CONTAINS },
        DefiNodoFinal: { value: null, matchMode: FilterMatchMode.CONTAINS },
        defiCol2: { value: null, matchMode: FilterMatchMode.EQUALS },
        DefiAmrmadoMaterial: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };

    const [filters, setFilters] = useState(initialFilters);

    // -------------------------------------------------------------------
    // 2. USO DE HOOKS
    // -------------------------------------------------------------------
    const { feeders, loading: loadingFeeders } = useFeeder();
    const feederObject = feeders.find(f => f.value === selectedFeeder);
    const { seds: sedsDelAlimentador, loading: loadingSeds } = useSedsByFeeder(selectedFeeder);
    
    

    const {
        deficiencies,
        loading: loadingDef,
        fetchBySed,
        clearData,
        saveDeficiency,
        softDeleteDeficiency,
        restoreDeficiency,
        getDeficiencyById
    } = useDeficienciesBySed();

    const { getCodeById, loading: loadingTypos } = useTypification();
    const { getInspectorName, loading: loadingUsers } = useUsuario(true);

    // -------------------------------------------------------------------
    // 3. DATA AUGMENTATION (MAPEO)
    // -------------------------------------------------------------------
    const mappedDeficiencies = useMemo(() => {
        return deficiencies.map(item => {
            const critMap = { 1: 'LEVE', 2: 'MEDIO', 3: 'CRÍTICO' };
            return {
                ...item,
                // Agregamos labels calculados para usarlos en filtros y en el formulario
                tipificacionLabel: getCodeById(item.tipiInterno) || '',
                inspectorLabel: getInspectorName(item.defiUsuarioInic) || '',
                criticidadLabel: critMap[item.defiEstadoCriticidad] || 'N/A'
            };
        });
    }, [deficiencies, getCodeById, getInspectorName]);

    // -------------------------------------------------------------------
    // 4. REGLAS DE NEGOCIO (VALIDACIÓN PRE-GUARDADO)
    // -------------------------------------------------------------------
    const validateBusinessRules = (newData, currentList) => {
        const targetGis = newData.defiCodigoElemento;
        // Recuperamos el código como string (puede venir como ID numérico o String)
        const defCode = getCodeById(newData.tipiInterno) || String(newData.tipiInterno || "");

        // Filtrar existentes excluyendo al propio registro si es edición
        const existingOnElement = currentList.filter(d =>
            d.defiCodigoElemento === targetGis &&
            d.defiActivo === true &&
            d.defiInterno !== newData.defiInterno // <--- CLAVE PARA EDICIÓN
        );

        // Regla: Exclusividad S/D (0)
        const isZero = defCode === "0" || defCode === "0000";

        // Buscamos si YA EXISTE un 0 en la lista
        const hasZero = existingOnElement.some(d => {
            const codeStr = getCodeById(d.tipiInterno) || "";
            return codeStr === "0" || codeStr === "0000";
        });

        if (isZero && existingOnElement.length > 0) {
            return { valid: false, msg: `No se puede registrar 'Sin Deficiencia' porque el elemento ya tiene fallas reportadas.` };
        }
        if (!isZero && hasZero) {
            return { valid: false, msg: `El elemento está marcado como 'Sin Deficiencia'. Elimine ese registro primero para agregar fallas.` };
        }

        return { valid: true };
    };

    // -------------------------------------------------------------------
    // 5. ACCIONES & HANDLERS
    // -------------------------------------------------------------------

    // Deseleccionar al hacer clic en el fondo blanco
    const handleTableContainerClick = (e) => {
        const isRowClick = e.target.closest('tbody') || e.target.closest('thead');
        if (!isRowClick) {
            setSelectedDeficiency(null);
        }
    };

    const searchSeds = (event) => {
        const query = event.query.toLowerCase();
        let _filtered = sedsDelAlimentador.filter((sed) => {
            const codigo = String(sed.sedCodigo || "").toLowerCase();
            const etiqueta = String(sed.sedEtiqueta || "").toLowerCase();
            return codigo.includes(query) || etiqueta.includes(query);
        });
        setFilteredSeds(_filtered);
    };

    const handleFeederChange = (e) => {
        setSelectedFeeder(e.value);
        setSelectedSed(null);
        setFilteredSeds([]);
        setFilteredData(null);
        clearData();
        setSelectedDeficiency(null);
    };

    const handleSearch = async () => {
        if (!selectedSed) {
            toast.current.show({ severity: 'warn', summary: 'Atención', detail: 'Seleccione una SED.' });
            return;
        }
        setSelectedDeficiency(null);
        setFilteredData(null);
        const idParaBackend = selectedSed.sedInterno || selectedSed.SedInterno || selectedSed.id;
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

    // --- GUARDADO UNIFICADO ---
    const handleSaveSuccess = async (deficiencyData) => {

        // 1. Validar Reglas de Negocio (Capa Extra de Seguridad)
        const validation = validateBusinessRules(deficiencyData, mappedDeficiencies);
        if (!validation.valid) {
            toast.current.show({ severity: 'error', summary: 'Validación Fallida', detail: validation.msg, sticky: true });
            return;
        }

        // 2. Guardar en Backend
        const result = await saveDeficiency(deficiencyData);

        if (result.success) {
            setFormVisible(false);
            toast.current.show({ severity: 'success', summary: 'Guardado', detail: 'Registro procesado correctamente.' });

            // Recargar datos
            if (selectedSed) {
                const idSed = selectedSed.sedInterno || selectedSed.SedInterno || selectedSed.id;
                await fetchBySed(idSed);
            }
        } else {
            toast.current.show({ severity: 'error', summary: 'Error', detail: result.message });
        }
    };

    const clearAll = () => {
        setSelectedFeeder(null);
        setSelectedSed(null);
        setFilteredSeds([]);
        setGlobalFilterValue('');
        setFilters(initialFilters);
        setFilteredData(null);
        clearData();
        setSelectedDeficiency(null);
        toast.current.show({ severity: 'info', summary: 'Limpieza', detail: 'Filtros restablecidos.', life: 1000 });
    };

    const exportToExcel = () => {
        const sourceData = (filteredData && filteredData.length > 0) ? filteredData : mappedDeficiencies;
        if (!sourceData || sourceData.length === 0) {
            toast.current.show({ severity: 'warn', summary: 'Sin datos', detail: 'No hay registros visibles para exportar.' });
            return;
        }
        const dataToExport = sourceData.map((item) => ({
            "ID": item.defiIdElemento, "Tipo": item.defiTipoElemento, "Código GIS": item.defiCodigoElemento,
            "Material": item.DefiTipoMaterial || "", "Nodo Inicial": item.DefiNodoInicial || "", "Nodo Final": item.DefiNodoFinal || "", "Armado": item.DefiAmrmadoMaterial || "",
            "Tipificación": item.tipificacionLabel || "S/D", "Inspector": item.inspectorLabel || "Desconocido",
            "Fecha": item.defiFecRegistro ? new Date(item.defiFecRegistro).toLocaleDateString('es-PE') : "-",
            "Estado": item.defiActivo ? "ACTIVO" : "ELIMINADO", "Criticidad": item.criticidadLabel || 'N/A'
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Deficiencias");
        worksheet['!cols'] = [{ wch: 10 }, { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 12 }, { wch: 10 }, { wch: 10 }];
        const sedCode = selectedSed?.sedCodigo || 'Reporte';
        const dateStr = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(workbook, `Deficiencias_${sedCode}_${dateStr}.xlsx`);
        toast.current.show({ severity: 'success', summary: 'Excel Generado', detail: `Se exportaron ${sourceData.length} registros.` });
    };

    const confirmDeleteDeficiency = (rowData) => {
        confirmDialog({
            message: `¿Desactivar la deficiencia del elemento ${rowData.defiCodigoElemento}?`, header: 'Confirmar Eliminación', icon: 'pi pi-exclamation-triangle', acceptLabel: 'Sí, Eliminar', rejectLabel: 'Cancelar', acceptClassName: 'p-button-danger',
            accept: async () => {
                const success = await softDeleteDeficiency(rowData.defiInterno);
                if (success) toast.current.show({ severity: 'success', summary: 'Eliminado', detail: 'Registro desactivado.' });
                else toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar.' });
            }
        });
    };

    const confirmRestoreDeficiency = (rowData) => {
        confirmDialog({
            message: `¿Restaurar elemento ${rowData.defiCodigoElemento}?`, header: 'Confirmar Restauración', icon: 'pi pi-refresh', acceptLabel: 'Sí, Restaurar', acceptClassName: 'p-button-success',
            accept: async () => {
                const result = await restoreDeficiency(rowData.defiInterno);
                if (result.success) {
                    toast.current.show({ severity: 'success', summary: 'Restaurado', detail: 'Registro activo.' });
                    // Recargar datos
                    if (selectedSed) {
                        const idSed = selectedSed.sedInterno || selectedSed.SedInterno || selectedSed.id;
                        await fetchBySed(idSed);
                    }
                }
                else toast.current.show({ severity: 'error', summary: 'Error', detail: result.message });
            }
        });
    };
    // --- ACCIÓN: CAMBIAR ESTADO TERCERO (Restaurar / Eliminar de Campo) ---
    const confirmToggleTercero = (rowData) => {
        // Si actualmente esTercero es true, queremos pasarlo a false (Restaurar)
        const nuevoEstado = !rowData.esTercero;

        const accionTexto = nuevoEstado ? "MARCAR COMO NO EXISTE" : "RESTAURAR A CAMPO";
        const icono = nuevoEstado ? "pi pi-times-circle" : "pi pi-check-circle";

        confirmDialog({
            message: `¿Estás seguro de ${accionTexto} el elemento asociado a esta deficiencia?`,
            header: 'Confirmar Estado en Campo',
            icon: `pi ${icono} text-yellow-500`,
            acceptLabel: 'Sí, cambiar',
            rejectLabel: 'Cancelar',
            accept: async () => {
                try {
                    // Llamamos al endpoint "Quirúrgico" que creamos
                    await api.post('/Deficiency/CambiarEstadoTercero', {
                        defiInterno: rowData.defiInterno, // Enviamos el ID de la deficiencia
                        esTercero: nuevoEstado            // true = Eliminar, false = Restaurar
                    });

                    toast.current.show({
                        severity: 'success',
                        summary: 'Actualizado',
                        detail: `Elemento ${nuevoEstado ? 'marcado como NO EXISTE' : 'RESTAURADO'} correctamente.`
                    });

                    // IMPORTANTE: Recargamos la tabla para ver el cambio de color al instante
                    if (selectedSed) {
                        const idSed = selectedSed.sedInterno || selectedSed.SedInterno || selectedSed.id;
                        await fetchBySed(idSed);
                    }

                } catch (error) {
                    console.error("Error cambiando estado tercero:", error);
                    toast.current.show({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo cambiar el estado.'
                    });
                }
            }
        });
    };
    // NUEVO: CÁLCULO DE CORRELATIVO PARA 7004
    // -------------------------------------------------------------------
    const correlativoInfo = useMemo(() => {
        if (!selectedDeficiency) return { count: 0, myCorrelativo: 0 };

        const targetGis = selectedDeficiency.defiCodigoElemento;
        const targetType = "7004"; // O el código interno 60

        // 1. Filtramos todas las deficiencias de ESTE elemento que sean 7004
        const sameElement7004s = mappedDeficiencies.filter(d =>
            d.defiCodigoElemento === targetGis &&
            (getCodeById(d.tipiInterno) === targetType || d.tipiInterno === 60)
        );

        // 2. Ordenamos por fecha de registro (o ID) para saber "cuál soy yo" en la fila
        // Esto es útil si quieres decir "Soy la 7004 número 2 de 5"
        sameElement7004s.sort((a, b) => a.defiInterno - b.defiInterno);

        const myIndex = sameElement7004s.findIndex(d => d.defiInterno === selectedDeficiency.defiInterno) + 1;

        return {
            totalCount: sameElement7004s.length, // Total de 7004s para este poste
            myCorrelativo: myIndex > 0 ? myIndex : (sameElement7004s.length + 1) // Si es nueva, será la siguiente
        };
    }, [selectedDeficiency, mappedDeficiencies, getCodeById]);

    // -------------------------------------------------------------------
    // 6. TEMPLATES
    // -------------------------------------------------------------------
    const typeTemplate = (rowData) => <Tag value={rowData.defiTipoElemento} severity={rowData.defiTipoElemento === 'POST' ? 'info' : 'warning'} icon={rowData.defiTipoElemento === 'POST' ? 'pi pi-arrows-v' : 'pi pi-arrows-h'} />;

    const statusFilterTemplate = (options) => (
        <Dropdown value={options.value} options={[{ label: 'Todos', value: null }, { label: 'Activo', value: true }, { label: 'Eliminado', value: false }]} onChange={(e) => options.filterApplyCallback(e.value)} itemTemplate={(option) => option.value === null ? <span>Todos</span> : <Tag value={option.label} severity={option.value ? 'success' : 'danger'} />} placeholder="Estado" className="p-column-filter" showClear />
    );
    const responsabilidadTemplate = (rowData) => {
        // CAMBIO CLAVE: Usar 'defiCol2' (d minúscula) para coincidir con el JSON
        const valor = (rowData.defiCol2 || "").toString().trim().toUpperCase();
        const esSeal = valor === 'SEAL';

        return (
            <Tag
                value={esSeal ? 'SEAL' : 'TERCEROS'}
                severity={esSeal ? 'success' : 'warning'}
                style={{ fontSize: '10px', width: '90px', fontWeight: 'bold' }}
            />
        );
    };
    const responsabilidadFilterTemplate = (options) => (
        <Dropdown
            value={options.value}
            options={[
                { label: 'Todos', value: null },
                { label: 'SEAL', value: 'SEAL' },
                { label: 'TERCEROS', value: 'TERCEROS' }
            ]}
            onChange={(e) => options.filterApplyCallback(e.value)}
            placeholder="Resp."
            className="p-inputtext-sm border border-gray-400"
            showClear
        />
    );
    const activeTemplate = (rowData) => <Tag value={(rowData.defiActivo === true || rowData.defiActivo === 1) ? 'ACTIVO' : 'ELIMINADO'} severity={(rowData.defiActivo === true || rowData.defiActivo === 1) ? 'success' : 'danger'} style={{ fontSize: '10px' }} />;
    const criticidadTemplate = (rowData) => { const conf = { 'LEVE': 'success', 'MEDIO': 'warning', 'CRÍTICO': 'danger', 'N/A': 'null' }; return <Tag value={rowData.criticidadLabel} severity={conf[rowData.criticidadLabel] || 'null'} style={{ fontSize: '10px' }} />; };
    const typificationTemplate = (rowData) => { if (loadingTypos) return <Skeleton width="40px" />; return <Tag value={rowData.tipificacionLabel || "S/D"} severity={rowData.tipificacionLabel ? "info" : "warning"} style={{ fontSize: '11px', fontWeight: 'bold' }} />; };
    const inspectorTemplate = (rowData) => { if (loadingUsers) return <Skeleton width="80px" />; return <span className="text-gray-700 text-xs font-medium uppercase truncate">{rowData.inspectorLabel}</span>; };
    const dateTemplate = (rowData) => rowData.defiFecRegistro ? new Date(rowData.defiFecRegistro).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "-";


    // --- AGREGAR ESTE TEMPLATE NUEVO ---
    const terceroTemplate = (rowData) => {
        // Convertimos la propiedad 'esTercero' (bool) al formato 0/1 que espera tu Badge
        // true = No Existe (1), false = Existe (0)
        const estadoNumerico = rowData.esTercero ? 1 : 0;
        return <EstadoBadge estado={estadoNumerico} />;
    };
    const actionBodyTemplate = (rowData) => {
        // 1. Si la deficiencia está eliminada (Soft Delete), solo mostramos Restaurar Deficiencia
        const isDeleted = rowData.defiActivo === false || rowData.defiActivo === 0;

        if (isDeleted) {
            return (
                <div className="flex gap-1 justify-center">
                    <Button
                        icon="pi pi-refresh"
                        rounded
                        text
                        severity="success"
                        size="small"
                        onClick={() => confirmRestoreDeficiency(rowData)}
                        tooltip="Restaurar Deficiencia"
                    />
                </div>
            );
        }

        // 2. Lógica para el botón de "En Campo / Terceros"
        // Si esTercero es true (No existe) -> Botón VERDE para Restaurar
        // Si esTercero es false (Existe) -> Botón NARANJA para Eliminar de campo


        const isNoExiste = rowData.esTercero === true;

        return (
            <div className="flex gap-1 justify-center">
                {/* Botón Editar */}
                <Button
                    icon="pi pi-pencil"
                    rounded
                    text
                    severity="info"
                    size="small"
                    onClick={() => openEdit(rowData)}
                    tooltip="Editar"
                />

                {/* --- NUEVO BOTÓN: RESTAURAR O QUITAR DE CAMPO --- */}
                <Button
                    icon={isNoExiste ? "pi pi-check-circle" : "pi pi-ban"}
                    rounded
                    text
                    severity={isNoExiste ? "success" : "warning"}
                    size="small"
                    onClick={() => confirmToggleTercero(rowData)}
                    tooltip={isNoExiste ? "Restaurar elemento a Campo" : "Marcar elemento como No Existe"}
                />

                {/* Botón Eliminar Deficiencia */}
                <Button
                    icon="pi pi-trash"
                    rounded
                    text
                    severity="danger"
                    size="small"
                    onClick={() => confirmDeleteDeficiency(rowData)}
                    tooltip="Eliminar Deficiencia"
                />
            </div>
        );

    };

    const duplicateDeficiency = () => {

        if (!selectedDeficiency) {

            toast.current.show({
                severity: 'warn',
                summary: 'Atención',
                detail: 'Seleccione una deficiencia.'
            });

            return;
        }

        setDuplicateId(selectedDeficiency.defiInterno);
        setDuplicateVisible(true);
    };
        // -------------------------------------------------------------------
    // 7. RENDERIZADO
    // -------------------------------------------------------------------
    return (
        <div className="flex flex-col h-screen bg-gray-100 p-2 overflow-hidden">

            <style>{highContrastStyle}</style>
            <Toast ref={toast} />
            <ConfirmDialog />

            {/* --- BARRA SUPERIOR --- */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-4 flex items-center justify-between shrink-0 border border-slate-200 gap-4">
                <div className="flex flex-1 items-end gap-4 justify-start min-w-0">
                    <div className="flex flex-col shrink-0">
                        <label className="text-[10px] font-bold text-blue-800 mb-1 ml-1 uppercase tracking-wider">Alimentador</label>
                        <Dropdown value={selectedFeeder} onChange={handleFeederChange} options={feeders} optionLabel="label" filter placeholder="Seleccione..." className="w-48 p-inputtext-sm border border-gray-300 rounded h-10 flex items-center" disabled={loadingFeeders} filterInputAutoFocus={false} resetFilterOnHide={true} />
                    </div>
                    <div className="flex flex-col shrink-0">
                        <label className="text-[10px] font-bold text-blue-800 mb-1 ml-1 uppercase tracking-wider">Cód. SED</label>
                        <AutoComplete value={selectedSed} suggestions={filteredSeds} completeMethod={searchSeds} field="sedCodigo" dropdown onChange={(e) => setSelectedSed(e.value)} placeholder="Ej: S123..." className="w-40 p-inputtext-sm font-bold h-10" inputClassName="border border-gray-300 rounded-l h-10 w-full px-2" forceSelection disabled={!selectedFeeder} autoComplete="off" inputProps={{ autoComplete: "off" }} />
                    </div>
                    <Button onClick={handleSearch} loading={loadingDef} disabled={!selectedSed} className="p-button-sm px-3 h-10 shadow-sm shrink-0 border-none flex items-center gap-2" style={{ backgroundColor: '#3B82F6', color: '#fff' }}>
                        <i className={`pi ${loadingDef ? 'pi-spin pi-spinner' : 'pi-search'} text-lg`}></i>
                        <div className="flex flex-col items-start leading-none"><span className="font-bold text-[10px]">BUSCAR</span><span className="text-[9px] opacity-90 font-normal">DEFICIENCIAS</span></div>
                    </Button>
                </div>
                <div className="flex flex-1 items-center gap-2 justify-end pl-6 border-l border-gray-200 ml-4">
                    {(deficiencies.length > 0 || selectedFeeder || selectedSed || globalFilterValue) && (
                        <Button onClick={clearAll} className="p-button-sm px-3 h-10 shadow-md shrink-0 border-none flex items-center gap-2 hover:bg-red-600 transition-colors" style={{ backgroundColor: '#ef4444', color: '#ffffff' }} tooltip="Restablecer filtros">
                            <i className="pi pi-eraser text-lg font-bold"></i>
                            <div className="flex flex-col items-start leading-none"><span className="font-extrabold text-[10px]">LIMPIAR</span><span className="text-[9px] font-medium opacity-90">DEFICIENCIAS</span></div>
                        </Button>
                    )}
                    {deficiencies.length > 0 && (
                        <Button type="button" onClick={exportToExcel} className="p-button-sm px-3 h-10 shadow-md shrink-0 border-none flex items-center gap-2 hover:opacity-90 transition-opacity" style={{ backgroundColor: '#107c41', color: '#ffffff' }} tooltip="Exportar tabla a Excel">
                            <i className="pi pi-file-excel text-lg font-bold"></i>
                            <div className="flex flex-col items-start leading-none"><span className="font-extrabold text-[10px]">EXPORTAR</span><span className="text-[9px] font-medium opacity-90">EXCEL</span></div>
                        </Button>
                    )}
                    <Button onClick={openNew} disabled={!selectedSed} className="p-button-sm px-3 h-10 shadow-lg bg-green-600 border-none flex items-center gap-2 hover:scale-105 transition-transform" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: '#fff' }}>
                        <i className="pi pi-plus text-lg font-bold"></i>
                        <div className="flex flex-col items-start leading-none"><span className="font-extrabold text-[10px]">NUEVA</span><span className="text-[9px] font-medium">DEFICIENCIA</span></div>
                    </Button>
                    <Button onClick={duplicateDeficiency} disabled={!selectedDeficiency} className="p-button-sm px-3 h-10 shadow-lg bg-green-600 border-none flex items-center gap-2 hover:scale-105 transition-transform" style={{ background: 'linear-gradient(135deg, #2256c5 0%, #168ea3 100%)', color: '#fff' }}>
                        <i className="pi pi-clone text-lg font-bold"></i>
                        <div className="flex flex-col items-start leading-none"><span className="font-extrabold text-[10px]">CLONAR</span><span className="text-[9px] font-medium">DEFICIENCIA</span></div>
                    </Button>
                </div>
            </div>

            {/* --- CONTENIDO PRINCIPAL --- */}
            <div className="flex-grow bg-white rounded shadow border border-gray-300 overflow-hidden">
                <Splitter style={{ height: '100%' }} layout="horizontal" className="border-0">

                    {/* PANEL IZQUIERDO: TABLA */}
                    <SplitterPanel size={70} minSize={50} className="overflow-auto flex flex-col" onClick={handleTableContainerClick}>
                        <DataTable
                            value={mappedDeficiencies}
                            loading={loadingDef}
                            onValueChange={(processedData) => setFilteredData(processedData)}
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
                            filters={filters}
                            filterDisplay="row"
                            globalFilterFields={['defiCodigoElemento', 'defiTipoElemento', 'defiIdElemento', 'tipificacionLabel', 'inspectorLabel', 'DefiTipoMaterial', 'DefiNodoInicial', 'DefiNodoFinal', 'DefiAmrmadoMaterial']}
                            onFilter={(e) => setFilters(e.filters)}
                        >
                            <Column field="defiIdElemento" header="ID" sortable filter filterPlaceholder="Buscar ID" style={{ width: '90px' }} />
                            <Column field="defiTipoElemento" header="Tipo" body={typeTemplate} sortable filter filterPlaceholder="Filtrar" style={{ width: '100px', textAlign: 'center' }} />
                            <Column field="defiCodigoElemento" header="GIS" sortable filter filterPlaceholder="Buscar Código" style={{ fontWeight: 'bold', color: '#1e40af', minWidth: '120px' }} />
                            <Column field="defiNumSuministro" header="Num Suministro" sortable filter filterPlaceholder="Buscar Código" style={{ fontWeight: 'bold', color: '#1e40af', minWidth: '120px' }} />


                            <Column field="tipificacionLabel" header="Tipificación" body={typificationTemplate} sortable filter showFilterMenu={false} filterPlaceholder="Buscar..." style={{ textAlign: 'center', width: '130px' }} />


                            <Column body={(r) => selectedDeficiency?.defiInterno === r.defiInterno ? <i className="text-blue-600 font-bold"></i> : null} style={{ width: '40px' }} />

                            <Column field="defiFecRegistro" header="Fecha" body={dateTemplate} sortable style={{ width: '100px' }} />
                            <Column field="defiActivo" header="Estado" body={activeTemplate} sortable style={{ width: '130px', textAlign: 'center' }} filter filterElement={statusFilterTemplate} showFilterMenu={false} />
                            <Column field="criticidadLabel" header="Crit." body={criticidadTemplate} sortable filter showFilterMenu={false} filterPlaceholder="Buscar..." style={{ width: '100px', textAlign: 'center' }} />
                            <Column
                                field="esTercero"
                                header="En Campo"
                                body={terceroTemplate}
                                sortable
                                style={{ textAlign: 'center', width: '110px' }}
                            />
                            <Column header="Acciones" body={actionBodyTemplate} style={{ width: '90px', textAlign: 'center' }} alignFrozen="right" frozen />
                            <Column field="inspectorLabel" header="Inspector" body={inspectorTemplate} sortable filter showFilterMenu={false} filterPlaceholder="Buscar..." style={{ minWidth: '150px' }} />
                            <Column
                                field="defiCol2"
                                header="Responsabilidad"
                                body={responsabilidadTemplate}
                                sortable
                                filter
                                filterElement={responsabilidadFilterTemplate}
                                showFilterMenu={false}
                                style={{ minWidth: '150px', textAlign: 'center' }}
                            />
                            <Column field="DefiTipoMaterial" header="Material" sortable filter filterPlaceholder="Buscar..." style={{ width: '120px' }} />
                            <Column field="DefiNodoInicial" header="N. Inicial" sortable filter filterPlaceholder="Buscar..." style={{ width: '100px' }} />
                            <Column field="DefiNodoFinal" header="N. Final" sortable filter filterPlaceholder="Buscar..." style={{ width: '100px' }} />
                            <Column field="DefiAmrmadoMaterial" header="Armado" sortable filter filterPlaceholder="Buscar..." style={{ width: '120px' }} />
                        </DataTable>
                    </SplitterPanel>

                    {/* PANEL DERECHO: GALERÍA */}
                    {/* Quitamos bg-slate-50 y ponemos bg-white para evitar parches de color */}
                    {/* PANEL DERECHO: EVIDENCE VIEW (INFO + GALERÍA) */}
                    <SplitterPanel size={40} minSize={20} className="bg-white flex flex-col overflow-hidden border-l border-gray-200">

                        {/* REEMPLAZAMOS <EvidenceGallery> POR <EvidenceView> */}
                        <EvidenceView
                            selectedDeficiency={selectedDeficiency}
                            feeder={feederObject}
                            sed={selectedSed}
                            suministro={selectedDeficiency?.defiNumSuministro || "0000"}
                            my7004Correlativo={correlativoInfo.myCorrelativo}

                            // Este callback permite recargar la tabla si guardas cambios en la ficha técnica
                            onUpdateDeficiency={() => {
                                if (selectedSed) {
                                    const idSed = selectedSed.sedInterno || selectedSed.SedInterno || selectedSed.id;
                                    fetchBySed(idSed);
                                }
                            }}
                        />

                    </SplitterPanel>

                </Splitter>
            </div>

            <DeficiencyForm
                visible={formVisible}
                onHide={() => setFormVisible(false)}
                onSave={handleSaveSuccess}
                deficiencyToEdit={deficiencyToEdit}
                alimentadorId={selectedFeeder}
                sedId={selectedSed}
                existingDeficiencies={mappedDeficiencies} // Pasamos la lista completa para validar duplicados
                referenceSelection={selectedDeficiency}   // Pasa la selección para pre-llenar (clonar)
            />
            <DuplicateDeficiencyModal
                visible={duplicateVisible}
                deficiencyId={duplicateId}
                onHide={() => setDuplicateVisible(false)}
                getDeficiencyById={getDeficiencyById}
                onSave={handleSaveSuccess}
            />
        </div>
    );
}