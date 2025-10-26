import React, { useState } from 'react';

const Sorteos = () => {
  const [selectedOption, setSelectedOption] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Datos de ejemplo para la tabla
  const sorteos = [
    { numero: 1, ganadores: 'Juan Pérez', fecha: '2024-12-10', modalidad: 'Sorteo Regular' },
    { numero: 2, ganadores: 'Ana Gómez', fecha: '2024-12-12', modalidad: 'Martillazo' },
    { numero: 3, ganadores: 'Carlos López', fecha: '2024-12-15', modalidad: 'Sorteo Especial' },
    { numero: 4, ganadores: 'Lucía García', fecha: '2024-12-17', modalidad: 'Sorteo Regular' }
  ];

  const handleOptionChange = (e) => {
    setSelectedOption(e.target.value);
  };

  const toggleModal = () => {
    setShowModal(!showModal);
  };

  return (
    <div className="container mt-4 mb-4">
      <h3 className="mb-4 text-start">Sorteos</h3>
      <h5 htmlFor="searchDropdown" className="form-label text-start">
        Próximo Sorteo: 10 de Diciembre de 2024!
      </h5>

      {/* Sección de búsqueda */}
      <div className="row align-items-center mb-3">
        <div className="col-12 col-md-1 text-start">
          <label htmlFor="searchDropdown" className="form-label">
            Grupo:
          </label>
        </div>
        <div className="col-12 col-md-5 text-start" style={{ paddingLeft: '0px' }}>
          <select
            id="searchDropdown"
            className="form-select"
            value={selectedOption}
            onChange={handleOptionChange}
          >
            <option value="">Seleccione un Grupo</option>
            <option value="nombre1">Nombre 1</option>
            <option value="nombre2">Nombre 2</option>
            <option value="nombre3">Nombre 3</option>
          </select>
        </div>
        <div className="col-12 col-md-5 text-start mt-2 mt-md-0 d-flex align-items-center">
          <button className="btn btn-primary me-2">Buscar</button>
          <button className="btn btn-secondary me-2">Realizar Martillazo!</button>
          <button
            className="btn btn-secondary rounded-circle"
            onClick={toggleModal}
            style={{ fontSize: '18px', width: '35px', height: '35px' }}
          >
            !
          </button>
        </div>
      </div>

      {/* Tabla de sorteos */}
      <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
      <table className="table table-bordered table table-striped">
        <thead className="table-dark" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr>
              <th>Numero</th>
              <th>Ganadores</th>
              <th>Fecha</th>
              <th>Modalidad</th>
            </tr>
          </thead>
          <tbody>
            {sorteos.map((sorteo, index) => (
              <tr key={index}>
                <td>{sorteo.numero}</td>
                <td>{sorteo.ganadores}</td>
                <td>{sorteo.fecha}</td>
                <td>{sorteo.modalidad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal con información importante */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h5 className="text-start">Información Importante</h5>
            <p className="text-start">
              Instrucciones importantes relacionadas
              con el sorteo o la acción de martillazo.
            </p>
            <button className="btn btn-secondary mt-2" onClick={toggleModal}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sorteos;