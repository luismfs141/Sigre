import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <div className="container vh-100 d-flex flex-column justify-content-start align-items-center text-center pt-5">
      <h1 className="mb-4">¡Bienvenido a Sigre Web!</h1>
      <h2 className="lead mb-4">
        Sigre Web es un sistema especializado en el <strong>registro, control y gestión de datos</strong> 
        relacionados con los <strong>componentes de baja tensión</strong>. 
        Su objetivo es facilitar la administración técnica de los elementos eléctricos en campo y oficina.
      </h2>
      <h2 className="lead mb-4">
        Desde esta plataforma podrás <strong>crear formularios personalizados</strong>, 
        registrar información detallada de componentes, y visualizar su ubicación y estado 
        directamente en un <strong>mapa interactivo</strong>.
      </h2>
      <p>
        Con Sigre Web, optimiza tus procesos de supervisión y mantenimiento, 
        asegurando precisión, trazabilidad y una gestión eficiente de tus activos eléctricos.
      </p>
    </div>
  );
}

export default App;
