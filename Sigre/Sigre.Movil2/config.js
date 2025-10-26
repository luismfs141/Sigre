import axios from 'axios';

//const baseURL = 'https://sigreserver.azurewebsites.net/api/'; // producción
//const baseURL = 'https://localhost:44325/api/'; // desar con SSL
//const baseURL = 'http://localhost:56870/api/'; // desa sin SSL
//const baseURL = 'https://localhost:7280/api/'; //
//const baseURL = 'http://192.168.0.208/SigreHost/api/'; // local
const baseURL = 'http://192.168.1.79/SigreHost/api/'; // local

export const API_URL = baseURL;

export const api = () => {
  const headers = {
    'Content-Type': 'application/json'
  };
  const defaultOptions = {
    baseURL,
    headers
  };
  return axios.create(defaultOptions);
};