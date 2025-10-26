import React, { useState,useEffect } from 'react';
import '../assetss/css/Modal.css';
import { useCliente } from '../hooks/useCliente';
import { useGrupo } from '../hooks/useGrupo';
import { useModelo } from '../hooks/useModelo';
import { useDocumento } from '../hooks/useDocumento';
import { useEstadoCuenta } from '../hooks/useEstadoCuenta';
import ModalGuardarDocumento from '../components/Modals/ModalGuardarDocumento';
import ModalDetallesGrupo from '../components/Modals/ModalDetallesGrupo';
import ModalClientesPendientes from '../components/Modals/ModalClientesPendientes';
import ModalIniciarGrupo from '../components/Modals/ModalIniciarGrupo';
import ButtonAccionGrupo from '../components/Buttons/ButtonAccionGrupo';


const Grupos = () => {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newEntry, setNewEntry] = useState({ code: '', status: '', startDate: '', fee: '', period: '' });
  const [editId, setEditId] = useState(null);
  const [filterOption, setFilterOption] = useState('');
  const [modalContent, setModalContent] = useState(null);
  const [showCreateJoinModal, setShowCreateJoinModal] = useState(false);
  const [showCreateUModal, setShowCreateUModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState('');
  const [codigoGrupo, setCodigoGrupo] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [showModalDetalles, setShowModalDetalles] = useState(false);
  const [detallesGrupo, setDetallesGrupo] = useState(null);
  const [showModalClientesPendientes, setShowModalClientesPendientes] = useState(false);
  const [clientesPendientes, setClientesPendientes] = useState(null);
  const [showModalIniciarGrupo,setShowModalInciarGrupo] = useState(false);

  //Metodos Hooks
  const { getClienteFromLocalStorage, getIdGruposAdminFromLocalStorage} = useCliente();
  const { getGruposPorCliente, guardarGrupo, buscarGrupoCodigo,
          agregarListaGrupoCliente, getDetallesGrupo, agregarListaEsperaGrupo,
          listarClientesPendientes, admitirClienteGrupo, rechazarClienteGrupo } = useGrupo();
  const { getModelos } = useModelo();
  const { guardarDocumento, getDocumentoPorClienteGrupo } = useDocumento();
  const {crearCronogramaPorGrupo, ObtenerEstadosCuentaPorIdClienteGrupo} = useEstadoCuenta();
  
  //Variables de control
  const [gruposCliente, setGruposCliente] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [clienteData,setClienteData] = useState();
  const [isInitialized, setIsInitialized] = useState(false); // Nuevo estado para evitar el ciclo infinito
  const [idGruposAdmin, setIdGruposAdmin] = useState();

  //Variables de Objetos
  //Grupo
  const [cantMaxIntegrantes, setCantMaxIntegrantes] = useState('');
  const [cantidadCuotas, setCantidadCuotas] = useState('');
  const [tipoPeriodoPago, setTipoPeriodoPago] = useState('');
  const [modeloVehiculo, setModeloVehiculo] = useState('');
  const [precioVehiculo, setPrecioVehiculo] = useState('');
  const [montoCuota, setMontoCuota] = useState(0);
  const [tiempoPago, setTiempoPago] = useState(0);
  const [sorteo, setSorteo] = useState(0);
  const [documentosDisponibles, setDocumentosDisponibles] = useState({});

  //Message Box
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // Puede ser 'success' o 'error'
  const [showMessage, setShowMessage] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      const clienteLogin = getClienteFromLocalStorage();
      const idGrupos = getIdGruposAdminFromLocalStorage();
      if (clienteLogin) {
        setClienteData(clienteLogin);
        setIdGruposAdmin(idGrupos);
        const listaGrupo = getGruposPorCliente(clienteLogin);
        listaGrupo.then(grupos => {
          setGruposCliente(grupos); 
        });
      }
      setIsInitialized(true); // Cambiar el estado de isInitialized para que no se actualice nuevamente
    }
  }, [isInitialized, getClienteFromLocalStorage,getGruposPorCliente]); 

  //useEffect para tabla de grupos
  useEffect(() => {
    // Función para obtener los documentos por cliente y grupo
    const checkDocumentosDisponibles = async () => {
      const documentos = {};
      for (const item of gruposCliente) {
        const resultado = await getDocumentoPorClienteGrupo(clienteData, item);
        documentos[item.idGrupoI] = resultado; // Guardamos el resultado en el objeto
      }
      setDocumentosDisponibles(documentos); // Actualizamos el estado con los resultados
    };
    checkDocumentosDisponibles();
  }, [gruposCliente, clienteData]);

  useEffect(() => {
    if (precioVehiculo > 0 && montoCuota > 0) {
      const cantCuotas = precioVehiculo / montoCuota;
      setCantidadCuotas(cantCuotas);
    }
  }, [precioVehiculo, montoCuota]);
  
  useEffect(() => {
    if (cantidadCuotas && tipoPeriodoPago) {
      let tiempo;
      if (tipoPeriodoPago === "D") {
        tiempo = cantidadCuotas / 30;
      } else if (tipoPeriodoPago === "S") {
        tiempo = cantidadCuotas / 4;
      } else if (tipoPeriodoPago === "Q") {
        tiempo = cantidadCuotas / 2;
      } else if (tipoPeriodoPago === "M") {
        tiempo = cantidadCuotas;
      }
  
      if (tiempo !== undefined) {
        setTiempoPago(tiempo);
      }
    }
  }, [cantidadCuotas, tipoPeriodoPago]);

  useEffect(() => {
    if (cantidadCuotas && tipoPeriodoPago && cantMaxIntegrantes) {
      let sorteo;
      sorteo = precioVehiculo/(cantMaxIntegrantes*montoCuota);
      if (sorteo !== undefined) {
        setSorteo(sorteo);
      }
    }
  }, [cantidadCuotas, tipoPeriodoPago, cantMaxIntegrantes]);

  const handleDelete = (id) => {
    setData(data.filter((item) => item.id !== id));
  };

  const handleEdit = (item) => {
    setNewEntry({
      code: item.code,
      status: item.status,
      startDate: item.startDate,
      fee: item.fee,
      period: item.period,
    });
    setEditId(item.id);
  };

  const handleSearch = () => {
    setSearchTerm(searchTerm.trim());
  };

  const filteredData = data
    .filter((item) => item.code.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((item) => (filterOption ? item.status === filterOption : true));

  const handleShowDetails = (content) => {
    setModalContent(content);
  };

  const handleCloseModal = () => {
    setModalContent(null);
    setShowCreateJoinModal(false);
    setShowCreateUModal(false);
    setShowModal(false);
    setShowModalDetalles(false);
    setShowModalClientesPendientes(false);
    limpiarCamposGrupo();
    setShowModalInciarGrupo(false);
  };

  const limpiarCamposGrupo = () =>{
    setCantMaxIntegrantes(0);
    setCantidadCuotas(0);
    setTipoPeriodoPago("");
    setModeloVehiculo("");
    setPrecioVehiculo(0);
    setMontoCuota(0);
    setTiempoPago(0);
    setSorteo(0);
  }

  // Modal Creación de grupo
  const toggleCreateJoinModal = () => {
    setShowCreateJoinModal(!showCreateJoinModal);
    const listaModelos = getModelos();
      listaModelos.then(modelos => {
        setModelos(modelos); 
      });
  };

  const toggleCreateUModal = () => {
    setShowCreateUModal(!showCreateUModal);
  };

  const handleOptionChange = (e) => {
    setSelectedOption(e.target.value);
  };

  const crearGrupoModal = async () =>{
    const response = await guardarGrupo(clienteData,grupo);
    if(response.exito){
      setShowCreateJoinModal(!showCreateJoinModal);
      const listaGrupo = getGruposPorCliente(clienteData);
      listaGrupo.then(grupos => {
        setGruposCliente(grupos); 
      });
      showSuccessMessage("Grupo creado exitosamente!");
    }
    else{
      showErrorMessage("Hubo un error al crear el grupo.");
    }
  };

  const handleModeloVehiculo =(e) =>{
    const idVehiculo = e.target.value;
    setModeloVehiculo(idVehiculo);
    const modeloSeleccionado = modelos.find(m => m.idModeloVehiculoI == idVehiculo);
    if (modeloSeleccionado) {
      setPrecioVehiculo(modeloSeleccionado.precioUnidadVehiculoM);
    } else {
      setPrecioVehiculo(0);
    }
  };

  const handleAgregarListaClienteGrupo = async (e) => {
    e.preventDefault();  // Si estás usando un formulario, previenes el comportamiento por defecto
  
    // Verifica que el código del grupo no esté vacío
    if (!codigoGrupo || !clienteData?.idClienteI) {
      showErrorMessage("Por favor ingrese un código válido y asegúrese de estar logueado.");
      return;
    }
    try {
      // Busca el grupo con el código ingresado
      const grupoBuscado = await buscarGrupoCodigo(codigoGrupo);
      if (grupoBuscado) {
        // Intentar unirse al grupo
        const response = await agregarListaGrupoCliente(grupoBuscado, clienteData);
        
        if (response.exito) {
          showSuccessMessage("¡Grupo agregado exitosamente!");
          handleCloseModal();  // Si deseas cerrar el modal después del éxito
        } else {
          showErrorMessage("Error al agregar el grupo. Intenta de nuevo.");
        }
      } else {
        showErrorMessage("Error: el grupo no existe.");
      }
    } catch (error) {
      showErrorMessage("Ocurrió un error al procesar la solicitud. Intente más tarde.");
    }
    finally{
      const listaGrupo = getGruposPorCliente(clienteData);
      listaGrupo.then(grupos => {
        setGruposCliente(grupos); 
      });
    }
  };

  const handleDocumento = (grupo) => {
    setGrupoSeleccionado(grupo); // Establecer el grupo seleccionado
    setShowModal(true); // Mostrar el modal
  };

  const handleShowDetailsModal = async (grupo) => {
    setLoading(true); // Indicamos que estamos cargando
    try {
        const detallesGrupo = await getDetallesGrupo(grupo.idGrupoI);
        setDetallesGrupo(detallesGrupo);
        setShowModalDetalles(true);
    } catch (error) {
        console.error("Error al cargar los detalles del grupo:", error);
    } finally {
        setLoading(false); // Terminamos de cargar
    }
  };

  const handleListaClientesPendientes = async (grupo) => {
    setLoading(true); 
    try {
      const clientes = await listarClientesPendientes(grupo.idGrupoI);
      setClientesPendientes(clientes);
      setGrupoSeleccionado(grupo);
      setShowModalClientesPendientes(true);
    } catch (error) {
        console.error("Error al cargar la lista de clientes", error);
    } finally {
        setLoading(false);
    }
  };

  const handleUnirseGrupo = async (grupo) => {
    setLoading(true); 
    try {
      const response = await agregarListaEsperaGrupo(clienteData.idClienteI, grupo.idGrupoI);
      if (response.exito) {
        showSuccessMessage("¡Solicitud enviada!");
      } else {
        showErrorMessage("Error al enviar la solicitud de unión al grupo.");
      }
    } catch (error) {
        console.error("Error al cargar los detalles del grupo:", error);
    } finally {
        setLoading(false);
    }
  };

  const handleSaveDocumentos = async (documentos) => {
    try {
      const response = await guardarDocumento(documentos, clienteData, grupoSeleccionado);
      const listaGrupo = getGruposPorCliente(clienteData);
      listaGrupo.then(grupos => {
        setGruposCliente(grupos); 
      });
      handleCloseModal();
    } catch (error) {
        console.error('Error al guardar documento:', error);
    }
  };

  //logica para aceptar clientes
  const handleAdmitirClienteGrupo = async (idCliente) => {
    setLoading(true); 
    try {
      const idGrupo = grupoSeleccionado.idGrupoI;
      const response = await admitirClienteGrupo(idCliente, idGrupo);
      handleListaClientesPendientes(grupoSeleccionado);
    } catch (error) {
        console.error("Error al admitir el cliente", error);
    } finally {
        setLoading(false); 
    }
  };

  const handleRechazarClienteGrupo = async (idCliente) => {
    setLoading(true); 
    try {
      const idGrupo = grupoSeleccionado.idGrupoI;
      const response = await rechazarClienteGrupo(idCliente, idGrupo);
      handleListaClientesPendientes(grupoSeleccionado);
    } catch (error) {
        console.error("Error al rechazar el cliente", error);
    } finally {
        setLoading(false);
    }
  };

  const handleRetirarClienteGrupo = (idCliente, idGrupo) =>{
    console.log("Retirar Cliente: ",idCliente);
    console.log("Grupo: ",idGrupo);
  };

  const handleIniciarGrupo = async (grupo) =>{
    setLoading(true);
    try {
        const detallesGrupo = await getDetallesGrupo(grupo.idGrupoI);
        setDetallesGrupo(detallesGrupo);
        setShowModalInciarGrupo(true);
    } catch (error) {
        console.error("Error al cargar los detalles del grupo:", error);
    } finally {
        setLoading(false);
    }
  };

  const handleAceptarIniciarGrupo = async (grupo, fechaInicio) => {
    setLoading(true);
    try {
      const cronograma = await crearCronogramaPorGrupo(grupo.idGrupo, fechaInicio);
      alert(cronograma.mensaje);
    } catch (error) {
      console.error("Error al crear cronograma:", error);
    } finally {
      setLoading(false);
      setShowModalInciarGrupo(false);
      window.location.reload();
    }
  };

  //Funcion de mensajes
  const showSuccessMessage = (msg) => {
    setMessage(msg);
    setMessageType("success");
    setShowMessage(true);

    // Opcionalmente ocultamos el mensaje después de 3 segundos
    setTimeout(() => {
      setShowMessage(false);
    }, 3000);
  };

  const showErrorMessage = (msg) => {
    setMessage(msg);
    setMessageType("error");
    setShowMessage(true);

    // Opcionalmente ocultamos el mensaje después de 3 segundos
    setTimeout(() => {
      setShowMessage(false);
    }, 3000);
  };

  const grupo = {
    idGrupoI: 0,
    idModeloVehiculoI: modeloVehiculo,
    codigoC: "0",
    cantMaxIntegrantesI: cantMaxIntegrantes,
    fechaCreacionD: new Date().toISOString(), 
    fechaInicioPanderoD: null,
    estadoC: "E",
    cantidadCuotasI: cantidadCuotas,
    tipoPeriodoPagoC: tipoPeriodoPago,
    precioUnidadVehiculoM: precioVehiculo,
    montoCuotaN: montoCuota
  };

  return (
    <div className="container mt-4 mb-4">
      <h3 className="mb-4">Grupos</h3>

      {/* Sección de búsqueda */}
      <div className="d-flex flex-column flex-sm-row align-items-center mb-3">
        <label htmlFor="searchDropdown" className="form-label me-2">
          Buscar Grupo:
        </label>
        <select
          id="searchDropdown"
          className="form-select me-2 mb-2 mb-sm-0"
          style={{ width: '250px' }}
          value={selectedOption}
          onChange={handleOptionChange}
        >
          <option value="">Seleccione un Grupo</option>
          <option value="nombre1">Nombre 1</option>
          <option value="nombre2">Nombre 2</option>
          <option value="nombre3">Nombre 3</option>
        </select>
        <button className="btn btn-primary me-2">
          Buscar
        </button>
      </div>
      {/**Añadir modal */}

      {/* Botones Crear y Unirse a Grupo */}
      <div className="mb-3 d-flex flex-column flex-sm-row">
        <button className="btn btn-primary me-2 mb-2 mb-sm-0" onClick={() => toggleCreateJoinModal(false)}>
          Crear Grupo
        </button>
        <button className="btn btn-warning" onClick={() => toggleCreateUModal(true)}>
          Agregar Grupo
        </button>
      </div>
      {showMessage && (
            <div
              className={`alert ${messageType === "success" ? "alert-success" : "alert-danger"}`}
              role="alert"
            >
              {message}
            </div>
          )}

      {showCreateJoinModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h5>Configuración</h5>
            <form className="mb-4" onSubmit={(e) => e.preventDefault()}>
              <div className="mb-3 d-flex flex-column flex-sm-row align-items-center">
                <label className="me-2 w-25">Modelo de Vehículo</label>
                <select 
                  className="form-control w-75"
                  id="modeloVehiculo"
                  value={modeloVehiculo}
                  onChange={handleModeloVehiculo}
                  required>
                  <option value="">Seleccione un modelo</option>
                  {modelos.map((modelo) => (
                    <option key={modelo.idModeloVehiculoI} value={modelo.idModeloVehiculoI}>
                      {modelo.nombreNv}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3 d-flex flex-column flex-sm-row align-items-center">
                <label className="me-2 w-25">Precio</label>
                <input
                  id="precioVehiculo"
                  type="number"
                  className="form-control w-75"
                  placeholder="Precio"
                  value={precioVehiculo}
                  readOnly
                />
              </div>

              <div className="mb-3 d-flex flex-column flex-sm-row align-items-center">
                <label className="me-2 w-25">Cantidad de Integrantes</label>
                <select 
                  className="form-control w-75"
                  id="cantMaxIntegrantes"
                  value={cantMaxIntegrantes}
                  onChange={(e) => setCantMaxIntegrantes(e.target.value)}
                  required
                  >
                  <option value="">Seleccione cantidad</option>
                  <option value="20">20</option>
                  <option value="25">25</option>
                  <option value="30">30</option>
                </select>
              </div>

              <div className="mb-3 d-flex flex-column flex-sm-row align-items-center">
                <label className="me-2 w-25">Periodo</label>
                <select 
                className="form-control w-75"
                id="tipoPeriodoPago"
                value={tipoPeriodoPago}
                onChange={(e) => setTipoPeriodoPago(e.target.value)}
                required
                >
                  <option value="">Seleccione periodo</option>
                  <option value="D">Diario</option>
                  <option value="S">Semanal</option>
                  <option value="Q">Quincenal</option>
                  <option value="M">Mensual</option>
                </select>
              </div>

              <div className="mb-3 d-flex flex-column flex-sm-row align-items-center">
                <label className="me-2 w-25">Monto Cuota</label>
                <select 
                className="form-control w-75"
                id="montoCuota"
                value={montoCuota}
                onChange={(e) => setMontoCuota(e.target.value)}
                required
                >
                  <option value="">Seleccione cuota</option>
                  <option value={20}>S/20.00</option>
                  <option value={30}>S/30.00</option>
                  <option value={40}>S/40.00</option>
                  <option value={50}>S/50.00</option>
                  <option value={100}>S/100.00</option>
                  <option value={200}>S/200.00</option>
                  <option value={500}>S/500.00</option>
                  <option value={1000}>S/1,000.00</option>
                </select>
              </div>

              <div className="mb-3 d-flex flex-row align-items-center">
                <div className="w-auto" style={{fontWeight: 'bold' }}>
                  {cantidadCuotas} cuotas durante {tiempoPago} meses
                </div>
              </div>

              <div className="mb-3 d-flex flex-row align-items-center">
                <div className="w-auto" style={{fontWeight: 'bold' }}>
                  Sorteo cada {sorteo} días
                </div>
              </div>
              
              <div className="mb-3">
                <button className="btn btn-primary me-2" onClick={crearGrupoModal}>
                  Crear Grupo
                </button>
                <button className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateUModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h5>Ingrese Código de Grupo</h5>
            <form className="mb-4" onSubmit={handleAgregarListaClienteGrupo}>
              <div className="mb-3 d-flex justify-content-center">
                <input
                  type="text"
                  className="form-control w-75 text-center"
                  placeholder="Código"
                  onChange={(e) => setCodigoGrupo(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <button type="submit" className="btn btn-primary me-2">
                  Agregar
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseModal}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla de grupos */}
      <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
      <table className="table table-bordered table table-striped">
        <thead className="table-dark" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
          <tr>
            <th>Código</th>
            <th>Estado</th>
            <th>Fecha de Inicio</th>
            <th>Cuota Total</th>
            <th>Periodo</th>
            <th>Detalles</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {gruposCliente.map((item) => (
            <tr key={item.idGrupoI}>
              <td>{item.codigoC}</td>
              <td>
                {({
                  'A': 'Abierto',
                  'C': 'Cerrado',
                  'F': 'Funcionando',
                  'T': 'Terminado'
                })[item.estadoC] || 'En Espera'}
              </td>
              <td>
                {item.fechaInicioPanderoD ? 
                  new Date(item.fechaInicioPanderoD).toLocaleDateString() : 
                  'Sin Fecha'}
              </td>
              <td>
                {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(item.precioUnidadVehiculoM)}
              </td>
              <td>
                {({
                  'D': 'Diario',
                  'S': 'Semanal',
                  'Q': 'Quincenal',
                  'M': 'Mensual'
                })[item.tipoPeriodoPagoC]}
              </td>
              <td>
                <button
                  className={documentosDisponibles[item.idGrupoI]?.estado !== 'A'?"btn btn-secondary":"btn btn-primary"}
                  onClick={() => handleShowDetailsModal(item)}
                  // handleShowDetails
                  disabled={documentosDisponibles[item.idGrupoI]?.estado !== 'A'}
                >
                  Ver
                </button>
              </td>
              <td>
                {/*Botones de Acciones */}
                <ButtonAccionGrupo 
                  cliente={clienteData}
                  grupo={item}
                  onUnirseGrupo={handleUnirseGrupo}
                  onSolicitudes={handleListaClientesPendientes}
                  onDocumentos={handleDocumento}
                  onIniciarGrupo={handleIniciarGrupo}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
      {/* Modal para guardar documentos */}
      <ModalGuardarDocumento
        show={showModal}
        onClose={handleCloseModal}
        onSave={handleSaveDocumentos}
      />
      {/* Modal de detalles del grupo */}
      <ModalDetallesGrupo
        show={showModalDetalles}
        onClose={handleCloseModal}
        detallesGrupo={detallesGrupo}
        cliente={clienteData}
        onRetirarGrupo={handleRetirarClienteGrupo}
      />
      {/* Modal con la lista de clientes */}
      <ModalClientesPendientes
        show={showModalClientesPendientes}
        onClose={handleCloseModal}
        clientes={clientesPendientes}
        onAccept={handleAdmitirClienteGrupo}
        onReject={handleRechazarClienteGrupo}
      />
      {/*Modal para iniciar grupo. */}
      <ModalIniciarGrupo
        show={showModalIniciarGrupo}
        onClose={handleCloseModal}
        cliente={clienteData}
        grupo={detallesGrupo}
        onIniciarGrupo={handleAceptarIniciarGrupo}
      />
    </div>
  );
};

export default Grupos;