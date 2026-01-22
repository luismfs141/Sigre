import React from 'react';
import { useFeeder } from '../hooks/useFeeder'; 
import { Zap, Activity, AlertTriangle, MapPin, RotateCcw } from 'lucide-react';

function DashboardHome() {
  // 1. Desestructuramos datos del hook
  const { feeders, loading, error, reload } = useFeeder(); 

  // Métricas
  const totalFeeders = feeders?.length || 0;
  const feedersConError = feeders?.filter(f => f.status === 'error').length || 0; 

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
          
          <button 
            onClick={reload}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2 mx-auto"
          >
            <RotateCcw className="w-4 h-4" /> Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  // --- VISTA PRINCIPAL ---
  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Panel de Control</h1>
          <p className="text-gray-500 text-sm">Resumen general de la red de distribución eléctrica.</p>
        </div>
        <button 
          onClick={reload}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium"
        >
          <RotateCcw className="w-4 h-4" /> Actualizar
        </button>
      </div>

      {/* Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Alimentadores</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{totalFeeders}</h3>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-full">
            <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        {/* ... Resto de las tarjetas ... */}
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* ... Contenido de la tabla ... */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h2 className="font-semibold text-gray-800 dark:text-white">Alimentadores Recientes</h2>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                {/* ... Tbody y Thead ... */}
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {feeders && feeders.length > 0 ? (
                    feeders.slice(0, 5).map((feeder) => (
                    <tr key={feeder.id || feeder.AlimInterno || Math.random()} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4">
                            {feeder.Nombre || `Alim. ${feeder.AlimInterno || 'N/A'}`}
                        </td>
                        {/* ... resto de celdas ... */}
                    </tr>
                    ))
                ) : (
                    <tr><td colSpan="4" className="text-center p-4">Sin datos</td></tr>
                )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}

// ✅ EXPORT AL FINAL (Esto es lo que pediste)
export default DashboardHome;