import React, { useState } from 'react';
import ModalPersonalNuevo from '../components/Modals/ModalPersonalNuevo';

const Personal = () => {
    const [showNuevoModal, setShowNuevoModal] = useState(false);
    const [busquedaNombres, setBusquedaNombres] = useState('');
    const [nuevoPersonal, setNuevoPersonal] = useState({
        dni: '',
        nombres: '',
        apellidos: '',
        area: '',
        cargo: '',
        activo: true,
        usuario: '',
    });

  // Datos de ejemplo para la tabla
  const listaPersonal = [
    {
        dni: '12345678',
        nombres: 'Juan',
        apellidos: 'Pérez',
        area: 'Sistemas',
        cargo: 'Desarrollador',
        activo: true,
        usuario: 'jperez',
    },
    {
        dni: '87654321',
        nombres: 'María',
        apellidos: 'Gonzales',
        area: 'Recursos Humanos',
        cargo: 'Analista',
        activo: false,
        usuario: 'mgonzales',
    },
  ];

  const handleEditar = (personal) => {
    // Puedes abrir un modal, cargar los datos en un formulario, etc.
    console.log('Editar:', personal);
    };

    const handleEliminar = (dni) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este registro?')) {
        // Lógica para eliminar por DNI
        console.log('Eliminar DNI:', dni);
        // Aquí podrías llamar a una función que actualice listaPersonal
    }
    };

    const handleChangeNuevo = (e) => {
    const { name, value, type, checked } = e.target;
    setNuevoPersonal((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
    }));
    };

    const handleGuardarNuevo = () => {
    console.log('Nuevo Personal:', nuevoPersonal);
    // Aquí puedes agregar lógica para enviar datos
    setShowNuevoModal(false);
    };

    const handleBuscar = () => {
    console.log('Buscando con:', { nombres: busquedaNombres });
    // Aquí podrías filtrar `listaPersonal` según los valores ingresados
    };

  return (
    <div className="container mt-4 mb-4">
        <h3 className="mb-4 text-start">Personal</h3>
        {/* Sección de búsqueda */}
        <div className="row align-items-end mb-3">
            <div className="col-md-4">
                <label htmlFor="nombresInput" className="form-label">Buscar por : nombres, apellidos o DNI:</label>
                <input
                type="text"
                id="nombresInput"
                className="form-control"
                value={busquedaNombres}
                onChange={(e) => setBusquedaNombres(e.target.value)}
                />
            </div>

            <div className="col-md-4 d-flex align-items-end">
                <button
                className="btn btn-primary"
                onClick={handleBuscar}
                >
                Buscar
                </button>
            </div>
        </div>
      {/* Tabla de personal */}
      <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
      <table className="table table-bordered table table-striped">
        <thead className="table-dark" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr>
              <th>DNI</th>
              <th>Nombres</th>
              <th>Apellidos</th>
              <th>Area</th>
              <th>Cargo</th>
              <th>Estado</th>
              <th>Usuario</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {listaPersonal.map((personal, index) => (
              <tr key={index}>
                <td>{personal.dni}</td>
                <td>{personal.nombres}</td>
                <td>{personal.apellidos}</td>
                <td>{personal.area}</td>
                <td>{personal.cargo}</td>
                <td>{personal.activo ? 'Activo' : 'Inactivo'}</td>
                <td>{personal.usuario}</td>
                <td>
                    <button
                    className="btn btn-sm btn-warning me-2"
                    onClick={() => handleEditar(personal)}
                    >
                    Editar
                    </button>
                    <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleEliminar(personal.dni)}
                    >
                    Eliminar
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mb-3 text-end">
            <button className="btn btn-success" onClick={() => setShowNuevoModal(true)}>
                + Nuevo Personal
            </button>
        </div>
      </div>

      {/* Modal con información importante */}
      <ModalPersonalNuevo
        visible={showNuevoModal}
        onClose={() => setShowNuevoModal(false)}
        onChange={handleChangeNuevo}
        onSave={handleGuardarNuevo}
        nuevoPersonal={nuevoPersonal}
        />
    </div>
  );
};

export default Personal;