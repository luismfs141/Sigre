import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// 1. Importamos el Layout Principal (El que tiene Sidebar + Navbar)
import DashboardLayout from './layouts/DashboardLayout';

// 2. Importamos las Páginas
import Login from './pages/Login';
import DashboardHome from './pages/DashboardHome';
import Mapas from './pages/Mapas';
import Reportes from './pages/Reportes';
import AuditFileElectrical from './pages/AuditFileElectrical';
import AuditElectrical from './pages/AuditElectrical';
import ImportData from './pages/ImportData';
function App() {
  return (
    <Routes>
      
      {/* =======================================================
          RUTAS PÚBLICAS
          (No tienen Sidebar ni Navbar, ocupan toda la pantalla)
      ======================================================== */}
      <Route path="/login" element={<Login />} />


      {/* =======================================================
          RUTAS PRIVADAS (DASHBOARD)
          Todas estas rutas usarán automáticamente el Sidebar y el Navbar
          porque están "dentro" del DashboardLayout.
      ======================================================== */}
      <Route element={<DashboardLayout />}>
        
        {/* Ruta principal (Dashboard) */}
        <Route path="/" element={<DashboardHome />} />
        
        {/* Otras secciones */}
        <Route path="/mapas" element={<Mapas />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/subestaciones" element={<div>Página de Subestaciones</div>} />
        <Route path="/auditoria-electrica" element={<AuditElectrical />} />
        <Route path="/auditoria-archivo" element={<AuditFileElectrical />} />
        <Route path="/importar-datos" element={<ImportData />} />
        
        {/* Ejemplo de ruta sin componente creado aún */}
        <Route path="/configuracion" element={<div>Página de Configuración</div>} />
        
      </Route>


      {/* =======================================================
          REDIRECCIÓN POR DEFECTO
          Si el usuario entra a una ruta que no existe, lo mandamos al inicio
      ======================================================== */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}

export default App;