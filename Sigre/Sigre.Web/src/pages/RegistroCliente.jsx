import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCliente } from '../hooks/useCliente';
import { useUbigeo } from '../hooks/useUbigeo';

const RegistroCliente = () => {

  const navigate = useNavigate();
  const { getDepartamentos, departamentos, getProvincias, provincias, getDistritos, distritos } = useUbigeo();
  const { registrarCliente, loading } = useCliente();

  const [nombre, setNombre] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [nroDocumento, setNroDocumento] = useState('');
  const [sexo, setSexo] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [estadoCivil, setEstadoCivil] = useState('');
  const [nroContacto, setNroContacto] = useState('');
  const [correo, setCorreo] = useState('');
  const [direccion, setDireccion] = useState('');
  const [direccionRef, setDireccionRef] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [provincia, setProvincia] = useState('');
  const [distrito, setDistrito] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  const [departamentosLoaded, setDepartamentosLoaded] = useState(false);

  const handleFocus = async () => {
    if (!departamentosLoaded) {
      // Obtener los departamentos solo si no se han cargado aún
      try {
        await getDepartamentos(); // Llama a tu API para obtener los departamentos
        setDepartamentosLoaded(true); // Marca como cargado
      } catch (err) {
        console.error("Error al obtener departamentos", err);
      }
    }
  };

  const handleDepartamentoChange = (e) => {
    const idDepartamento = e.target.value;
    setDepartamento(idDepartamento);
    setProvincia(""); // Limpiar la provincia seleccionada al cambiar el departamento
    setDistrito("");
    getProvincias(idDepartamento); // Llamamos a la API para obtener las provincias
  };

  const handleProvinciaChange = (e) =>{
    const idProvincia = e.target.value;
    setProvincia(idProvincia);
    setDistrito(""); // Limpiar la provincia seleccionada al cambiar el departamento
    getDistritos(idProvincia); // Llamamos a la API para obtener las provincias
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (password !== passwordConfirmation) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    const clienteData = {
      idClienteI: 0,
      codigoC: "C000000",
      nombreNv: nombre,
      apellidoPaternoNv: apellidoPaterno,
      apellidoMaternoNv: apellidoMaterno,
      tipoDocumentoC: tipoDocumento,
      nroDocumentoV: nroDocumento,
      sexoC: sexo,
      fechaNacimientoD: new Date(fechaNacimiento).toISOString(),
      estadoCivilC: estadoCivil,
      nroContactoC: nroContacto,
      correoNv: correo,
      correoAutenticadoBo: true,
      direccionNv: direccion,
      direccionRefNv: direccionRef,
      idDistritoC: distrito,
      passwordBi: btoa(password),
      estadoC: 'A',
      fechaInscripcionD: new Date().toISOString()
    };

    try {
      await registrarCliente(clienteData);
      alert('Cliente registrado exitosamente!');
      navigate('/Login');
    } catch (err) {
      console.error('Error al registrar cliente:', err);
      alert('Hubo un error al registrar el cliente.');
    }
  };

  const handleBackToLogin = () => {
    navigate('/Login');
  };

  return (
    <div className="container my-5">
      <div className="card shadow-sm p-4">
        <h2 className="text-center mb-4">Registrar Nuevo Cliente</h2>
        <form onSubmit={handleSubmit}>
          {/* Datos Personales */}
          <fieldset>
            <legend>Datos Personales</legend>
            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="nombre" className="form-label">Nombre</label>
                <input
                  id="nombre"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  className="form-control"
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="apellidoPaterno" className="form-label">Apellido Paterno</label>
                <input
                  id="apellidoPaterno"
                  type="text"
                  value={apellidoPaterno}
                  onChange={(e) => setApellidoPaterno(e.target.value)}
                  required
                  className="form-control"
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="apellidoMaterno" className="form-label">Apellido Materno</label>
                <input
                  id="apellidoMaterno"
                  type="text"
                  value={apellidoMaterno}
                  onChange={(e) => setApellidoMaterno(e.target.value)}
                  required
                  className="form-control"
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-3">
                <label htmlFor="tipoDocumento" className="form-label">Tipo de Documento</label>
                <select
                  id="tipoDocumento"
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value)}
                  required
                  className="form-select"
                >
                  <option value="">Selecciona un tipo de documento</option>
                  <option value="D">DNI</option>
                  <option value="P">Pasaporte</option>
                  <option value="C">Carnet</option>
                </select>
              </div>
              <div className="col-md-3">
                <label htmlFor="nroDocumento" className="form-label">Número de Documento</label>
                <input
                  id="nroDocumento"
                  type="text"
                  value={nroDocumento}
                  onChange={(e) => setNroDocumento(e.target.value)}
                  required
                  className="form-control"
                  maxLength={8}
                  minLength={8}
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="sexo" className="form-label">Sexo</label>
                <select
                  id="sexo"
                  value={sexo}
                  onChange={(e) => setSexo(e.target.value)}
                  required
                  className="form-select"
                >
                  <option value="">Selecciona el sexo</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
              <div className="col-md-3">
                <label htmlFor="estadoCivil" className="form-label">Estado Civil</label>
                <select
                  id="estadoCivil"
                  value={estadoCivil}
                  onChange={(e) => setEstadoCivil(e.target.value)}
                  required
                  className="form-select"
                >
                  <option value="">Selecciona el estado Civil</option>
                  <option value="S">Soltero(a)</option>
                  <option value="C">Casado(a)</option>
                  <option value="V">Viudo(a)</option>
                  <option value="D">Divorciado(a)</option>
                </select>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-3">
                <label htmlFor="fechaNacimiento" className="form-label">Fecha de Nacimiento</label>
                <input
                  id="fechaNacimiento"
                  type="date"
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                  required
                  className="form-control"
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="nroContacto" className="form-label">Número de Contacto</label>
                <input
                  id="nroContacto"
                  type="text"
                  value={nroContacto}
                  onChange={(e) => setNroContacto(e.target.value)}
                  required
                  className="form-control"
                  maxLength={9} 
                  minLength={9}
                />
              </div>
            </div>
          </fieldset>

          {/* Dirección */}
          <fieldset>
            <legend>Dirección</legend>
            <div className="row mb-3">
              <div className="col-md-3">
                <label htmlFor="departamento" className="form-label">Departamento</label>
                <select
                  id="departamento"
                  value={departamento}
                  onChange={handleDepartamentoChange}
                  onFocus={handleFocus}
                  required
                  className="form-select"
                >
                  <option value="">Selecciona el departamento</option>
                  {/* Renderizamos los departamentos aquí */}
                  {departamentos.map((dep) => (
                    <option key={dep.idDepartamentoC} value={dep.idDepartamentoC}>{dep.nombreNv}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label htmlFor="provincia" className="form-label">Provincia</label>
                <select
                  id="provincia"
                  value={provincia}
                  onChange={handleProvinciaChange}
                  required
                  className="form-select"
                >
                  <option value="">Selecciona la provincia</option>
                  {provincias.map((prov) => (
                    <option key={prov.idProvinciaC} value={prov.idProvinciaC}>{prov.nombreNv}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label htmlFor="distrito" className="form-label">Distrito</label>
                <select
                  id="distrito"
                  value={distrito}
                  onChange={(e) => setDistrito(e.target.value)}
                  required
                  className="form-select"
                >
                  <option value="">Selecciona el distrito</option>
                  {distritos.map((dis) => (
                    <option key={dis.idDistritoC} value={dis.idDistritoC}>{dis.nombreNv}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="direccion" className="form-label">Dirección</label>
                <input
                  id="direccion"
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  required
                  className="form-control"
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="direccionRef" className="form-label">Referencia de Dirección</label>
                <input
                  id="direccionRef"
                  type="text"
                  value={direccionRef}
                  onChange={(e) => setDireccionRef(e.target.value)}
                  required
                  className="form-control"
                />
              </div>
            </div>
          </fieldset>

          {/* Credenciales */}
          <fieldset>
            <legend>Credenciales</legend>
            <div className="row mb-3">
              <div className="col-md-4">
                <label htmlFor="correo" className="form-label">Correo</label>
                <input
                  id="correo"
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                  className="form-control"
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="password" className="form-label">Contraseña</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="form-control"
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="passwordConfirmation" className="form-label">Confirmar Contraseña</label>
                <input
                  id="passwordConfirmation"
                  type="password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                  className="form-control"
                />
              </div>
            </div>
          </fieldset>

          {/* Botones */}
          <div className="d-flex justify-content-center gap-3 mt-4">
            <button type="button" className="btn btn-danger" onClick={handleBackToLogin}>
              Regresar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistroCliente;