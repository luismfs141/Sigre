import React, { useState } from 'react';
import logo from '../assetss/resources/images/logo.png';
import { Link, useLocation } from 'react-router-dom';
import '../assetss/css/Sidebar.css'; // 👈 estilos exclusivos

const Sidebar = () => {
  const location = useLocation();
  const [openElements, setOpenElements] = useState(false);

  return (
    <div className="sidebar d-flex flex-column">
      {/* Logo */}
      <div className="sidebar-logo">
        <img src={logo} alt="Logo" className="img-fluid" />
      </div>

      {/* Links */}
      <div className="list-group list-group-flush flex-grow-1">
        <Link 
          to="/dashboard" 
          className={`list-group-item d-flex align-items-center ${location.pathname === "/dashboard" ? "active" : ""}`}
        >
          <i className="bi bi-speedometer2 me-2"></i> Dashboard
        </Link>
        <Link 
          to="/users" 
          className={`list-group-item d-flex align-items-center ${location.pathname === "/users" ? "active" : ""}`}
        >
          <i className="bi bi-people me-2"></i> Usuarios
        </Link>

        {/* Menú anidado */}
        <div className="list-group-item">
          <div
            className="d-flex align-items-center justify-content-between"
            onClick={() => setOpenElements(!openElements)}
            style={{ cursor: "pointer" }}
          >
            <span>
              <i className="bi bi-diagram-3 me-2"></i> Elementos
            </span>
            <i className={`bi ${openElements ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
          </div>

          {openElements && (
            <div className="list-group mt-2">
              <Link 
                to="/gaps" 
                className={`list-group-item submenu-item d-flex align-items-center ${location.pathname === "/gaps" ? "active" : ""}`}
              >
                <i className="bi bi-arrows-expand me-2"></i> Vanos
              </Link>
              <Link 
                to="/posts" 
                className={`list-group-item submenu-item d-flex align-items-center ${location.pathname === "/posts" ? "active" : ""}`}
              >
                <i className="bi bi-signpost-2 me-2"></i> Postes
              </Link>
              <Link 
                to="/feeders" 
                className={`list-group-item submenu-item d-flex align-items-center ${location.pathname === "/feeders" ? "active" : ""}`}
              >
                <i className="bi bi-lightning me-2"></i> SEDs
              </Link>
            </div>
          )}
        </div>

        <Link 
          to="/codes" 
          className={`list-group-item d-flex align-items-center ${location.pathname === "/codes" ? "active" : ""}`}
        >
          <i className="bi bi-file-code me-2"></i> Códigos
        </Link>

        <Link 
          to="/maps" 
          className={`list-group-item d-flex align-items-center ${location.pathname === "/maps" ? "active" : ""}`}
        >
          <i className="bi bi-map me-2"></i> Mapa
        </Link>
        <Link 
          to="/records" 
          className={`list-group-item d-flex align-items-center ${location.pathname === "/records" ? "active" : ""}`}
        >
          <i className="bi bi-journal-text me-2"></i> Registros
        </Link>
        <Link 
          to="/reports" 
          className={`list-group-item d-flex align-items-center ${location.pathname === "/reports" ? "active" : ""}`}
        >
          <i className="bi bi-file-earmark-text me-2"></i> Reportes
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;