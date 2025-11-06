import React, { useState,useEffect } from 'react';

const ModalDetallesGrupo = ({ show, onClose, detallesGrupo, cliente,onRetirarGrupo }) => {

  const [idAdminGrupo, setIdAdminGrupo] = useState();
  const [idCliente, setIdCliente] = useState();
  const [estadoGrupo, setEstadoGrupo] = useState();

  useEffect(() => {
    if(detallesGrupo && cliente){
      const idAdmin = detallesGrupo.adminGrupo.idClienteI;
      const idclnt = cliente.idClienteI;
      const estado = detallesGrupo.estadoGrupo;
      setIdAdminGrupo(idAdmin);
      setIdCliente(idclnt);
      setEstadoGrupo(estado);
    }
  }, [detallesGrupo,cliente]);

  return (
    <div className={`modal ${show ? 'show' : ''}`} tabIndex="-1" style={{ display: show ? 'block' : 'none' }}>
      <div className="modal-dialog" style={{ maxWidth: '50%' }}>{/*Se puede modificar el ancho del modal */}
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Detalles del Grupo</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {detallesGrupo ? (
              <div>
                {/* Cabecera de detalles del grupo */}
                <div className="row mb-3">
                  <div className="col-6">
                    <p><strong>Código del Grupo:</strong> {detallesGrupo.codigoGrupo}</p>
                    <p><strong>Estado del Grupo:</strong> {detallesGrupo.estadoGrupo}</p>
                    <p><strong>Modelo del Vehículo:</strong> {detallesGrupo.modeloVehiculo ? detallesGrupo.modeloVehiculo.nombreNv : 'N/A'}</p>
                    <p><strong>Administrador del Grupo:</strong> {detallesGrupo.adminGrupo ? `${detallesGrupo.adminGrupo.nombreNv} ${detallesGrupo.adminGrupo.apellidoPaternoNv}` : 'N/A'}</p>
                  </div>
                  <div className="col-6">
                    <p><strong>Tipo de Periodo:</strong> {detallesGrupo.tipoPeriodo}</p>
                    <p><strong>Cuota:</strong> {detallesGrupo.montoCuota}</p>
                    <p><strong>Número de Cuotas:</strong> {detallesGrupo.numeroCuotas}</p>
                    <p><strong>Fecha de Creación:</strong> {detallesGrupo.fechaCreacion ? new Date(detallesGrupo.fechaCreacion).toLocaleDateString() : 'N/A'}</p>
                    <p><strong>Fecha de Inicio:</strong> {detallesGrupo.fechaInicio ? new Date(detallesGrupo.fechaInicio).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>

                {/* Tabla de integrantes del grupo */}
                <h6><strong>{detallesGrupo.integrantesGrupo ? detallesGrupo.integrantesGrupo.length+" " : 0 +" "} 
                  de {" "+detallesGrupo.numeroIntegrantes} integrantes.</strong></h6>
                <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table className="table table-bordered">
                    <thead className="table-dark" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr>
                        <th>N°</th>
                        <th>Nombre</th>
                        <th>Apellidos</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detallesGrupo.integrantesGrupo?.length > 0 ? (
                        detallesGrupo.integrantesGrupo.map((integrante, index) => (
                          <tr key={index}>
                            <td>{index+1}</td>
                            <td>{integrante.nombreNv}</td>
                            <td>{integrante.apellidoPaternoNv +" "}{integrante.apellidoMaternoNv}</td>
                            <td>{integrante.correoNv}</td>
                            <td>{integrante.nroContactoC}</td>
                            <td>
                            {idAdminGrupo == idCliente?
                              (
                                <button 
                                  className="btn btn-danger"
                                  onClick={() => onRetirarGrupo(integrante.idClienteI, detallesGrupo.idGrupo)}
                                  disabled={estadoGrupo ==='A'?false:true}
                                >
                                  Retirar
                                </button>
                              )
                              :
                              (
                                <button 
                                  className="btn btn-danger"
                                  onClick={() => onRetirarGrupo(integrante.idClienteI, detallesGrupo.idGrupo)}
                                  disabled={idCliente==integrante.idClienteI && estadoGrupo === 'A'?false:true}
                                >
                                  Retirar
                                </button>
                              )
                            }
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center">No hay integrantes</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p>No se encontró información para este grupo.</p>
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

export default ModalDetallesGrupo;