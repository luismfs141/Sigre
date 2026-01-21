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
        <li><Link to="/routes"><i className='bx bxs-widget icon'></i> Convertidor de rutas</Link></li>
        <li><Link to="/area"><i className='bx bxs-widget icon'></i> Mapas</Link></li>
        <li><Link to="/personal"><i className='bx bxs-widget icon'></i> Reportes</Link></li>
        <li><Link to="/bien"><i className='bx bxs-widget icon'></i> Bienes</Link></li>
        <li><Link to="/mantenimiento"><i className='bx bxs-widget icon'></i> Mantenimientos</Link></li>
        <li><Link to="/auditElectrical"><i className='bx bxs-widget icon'></i> Auditoría Eléctrica</Link></li>
        <li><Link to="/auditFileElectrical"><i className='bx bxs-widget icon'></i> Auditoría Archivo Eléctrico</Link></li>
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
