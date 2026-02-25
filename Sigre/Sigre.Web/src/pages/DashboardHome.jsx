import React, { useState, useEffect } from 'react';

// TUS HOOKS
import { useFeeder } from '../hooks/useFeeder';
import { useElements } from '../hooks/useElement';
import { useUltimasDeficiencias, useEstadisticasInspectores } from '../hooks/useUltimasDeficiencias';

// PRIMEREACT
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Badge } from 'primereact/badge';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { Calendar } from 'primereact/calendar'; // <-- NUEVO: Importamos el Calendario

// LUCIDE ICONS
import { Zap, AlertTriangle, RotateCcw, Activity, Users, Wrench, UtilityPole, Cable, CalendarDays } from 'lucide-react';

function DashboardHome() {
  // 1. Instanciar Hooks
  const { feeders, loading: loadingFeeders, error: errorFeeders } = useFeeder();
  const { fetchPostesChunk, fetchVanosChunk } = useElements();
  
  const { deficiencies, totalRecords, loading: loadingDefs, error: errorDefs, fetchDeficienciasPaginadas } = useUltimasDeficiencias();
  const { estadisticas, loadingStats, fetchEstadisticas } = useEstadisticasInspectores();

  // 2. Estados Generales
  const [totalPostes, setTotalPostes] = useState(0);
  const [totalVanos, setTotalVanos] = useState(0);
  const [loadingCounts, setLoadingCounts] = useState(false);

  // NUEVO ESTADO: Fecha seleccionada por el usuario (inicia hoy)
  const [selectedDate, setSelectedDate] = useState(new Date());

  // ESTADO DE PAGINACIÓN PARA PRIMEREACT (LAZY)
  const [lazyParams, setLazyParams] = useState({ first: 0, rows: 10, page: 0 });

  const totalFeeders = feeders?.length || 0;

  // Función auxiliar para convertir Date de JS a "YYYY-MM-DD"
  const formatDateForBackend = (dateObj) => {
      if (!dateObj) return "";
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
  };

  // 3. Efecto 1: Carga Única (Solo cuenta de infraestructura global)
  useEffect(() => {
    const fetchCounts = async () => {
      setLoadingCounts(true);
      try {
        const postesData = await fetchPostesChunk(0, 1, "");
        const vanosData = await fetchVanosChunk(0, 1, "");
        setTotalPostes(postesData?.totalRecords || 0);
        setTotalVanos(vanosData?.totalRecords || 0);
      } catch (err) {
        console.error("Error cargando totales de elementos:", err);
      } finally {
        setLoadingCounts(false);
      }
    };
    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 4. Efecto 2: Carga Diaria Paginada (Reacciona al cambiar la página o LA FECHA)
  useEffect(() => {
      if (selectedDate) {
          const fechaStr = formatDateForBackend(selectedDate);
          fetchDeficienciasPaginadas(lazyParams.first, lazyParams.rows, fechaStr);
          fetchEstadisticas(fechaStr);
      }
  }, [lazyParams, selectedDate, fetchDeficienciasPaginadas, fetchEstadisticas]);

  // Eventos de usuario
  const onPage = (event) => {
      setLazyParams(event);
  };

  const handleReload = () => {
      if (selectedDate) {
          const fechaStr = formatDateForBackend(selectedDate);
          fetchDeficienciasPaginadas(lazyParams.first, lazyParams.rows, fechaStr);
          fetchEstadisticas(fechaStr);
      }
  };

  // ==========================================
  // --- TEMPLATES DE PRIMEREACT ---
  // ==========================================
  const alimentadorTemplate = (rowData) => {
      if (!rowData.alimentador || rowData.alimentador === 'N/A') return <span className="text-gray-400">N/A</span>;
      const feederEncontrado = feeders?.find(f => f.alimInterno?.toString() === rowData.alimentador?.toString());
      return <span className="font-medium text-gray-800">{feederEncontrado ? feederEncontrado.label : rowData.alimentador}</span>;
  };
  
  const fechaTemplate = (rowData) => {
    if (!rowData.defiFecRegistro) return '-';
    return new Date(rowData.defiFecRegistro).toLocaleDateString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const criticidadTemplate = (rowData) => {
    const isCritical = rowData.defiEstadoCriticidad > 0;
    return <Badge value={rowData.defiEstadoCriticidad} severity={isCritical ? 'danger' : 'success'}></Badge>;
  };

  // --- MANEJO DE ESTADOS GLOBALES ---
  if (loadingFeeders || loadingCounts) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-500 animate-pulse">Analizando estado y elementos de la red...</p>
      </div>
    );
  }

  if (errorFeeders || errorDefs) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-4">
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700 max-w-md text-center shadow-sm">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2" />
          <h3 className="font-bold text-lg mb-1">Error de conexión</h3>
          <p className="text-sm text-red-600 mb-4">No se pudo conectar con el servidor.</p>
          <button onClick={handleReload} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2 mx-auto">
            <RotateCcw className="w-4 h-4" /> Reintentar
          </button>
        </div>
      </div>
    );
  }

  // --- VISTA PRINCIPAL ---
  return (
    <div className="space-y-4 animate-fade-in p-2 max-w-7xl mx-auto bg-slate-50/50 min-h-screen">

      {/* Header Compacto con Calendario */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Activity className="text-blue-600 w-6 h-6" />
            Dashboard Sigre Web
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">Resumen de infraestructura y deficiencias por fecha seleccionada.</p>
        </div>
        
        {/* NUEVO: Controles de Fecha y Refresco */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-1.5 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 px-2 border-r border-gray-200">
                <CalendarDays className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-600">Fecha:</span>
                <Calendar 
                    value={selectedDate} 
                    onChange={(e) => {
                        setSelectedDate(e.value);
                        // Reseteamos la página a 0 cuando cambian de fecha
                        setLazyParams({ first: 0, rows: 10, page: 0 }); 
                    }} 
                    dateFormat="dd/mm/yy" 
                    showIcon 
                    className="p-inputtext-sm w-36"
                />
            </div>
            <button onClick={handleReload} className="flex items-center justify-center gap-1.5 px-3 py-1.5 hover:bg-gray-50 text-gray-700 rounded-md text-xs font-medium transition-all">
                <RotateCcw className="w-3.5 h-3.5 text-blue-600" /> Refrescar
            </button>
        </div>
      </div>

      {/* Tarjetas de Resumen (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* KPI 1 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
            <Zap className="w-16 h-16 text-blue-600" />
          </div>
          <p className="text-sm font-medium text-gray-500 relative z-10">Total Alimentadores</p>
          <h3 className="text-4xl font-bold text-gray-900 relative z-10 mt-2">{totalFeeders}</h3>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
            <UtilityPole className="w-16 h-16 text-amber-500" />
          </div>
          <p className="text-sm font-medium text-gray-500 relative z-10">Total Postes</p>
          <h3 className="text-4xl font-bold text-amber-600 relative z-10 mt-2">
            {totalPostes > 0 ? totalPostes.toLocaleString() : '0'}
          </h3>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
            <Cable className="w-16 h-16 text-indigo-500" />
          </div>
          <p className="text-sm font-medium text-gray-500 relative z-10">Total Vanos </p>
          <h3 className="text-4xl font-bold text-indigo-600 relative z-10 mt-2">
            {totalVanos > 0 ? totalVanos.toLocaleString() : '0'}
          </h3>
        </div>

        {/* KPI 4: Deficiencias de la FECHA SELECCIONADA */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
            <AlertTriangle className="w-16 h-16 text-rose-500" />
          </div>
          <p className="text-sm font-medium text-gray-500 relative z-10">Deficiencias del Día</p>
          <h3 className="text-4xl font-bold text-rose-600 relative z-10 mt-2">
            {totalRecords.toLocaleString()}
          </h3>
        </div>
      </div>

      {/* SECCIÓN DE TABLAS (SPLITTER) */}
      <div className="card border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white">
        <Splitter style={{ height: '500px' }} className="border-none">
            
            {/* PANEL IZQUIERDO: Inspectores */}
            <SplitterPanel className="flex flex-col" size={30} minSize={20}>
                <div className="p-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                    <div className="p-1.5 bg-purple-100 text-purple-600 rounded-md"><Users className="w-4 h-4" /></div>
                    <h2 className="font-bold text-gray-800 text-sm">Actividad Inspectores</h2>
                </div>
                <div className="p-2 flex-1 overflow-auto">
                    <DataTable value={estadisticas} loading={loadingStats} size="small" stripedRows paginator rows={8} emptyMessage="No hay actividad para esta fecha.">
                        <Column field="nombreInspector" header="Inspector" style={{ fontSize: '0.75rem' }}></Column>
                        <Column field="postes" header="Postes" align="center" style={{ fontSize: '0.75rem' }}></Column>
                        <Column field="vanos" header="Vanos" align="center" style={{ fontSize: '0.75rem' }}></Column>
                        <Column field="total" header="Total" align="center" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}></Column>
                    </DataTable>
                </div>
            </SplitterPanel>

            {/* PANEL DERECHO: Detalles Técnicos (PAGINACIÓN LAZY) */}
            <SplitterPanel className="flex flex-col" size={70} minSize={50}>
                <div className="p-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                    <div className="p-1.5 bg-orange-100 text-orange-600 rounded-md"><Wrench className="w-4 h-4" /></div>
                    <h2 className="font-bold text-gray-800 text-sm">Registro de Deficiencias</h2>
                </div>
                <div className="p-2 flex-1 overflow-auto">
                    <DataTable 
                        value={deficiencies} 
                        lazy={true} 
                        first={lazyParams.first} 
                        rows={lazyParams.rows} 
                        totalRecords={totalRecords} 
                        onPage={onPage}
                        loading={loadingDefs} 
                        size="small" 
                        stripedRows 
                        paginator 
                        emptyMessage="No hay deficiencias registradas para esta fecha.">
                        
                        <Column field="alimentador" header="Alim." body={alimentadorTemplate} style={{ minWidth: '120px', fontSize: '0.75rem' }}></Column>
                        <Column field="sed" header="SED" style={{ fontSize: '0.75rem' }}></Column>
                        <Column field="defiCodigoElemento" header="Código" style={{ fontWeight: '600', color: '#3b82f6', fontSize: '0.75rem' }}></Column>
                        <Column field="defiEstadoCriticidad" header="Crit." body={criticidadTemplate} align="center" style={{ fontSize: '0.75rem' }}></Column>
                        <Column field="defiFecRegistro" header="Registro" body={fechaTemplate} style={{ fontSize: '0.75rem' }}></Column>
                    </DataTable>
                </div>
            </SplitterPanel>

        </Splitter>
      </div>
    </div>      
  );
}

export default DashboardHome;