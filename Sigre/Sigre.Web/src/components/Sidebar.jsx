import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  X,
  LogOut,
  User // <-- Importamos íconos adicionales para el usuario
} from 'lucide-react';
import { cn } from '../lib/utils';
// 👇 Importamos el hook de usuario
import { useUsuario } from '../hooks/useUsuario';

const navItems = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  { title: 'Mapas', href: '/mapas', icon: MapIcon },
  { title: 'Nuevo Elemento', href: '/nuevo-elemento', icon: ClipboardCheck },
  { title: 'Elementos', href: '/elemento', icon: FileText },
  { title: 'Deficiencias', href: '/subestaciones', icon: Building2 },
  { title: 'Archivos', href: '/auditoria-archivo', icon: FileSearch },
  { title: 'Reportes', href: '/reportes', icon: FileText },
  { title: 'Importar Datos', href: '/importar-datos', icon: FileSearch },
  { title: 'Importación Masiva Fotos', href: '/importacion-masiva-fotos', icon: FileSearch },
];

export function Sidebar({ className, onClose, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // 👇 Extraemos las funciones de usuario
  const { logoutUsuario, getUsuarioLocalStorage } = useUsuario();
  const [usuario, setUsuario] = useState(null);
  const [nombreUsuario, setNombreUsuario] = useState("Invitado");

  // Efecto para cargar los datos del usuario al montar el Sidebar
// Efecto para cargar los datos del usuario al montar el Sidebar
  useEffect(() => {
    const usuarioData = getUsuarioLocalStorage(); 
    if (usuarioData) {
      setUsuario(usuarioData);
      setNombreUsuario(usuarioData.username || usuarioData.nombre || "Administrador");
    }
    // Desactivamos la advertencia de ESLint porque sabemos que esta función no cambiará
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 👇 Función para manejar el cierre de sesión
  const handleLogout = (e) => {
    e.preventDefault();
    logoutUsuario(); // Limpia localStorage y cookies
    if (onLogout) onLogout(); // Avisa a App.js (si es necesario)
    navigate("/login"); // Redirige al login
  };

  return (
    <aside
      className={cn(
        'relative z-50 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border h-full transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* --- Header --- */}
      <div className={cn(
        'h-16 flex items-center px-4 border-b border-sidebar-border flex-shrink-0',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            // Quitamos 'overflow-hidden' de aquí
            <div className="flex flex-col">
              {/* Quitamos 'truncate' y agregamos 'whitespace-nowrap' para que no se parta */}
              <h1 className="text-sm font-bold text-sidebar-primary leading-none whitespace-nowrap">Sigre Web</h1>
              <p className="text-[10px] text-sidebar-foreground/60 uppercase mt-1 whitespace-nowrap">Gestión Red</p>
            </div>
          )}
        </div>
        
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1 hover:bg-sidebar-accent rounded-md">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* --- Navegación Principal --- */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group relative',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.title : undefined}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0 transition-colors", isActive && "text-sidebar-primary")} />
              
              {!collapsed && <span className="whitespace-normal leading-tight text-sm">{item.title}</span>}
              
              {collapsed && isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-sidebar-primary rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* --- Sección de Usuario y Logout (Abajo) --- */}
      <div className="mt-auto border-t border-sidebar-border p-3 flex-shrink-0 space-y-2">
        
        {/* Perfil del Usuario */}
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-md bg-sidebar-accent/30 border border-sidebar-border/50",
          collapsed ? "justify-center" : "justify-start"
        )}>
          <div className="w-5 h-5 bg-blue-100/10 rounded-full flex items-center justify-center border border-blue-500/20 flex-shrink-0">
             <User className="w-4 h-4 text-blue-500" />
          </div>
          {!collapsed && (
             <div className="overflow-hidden">
               <p className="text-sm font-medium text-sidebar-foreground truncate" title={nombreUsuario}>
                 {nombreUsuario}
               </p>
               <p className="text-xs text-sidebar-foreground/50 truncate">
                 {usuario?.rol || "Administrador"}
               </p>
             </div>
          )}
        </div>

        {/* Botón de Cerrar Sesión */}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center w-full py-2 px-3 rounded-md transition-colors text-red-500 hover:bg-red-500/10 hover:text-red-600',
            collapsed ? 'justify-center' : 'justify-start gap-3'
          )}
          title={collapsed ? "Cerrar sesión" : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium truncate">Cerrar Sesión</span>}
        </button>

        {/* Botón Colapsar Sidebar (Solo Desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'hidden md:flex items-center w-full py-2 px-3 hover:bg-sidebar-accent/50 rounded-md text-sidebar-foreground/60 transition-colors mt-1',
            collapsed ? 'justify-center' : 'justify-start gap-3'
          )}
        >
          {collapsed ? <ChevronRight className="w-5 h-5 flex-shrink-0" /> : <ChevronLeft className="w-5 h-5 flex-shrink-0" />}
          {!collapsed && <span className="text-xs font-medium tracking-wider">OCULTAR MENÚ</span>}
        </button>
      </div>

    </aside>
  );
}

export default Sidebar;