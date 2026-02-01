import api from "../api/apiConfig"; // Importamos tu instancia configurada

export const ReporteService = {
    /**
     * Obtiene el reporte segregado (Postes y Vanos) para una Subestación específica.
     * @param {number} sedInterno - ID interno de la Subestación.
     */
    getReportePorSED: async (sedInterno) => {
        try {
            // Ya no necesitas poner la URL completa, 'api' ya tiene la baseURL.
            // Asumimos que tu baseURL termina en '/api'
            const response = await api.get(`/Deficiency/reporte-sed/${sedInterno}`);
            
            // Retornamos directamente la data { postes: [...], vanos: [...] }
            return response.data; 
        } catch (error) {
            console.error("Error en ReporteService:", error);
            throw error;
        }
    }
};