import React, { useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown'; // <--- IMPORTANTE
import { Toolbar } from 'primereact/toolbar';
import { Tag } from 'primereact/tag';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Servicios
import { ReporteService } from '../services/reporteService';
// Hooks para los Dropdowns (Asegúrate de que la ruta sea correcta)
import { useFeeder, useSedsByFeeder } from '../hooks/useFeeder'; 

const Reportes = () => {
    // 1. ESTADOS PARA LOS DROPDOWNS
    const [selectedFeeder, setSelectedFeeder] = useState(null);
    const [selectedSed, setSelectedSed] = useState(null);

    // Hooks de datos (Cascada)
    const { feeders } = useFeeder(); 
    const { seds: listaSeds, loading: lSeds } = useSedsByFeeder(selectedFeeder); 

    // Estados de datos del reporte
    const [postesData, setPostesData] = useState({ rows: [], cols: [] });
    const [vanosData, setVanosData] = useState({ rows: [], cols: [] });
    
    const [loading, setLoading] = useState(false);
    const toast = useRef(null);

    // -------------------------------------------------------------------------
    // 1. LOGICA DE CONSULTA
    // -------------------------------------------------------------------------
    const handleConsultar = async () => {
        if (!selectedSed) {
            toast.current.show({ severity: 'warn', summary: 'Atención', detail: 'Seleccione una Subestación.' });
            return;
        }

        // Extraemos el ID seguro (dependiendo de cómo venga tu objeto SED)
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

    // Helper: Transforma la lista del backend a formato de Tabla
    const procesarMatriz = (listaBackend) => {
        if (!listaBackend || listaBackend.length === 0) return { rows: [], cols: [] };

        const uniqueCodes = new Set();
        listaBackend.forEach(item => {
            if (item.deficiencies) item.deficiencies.forEach(c => uniqueCodes.add(c));
        });
        const sortedCols = Array.from(uniqueCodes).sort();

        const rows = listaBackend.map(item => {
            const row = { id: item.id, sector: item.sector, total: item.deficiencies ? item.deficiencies.length : 0 };
            sortedCols.forEach(code => {
                row[code] = item.deficiencies.includes(code);
            });
            return row;
        });

        return { rows, cols: sortedCols };
    };

    // -------------------------------------------------------------------------
    // 2. LOGICA DE EXPORTACIÓN
    // -------------------------------------------------------------------------
    const exportarExcel = () => {
        const workbook = XLSX.utils.book_new();
        let hojasAgregadas = 0;

        const agregarHoja = (dataObj, nombreHoja, colIdLabel) => {
            if (dataObj.rows.length === 0) return;

            const excelRows = dataObj.rows.map(r => {
                const row = { "Sector": r.sector, [colIdLabel]: r.id };
                dataObj.cols.forEach(c => row[`Def. ${c}`] = r[c] ? "X" : "");
                row["Total Hallazgos"] = r.total;
                return row;
            });

            const ws = XLSX.utils.json_to_sheet(excelRows);
            ws['!cols'] = [{wch:15}, {wch:15}, ...dataObj.cols.map(()=>({wch:8})), {wch:12}];
            XLSX.utils.book_append_sheet(workbook, ws, nombreHoja);
            hojasAgregadas++;
        };

        agregarHoja(postesData, "Estructuras (Postes)", "Código Poste");
        agregarHoja(vanosData, "Líneas (Vanos)", "Código Vano");

        if (hojasAgregadas === 0) {
            toast.current.show({ severity: 'warn', summary: 'Vacío', detail: 'No hay datos para exportar.' });
            return;
        }

        // Nombre del archivo con la etiqueta de la SED seleccionada
        const nombreArchivo = `Reporte_${selectedSed.label || 'SED'}.xlsx`;
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'});
        saveAs(blob, nombreArchivo);
    };

    // -------------------------------------------------------------------------
    // 3. UI (Renderizado)
    // -------------------------------------------------------------------------
    
    // BARRA DE HERRAMIENTAS IZQUIERDA (LOS DROPDOWNS)
    const leftToolbarTemplate = () => {
        return (
            <div className="flex flex-wrap gap-3 align-items-end">
                {/* 1. ALIMENTADOR */}
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

                {/* 2. SUBESTACIÓN */}
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
                
                {data.cols.map(col => (
                    <Column 
                        key={col} 
                        field={col} 
                        header={col} 
                        body={(r) => r[col] ? <i className="pi pi-check text-red-500 font-bold"/> : "-"}
                        style={{ minWidth: '50px', textAlign: 'center' }}
                        headerTooltip={`Código Deficiencia: ${col}`}
                    />
                ))}

                <Column 
                    field="total" 
                    header="Total" 
                    alignFrozen="right" 
                    frozen 
                    body={(r) => <Tag severity={r.total > 0 ? 'danger' : 'success'} value={r.total} />}
                    style={{ minWidth: '70px', textAlign: 'center' }} 
                />
            </DataTable>
        );
    };

    return (
        <div className="card p-4">
            <Toast ref={toast} />
            
            <h2 className="mb-3 text-900">Reporte de Deficiencias</h2>
            <p className="text-gray-600 mb-4">Consulta las deficiencias por Subestación y exporta el formato oficial.</p>
            
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