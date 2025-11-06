import React from 'react';

const ModalClientesPendientes = ({ show, onClose, clientes, onAccept, onReject }) => {
  //console.log(grupo);
  return (
    <div className={`modal ${show ? 'show' : ''}`} tabIndex="-1" style={{ display: show ? 'block' : 'none' }}>
      <div className="modal-dialog" style={{ maxWidth: '45%' }}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Solicitud de unión de clientes</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {clientes && clientes.length > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                {/* Tabla de Clientes Pendientes */}
                <table className="table table-bordered" style={{ maxWidth: '90%' }}>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Nombres</th>
                      <th>Apellidos</th>
                      <th style={{ width: '210px' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.map((cliente) => (
                      <tr key={cliente.idClienteI}>
                        <td>{cliente.codigoC}</td>
                        <td>{cliente.nombreNv}</td>
                        <td>{cliente.apellidoPaternoNv} {cliente.apellidoMaternoNv}</td>
                        <td>
                          <button 
                            className="btn btn-success me-2"
                            onClick={() => onAccept(cliente.idClienteI)}
                          >
                            Aceptar
                          </button>
                          <button 
                            className="btn btn-danger"
                            onClick={() => onReject(cliente.idClienteI)}
                          >
                            Rechazar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No hay clientes pendientes.</p>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalClientesPendientes;