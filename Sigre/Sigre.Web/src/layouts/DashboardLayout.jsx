import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar'; // <--- 1. IMPORTAR NAVBAR
import { Menu, Zap } from 'lucide-react';

export default function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Función simple para manejar el logout desde el layout
  const handleLogout = () => {
    console.log("Sesión cerrada");
    // Aquí podrías limpiar localStorage también si no lo hace el Navbar internamente
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background w-full overflow-hidden">
      
      {/* 1. SIDEBAR ESCRITORIO */}
      <div className="hidden md:flex h-full flex-shrink-0">
        <Sidebar />
      </div>

      {/* 2. AREA PRINCIPAL (Columna derecha) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* A. HEADER MÓVIL (Existente - Solo visible en móvil) */}
        <header className="h-16 border-b border-border flex items-center justify-between px-4 md:hidden bg-card flex-shrink-0 z-20">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
             </div>
             <span className="font-bold text-foreground">Sigre Web</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 hover:bg-accent rounded-md text-foreground"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* B. NAVBAR (NUEVO - Solo visible en escritorio) */}
        {/* Usamos 'hidden md:block' para que no se pelee con el header móvil */}
        <div className="hidden md:block w-full z-10">
           <Navbar onLogout={handleLogout} />
        </div>

        {/* C. CONTENIDO DE LAS PÁGINAS */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background relative z-0">
            <Outlet /> 
        </main>

      </div>

      {/* 3. MENÚ MÓVIL (DRAWER) */}
      {/* Fondo oscuro (Overlay) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Contenedor deslizable del menú */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-sidebar shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setIsMobileMenuOpen(false)} className="w-full h-full border-none" />
      </div>

    </div>
  );
}