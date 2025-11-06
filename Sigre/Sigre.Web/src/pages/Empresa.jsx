import React, { useState } from 'react';
import ModalEmpresa from '../components/Modals/ModalEmpresa';

const Empresa =() =>{
    const [showModalEmpresa, setShowModalEmpresa] = useState(false);
    const [busquedaEmpresa, setBusquedaEmpresa] = useState ("");
    const [dataEmpresa, setDataEmpresa] = useState({
        id: 0,
        nombre: '',
        ruc: '',
        telefono: '',
        correo: ''
    });

    const listaEmpresas = [
        {
            id: 1,
            nombre: 'PAZ LABORATORIOS',
            ruc: '12345678985',
            telefono: '987541336',
            correo: 'pazlaboratorios@gmail.com'
        },
        {
            id: 2,
            nombre: 'ACV PRODUCCIONES',
            ruc: '12345678910',
            telefono: '987541336',
            correo: 'acv@gmail.com'
        },
    ];

    const handleBuscar = () => {
        console.log('Buscando con:', { nombres: busquedaEmpresa });
    };

    const handleVerEmpresa = () => {
        setShowModalEmpresa(true);
    };

    //Funciones de control de modal empresa
    const handleChangeEmpresa = (e) => {
        const { name, value, type, checked } = e.target;
        setDataEmpresa((prev) => ({
            ...prev,
        }));
    };

    const handleGuardarEmpresa = (e) => {
        console.log('Empresa:', dataEmpresa);
    // Aquí puedes agregar lógica para enviar datos
    setShowModalEmpresa(false);
    }

    return(
        <div className="container mt-4 mb-4">
        <h3 className="mb-4 text-start">Empresas</h3>
        {/* Sección de búsqueda */}
        <div className="row align-items-end mb-3">
            <div className="col-md-4">
                <label htmlFor="nombresInput" className="form-label">Buscar por : Nombres ó RUC:</label>
                <input
                type="text"
                id="nombresInput"
                className="form-control"
                value={busquedaEmpresa}
                onChange={(e) => setBusquedaEmpresa(e.target.value)}
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
      {/* Tabla de empresas */}
      <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
      <table className="table table-bordered table table-striped">
        <thead className="table-dark" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr>
              <th>ID</th>
              <th>Nombres</th>
              <th>RUC</th>
              <th>Teléfono</th>
              <th>Correo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {listaEmpresas.map((empresa, index) => (
              <tr key={index}>
                <td>{empresa.id}</td>
                <td>{empresa.nombre}</td>
                <td>{empresa.ruc}</td>
                <td>{empresa.telefono}</td>
                <td>{empresa.correo}</td>
                <td>
                    <button
                    className="btn btn-sm btn-warning me-2"
                    onClick={() => handleVerEmpresa(dataEmpresa)}
                    >
                    Ver
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mb-3 text-end">
            <button className="btn btn-success" onClick={() => setShowModalEmpresa(true)}>
                + Nueva Empresa
            </button>
        </div>
      </div>
      {/* Modal con información importante */}
      <ModalEmpresa
        visible={showModalEmpresa}
        onClose={() => setShowModalEmpresa(false)}
        onChange={handleChangeEmpresa}
        onSave={handleGuardarEmpresa}
        dataEmpresa={dataEmpresa}
        />
    </div>
    );
}
export default Empresa;