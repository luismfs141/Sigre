import { runQuery } from "./db";

export const getPostById = async (id) => {
  try {
    const rows = await runQuery(
      "SELECT * FROM Postes WHERE PostInterno = ?",
      [id]
    );

    if (!rows || rows.length === 0) {
      console.warn(`⚠ No hay poste ${id}`);
      return [];
    }

    return rows;
  } catch (error) {
    console.error(`❌ Error al obtener el poste ${id}:`, error);
    return [];
  }
};