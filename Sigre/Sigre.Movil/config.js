import axios from 'axios';

//const baseURL = 'http://192.168.1.12/SigreHost/api/'; // local Roy
const baseURL = 'http://192.168.0.208/SigreHost/api/'; // local Luis
//const baseURL = 'http://192.168.1.28/SigreHost/api/'; // local Roy
//const baseURL = 'http://192.168.18.34/SigreHost/api/'; //local Cami 
//const baseURL = 'http://192.168.1.41/SisgreHost/api/'; // OFICINA SIGRE
//const baseURL = 'https://sigre-api-a6bbh4drgpgjeshw.canadacentral-01.azurewebsites.net/api/';
export const API_URL = baseURL; 



export const api = () => {
  return axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
  });
}; 


