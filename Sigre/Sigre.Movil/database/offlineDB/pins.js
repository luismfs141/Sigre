import { runQuery } from "./db";

export const getPinsByFeederLocal = async (feederId) => {
  try {
    const rows = await runQuery(
      "SELECT * FROM Pines WHERE IdAlimentador = ?",
      [feederId]
    );

    if (!rows || rows.length === 0) {
      console.warn(`⚠ No hay pines para el alimentador ${feederId}`);
      return [];
    }

    return rows;
  } catch (error) {
    console.error(`❌ Error al obtener pines locales para el alimentador ${feederId}:`, error);
    return [];
  }
};

export const getPinsBySedLocal = async (sedId) => {
  try {
    const rows = await runQuery(
      "SELECT * FROM Pines WHERE IdSed = ?",
      [sedId]
    );

    if (!rows || rows.length === 0) {
      console.warn(`⚠ No hay pines para la subestacion ${sedId}`);
      return [];
    }

    return rows;
  } catch (error) {
    console.error(`❌ Error al obtener pines locales para el alimentador ${sedId}:`, error);
    return [];
  }
};