import React, { useState, useRef, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import { Toolbar } from 'primereact/toolbar';
import { Tag } from 'primereact/tag';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Servicios
import { ReporteService } from '../services/reporteService';
// 🔥 IMPORTA AQUÍ TU NUEVA FUNCIÓN (Ajusta la ruta según donde la guardaste)
import { getAllTypifications } from '../services/typificationService';

// Hooks
import { useFeeder, useSedsByFeeder } from '../hooks/useFeeder'; 

const Reportes = () => {
    // -------------------------------------------------------------------------
    // 0. CONFIGURACIÓN
    // -------------------------------------------------------------------------
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

    // -------------------------------------------------------------------------
    // 1. ESTADOS
    // -------------------------------------------------------------------------
    const [selectedFeeder, setSelectedFeeder] = useState(null);
    const [selectedSed, setSelectedSed] = useState(null);

    const { feeders } = useFeeder(); 
    const { seds: listaSeds, loading: lSeds } = useSedsByFeeder(selectedFeeder); 

    const [postesData, setPostesData] = useState({ rows: [], cols: [] });
    const [vanosData, setVanosData] = useState({ rows: [], cols: [] });
    
    // 🔥 NUEVO ESTADO: Mapa de Tipificaciones (ID -> Código)
    const [tipificationMap, setTipificationMap] = useState({});

    const [loading, setLoading] = useState(false);
    const toast = useRef(null);

    // -------------------------------------------------------------------------
    // 1.5. CARGA INICIAL DE TIPIFICACIONES
    // -------------------------------------------------------------------------
useEffect(() => {
        const cargarMaestros = async () => {
            try {
                const data = await getAllTypifications();

                if (!data || data.length === 0) return;

                const map = {};
                
                // 1. Mapeo estricto: typificationId -> code
                data.forEach(t => {
                    const id = Number(t.typificationId); 
                    const visualCode = t.code; 

                    // Validamos !isNaN para permitir el 0 si viniera en la API
                    if (!isNaN(id) && visualCode) {
                        map[id] = visualCode;
                    }
                });

                // 2. 🔥 CORRECCIÓN MANUAL PARA EL CERO (S/D)
                // Si el ID 0 no vino de la API, lo forzamos aquí para que el label diga "SINDEF"
                // en lugar de "ID:0".
                map[0] = "SINDEF"; 

                console.log("🗺️ MAPA FINAL (Incluye 0):", map);
                setTipificationMap(map);

            } catch (error) {
                console.error("❌ Error cargando tipificaciones:", error);
            }
        };
        cargarMaestros();
    }, []);
    // -------------------------------------------------------------------------
    // 2. LÓGICA DE DATOS
    // -------------------------------------------------------------------------
    const handleConsultar = async () => {
        if (!selectedSed) {
            toast.current.show({ severity: 'warn', summary: 'Atención', detail: 'Seleccione una Subestación.' });
            return;
        }

        const idSed = selectedSed.value || selectedSed.sedInterno || selectedSed.id;

        setLoading(true);
        try {
            const data = await ReporteService.getReportePorSED(idSed);

            setPostesData(procesarMatriz(data.postes));
            setVanosData(procesarMatriz(data.vanos));

            if ((!data.postes || data.postes.length === 0) && (!data.vanos || data.vanos.length === 0)) {
                toast.current.show({ severity: 'info', summary: 'Sin datos', detail: 'No se encontraron deficiencias.' });
            } else {
                toast.current.show({ severity: 'success', summary: 'Éxito', detail: 'Reporte generado.' });
            }
        } catch (error) {
            console.error(error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo conectar con el servidor.' });
        } finally {
            setLoading(false);
        }
    };

    const procesarMatriz = (listaBackend) => {
        if (!listaBackend || listaBackend.length === 0) return { rows: [], cols: [] };

        const uniqueCodes = new Set();

        // 1. RECORREMOS "DETAILS" PARA ENCONTRAR COLUMNAS
        listaBackend.forEach(item => {
            if (item.details && Array.isArray(item.details)) {
                item.details.forEach(detalle => {
                    // detalle es { code: 52, crit: 3 }
                    // Guardamos el 52 (ID)
                    uniqueCodes.add(detalle.code);
                });
            }
        });

        // 2. ORDENAMOS LAS COLUMNAS USANDO EL MAPA (Traducimos 52 -> "1000" para ordenar)
        const sortedCols = Array.from(uniqueCodes).sort((idA, idB) => {
            const codigoVisualA = tipificationMap[idA] || String(idA);
            const codigoVisualB = tipificationMap[idB] || String(idB);
            return codigoVisualA.localeCompare(codigoVisualB, undefined, { numeric: true });
        });

        // 3. CREAMOS LAS FILAS
        const rows = listaBackend.map(item => {
            // Datos base
            const row = { 
                id: item.id, 
                sector: item.sector, 
                // Calculamos totales basados en details
                total: item.details ? item.details.length : 0, 
                cantFotos: item.totalArchivosPoste || 0,
                criticidad: item.maxCriticality || 0,
                estadoRevision: item.estadoRevision 
            };
            
            // Rellenamos las columnas dinámicas
            sortedCols.forEach(colId => {
                // Buscamos si este ID (ej: 52) existe en los detalles de este poste
                const detalleEncontrado = item.details?.find(d => d.code === colId);

                // Si existe, guardamos TRUE (o el objeto entero si quieres usar la criticidad específica)
                row[colId] = !!detalleEncontrado; 
                
                // OPCIONAL: Si quisieras guardar la criticidad específica de esa celda:
                // row[colId] = detalleEncontrado ? detalleEncontrado.crit : null;
            });

            return row;
        });

        return { rows, cols: sortedCols };
    };

    // -------------------------------------------------------------------------
    // 3. EXPORTACIÓN A EXCEL
    // -------------------------------------------------------------------------
    const exportarExcel = () => {
        const workbook = XLSX.utils.book_new();
        let hojasAgregadas = 0;

        const agregarHoja = (dataObj, nombreHoja, colIdLabel) => {
            if (dataObj.rows.length === 0) return;

            const excelRows = dataObj.rows.map(r => {
                const row = { 
                    "Sector": r.sector, 
                    [colIdLabel]: r.id,
                    "Criticidad": r.criticidad,
                    "Fotos": r.cantFotos
                };
                
                // 🔥 AQUÍ USAMOS EL MAPA PARA EL HEADER DEL EXCEL
                dataObj.cols.forEach(codeId => {
                    // Obtenemos el código visual (ej: "205") o fallback al ID
                    const headerCode = tipificationMap[codeId] || `ID_${codeId}`;
                    row[`Def. ${headerCode}`] = r[codeId] ? "X" : "";
                });
                
                row["Total Hallazgos"] = r.total;
                return row;
            });

            const ws = XLSX.utils.json_to_sheet(excelRows);
            
            ws['!cols'] = [
                {wch:15}, 
                {wch:15}, 
                {wch:10}, 
                {wch:8}, 
                ...dataObj.cols.map(()=>({wch:8})),
                {wch:12} 
            ];
            
            XLSX.utils.book_append_sheet(workbook, ws, nombreHoja);
            hojasAgregadas++;
        };

        agregarHoja(postesData, "Estructuras (Postes)", "Código Poste");
        agregarHoja(vanosData, "Líneas (Vanos)", "Código Vano");

        if (hojasAgregadas === 0) {
            toast.current.show({ severity: 'warn', summary: 'Vacío', detail: 'No hay datos para exportar.' });
            return;
        }

        const nombreArchivo = `Reporte_${selectedSed.label || 'SED'}.xlsx`;
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'});
        saveAs(blob, nombreArchivo);
    };

    // -------------------------------------------------------------------------
    // 4. UI (Renderizado)
    // -------------------------------------------------------------------------
    
    const fotosBodyTemplate = (rowData) => {
        return (
            <div className="flex align-items-center justify-content-center gap-2">
                <i className={`pi pi-camera ${rowData.cantFotos > 0 ? 'text-primary' : 'text-300'}`} style={{ fontSize: '1rem' }}></i>
                {rowData.cantFotos > 0 && <span className="font-bold text-700">{rowData.cantFotos}</span>}
            </div>
        );
    };

    const criticidadBodyTemplate = (rowData) => {
        if (!rowData.criticidad) return "-";
        const conf = getCriticidadConfig(rowData.criticidad);
        return <Tag value={conf.label} severity={conf.severity} />;
    };
const estadoRevisionTemplate = (rowData) => {
    // 1. Extraemos el estado que viene del JSON del servidor
    const estado = rowData.estadoRevision; // Valdrá "PENDIENTE" o "COMPLETADO"
    const isPendiente = estado === 'PENDIENTE';

    return (
        <Tag 
            value={estado} 
            severity={isPendiente ? 'warning' : 'success'} 
            icon={isPendiente ? 'pi pi-exclamation-triangle' : 'pi pi-check-circle'}
            className="text-[10px] font-bold px-2"
            rounded
        />
    );
};

    const leftToolbarTemplate = () => {
        return (
            <div className="flex flex-wrap gap-3 align-items-end">
                <div className="flex flex-column gap-1">
                    <label className="text-xs font-bold text-gray-500">ALIMENTADOR</label>
                    <Dropdown 
                        value={selectedFeeder} 
                        options={feeders} 
                        onChange={(e) => { setSelectedFeeder(e.value); setSelectedSed(null); }} 
                        optionLabel="label" 
                        placeholder="Seleccione..." 
                        filter 
                        className="w-16rem"
                    />
                </div>
                <div className="flex flex-column gap-1">
                    <label className="text-xs font-bold text-gray-500">SUBESTACIÓN</label>
                    <Dropdown 
                        value={selectedSed} 
                        options={listaSeds} 
                        onChange={(e) => setSelectedSed(e.value)} 
                        optionLabel="label" 
                        placeholder={lSeds ? "Cargando..." : "Seleccione SED..."}
                        filter 
                        disabled={!selectedFeeder}
                        className="w-16rem"
                        emptyMessage="Sin SEDs asociadas"
                    />
                </div>
                <Button 
                    label="Consultar" 
                    icon="pi pi-search" 
                    onClick={handleConsultar} 
                    loading={loading} 
                    disabled={!selectedSed} 
                />
            </div>
        );
    };

    const rightToolbarTemplate = () => {
        return (
            <Button 
                label="Descargar Excel" 
                icon="pi pi-file-excel" 
                severity="success" 
                onClick={exportarExcel} 
                disabled={postesData.rows.length === 0 && vanosData.rows.length === 0} 
            />
        );
    };

    const renderTable = (data, headerId) => {
        if (data.rows.length === 0) return <div className="p-4 text-center text-gray-500">Seleccione una SED para ver los datos.</div>;

        return (
            <DataTable value={data.rows} scrollable scrollHeight="600px" size="small" stripedRows showGridlines className="mt-2 text-xs">
                <Column field="sector" header="Sector" frozen style={{ minWidth: '90px' }} />
                <Column field="id" header={headerId} frozen style={{ minWidth: '110px', fontWeight: 'bold' }} />
                
                <Column 
                    field="criticidad" 
                    header="Criticidad" 
                    body={criticidadBodyTemplate}
                    style={{ minWidth: '100px', textAlign: 'center' }} 
                    frozen
                />
                
                <Column 
                    field="cantFotos" 
                    header="Fotos" 
                    body={fotosBodyTemplate}
                    style={{ minWidth: '80px', textAlign: 'center' }} 
                    frozen
                />

                {/* --- RENDERIZADO DINÁMICO DE COLUMNAS CON CÓDIGOS --- */}
                {data.cols.map(colId => {
                    // colId es 52. Buscamos en el mapa: map[52] -> "1000"
                    const tituloColumna = tipificationMap[colId] || `ID:${colId}`;
                    
                    return (
                        <Column 
                            key={colId} 
                            field={colId} 
                            header={tituloColumna} // <--- AQUÍ MOSTRAMOS EL CÓDIGO VISUAL
                            body={(r) => r[colId] ? <i className="pi pi-check text-green-600 font-bold"/> : ""}
                            style={{ minWidth: '50px', textAlign: 'center' }}
                        />
                    );
                })}

                <Column 
                    field="total" 
                    header="Total" 
                    alignFrozen="right" 
                    frozen 
                    body={(r) => <Tag severity={r.total > 0 ? 'danger' : 'success'} value={r.total} />}
                    style={{ minWidth: '70px', textAlign: 'center' }} 
                />
<Column 
        field="estadoRevision" // Nombre exacto que ves en el Network tab
        header="Revisión" 
        body={estadoRevisionTemplate} 
        sortable 
        style={{ width: '130px', textAlign: 'center' }} 
    />
            </DataTable>
        );
    };

    return (
        <div className="card p-4">
            <Toast ref={toast} />
            <h2 className="mb-3 text-900">Reporte de Deficiencias</h2>
            <p className="text-gray-600 mb-4">Consulta las deficiencias por Subestación, criticidad y evidencias fotográficas.</p>
            
            <Toolbar left={leftToolbarTemplate} right={rightToolbarTemplate} className="mb-4 surface-card border-none shadow-1" />

            <div className="border-round-lg shadow-1 surface-card overflow-hidden">
                <TabView>
                    <TabPanel header="Estructuras (Postes)" leftIcon="pi pi-map-marker">
                        {renderTable(postesData, "Código Poste")}
                    </TabPanel>
                    <TabPanel header="Líneas (Vanos)" leftIcon="pi pi-arrows-h">
                        {renderTable(vanosData, "Código Vano")}
                    </TabPanel>
                </TabView>
            </div>
        </div>
    );
};

export default Reportes;