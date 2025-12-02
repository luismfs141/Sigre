import { runQuery } from "./db";

export const getGapsByFeederLocal = async (feederId) => {
  try {
    const rows = await runQuery(
      "SELECT * FROM Vanos WHERE AlimInterno = ?",
      [feederId]
    );

    if (!rows || rows.length === 0) {
      console.warn(`⚠ No hay gaps para el alimentador ${feederId}`);
      return [];
    }

    return rows;
  } catch (error) {
    console.error(`❌ Error al obtener gaps locales para el alimentador ${feederId}:`, error);
    return [];
  }
};

export const getGapsBySedLocal = async (sedId) => {
  try {
    sedId = Number(sedId);
    const rows = await runQuery(
      "SELECT * FROM Vanos WHERE VanoSubestacion = ?",
      [sedId]
    );

    if (!rows || rows.length === 0) {
      console.warn(`⚠ No hay gaps para la subestacion${sedId}`);
      return [];
    }

    return rows;
  } catch (error) {
    console.error(`❌ Error al obtener gaps locales para la subestacion ${sedId}:`, error);
    return [];
  }
};