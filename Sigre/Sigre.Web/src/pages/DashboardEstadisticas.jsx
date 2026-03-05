import React, { useState, useEffect } from 'react';
import { AutoComplete } from 'primereact/autocomplete';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Chart } from 'primereact/chart';
import { Divider } from 'primereact/divider';
import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';

// 🔥 IMPORTAMOS TU NUEVO HOOK
import { useEstadisticas } from '../hooks/useEstadisticas';

export default function DashboardEstadisticas() {
    // --- ESTADOS DE BÚSQUEDA ---
    const [selectedSed, setSelectedSed] = useState(null);
    const [suggestions, setSuggestions] = useState([]);

    // --- ESTADOS PARA EL MODAL DE DESGLOSE ---
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [detailTitle, setDetailTitle] = useState('');
    const [detailColumns, setDetailColumns] = useState([]);

    // --- ESTADOS PARA GRÁFICOS ---
    const [chartData, setChartData] = useState({});
    const [chartOptions, setChartOptions] = useState({});

    // 🔥 USAMOS EL HOOK
    const { 
        metrics, 
        loadingMetrics, 
        fetchEstadisticas, 
        detailData, 
        loadingDetail, 
        fetchDetalleKpi 
    } = useEstadisticas();

    // =========================================================================
    // ACCIONES
    // =========================================================================
    
    // 1. BUSCAR SED
    const searchSed = async (event) => {
        const query = event.query.toLowerCase();
        
        // Simulación rápida (Reemplazar con tu endpoint real de buscar SED)
        // const res = await api.get(`/SED/Buscar?query=${query}`);
        // setSuggestions(res.data);
        
        const mockSeds = [
            { sedInterno: 1465, sedCodigo: '1887', nombre: 'SED Alto Cocachacra' }, 
            { sedInterno: 2, sedCodigo: '8581', nombre: 'SED Central' }
        ];
        setSuggestions(mockSeds.filter(s => 
            s.sedCodigo.includes(query) || s.nombre.toLowerCase().includes(query)
        ));
    };

    // 2. CARGAR ESTADÍSTICAS PRINCIPALES
    const handleLoadData = async (sed) => {
        if (!sed) return;

        // Extracción robusta del ID y Código
        const sedIdExtracted = sed.value || sed.sedInterno || sed.SedInterno || sed.id || sed.Id;
        const sedCodigoExtracted = sed.label || sed.sedCodigo || sed.SedCodigo || (typeof sed === 'string' ? sed : '');

        if (!sedIdExtracted) {
            alert("Por favor, seleccione una SED válida de la lista.");
            return;
        }

        // Llamamos al hook
        try {
            await fetchEstadisticas(sedIdExtracted, sedCodigoExtracted);
        } catch (e) {
            alert("Error de conexión al obtener estadísticas.");
        }
    };

    // 3. ABRIR MODAL DE DESGLOSE (DRILL-DOWN)
    const openDetailModal = async (kpiType, title) => {
        if (!selectedSed) return;
        
        // Extracción robusta del ID
        const sedIdExtracted = selectedSed.value || selectedSed.sedInterno || selectedSed.id || selectedSed.Id;

        setDetailTitle(`Desglose: ${title}`);
        setDetailModalVisible(true);

        // Configuramos las columnas del DataTable dinámicamente según el KPI
        if (kpiType === 'DUPLICADAS') {
            setDetailColumns([
                { field: 'codigoDef', header: 'Tipo Defecto' },
                { field: 'gis', header: 'Código GIS' },
                { field: 'observacion', header: 'Observación' }
            ]);
        } else if (kpiType === 'DISTANCIAS_CERO') {
            setDetailColumns([
                { field: 'codigoDef', header: 'Tipo Defecto' },
                { field: 'gis', header: 'Código GIS' },
                { field: 'distH', header: 'D. Horizontal' },
                { field: 'distV', header: 'D. Vertical' },
                { field: 'id', header: 'ID Registro' }
            ]);
        }

        // Llamamos al hook para traer los datos (Se mostrará el ProgressSpinner automáticamente)
        await fetchDetalleKpi(kpiType, sedIdExtracted);
    };

    // =========================================================================
    // EFECTOS
    // =========================================================================
    
    // Actualizar configuración del gráfico de Chart.js cuando recibimos nueva data
    useEffect(() => {
        if (metrics && metrics.summaryData) {
            const documentStyle = getComputedStyle(document.documentElement);
            const activos = metrics.summaryData.find(d => d.eliminado === 'NO')?.total || 0;
            const eliminados = metrics.summaryData.find(d => d.eliminado === 'SI')?.total || 0;

            setChartData({
                labels: ['Activos (NO Eliminados)', 'Eliminados (SI)'],
                datasets: [{
                    data: [activos, eliminados],
                    backgroundColor: [documentStyle.getPropertyValue('--blue-500'), documentStyle.getPropertyValue('--red-500')],
                    hoverBackgroundColor: [documentStyle.getPropertyValue('--blue-400'), documentStyle.getPropertyValue('--red-400')]
                }]
            });
            
            setChartOptions({ 
                plugins: { legend: { labels: { usePointStyle: true } } } 
            });
        }
    }, [metrics]);

    // =========================================================================
    // COMPONENTES AUXILIARES UI
    // =========================================================================
    
    const footerGroup = (
        <div className="flex justify-between w-full font-bold text-gray-800">
            <span>Total General SED {selectedSed?.sedCodigo || selectedSed?.label}:</span>
            <span>{metrics?.totalGeneral || 0}</span>
        </div>
    );

    const KpiCard = ({ id, title, value, icon, colorClass }) => {
        // Solo es cliqueable si tiene un ID configurado y su valor es mayor a 0
        const isClickable = !!id && value > 0;
        
        return (
            <div 
                onClick={() => isClickable && openDetailModal(id, title)}
                className={`p-4 rounded-xl shadow-sm border-l-4 bg-white flex items-center justify-between transition-all duration-200
                    ${colorClass} 
                    ${isClickable ? 'cursor-pointer hover:shadow-md hover:-translate-y-1' : 'opacity-80'}`}
            >
                <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{title}</h4>
                    <span className="text-2xl font-black text-gray-800">{value}</span>
                    
                    {/* Indicador visual de que se puede hacer clic */}
                    {isClickable && (
                        <div className="text-[10px] text-blue-500 mt-1 font-bold flex items-center gap-1">
                            <i className="pi pi-search-plus"></i> Ver detalle
                        </div>
                    )}
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-opacity-20 ${colorClass.replace('border-', 'bg-').replace('500', '100')} ${colorClass.replace('border-', 'text-')}`}>
                    <i className={`pi ${icon} text-xl`}></i>
                </div>
            </div>
        );
    };

    // =========================================================================
    // RENDER PRINCIPAL
    // =========================================================================
    return (
        <div className="p-4 flex flex-col gap-4 bg-gray-50 min-h-screen">
            
            {/* 1. BARRA SUPERIOR DE BÚSQUEDA */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-blue-900 m-0 flex items-center gap-2">
                        <i className="pi pi-chart-bar"></i> Auditoría y Calidad de Datos
                    </h2>
                    <p className="text-sm text-gray-500 m-0">Seleccione una subestación para evaluar la integridad de sus registros.</p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="p-inputgroup flex-1">
                        <span className="p-inputgroup-addon bg-blue-50"><i className="pi pi-search text-blue-600"></i></span>
                        <AutoComplete 
                            value={selectedSed} 
                            suggestions={suggestions} 
                            completeMethod={searchSed} 
                            field="sedCodigo" // Asegúrate de que esto coincida con cómo quieres mostrar el texto
                            placeholder="Buscar SED (Ej: 1887)" 
                            onChange={(e) => setSelectedSed(e.value)} 
                            onSelect={(e) => handleLoadData(e.value)}
                            dropdown
                            forceSelection // 🔥 Obliga a seleccionar de la lista
                            className="w-full md:w-64"
                            inputClassName="w-full font-bold"
                        />
                    </div>
                    <Button 
                        icon={`pi ${loadingMetrics ? 'pi-spin pi-spinner' : 'pi-refresh'}`} 
                        onClick={() => handleLoadData(selectedSed)} 
                        disabled={!selectedSed || loadingMetrics} 
                        tooltip="Recargar Métricas" 
                        className="p-button-outlined" 
                    />
                </div>
            </div>

            {/* 2. CONTENIDO DEL DASHBOARD */}
            {loadingMetrics ? (
                <div className="flex-1 flex flex-col items-center justify-center text-blue-500 mt-10">
                    <ProgressSpinner style={{width: '50px', height: '50px'}} strokeWidth="4" />
                    <p className="mt-4 font-bold animate-pulse">Procesando calidad de datos...</p>
                </div>
            ) : metrics ? (
                <div className="flex flex-col gap-6 animate-fadein">
                    
                    {/* --- RESUMEN GENERAL (TABLA + GRÁFICO) --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="text-sm font-bold text-gray-700 uppercase mb-3 border-b pb-2">Estado de Deficiencias / Elementos</h3>
                            <DataTable value={metrics.summaryData} size="small" footer={footerGroup} className="p-datatable-sm" stripedRows>
                                <Column field="sed" header="SED" style={{ width: '33%' }} />
                                <Column field="eliminado" header="Eliminado" body={(r) => (
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${r.eliminado === 'SI' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {r.eliminado}
                                    </span>
                                )} style={{ width: '33%' }} />
                                <Column field="total" header="Total de Registros" style={{ width: '33%', fontWeight: 'bold' }} />
                            </DataTable>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center">
                            <h3 className="text-sm font-bold text-gray-700 uppercase mb-3 w-full text-center">Proporción de Estados</h3>
                            <div className="w-48 h-48">
                                <Chart type="doughnut" data={chartData} options={chartOptions} className="w-full" />
                            </div>
                        </div>
                    </div>

                    <Divider align="left">
                        <span className="text-gray-500 font-bold text-sm flex items-center gap-2">
                            <i className="pi pi-shield"></i> ALERTAS DE CALIDAD DE DATOS
                        </span>
                    </Divider>

                    {/* --- KPIs DE AUDITORÍA (TARJETAS) --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <KpiCard title="No Inspeccionados" value={metrics.noInspeccionados} icon="pi pi-eye-slash" colorClass="border-gray-500 text-gray-500" />
                        
                        {/* 🔥 Tarjetas con ID para abrir el Modal */}
                        <KpiCard id="DUPLICADAS" title="Def. Duplicadas" value={metrics.duplicadas} icon="pi pi-clone" colorClass="border-red-500 text-red-500" />
                        <KpiCard id="DISTANCIAS_CERO" title="7004/7006 Distancia 0.0" value={metrics.distanciasCero} icon="pi pi-arrows-h" colorClass="border-pink-500 text-pink-500" />
                        
                        <KpiCard title="Sin Deff pero Con Deff" value={metrics.sinDefConDef} icon="pi pi-exclamation-triangle" colorClass="border-red-600 text-red-600" />
                        <KpiCard title="Falta Nodo Inicial/Final" value={metrics.nodoFaltante} icon="pi pi-share-alt" colorClass="border-orange-500 text-orange-500" />
                        <KpiCard title="Suministro Erróneo" value={metrics.suministroErroneo} icon="pi pi-id-card" colorClass="border-orange-400 text-orange-400" />
                        <KpiCard title="Salto de Fechas" value={metrics.saltoFechas} icon="pi pi-calendar-times" colorClass="border-yellow-500 text-yellow-500" />
                        <KpiCard title="Sin Criticidad" value={metrics.sinCriticidad} icon="pi pi-question-circle" colorClass="border-purple-500 text-purple-500" />
                        <KpiCard title="Criticidad Leve" value={metrics.criticidadLeve} icon="pi pi-info-circle" colorClass="border-blue-500 text-blue-500" />
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 mt-10">
                    <i className="pi pi-chart-pie text-6xl mb-4 opacity-50"></i>
                    <h3 className="text-lg font-bold">Sin datos para mostrar</h3>
                    <p className="text-sm">Busque y seleccione una SED para visualizar sus estadísticas.</p>
                </div>
            )}

            {/* ========================================================================= */}
            {/* 3. MODAL DE DESGLOSE (DRILL-DOWN) */}
            {/* ========================================================================= */}
            <Dialog 
                header={detailTitle} 
                visible={detailModalVisible} 
                style={{ width: '80vw' }} 
                onHide={() => setDetailModalVisible(false)}
                maximizable
                contentClassName="p-0" // Quita padding extra para la tabla
            >
                {loadingDetail ? (
                    <div className="flex justify-center items-center p-10 flex-col gap-3">
                        <ProgressSpinner style={{width: '40px', height: '40px'}} />
                        <span className="text-gray-500 font-bold">Cargando detalle...</span>
                    </div>
                ) : (
                    <DataTable 
                        value={detailData} 
                        paginator 
                        rows={10} 
                        size="small" 
                        stripedRows 
                        className="p-datatable-sm text-sm" 
                        emptyMessage="No hay registros detallados."
                    >
                        {detailColumns.map((col, i) => (
                            <Column 
                                key={i} 
                                field={col.field} 
                                header={col.header} 
                                sortable 
                                filter 
                                filterPlaceholder="Buscar" 
                                style={{ minWidth: '120px' }} 
                            />
                        ))}
                    </DataTable>
                )}
            </Dialog>

        </div>
    );
}