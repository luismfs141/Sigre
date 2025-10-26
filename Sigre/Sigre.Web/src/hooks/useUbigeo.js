import { useState } from 'react';
import api from '../api/apiConfig';

export const useUbigeo = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [departamentos, setDepartamentos] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [distritos, setDistritos] = useState([]);

  const getDepartamentos = async () => {
    setLoading(true);
    setError(''); // Limpiar el error antes de hacer la llamada

    try {
      const response = await api.get("/Ubigeo/GetDepartamentos");
      if (response && response.data) {
        setDepartamentos(response.data); // Guardamos los departamentos en el estado
        return response.data; // Retorna los datos para que puedan ser usados donde sea necesario
      } else {
        setError("No se encontraron departamentos");
      }
    } catch (error) {
      // En caso de error, mostramos el mensaje del error
      setError(error.response?.data?.Mensaje || 'Hubo un error al obtener los departamentos');
    } finally {
      setLoading(false);
    }
  };

  const getProvincias = async (idDepartamento) => {
    setLoading(true);
    setError(''); // Limpiar el error antes de hacer la llamada

    try {
      const response = await api.get(`/Ubigeo/GetProvincias?idDepartamento=${idDepartamento}`);
      if (response && response.data) {
        setProvincias(response.data); // Guardamos los departamentos en el estado
        return response.data; // Retorna los datos para que puedan ser usados donde sea necesario
      } else {
        setError("No se encontraron provincias");
      }
    } catch (error) {
      // En caso de error, mostramos el mensaje del error
      setError(error.response?.data?.Mensaje || 'Hubo un error al obtener los departamentos');
    } finally {
      setLoading(false);
    }
  };

  const getDistritos = async (idProvincia) => {
    setLoading(true);
    setError(''); // Limpiar el error antes de hacer la llamada

    try {
      const response = await api.get(`/Ubigeo/GetDistritos?idProvincia=${idProvincia}`);
      if (response && response.data) {
        setDistritos(response.data); // Guardamos los departamentos en el estado
        return response.data; // Retorna los datos para que puedan ser usados donde sea necesario
      } else {
        setError("No se encontraron provincias");
      }
    } catch (error) {
      // En caso de error, mostramos el mensaje del error
      setError(error.response?.data?.Mensaje || 'Hubo un error al obtener los departamentos');
    } finally {
      setLoading(false);
    }
  };

  return { getDepartamentos, getProvincias, getDistritos, distritos, provincias, departamentos, loading, error };
};