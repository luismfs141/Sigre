import React, { useState, useEffect } from 'react';
import '../assetss/css/Modal.css';
import {useEstadoCuenta} from '../hooks/useEstadoCuenta';
import { useCliente } from '../hooks/useCliente';
import { useGrupo } from '../hooks/useGrupo';

const Cronograma = () => {
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

  let periodo = 1;
  let montoPeriodo = 0;

  return (
    <div className="container mt-4 mb-4">
      <h3 className="mb-4 text-start">Cronograma</h3>

      <div className="row align-items-center mb-3">
        <div className="col-12 col-md-1 text-start">
          <label htmlFor="searchDropdown" className="form-label">
            Grupo:
          </label>
        </div>
        <div className="col-12 col-md-5 text-start">
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
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
      <table className="table table-bordered table table-striped">
        <thead className="table-dark" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr>
              <th>Nro Cuota</th>
              <th>Fecha de Pago</th>
              <th>Cuota</th>
              <th>CuotaGrupal</th>
              <th>Sorteo</th>
              <th>Martillazo</th>
            </tr>
          </thead>
          <tbody>
            {estadosCuenta && estadosCuenta.length > 0 ? (
              estadosCuenta.map((estado, index) => {
                // Calculamos el monto acumulativo solo una vez
                const montoAcumulativo = estado.nroCuotaI * estado.montoCuotaM * numIntegrantes;

                // Verificamos si el resultado del módulo es "SI"
                const esSorteoExitoso = montoAcumulativo % montoSorteo == 0;
                if(esSorteoExitoso){
                  periodo = periodo +1;
                  montoPeriodo = montoAcumulativo+ (montoSorteo/2);
                }
                let activarMartillazo = montoPeriodo >0 && montoPeriodo < montoAcumulativo? "SI":"NO";

                return (
                  <tr className= {esSorteoExitoso?'table-success':''} >
                    <td>{estado.nroCuotaI}</td>
                    <td>{estado.fechaPagoProgramadaD ? new Date(estado.fechaPagoProgramadaD).toLocaleDateString() : 'No Disponible'}</td>
                    <td>{estado.montoCuotaM ? `S/.${estado.montoCuotaM.toFixed(2)}` : 'No Disponible'}</td>
                    <td>{estado.montoCuotaM ? `S/.${montoAcumulativo.toFixed(2)}` : 'No Disponible'}</td>
                    <td>{esSorteoExitoso ? "SI" : "NO"}</td>
                    <td>{activarMartillazo}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="text-center">No hay datos disponibles</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Cronograma;
