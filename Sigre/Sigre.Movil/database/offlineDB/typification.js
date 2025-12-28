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
       WHERE d.DefiIdElemento = ? AND d.DefiTipoElemento = ? AND d.DefiActivo = 1`,
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

export const getTypificationByDeficiencies = async (idElement, typeElement) => {
  try {
    const typifications = await runQuery(
      `SELECT DISTINCT t.*
       FROM Tipificaciones t
       INNER JOIN Deficiencias d 
         ON t.TypificationId = d.TipiInterno
       WHERE d.DefiIdElemento = ?
         AND d.DefiTipoElemento = ?
         AND d.DefiActivo = 1`,
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

export const getTypificationByFiles = async (idElement, typeElement) => {
  try {
    const typifications = await runQuery(
      `SELECT DISTINCT t.*
       FROM Tipificaciones t
       INNER JOIN Archivos a 
         ON t.TypificationId = a.TipiInterno
       WHERE a.ArchIdElemento = ?
         AND a.ArchTipoElemento = ?
         AND a.ArchActivo = 1`,
      [idElement, typeElement]
    );

    if (!typifications || typifications.length === 0) {
      console.warn(`⚠ No se encontraron tipificaciones en archivos para el elemento ${idElement}`);
      return [];
    }

    return typifications;
  } catch (error) {
    console.error(`❌ Error al obtener tipificaciones desde archivos:`, error);
    return [];
  }
};
