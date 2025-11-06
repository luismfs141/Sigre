import React, { useEffect, useState } from "react";

const ModalIniciarGrupo = ({cliente, grupo, show, onIniciarGrupo, onClose}) => {

    const [esAdmin, setEsAdmin] = useState(false);
    const [fechaInicio, setFechaInicio] = useState(Date.now);

    useEffect(() => {
        // Establecer la fecha de inicio con el valor actual
        const today = new Date().toISOString().split('T')[0]; // Formato 'YYYY-MM-DD'
        setFechaInicio(today);

        if(cliente && grupo) {
            if(cliente.idClienteI === grupo.adminGrupo.idClienteI) {
                setEsAdmin(true);
            }
        }
    }, [cliente, grupo]);

    const handleFechaInicioChange = (e) => {
        const selectedDate = e.target.value;
        const currentDate = new Date().toISOString().split('T')[0];  // Fecha actual

        // Comprobar que la fecha seleccionada es mayor a la fecha actual
        if (selectedDate > currentDate) {
            setFechaInicio(selectedDate);
        } else {
            alert("La fecha seleccionada debe ser mayor a la fecha actual.");
        }
    };

    return (
        <div className={`modal ${show ? 'show' : ''}`} tabIndex="-1" style={{ display: show ? 'block' : 'none' }}>
            <div className="modal-dialog" style={{ maxWidth: '30%' }}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Inicio de Cronograma</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        {grupo ? (
                            <div>
                                <div className="row mb-3">
                                    <div className="col-6">
                                        <p><strong>Código del Grupo:</strong> {grupo.codigoGrupo}</p>
                                        <p><strong>Estado del Grupo: </strong>
                                            {({
                                                'A': 'Abierto',
                                                'C': 'Cerrado',
                                                'F': 'Finalizado',
                                                'P': 'Pendiente',
                                                'I': 'Iniciado'
                                            })[grupo.estadoGrupo]} 
                                        </p>
                                        <p><strong>Modelo del Vehículo:</strong> {grupo.modeloVehiculo ? grupo.modeloVehiculo.nombreNv : 'N/A'}</p>
                                        <p><strong>Fecha de Creación:</strong> {grupo.fechaCreacion ? new Date(grupo.fechaCreacion).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                    <div className="col-6">
                                        <p><strong>Total: </strong> S/.{grupo.modeloVehiculo.precioUnidadVehiculoM}</p>
                                        <p><strong>Monto Cuota: </strong> S/.{grupo.montoCuota}</p>
                                        <p><strong>Número de Cuotas:</strong> {grupo.numeroCuotas}</p>
                                        <p><strong>Tipo de Periodo:</strong>
                                            {({
                                                'D': 'Diario',
                                                'S': 'Semanal',
                                                'Q': 'Quincenal',
                                                'M': 'Mensual'
                                            })[grupo.tipoPeriodo]} 
                                        </p>
                                        
                                        
                                    </div>
                                </div>
                                <div className="row mb-3 justify-content-center">
                                    <div className="col-md-6">
                                        <label htmlFor="fechaInicio" className="form-label">Fecha Inicio de Cuotas</label>
                                        <input
                                            id="fechaInicio"
                                            type="date"
                                            value={fechaInicio}
                                            onChange={handleFechaInicioChange}
                                            required
                                            className="form-control bg-light border-primary"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p>No se encontró información para este grupo.</p>
                        )}
                    </div>
                    <div className="modal-footer d-flex justify-content-center w-100">
                        <button type="button" className="btn btn-primary" onClick={() => onIniciarGrupo(grupo,fechaInicio)}>Iniciar Cronograma</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalIniciarGrupo;