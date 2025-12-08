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
    // 1. Obtener postes/vanos asociados a la SED
    const rows = await runQuery(
      "SELECT * FROM Pines WHERE IdSed = ?",
      [sedId]
    );

    // 2. Obtener la SED (Id es NULL y IdOriginal coincide)
    const sedRows = await runQuery(
      "SELECT * FROM Pines WHERE IdOriginal = ? AND IdSed IS NULL LIMIT 1",
      [sedId]
    );

    if ((!rows || rows.length === 0) && (!sedRows || sedRows.length === 0)) {
      console.warn(`⚠ No hay pines ni SED para el sedId ${sedId}`);
      return [];
    }

    // 3. Primero la SED, luego los pines
    const combined = [
      ...(sedRows ?? []),
      ...(rows ?? [])
    ];

    return combined;

  } catch (error) {
    console.error(`❌ Error al obtener pines locales para sedId ${sedId}:`, error);
    return [];
  }
};
