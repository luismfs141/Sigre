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

// Obtiene las opciones de una tipificación según su TIPI_Interno
export const getTypificationOptionsByTipiInterno = async (tipiInterno) => {
  try {
    const response = await api.get('/Typification/GetOptionsByTipiInterno', {
      params: { tipiInterno }
    });
    return response.data ?? [];
  } catch (error) {
    console.error("❌ Error API Opciones de Tipificación:", error);
    return [];
  }
};