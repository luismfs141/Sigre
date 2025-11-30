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



