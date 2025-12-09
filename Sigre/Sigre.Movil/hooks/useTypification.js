import { useDatos } from "../context/DatosContext";
import { getTypificationByIdElement, getTypificationByTypeElement } from "../database/offlineDB/typification";

export const useTypification = () => {
  const { checkDatabase } = useDatos();

  const fetchTypificationsByTypeElement = async (tableId) => {
    const dbOk = await checkDatabase();
    if (!dbOk) {
      console.warn("⚠ Base de datos no disponible. No se pueden cargar las tipificaciones.");
      return [];
    }

    try {
      return await getTypificationByTypeElement(tableId);
    } catch (error) {
      console.error("❌ Error al obtener tipificaciones por tipo de elemento:", error);
      return [];
    }
  };

  const fetchTypificationsByElement = async (idElement, typeElement) => {
    const dbOk = await checkDatabase();
    if (!dbOk) {
      console.warn("⚠ Base de datos no disponible. No se pueden cargar las tipificaciones.");
      return [];
    }

    // ⚠ PARCHE QUE EVITA EL CRASH
    if (!idElement) {
      console.warn("⚠ No se encontraron tipificaciones para el elemento undefined");
      return [];
    }

    try {
      return await getTypificationByIdElement(idElement, typeElement);
    } catch (error) {
      console.error("❌ Error al obtener tipificaciones por elemento:", error);
      return [];
    }
  };

  return {
    fetchTypificationsByTypeElement,
    fetchTypificationsByElement
  };
};
