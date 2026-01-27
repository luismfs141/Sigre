import axios from 'axios';

// 👉 URL base del backend
const baseURL = 'http://localhost/SigreHost/api/';
// Producción
//const baseURL = 'https://sigre-api-a6bbh4drgpgjeshw.canadacentral-01.azurewebsites.net/api/';

export const API_URL = baseURL; 
const api = axios.create({
  baseURL: baseURL,
  //timeout: 10000, // un poco más alto por seguridad
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