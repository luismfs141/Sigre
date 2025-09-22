import React from 'react';
import { useAuth } from '../context/AuthContext';
import '../assetss/css/Navbar.css'; // 👈 estilos exclusivos del navbar

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar-custom d-flex align-items-center justify-content-between">
      <span className="navbar-brand">SigreWeb</span>
      <div className="d-flex align-items-center">
        {user && (
          <>
            <span className="user-text">Hola, {user.username}</span>
            <button className="btn-logout" onClick={logout}>Cerrar sesión</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;