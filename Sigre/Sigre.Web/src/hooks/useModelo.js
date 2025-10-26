import api from '../api/apiConfig';

export const useModelo = () => {

    const getModelos = async () =>{
        try {
            const response = await api.get(`/Modelo/ObtenerModelos`);
            // Aseguramos que 'response.data.objeto' siempre sea un arreglo
            return Array.isArray(response.data.objeto) ? response.data.objeto : [];
        } catch (error) {
            console.error("Error al obtener los modelos:", error);
            return [];
        }
    };
    return{
        getModelos
    };
}