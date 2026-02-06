import axios from 'axios';

export const API_URL = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

// ✅ Interceptor de solicitud: agrega el token JWT automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ⚠️ Interceptor de respuesta: detecta errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Si el token expira o no es válido
      if (error.response.status === 401) {
        console.warn('⚠️ Sesión expirada o token inválido.');
        // Elimina token y redirige al login (opcional)
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = '/'; // Redirigir al login
      }
    }
    return Promise.reject(error);
  }
);

export default api;