import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  FileText,
  Map as MapIcon,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Zap,
  ClipboardCheck,
  FileSearch,
  X,
  LogOut,
  User,
  UploadCloud,
  Settings,
  Wrench,
  Users,
  SearchCheck,
} from "lucide-react";

import { cn } from "../lib/utils";
import { useUsuario } from "../hooks/useUsuario";

/* ============================================================
   MENÚ PRINCIPAL
============================================================ */

const navItems = [
  {
    title: "MAPAS",
    icon: MapIcon,
    children: [
      {
        title: "Mapas",
        href: "/mapas",
        icon: MapIcon,
      },
    ],
  },

  {
    title: "ELEMENTOS",
    icon: FileText,
    children: [
      {
        title: "Elementos",
        href: "/elemento",
        icon: FileText,
      },
    ],
  },

  {
    title: "INSPECCIÓN",
    icon: ClipboardCheck,
    children: [
      {
        title: "Deficiencias",
        href: "/subestaciones",
        icon: Building2,
      },
      {
        title: "Importar Datos",
        href: "/importar-datos",
        icon: FileSearch,
      },
      {
        title: "Importación Masiva de Fotos",
        href: "/importacion-masiva-fotos",
        icon: UploadCloud,
      },
      {
        title: "Nueva Importación Masiva",
        href: "/importacion-masiva-inversa",
        icon: FileSearch,
      },
    ],
  },

  {
    title: "REPORTES",
    icon: FileText,
    children: [
      {
        title: "Reporte Maestro",
        href: "/reporteMaestro",
        icon: SearchCheck,
      },
      {
        title: "Reportes",
        href: "/reportes",
        icon: FileText,
      },
      {
        title: "Estadísticas",
        href: "/estadisticas",
        icon: ClipboardCheck,
      },
      {
        title: "Archivos",
        href: "/auditoria-archivo",
        icon: FileSearch,
      },
    ],
  },

  {
    title: "USUARIOS",
    icon: Users,
    children: [
      {
        title: "Usuarios",
        href: "/usuarios",
        icon: User,
      },
    ],
  },

  {
    title: "CONFIGURACIÓN",
    icon: Settings,
    children: [
      {
        title: "Configuración",
        href: "/configuracion",
        icon: Settings,
      },
    ],
  },

  {
    title: "UTILIDADES",
    icon: Wrench,
    children: [
      {
        title: "Migración a AWS S3",
        href: "/AwsSubida",
        icon: UploadCloud,
      },
      {
        title: "Actualizar Base-Reportes",
        href: "/ActualizarDeficiencias",
        icon: UploadCloud,
      },
      {
        title: "Agregar Tramos",
        href: "/agregar-tramos",
        icon: UploadCloud,
      },
    ],
  },
];

/* ============================================================
   SIDEBAR
============================================================ */

export function Sidebar({ className, onClose, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const { logoutUsuario, getUsuarioLocalStorage } = useUsuario();

  const [usuario, setUsuario] = useState(null);
  const [nombreUsuario, setNombreUsuario] = useState("Invitado");

  /* ============================================================
     MENÚS ABIERTOS
  ============================================================ */

  const [openMenus, setOpenMenus] = useState({});

  /* ============================================================
     CARGAR USUARIO
  ============================================================ */

  useEffect(() => {
    const usuarioData = getUsuarioLocalStorage();

    if (usuarioData) {
      setUsuario(usuarioData);

      setNombreUsuario(
        usuarioData.username || usuarioData.nombre || "Administrador",
      );
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ============================================================
     ABRIR AUTOMÁTICAMENTE EL MENÚ ACTIVO
  ============================================================ */

  useEffect(() => {
    const menusActivos = {};

    navItems.forEach((menu) => {
      const tieneRutaActiva = menu.children?.some(
        (child) => location.pathname === child.href,
      );

      if (tieneRutaActiva) {
        menusActivos[menu.title] = true;
      }
    });

    setOpenMenus((prev) => ({
      ...prev,
      ...menusActivos,
    }));
  }, [location.pathname]);

  /* ============================================================
     TOGGLE MENÚ
  ============================================================ */

  const toggleMenu = (menuTitle) => {
    if (collapsed) {
      setCollapsed(false);
    }

    setOpenMenus((prev) => ({
      ...prev,
      [menuTitle]: !prev[menuTitle],
    }));
  };

  /* ============================================================
     LOGOUT
  ============================================================ */

  const handleLogout = (e) => {
    e.preventDefault();

    logoutUsuario();

    if (onLogout) {
      onLogout();
    }

    navigate("/login");
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <aside
      className={cn(
        "relative z-50 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border h-full transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className,
      )}
    >
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        className={cn(
          "h-16 flex items-center px-4 border-b border-sidebar-border flex-shrink-0",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        <div className="flex items-center gap-3">
          {/* LOGO */}

          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>

          {/* NOMBRE */}

          {!collapsed && (
            <div className="flex flex-col">
              <h1 className="text-sm font-bold text-sidebar-primary leading-none whitespace-nowrap">
                Sigre MT
              </h1>

              <p className="text-[10px] text-sidebar-foreground/60 uppercase mt-1 whitespace-nowrap">
                Gestión Red
              </p>
            </div>
          )}
        </div>

        {/* CERRAR EN MOBILE */}

        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1 hover:bg-sidebar-accent rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ======================================================
          NAVEGACIÓN
      ====================================================== */}

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
        {/* ====================================================
            DASHBOARD
        ==================================================== */}

        <Link
          to="/"
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group relative",

            location.pathname === "/"
              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",

            collapsed && "justify-center px-2",
          )}
          title={collapsed ? "Dashboard" : undefined}
        >
          <LayoutDashboard
            className={cn(
              "w-5 h-5 flex-shrink-0",

              location.pathname === "/" ? "text-sidebar-primary" : "",
            )}
          />

          {!collapsed && <span className="text-sm">Dashboard</span>}

          {collapsed && location.pathname === "/" && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-sidebar-primary rounded-r-full" />
          )}
        </Link>

        {/* ====================================================
            SEPARADOR
        ==================================================== */}

        <div className="my-2 border-t border-sidebar-border/50" />

        {/* ====================================================
            MENÚS
        ==================================================== */}

        {navItems.map((menu) => {
          const MenuIcon = menu.icon;

          const isMenuActive = menu.children?.some(
            (child) => location.pathname === child.href,
          );

          const isOpen = openMenus[menu.title] && !collapsed;

          return (
            <div key={menu.title} className="space-y-1">
              {/* =================================================
                  BOTÓN PRINCIPAL
              ================================================= */}

              <button
                type="button"
                onClick={() => toggleMenu(menu.title)}
                className={cn(
                  "flex items-center w-full gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group relative",

                  isMenuActive
                    ? "bg-sidebar-accent/70 text-sidebar-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",

                  collapsed && "justify-center px-2",
                )}
                title={collapsed ? menu.title : undefined}
              >
                <MenuIcon
                  className={cn(
                    "w-5 h-5 flex-shrink-0 transition-colors",

                    isMenuActive ? "text-sidebar-primary" : "",
                  )}
                />

                {!collapsed && (
                  <>
                    <span className="text-sm flex-1 text-left">
                      {menu.title}
                    </span>

                    <ChevronDown
                      className={cn(
                        "w-4 h-4 transition-transform duration-200",

                        isOpen ? "rotate-180" : "",
                      )}
                    />
                  </>
                )}

                {/* INDICADOR CUANDO ESTÁ COLAPSADO */}

                {collapsed && isMenuActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-sidebar-primary rounded-r-full" />
                )}
              </button>

              {/* =================================================
                  SUBMENÚ
              ================================================= */}

              {!collapsed && isOpen && (
                <div className="ml-4 pl-3 border-l border-sidebar-border/60 space-y-1">
                  {menu.children.map((child) => {
                    const ChildIcon = child.icon;

                    const isActive = location.pathname === child.href;

                    return (
                      <Link
                        key={child.href}
                        to={child.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group",

                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                        )}
                      >
                        <ChildIcon
                          className={cn(
                            "w-4 h-4 flex-shrink-0",

                            isActive ? "text-sidebar-primary" : "",
                          )}
                        />

                        <span className="text-sm leading-tight">
                          {child.title}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ======================================================
          USUARIO / LOGOUT
      ====================================================== */}

      <div className="mt-auto border-t border-sidebar-border p-3 flex-shrink-0 space-y-2">
        {/* ====================================================
            PERFIL
        ==================================================== */}

        <div
          className={cn(
            "flex items-center gap-3 p-2 rounded-md bg-sidebar-accent/30 border border-sidebar-border/50",

            collapsed ? "justify-center" : "justify-start",
          )}
        >
          <div className="w-6 h-6 bg-blue-100/10 rounded-full flex items-center justify-center border border-blue-500/20 flex-shrink-0">
            <User className="w-4 h-4 text-blue-500" />
          </div>

          {!collapsed && (
            <div className="overflow-hidden">
              <p
                className="text-sm font-medium text-sidebar-foreground truncate"
                title={nombreUsuario}
              >
                {nombreUsuario}
              </p>

              <p className="text-xs text-sidebar-foreground/50 truncate">
                {usuario?.rol || "Administrador"}
              </p>
            </div>
          )}
        </div>

        {/* ====================================================
            CERRAR SESIÓN
        ==================================================== */}

        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center w-full py-2 px-3 rounded-md transition-colors text-red-500 hover:bg-red-500/10 hover:text-red-600",

            collapsed ? "justify-center" : "justify-start gap-3",
          )}
          title={collapsed ? "Cerrar sesión" : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />

          {!collapsed && (
            <span className="text-sm font-medium truncate">Cerrar Sesión</span>
          )}
        </button>

        {/* ====================================================
            COLAPSAR
        ==================================================== */}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "hidden md:flex items-center w-full py-2 px-3 hover:bg-sidebar-accent/50 rounded-md text-sidebar-foreground/60 transition-colors mt-1",

            collapsed ? "justify-center" : "justify-start gap-3",
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 flex-shrink-0" />
          ) : (
            <ChevronLeft className="w-5 h-5 flex-shrink-0" />
          )}

          {!collapsed && (
            <span className="text-xs font-medium tracking-wider">
              OCULTAR MENÚ
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
