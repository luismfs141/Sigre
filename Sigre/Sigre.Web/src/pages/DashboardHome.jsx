import React, { useState, useEffect } from 'react';

// TUS HOOKS
import { useFeeder } from '../hooks/useFeeder';
import { useElements } from '../hooks/useElement';
import { useUltimasDeficiencias } from '../hooks/useUltimasDeficiencias';

// PRIMEREACT
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Badge } from 'primereact/badge';
import { Splitter, SplitterPanel } from 'primereact/splitter';

// LUCIDE ICONS (Actualizados con Poste y Cable)
import { Zap, AlertTriangle, RotateCcw, Activity, Users, Wrench, UtilityPole, Cable } from 'lucide-react';

function DashboardHome() {
  // 1. Instanciar Hooks
  const { feeders, loading: loadingFeeders, error: errorFeeders, reload: reloadFeeders } = useFeeder();
  const { fetchPostesChunk, fetchVanosChunk } = useElements();
  const { deficiencies, loading: loadingDefs, error: errorDefs, fetchUltimas } = useUltimasDeficiencias();

  // 2. Estados para los Totales de Elementos
  const [totalPostes, setTotalPostes] = useState(0);
  const [totalVanos, setTotalVanos] = useState(0);
  const [loadingCounts, setLoadingCounts] = useState(false);

  // Total de alimentadores calculado del hook de feeders
  const totalFeeders = feeders?.length || 0;

  // 3. Efecto para cargar toda la data inicial
  useEffect(() => {
    // Cargar la tabla de deficiencias
    fetchUltimas();

    // Cargar los conteos de Postes y Vanos
    const fetchCounts = async () => {
      setLoadingCounts(true);
      try {
        // Traemos solo 1 registro (skip: 0, take: 1) para que sea instantáneo
        // Solo nos interesa la propiedad 'totalRecords' que devuelve tu backend
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

  // Función para recargar todo manualmente desde el botón
  const handleReload = () => {
    //reloadFeeders();
    fetchUltimas();
  };
  // ==========================================
  // --- LÓGICA DE AGRUPACIÓN (INSPECTORES) ---
  // ==========================================
  const estadisticasInspectores = React.useMemo(() => {
      const stats = {};

      deficiencies.forEach((def) => {
          const inspector = def.nombreInspector || 'Sin asignar';
          
          // Si el inspector no existe en nuestro objeto temporal, lo creamos
          if (!stats[inspector]) {
              stats[inspector] = { nombreInspector: inspector, postes: 0, vanos: 0, total: 0 };
          }

          // Sumamos dependiendo del tipo
          if (def.defiTipoElemento === 'POST') {
              stats[inspector].postes += 1;
          } else if (def.defiTipoElemento === 'VANO') {
              stats[inspector].vanos += 1;
          }

          stats[inspector].total += 1;
      });

      // Convertimos el objeto resultante a un arreglo y lo ordenamos de mayor a menor total
      return Object.values(stats).sort((a, b) => b.total - a.total);
  }, [deficiencies]);

  // --- TEMPLATES DE PRIMEREACT ---
  // 1. NUEVO: Template para mostrar el Nombre del Alimentador en vez del ID
  const alimentadorTemplate = (rowData) => {
      if (!rowData.alimentador || rowData.alimentador === 'N/A') return <span className="text-gray-400">N/A</span>;
      
      // Buscamos el alimentador en la lista que trajimos con useFeeder
      // Convertimos a String para asegurar que coincidan (ej: 123 === "123")
      const feederEncontrado = feeders?.find(f => f.alimInterno?.toString() === rowData.alimentador?.toString());
      
      // Si lo encuentra, muestra el label ("Nombre - Codigo"). Si no, muestra el ID por defecto.
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

  const ubicacionTemplate = (rowData) => {
    if (!rowData.defiLatitud) return 'N/A';
    return <span className="font-mono text-xs text-gray-500">{`${rowData.defiLatitud.toFixed(4)}, ${rowData.defiLongitud.toFixed(4)}`}</span>;
  };

  // --- MANEJO DE ESTADOS DE CARGA Y ERROR GLOBALES ---
  // Muestra pantalla de carga si los alimentadores o los conteos principales están cargando
  if (loadingFeeders || loadingCounts) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-500 animate-pulse">Analizando estado y elementos de la red...</p>
      </div>
    );
  }

  // Si hay error en la data principal
  if (errorFeeders) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-4">
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700 max-w-md text-center shadow-sm">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2" />
          <h3 className="font-bold text-lg mb-1">Error de conexión</h3>
          <p className="text-sm text-red-600 mb-4">{errorFeeders}</p>
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

      {/* Header Compacto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-2">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Activity className="text-blue-600 w-6 h-6" />
            Dashboard Sigre Web
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">Resumen de infraestructura y últimas deficiencias registradas.</p>
        </div>
        <button onClick={handleReload} className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 shadow-sm text-xs font-medium transition-all">
          <RotateCcw className="w-3.5 h-3.5 text-blue-600" /> Refrescar Panel
        </button>
      </div>

      {/* Tarjetas de Resumen (KPIs) Modificadas con Postes y Vanos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* KPI 1: Alimentadores */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
            <Zap className="w-16 h-16 text-blue-600" />
          </div>
          <p className="text-sm font-medium text-gray-500 relative z-10">Total Alimentadores</p>
          <h3 className="text-4xl font-bold text-gray-900 relative z-10 mt-2">{totalFeeders}</h3>
        </div>

        {/* KPI 2: Postes */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
            <UtilityPole className="w-16 h-16 text-amber-500" />
          </div>
          <p className="text-sm font-medium text-gray-500 relative z-10">Total Postes</p>
          <h3 className="text-4xl font-bold text-amber-600 relative z-10 mt-2">
            {totalPostes > 0 ? totalPostes.toLocaleString() : '0'}
          </h3>
        </div>

        {/* KPI 3: Vanos */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
            <Cable className="w-16 h-16 text-indigo-500" />
          </div>
          <p className="text-sm font-medium text-gray-500 relative z-10">Total Vanos </p>
          <h3 className="text-4xl font-bold text-indigo-600 relative z-10 mt-2">
            {totalVanos > 0 ? totalVanos.toLocaleString() : '0'}
          </h3>
        </div>

        {/* KPI 4: Deficiencias Recientes */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-300">
            <AlertTriangle className="w-16 h-16 text-rose-500" />
          </div>
          <p className="text-sm font-medium text-gray-500 relative z-10">Deficiencias del Día</p>
          <h3 className="text-4xl font-bold text-rose-600 relative z-10 mt-2">
            {deficiencies.length}
          </h3>
        </div>
      </div>

      {/* SECCIÓN DE TABLAS CON PRIMEREACT */}
{/* 2. SPLITTER PARA LAS TABLAS */}
      <div className="card border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white">
        <Splitter style={{ height: '500px' }} className="border-none">
            
            {/* PANEL IZQUIERDO: Inspectores (Ancho inicial 30%) */}
            <SplitterPanel className="flex flex-col" size={30} minSize={20}>
                <div className="p-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                    <div className="p-1.5 bg-purple-100 text-purple-600 rounded-md"><Users className="w-4 h-4" /></div>
                    <h2 className="font-bold text-gray-800 text-sm">Actividad Inspectores</h2>
                </div>
                <div className="p-2 flex-1 overflow-auto">
                    <DataTable value={estadisticasInspectores} loading={loadingDefs} size="small" stripedRows paginator rows={8}>
                        <Column field="nombreInspector" header="Inspector" style={{ fontSize: '0.75rem' }}></Column>
                        <Column field="postes" header="Postes" align="center" style={{ fontSize: '0.75rem' }}></Column>
                        <Column field="vanos" header="Vanos" align="center" style={{ fontSize: '0.75rem' }}></Column>
                        <Column field="total" header="Total" align="center" style={{ fontWeight: 'bold', fontSize: '0.75rem' }}></Column>
                    </DataTable>
                </div>
            </SplitterPanel>

            {/* PANEL DERECHO: Detalles Técnicos (Ancho inicial 70%) */}
            <SplitterPanel className="flex flex-col" size={70} minSize={50}>
                <div className="p-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                    <div className="p-1.5 bg-orange-100 text-orange-600 rounded-md"><Wrench className="w-4 h-4" /></div>
                    <h2 className="font-bold text-gray-800 text-sm">Últimas Deficiencias</h2>
                </div>
                <div className="p-2 flex-1 overflow-auto">
                    <DataTable value={deficiencies} loading={loadingDefs} size="small" stripedRows paginator rows={8}>
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