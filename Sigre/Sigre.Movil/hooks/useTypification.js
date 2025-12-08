import { useDatos } from "../context/DatosContext";
import { getTypificationByTypeElement } from "../database/offlineDB/typification";

export const useTypification = () => {
  const { checkDatabase } = useDatos();

  const fetchTypificationsByElement = async (tableId) => {
    const dbOk = await checkDatabase();
    if (!dbOk) {
      console.warn("⚠ Base de datos no disponible. No se pueden cargar las tipificaciones.");
      return [];
    }

    try {
      const data = await getTypificationByTypeElement(tableId);
      return data;
    } catch (err) {
      console.error("❌ Error al obtener tipificaciones:", err);
      return [];
    }
  };

  return {
    fetchTypificationsByElement
  };
};