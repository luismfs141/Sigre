import React, { useState, useEffect } from 'react';
import './assetss/css/Generalbar.css';
import { Routes, Route, useNavigate } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Grupos from './pages/Grupos';
import Menu from './pages/Menu';
import Estado from './pages/Estado';
import Sorteos from './pages/Sorteos';
import Cronograma from './pages/Cronograma';
import Soporte from './pages/Soporte';
import LoginForm from './pages/Login';
import Personal from './pages/Personal'
import Empresa from './pages/Empresa';
import RegistroCliente from './pages/RegistroCliente';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Verificar si el usuario está autenticado al montar el componente
  useEffect(() => {
    if (localStorage.getItem('usuario') === "undefined") {
        localStorage.removeItem('usuario');
    }

    const usuarioData = localStorage.getItem('usuario');
    if (usuarioData) {
      setIsAuthenticated(true);
    }
  }, []);

  // Función para manejar el login
  const handleLogin = () => {
    setIsAuthenticated(true);
    navigate("/Menu"); // Redirige a la página principal después de iniciar sesión
  };

  // Función para manejar el logout
  const handleLogout = () => {
    localStorage.removeItem('usuario'); // Eliminar los datos del cliente de localStorage
    setIsAuthenticated(false); // Cambiar el estado de autenticación
    navigate("/Login"); // Redirigir al login
  };

  return (
    <div>
      {/* Mostrar el LoginForm solo si no está autenticado */}
      {!isAuthenticated ? (
        <Routes>
          <Route path="/" element={<LoginForm onLogin={handleLogin} />} />
          <Route path="/Login" element={<LoginForm onLogin={handleLogin} />} />  
        </Routes>
      ) : (
        <>
          <Sidebar />
          <section id="content">
            <Navbar onLogout={handleLogout} />
            <Routes>
              <Route path="/Personal" element={<Personal />} />
              <Route path="/Empresa" element={<Empresa />} />
              <Route path="/Menu" element={<Menu />} />
              <Route path="/Grupos" element={<Grupos />} />
              <Route path="/Estado" element={<Estado />} />
              <Route path="/Sorteos" element={<Sorteos />} />
              <Route path="/Cronograma" element={<Cronograma />} />
              <Route path="/Soporte" element={<Soporte />} />
            </Routes>
          </section>
        </>
      )}
    </div>
  );
}

export default App;