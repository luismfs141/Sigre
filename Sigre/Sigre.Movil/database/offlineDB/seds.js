import { runQuery } from "./db";

export const getSedById = async (id) => {
  try {
    const rows = await runQuery(
      "SELECT * FROM Seds WHERE SedInterno = ?",
      [id]
    );

    if (!rows || rows.length === 0) {
      console.warn(`⚠ No hay SED ${id}`);
      return [];
    }

    return rows;
  } catch (error) {
    console.error(`❌ Error al obtener el SED ${id}:`, error);
    return [];
  }
};