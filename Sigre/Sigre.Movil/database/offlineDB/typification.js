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

export const getTypificationByIdElement = async (idElement, typeElement) => {
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
    console.error(`❌ Error al obtener las tipificaciones:`, error);
    return [];
  }
};
