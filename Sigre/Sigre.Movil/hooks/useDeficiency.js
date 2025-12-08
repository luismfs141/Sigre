import { useDatos } from "../context/DatosContext";
import { getDeficiencyByTypificationElement } from "../database/offlineDB/deficiencies";

export const useDeficiency = () => {
  const { checkDatabase } = useDatos();

  /**
   * Obtiene las deficiencias asociadas a un elemento y tipificación
   */
  const fetchDeficiencyByTypificationElement = async (idElement, typeElement, idTypification) => {
    const dbOk = await checkDatabase();
    if (!dbOk) {
      console.warn("⚠ Base de datos no disponible. No se pueden cargar las deficiencias.");
      return [];
    }

    try {
      const deficiencies = await getDeficiencyByTypificationElement(idElement, typeElement, idTypification);
      return deficiencies;
    } catch (error) {
      console.error("❌ Error al obtener las deficiencias:", error);
      return [];
    }
  };

  return {
    fetchDeficiencyByTypificationElement
  };
};