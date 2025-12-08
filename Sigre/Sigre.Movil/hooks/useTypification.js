import { useDatos } from "../context/DatosContext";
import { runQuery } from "../database/offlineDB/db";

export const useTypification = () => {
  const { checkDatabase } = useDatos();

  /**
   * Obtiene tipificaciones según el tipo de elemento (TableId)
   */
  const fetchTypificationsByTypeElement = async (tableId) => {
    const dbOk = await checkDatabase();
    if (!dbOk) {
      console.warn("⚠ Base de datos no disponible. No se pueden cargar las tipificaciones.");
      return [];
    }

    try {
      const typifications = await runQuery(
        "SELECT * FROM Tipificaciones WHERE TableId = ?",
        [tableId]
      );

      if (!typifications || typifications.length === 0) {
        console.warn(`⚠ No hay tipificaciones para TableId ${tableId}`);
        return [];
      }

      return typifications;
    } catch (error) {
      console.error("❌ Error al obtener tipificaciones por tipo de elemento:", error);
      return [];
    }
  };

  /**
   * Obtiene tipificaciones asociadas a un elemento específico
   */
  const fetchTypificationsByElement = async (idElement, typeElement) => {
    const dbOk = await checkDatabase();
    if (!dbOk) {
      console.warn("⚠ Base de datos no disponible. No se pueden cargar las tipificaciones.");
      return [];
    }

    try {
      const typifications = await runQuery(
        `SELECT t.*
         FROM Tipificaciones t
         INNER JOIN Deficiencias d ON t.TypificationId = d.tipiInterno
         WHERE d.DefiIdElemento = ? AND d.DefiTipoElemento = ?`,
        [idElement, typeElement]
      );

      if (!typifications || typifications.length === 0) {
        console.warn(`⚠ No se encontraron tipificaciones para el elemento ${idElement}`);
        return [];
      }

      return typifications;
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
