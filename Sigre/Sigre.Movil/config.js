import axios from 'axios';

//const baseURL = 'https://sigreserver.azurewebsites.net/api/'; // producción
//const baseURL = 'https://localhost:44325/api/'; // desar con SSL
//const baseURL = 'http://localhost:56870/api/'; // desa sin SSL
//const baseURL = 'https://localhost:7280/api/'; //
//const baseURL = 'http://192.168.0.208/SigreHost/api/'; // local Luis
//const baseURL = 'http://192.168.1.32/SigreHost/api/'; // local Roy
//const baseURL = 'http://192.168.1.41/SigreHost/api/'; // OFICINA SIGRE
const baseURL = 'https://balladlike-priscilla-uncaringly.ngrok-free.dev/SigreHost/api/'; // ngrok acceso
export const API_URL = baseURL; 

export const api = () => {
  return axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
  });
}; 