
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
      [alimInterno]
    );

    if (!rows || rows.length === 0) {
      console.warn("[getFeederByIdLocal] Sin alimentador con id:", alimInterno);
      return null;
    }

    const f = rows[0];

    console.log("[getFeederByIdLocal] resultado desde DB:", f);

    return f;
  } catch (err) {
    console.error("[getFeederByIdLocal] Error:", err);
    return null;
  }
};
