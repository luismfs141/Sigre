import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// 👇 1. IMPORTAMOS EL HOOK CON EL NOMBRE CORRECTO
import { useUsuario } from '../hooks/useUsuario'; 
import { Calendar, Bell, User, LogOut, Menu, ChevronDown } from 'lucide-react';

function Navbar({ onLogout }) {
  const navigate = useNavigate();

  // 👇 2. USAMOS EL HOOK 'useUsuario'
  // Destructuramos las funciones que exportamos en el paso anterior
  const { logoutUsuario, getUsuarioLocalStorage } = useUsuario();

  const [usuario, setUsuario] = useState(null);
  const [nombreUsuario, setNombreUsuario] = useState(null);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [period, setPeriod] = useState("january-2025");

  // Efecto para leer el usuario al cargar el componente
  useEffect(() => {
    if (!isInitialized) {
      // 👇 3. AHORA ESTA FUNCIÓN SÍ EXISTE
      const usuarioData = getUsuarioLocalStorage(); 
      
      if (usuarioData) {
        setUsuario(usuarioData);
        // Ajusta 'username' según cómo se llame la propiedad en tu BD (ej: 'nombre', 'email', etc.)
        setNombreUsuario(usuarioData.username || usuarioData.nombre || "Adminsistrador");
      }
      setIsInitialized(true); 
    }
  }, [isInitialized, getUsuarioLocalStorage]); 

  const toggleDropdown = () => {
    setIsDropdownVisible(!isDropdownVisible);
  };

  const handleLogout = (e) => {
    e.preventDefault();
    
    // 👇 4. LLAMAMOS AL LOGOUT DEL HOOK
    logoutUsuario(); 
    
    if (onLogout) onLogout();
    navigate("/login");
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 w-full sticky top-0 z-50">
      
      {/* --- IZQUIERDA: Menú Móvil y Selector --- */}
      <div className="flex items-center gap-4">
        {/* Botón Hamburguesa (Solo visible en móvil) */}
        <button className="p-2 hover:bg-gray-100 rounded-md text-gray-600 md:hidden toggle-sidebar">
          <Menu className="w-5 h-5" />
        </button>

        {/* Selector de Fecha (Visible en escritorio) */}
        <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-transparent border-none text-sm focus:ring-0 cursor-pointer text-gray-700 outline-none w-[140px]"
          >
            <option value="january-2025">Enero 2025</option>
            <option value="december-2024">Diciembre 2024</option>
          </select>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </div>
      </div>

      {/* --- DERECHA: Notificaciones y Perfil --- */}
      <div className="flex items-center gap-3">
        {/* Campana */}
        <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Perfil Usuario */}
        <div className="relative">
          <button 
            onClick={toggleDropdown} 
            className="flex items-center gap-3 pl-2 hover:opacity-80 transition-opacity focus:outline-none"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {usuario ? nombreUsuario : "Invitado"}
              </p>
              <p className="text-xs text-gray-500">
                 {/* Ajusta 'rol' según tu BD */}
                {usuario?.rol || "Usuario"}
              </p>
            </div>
            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200 overflow-hidden">
               <User className="w-5 h-5 text-blue-600" />
            </div>
          </button>

          {/* Menú Desplegable */}
          {isDropdownVisible && (
            <div className="absolute right-0 mt-3 w-48 bg-white rounded-md shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
                <p className="text-sm font-medium text-gray-900">{nombreUsuario}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;