import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Map as MapIcon, 
  Building2, 
  ChevronLeft,
  ChevronRight,
  Zap,
  ClipboardCheck,
  FileSearch,
  X 
} from 'lucide-react';
import { cn } from '../lib/utils';


const navItems = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  { title: 'Mapas', href: '/mapas', icon: MapIcon },
  { title: 'Reportes', href: '/reportes', icon: FileText },
  {title: 'Elementos', href: '/elemento', icon: FileText },
  { title: 'Deficiencias ', href: '/subestaciones', icon: Building2 },
  { title: 'Nuevo Elemento', href: '/nuevo-elemento', icon: ClipboardCheck },
  { title: 'Archivos', href: '/auditoria-archivo', icon: FileSearch },
  { title: 'Importar Datos', href: '/importar-datos', icon: FileSearch },
  { title: 'Importación Masiva Fotos', href: '/importacion-masiva-fotos', icon: FileSearch },
];

export function Sidebar({ className, onClose }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        'bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border h-full',
        collapsed ? 'w-16' : 'w-64',
        // Fusionamos clases externas si vienen desde el padre (útil para el móvil)
        className
      )}
    >
      {/* --- Header --- */}
      <div className={cn(
        'h-16 flex items-center px-4 border-b border-sidebar-border',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-sm font-bold text-sidebar-primary leading-none">Sigre Web</h1>
              <p className="text-[10px] text-sidebar-foreground/60 uppercase mt-1">Gestión Red</p>
            </div>
          )}
        </div>
        
        {/* Botón X visible solo si se pasa la función onClose (modo móvil) */}
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1 hover:bg-sidebar-accent rounded-md">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* --- Navegación --- */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon; // En JSX asignamos el componente a una variable con Mayúscula

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onClose} // Cerramos menú al clickear (UX Móvil)
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group relative',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.title : undefined}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-sidebar-primary")} />
              
              {!collapsed && <span>{item.title}</span>}
              
              {/* Indicador visual cuando está colapsado y activo */}
              {collapsed && isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-sidebar-primary rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* --- Footer Toggle (Solo Escritorio) --- */}
      <div className="p-3 border-t border-sidebar-border hidden md:block">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex items-center justify-center w-full py-2 hover:bg-sidebar-accent/50 rounded-md text-sidebar-foreground/60',
            !collapsed && 'justify-start px-2 gap-3'
          )}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!collapsed && <span className="text-xs font-medium">COLLAPSE</span>}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;