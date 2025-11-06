import React, { useState, useEffect } from 'react';
import '../assetss/css/Modal.css';
import {useEstadoCuenta} from '../hooks/useEstadoCuenta';
import { useCliente } from '../hooks/useCliente';
import { useGrupo } from '../hooks/useGrupo';
import ModalVoucher from '../components/Modals/ModalVoucher';


const Estado = () => {
    const { ObtenerEstadosCuentaPorIdClienteGrupo} = useEstadoCuenta();
    const { getClienteFromLocalStorage } = useCliente();
    const { getGruposPorCliente, getDetallesGrupo} = useGrupo();
  
    const [ clienteData, setClienteData ] = useState();
    const [ estadosCuenta, setEstadosCuenta ] = useState([]);
    const [ gruposCliente, setGruposCliente ] = useState([]);
    const [ grupoSeleccionado, setGrupoSeleccionado] = useState('');
    const [ detallesGrupo, setDetallesGrupo ] = useState(null);
    const [ montoSorteo, setMontoSorteo ] = useState(0);
    const [ isInitialized, setIsInitialized ] = useState(false);
    const [ numIntegrantes, setNumIntegrantes] = useState(0);
    const [ showModalVoucher ,setShowModalVoucher] = useState(false);
  
    useEffect(() => {
      if (!isInitialized) {
        const clienteLogin = getClienteFromLocalStorage();
        if (clienteLogin) {
          setClienteData(clienteLogin);
          const listaGrupo = getGruposPorCliente(clienteLogin);
          listaGrupo.then(grupos => {
            setGruposCliente(grupos); 
          });
        }
        setIsInitialized(true);
      }
    }, [isInitialized, getClienteFromLocalStorage,getGruposPorCliente]);
  
    //useEffect para la seleccion de grupo.
    useEffect(() => {
      const fetchEstadosCuenta = async () => {
        setEstadosCuenta([]);
        if (grupoSeleccionado && clienteData) {
          const datosGrupo = gruposCliente.find(grupo => grupo.codigoC === grupoSeleccionado);
          if (datosGrupo) {
            const listaEstadosCuentas = await ObtenerEstadosCuentaPorIdClienteGrupo(clienteData.idClienteI, datosGrupo.idGrupoI);
            const detallesGrupo = await getDetallesGrupo(datosGrupo.idGrupoI);
            setDetallesGrupo(detallesGrupo);
            if (listaEstadosCuentas && listaEstadosCuentas.exito) {
              setEstadosCuenta(listaEstadosCuentas.objeto);
            }
          }
        }
      };
      if (grupoSeleccionado && clienteData) {
        fetchEstadosCuenta();
      }
    }, [grupoSeleccionado]);
  
    useEffect(() => {
      if(detallesGrupo){
        setMontoSorteo(detallesGrupo.modeloVehiculo.precioUnidadVehiculoM);
        setNumIntegrantes(detallesGrupo.numeroIntegrantes);
      }
    }, [detallesGrupo]);

    const handleCloseModal = () => {
      setShowModalVoucher(false);
    };

    const handleSubirVoucher = (estado) => {
      console.log(estado);
      setShowModalVoucher(true); // Mostrar el modal
    };

    const handleSaveVoucher = () =>{
      console.log("Guardar voucher");
    }

  return (
    <div className="container mt-4 mb-4">
      <h3 className="mb-4 text-start">Estado de Cuenta</h3>

      <div className="row align-items-center mb-3">
        <div className="col-12 col-md-1 text-start">
          <label htmlFor="searchDropdown" className="form-label">
            Grupo:
          </label>
        </div>
        <div className="col-12 col-md-5 text-start" tyle={{ paddingLeft: '0px' }}>
        <select
            id="searchDropdown"
            className="form-select"
            value={grupoSeleccionado}
            onChange={(e) => setGrupoSeleccionado(e.target.value)}
          >
            <option value="">Seleccione un Grupo</option>
            {gruposCliente.map(grupo => (
              <option key={grupo.idGrupoI} value={grupo.codigoC}>
                {grupo.codigoC}
              </option>
            ))}
          </select>
        </div>
        <div className="col-12 col-md-3 text-start mt-2 mt-md-0 d-flex align-items-center">
          <button className="btn btn-primary me-2">
            Buscar
          </button>
          <button className="btn btn-secondary me-2">
            Filtro
          </button>
        </div>
      </div>

      <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
      <table className="table table-bordered table table-striped">
        <thead className="table-dark" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr>
              <th>Nro Cuota</th>
              <th>Monto Cuota</th>
              <th>Prioridad</th>
              <th>Fecha de Pago</th>
              <th>Estado</th>
              <th>Voucher</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {estadosCuenta.map((estado) => (
              <tr key={estado.idDetalleEstadoCuentaI}>
                <td>{estado.nroCuotaI}</td>
                <td>{estado.montoCuotaM ? `S/.${estado.montoCuotaM.toFixed(2)}` : 'No Disponible'}</td>
                <td>{estado.estadoCuotaC === 'D' ? 'Normal' : 'Urgente'}</td> {/* Aquí asumes que si el estado es 'D' es normal */}
                <td>{estado.fechaPagoProgramadaD ? new Date(estado.fechaPagoProgramadaD).toLocaleDateString() : 'No Disponible'}</td>
                <td>{estado.estadoCuotaC === 'D' ? 'Pendiente' : 'Pagado'}</td> {/* Asegúrate de cambiar la lógica según los valores posibles de estadoCuotaC */}
                <td>{estado.estadoCuotaC=='A'?'Abonado':'Pendiente'}</td>
                <td>
                  <button className="btn btn-success" onClick={() => handleSubirVoucher(estado)}>Subir Voucher</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Modal para guardar documentos */}
      <ModalVoucher
        show={showModalVoucher}
        onClose={handleCloseModal}
        onSave={handleSaveVoucher}
      />
    </div>
  );
};

export default Estado;
