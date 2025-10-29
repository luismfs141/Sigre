import { useState } from 'react';
import api from '../api/apiConfig';

export const useUsuario = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getUsuarioLocalStorage = () => {
    const usuarioStr = localStorage.getItem('usuario');
    if (!usuarioStr) return null;

    try {
      const usuario = JSON.parse(usuarioStr);
      return {
        id: usuario.usuaInterno,
        nombre: usuario.usuaNombres,
        apellidos: usuario.usuaApellidos,
        token: usuario.token
      };
    } catch (error) {
      console.error("Error al leer usuario del localStorage:", error);
      return null;
    }
  };

  const loginUsuario = async (correo, password) => {
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/Auth/Login', {
        correo,
        password,
        imei: null
      });

      if (response.data) {
        const usuarioData = response.data;
        localStorage.setItem('usuario', JSON.stringify(usuarioData));
        localStorage.setItem('token', usuarioData.token);
        return usuarioData;
      } else {
        setError('Credenciales inválidas.');
        throw new Error('Credenciales inválidas.');
      }
    } catch (err) {
      console.error('Error de login:', err);
      setError(err.response?.data?.message || 'Error al intentar hacer login');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logoutUsuario = () => {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
  };

  return {
    loginUsuario,
    getUsuarioLocalStorage,
    logoutUsuario,
    loading,
    error
  };
};
