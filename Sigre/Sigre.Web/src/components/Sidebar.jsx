import React from 'react';
import { Link } from 'react-router-dom';
import '../assetss/css/Generalbar.css';
import useSidebar from '../assetss/script/Generalbar';

function Sidebar() {
  useSidebar();

  return (
    <section id="sidebar">
      <br></br>
      <a href="#" className="brand" style={{ textDecoration: 'none' }}>
        <i className='bx bxs-smile icon'></i>Sigre Web
      </a>

      <ul className="side-menu">
        <li><Link to="/Menu" className="active"><i className='bx bxs-dashboard icon'></i> Menu</Link></li>

        <li className="divider " data-text="Principal">Principal</li>
        <li><Link to="/empresa"><i className='bx bxs-widget icon'></i> Empresas</Link></li>
        <li><Link to="/area"><i className='bx bxs-widget icon'></i> Áreas</Link></li>
        <li><Link to="/personal"><i className='bx bxs-widget icon'></i> Personal</Link></li>
        <li><Link to="/bien"><i className='bx bxs-widget icon'></i> Bienes</Link></li>
        <li><Link to="/mantenimiento"><i className='bx bxs-widget icon'></i> Mantenimientos</Link></li>
        <li className="divider" data-text="Contacto">Contacto</li>
        <li>
          <Link to="/soporte"><i className='bx bxs-notepad icon'></i> Soporte <i className='bx bx-chevron-right icon-right'></i></Link>
          <ul className="side-dropdown">
            <li><a href="/soporte#preguntas-frecuentes">Preguntas frecuentes</a></li>
            <li><a href="/soporte#contacto">Contacto</a></li>
            <li><a href="/soporte#informacion">Información</a></li>
          </ul>
        </li>
      </ul>
    </section>
  );
}

export default Sidebar;
