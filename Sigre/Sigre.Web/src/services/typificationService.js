import api from "../api/apiConfig";

// Obtiene TODAS las tipificaciones del servidor
export const getAllTypifications = async () => {
  try {
    const response = await api.get('/Typification/GetAll');
    return response.data; 
  } catch (error) {
    console.error("❌ Error API Tipificaciones:", error);
    return [];
  }
};