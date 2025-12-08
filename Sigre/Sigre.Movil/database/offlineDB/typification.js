import { runQuery } from "./db";

export const getTypificationByTypeElement = async (tableId) => {
  try {
    const typifications = await runQuery(
      "SELECT * FROM Tipificaciones WHERE TableId = ?",
      [tableId]
    );

    if (!typifications || typifications.length === 0) {
      console.warn(`⚠ No hay tipificaciones`);
      return [];
    }

    return typifications;
  } catch (error) {
    console.error(`❌ Error al obtener las tipificaciones:`, error);
    return [];
  }
};

