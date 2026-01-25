import React, { useState, useEffect } from 'react';
import { useFeeder } from '../hooks/useFeeder';
import { Chart } from 'primereact/chart'; // 1. IMPORTAR CHART
import { Zap, AlertTriangle, RotateCcw, PieChart } from 'lucide-react';

function DashboardHome() {
  const { feeders, loading, error, reload } = useFeeder();

  // Estados para la gráfica
  const [chartData, setChartData] = useState({});
  const [chartOptions, setChartOptions] = useState({});

  // Métricas simples
  const totalFeeders = feeders?.length || 0;
  
  // 2. PREPARAR DATOS DEL GRÁFICO (Se ejecuta cuando llegan los 'feeders')
  useEffect(() => {
    if (feeders) {
        // Lógica de ejemplo: Contar Activos vs Inactivos
        // Ajusta 'alimActivo' al nombre real de tu campo booleano
        const activos = feeders.filter(f => f.alimActivo === true || f.alimActivo === 1).length;
        const inactivos = totalFeeders - activos;

        const data = {
            labels: ['Activos', 'Inactivos'],
            datasets: [
                {
                    data: [activos, inactivos],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)', // Azul (Tailwind blue-500)
                        'rgba(239, 68, 68, 0.8)'   // Rojo (Tailwind red-500)
                    ],
                    hoverBackgroundColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(239, 68, 68, 1)'
                    ],
                    borderWidth: 0
                }
            ]
        };

        const options = {
            cutout: '60%', // Hace el agujero de la dona
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        color: '#64748b' // Slate-500
                    }
                }
            },
            maintainAspectRatio: false // Permite que se ajuste al contenedor CSS
        };

        setChartData(data);
        setChartOptions(options);
    }
  }, [feeders, totalFeeders]);


  // --- ESTADO DE CARGA ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-500 animate-pulse">Cargando información de la red...</p>
      </div>
    );
  }

  // --- ESTADO DE ERROR ---
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-4">
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700 max-w-md text-center shadow-sm">
          <div className="flex justify-center mb-2">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="font-bold text-lg mb-1">Error al cargar datos</h3>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button onClick={reload} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2 mx-auto">
            <RotateCcw className="w-4 h-4" /> Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  // --- VISTA PRINCIPAL ---
  return (
    <div className="space-y-6 animate-fade-in p-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Panel de Control</h1>
          <p className="text-gray-500 text-sm">Resumen general de la red de distribución eléctrica.</p>
        </div>
        <button onClick={reload} className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium">
          <RotateCcw className="w-4 h-4" /> Actualizar
        </button>
      </div>

      {/* Tarjetas de Resumen (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Alimentadores</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{totalFeeders}</h3>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-full">
            <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        
        {/* Puedes agregar más tarjetas aquí si quieres */}
      </div>

      {/* 3. SECCIÓN DE CONTENIDO: TABLA + GRÁFICO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA (TABLA) - Ocupa 2 espacios */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h2 className="font-semibold text-gray-800 dark:text-white">Alimentadores Recientes</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-200 font-medium">
                        <tr>
                            <th className="px-6 py-3">Nombre</th>
                            <th className="px-6 py-3">Código</th>
                            <th className="px-6 py-3">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {feeders && feeders.length > 0 ? (
                        feeders.slice(0, 5).map((feeder) => (
                        <tr key={feeder.alimInterno || Math.random()} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                {feeder.alimEtiqueta || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-gray-500">
                                {feeder.alimCodigo || '-'}
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs ${feeder.alimActivo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {feeder.alimActivo ? 'Activo' : 'Inactivo'}
                                </span>
                            </td>
                        </tr>
                        ))
                    ) : (
                        <tr><td colSpan="3" className="text-center p-4 text-gray-500">Sin datos</td></tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* COLUMNA DERECHA (GRÁFICO) - Ocupa 1 espacio */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center justify-center">
            <h2 className="font-semibold text-gray-800 dark:text-white mb-4 w-full flex items-center gap-2">
                <PieChart className="w-4 h-4 text-gray-500"/> Estado de la Red
            </h2>
            
            {/* AQUÍ ESTÁ TU GRÁFICO */}
            <div className="w-full flex justify-center h-[250px]">
                {totalFeeders > 0 ? (
                     <Chart type="doughnut" data={chartData} options={chartOptions} className="w-full md:w-30rem" />
                ) : (
                    <div className="flex items-center justify-center text-gray-400 text-sm">No hay datos para graficar</div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}

export default DashboardHome;