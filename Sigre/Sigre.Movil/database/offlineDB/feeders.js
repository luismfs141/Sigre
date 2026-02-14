
import { runQuery } from './db';

export const getAllFeedersLocal = async () => {
  try {
    const sql = `
      SELECT 
        AlimInterno,
        AlimCodigo,
        AlimLatitud,
        AlimLongitud,
        AlimEtiqueta
      FROM Alimentadores
      ORDER BY AlimEtiqueta ASC;
    `;

    const rows = await runQuery(sql, [], true);

    if (!rows || rows.length === 0) {
      console.warn("⚠ No hay alimentadores en la base local");
      return [];
    }

    return rows;
  } catch (error) {
    console.error("❌ Error al obtener alimentadores locales:", error);
    return [];
  }
};


// 🔎 Nuevo: obtener un alimentador por su AlimInterno
export const getFeederByIdLocal = async (alimInterno) => {
  try {
    const rows = await runQuery(
      "SELECT * FROM Alimentadores WHERE AlimInterno = ?",
      [alimInterno],
      true // ✅ igual que getAllFeedersLocal
    );

    if (!rows || rows.length === 0) return null;
    return rows[0];
  } catch (err) {
    console.error("[getFeederByIdLocal] Error:", err);
    return null;
  }
};


export const getSingleFeederLocal = async () => {
  try {
    const sql = `
      SELECT 
        AlimInterno,
        AlimCodigo,
        AlimLatitud,
        AlimLongitud,
        AlimEtiqueta
      FROM Alimentadores
      LIMIT 1;
    `;

    const rows = await runQuery(sql, [], true);
    return rows?.[0] ?? null;
  } catch (error) {
    console.error("❌ Error getSingleFeederLocal:", error);
    return null;
  }
};
