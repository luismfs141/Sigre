import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// 1. IMPORTA TU CONTEXTO (Asegúrate que la ruta sea correcta)
import { DatosProvider } from './context/DatosContext'; // 👈 IMPORTANTE

// 2. Importamos el Layout Principal
import DashboardLayout from './layouts/DashboardLayout';

// 3. Importamos las Páginas
import Login from './pages/Login';
import DashboardHome from './pages/DashboardHome';
import Mapas from './pages/Mapas';
import Reportes from './pages/Reportes';
import AuditFileElectrical from './pages/WebInspectionManager';
import NuevoElemento from './pages/NuevoElemento';
import ImportData from './pages/ImportData';
import Subestaciones from './pages/Subestaciones';
import ImportacionMasivaFotos from './pages/ImportacionMasivaFotos';

function App() {
  return (
    // 4. ENVUELVE TODO EL CONTENIDO CON EL PROVIDER
    <DatosProvider> {/* 👈 AQUÍ EMPIEZA LA MAGIA */}
      
      <Routes>
        
        {/* RUTAS PÚBLICAS */}
        <Route path="/login" element={<Login />} />

        {/* RUTAS PRIVADAS (DASHBOARD) */}
        <Route element={<DashboardLayout />}>
          
          <Route path="/" element={<DashboardHome />} />
          <Route path="/mapas" element={<Mapas />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/subestaciones" element={<Subestaciones />} />
          <Route path="/nuevo-elemento" element={<NuevoElemento />} />
          <Route path="/auditoria-archivo" element={<AuditFileElectrical />} />
          <Route path="/importar-datos" element={<ImportData />} />
          <Route path="/importacion-masiva-fotos" element={<ImportacionMasivaFotos />} />
          
          <Route path="/configuracion" element={<div>Página de Configuración</div>} />
          
        </Route>

        {/* REDIRECCIÓN */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>

    </DatosProvider> // 👈 AQUÍ CIERRA EL PROVIDER
  );
}

export default App;