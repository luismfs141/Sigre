import React, { useState, useMemo } from 'react';
import { Search, Filter, Download, ChevronDown, ChevronUp } from 'lucide-react';

// --- DATOS DE EJEMPLO (MOCK DATA) ---
// Borra esto cuando conectes tu API real
const mockInspections = [
  { id: 1, elementCode: 'AL-001', elementType: 'Poste', substationName: 'Subestación A', inspectorName: 'Juan Pérez', inspectionDate: '2024-01-15', status: 'inspected', deficiencies: [] },
  { id: 2, elementCode: 'TR-052', elementType: 'Transformador', substationName: 'Subestación B', inspectorName: 'Ana Gomez', inspectionDate: '2024-01-18', status: 'deficient', deficiencies: [{ id: 1, severity: 'critical', code: 'Aceite Bajo' }] },
  { id: 3, elementCode: 'CB-104', elementType: 'Cableado', substationName: 'Subestación A', inspectorName: 'Carlos Diaz', inspectionDate: '2024-01-20', status: 'pending', deficiencies: [] },
];

// --- COMPONENTES AUXILIARES (BADGES) ---
const StatusBadge = ({ status }) => {
  const styles = {
    inspected: "bg-green-100 text-green-700 border-green-200",
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    deficient: "bg-red-100 text-red-700 border-red-200",
  };
  
  const labels = {
    inspected: "Inspeccionado",
    pending: "Pendiente",
    deficient: "Con Defectos"
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status] || "bg-gray-100 text-gray-600"}`}>
      {labels[status] || status}
    </span>
  );
};

const SeverityBadge = ({ severity }) => {
  const styles = {
    low: "bg-blue-100 text-blue-700",
    medium: "bg-orange-100 text-orange-700",
    critical: "bg-red-100 text-red-700 font-bold",
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider ${styles[severity] || "bg-gray-100"}`}>
      {severity}
    </span>
  );
};

// --- COMPONENTE PRINCIPAL ---
const Reports = () => {
  // Estados
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [substationFilter, setSubstationFilter] = useState('all');
  const [sortField, setSortField] = useState('inspectionDate');
  const [sortDirection, setSortDirection] = useState('desc');

  // Listas para filtros (En el futuro vendrán de tu API/BD)
  const substations = [{ id: 'Subestación A', name: 'Subestación A' }, { id: 'Subestación B', name: 'Subestación B' }];
  const elementTypes = ['Poste', 'Transformador', 'Cableado', 'Aislador'];

  // Lógica de Filtrado y Ordenamiento
  const filteredInspections = useMemo(() => {
    let result = [...mockInspections];

    // 1. Búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.elementCode.toLowerCase().includes(query) ||
          i.inspectorName.toLowerCase().includes(query) ||
          i.substationName.toLowerCase().includes(query)
      );
    }

    // 2. Filtros
    if (statusFilter !== 'all') {
      result = result.filter((i) => i.status === statusFilter);
    }
    if (substationFilter !== 'all') {
      result = result.filter((i) => i.substationName === substationFilter);
    }

    // 3. Ordenamiento
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'elementCode':
          comparison = a.elementCode.localeCompare(b.elementCode);
          break;
        case 'inspectionDate':
          comparison = new Date(a.inspectionDate) - new Date(b.inspectionDate);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'substationName':
          comparison = a.substationName.localeCompare(b.substationName);
          break;
        default:
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [searchQuery, statusFilter, substationFilter, sortField, sortDirection]);

  // Manejador de clic en cabeceras de tabla
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Icono de ordenamiento
  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  return (
    <div className="space-y-6 animate-fade-in p-6">
      
      {/* 1. Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reportes de Inspección</h1>
          <p className="text-gray-500 mt-1">Registros detallados y auditoría de la red.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors shadow-sm">
          <Download className="w-4 h-4" />
          Exportar Excel
        </button>
      </div>

      {/* 2. Barra de Filtros */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtros Avanzados</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar código, inspector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:border-gray-700"
            />
          </div>

          {/* Filtro Estado */}
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 dark:border-gray-700"
          >
            <option value="all">Todos los Estados</option>
            <option value="inspected">Inspeccionado</option>
            <option value="pending">Pendiente</option>
            <option value="deficient">Con Defectos</option>
          </select>

          {/* Filtro Subestación */}
          <select 
            value={substationFilter} 
            onChange={(e) => setSubstationFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 dark:border-gray-700"
          >
            <option value="all">Todas las Subestaciones</option>
            {substations.map((sub) => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>

        </div>
      </div>

      {/* 3. Conteo de Resultados */}
      <div className="text-sm text-gray-500">
        Mostrando {filteredInspections.length} de {mockInspections.length} registros
      </div>

      {/* 4. Tabla de Datos */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('elementCode')}>
                  Código <SortIcon field="elementCode" />
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700">Tipo</th>
                <th className="py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('substationName')}>
                  Subestación <SortIcon field="substationName" />
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700">Inspector</th>
                <th className="py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('inspectionDate')}>
                  Fecha <SortIcon field="inspectionDate" />
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>
                  Estado <SortIcon field="status" />
                </th>
                <th className="py-3 px-4 font-semibold text-gray-700">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredInspections.length > 0 ? (
                filteredInspections.map((inspection) => (
                  <tr key={inspection.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-gray-900 dark:text-white">
                      {inspection.elementCode}
                    </td>
                    <td className="py-3 px-4 text-gray-500">{inspection.elementType}</td>
                    <td className="py-3 px-4 text-gray-500">{inspection.substationName}</td>
                    <td className="py-3 px-4 text-gray-500">{inspection.inspectorName}</td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(inspection.inspectionDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={inspection.status} />
                    </td>
                    <td className="py-3 px-4">
                      {inspection.deficiencies && inspection.deficiencies.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {inspection.deficiencies.map((def) => (
                            <div key={def.id} className="flex items-center gap-2">
                              <SeverityBadge severity={def.severity} />
                              <span className="text-xs text-gray-500 truncate max-w-[150px]">
                                {def.code}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-500">
                    No se encontraron resultados para tu búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;