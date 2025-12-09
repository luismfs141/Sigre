// database/offlineDB/files.js
import { runQuery } from "./db";

export const getNextArchCodTablaLocal = async () => {
  try {
    const rows = await runQuery(
      "SELECT COALESCE(MAX(ArchCodTabla), 0) + 1 AS NextCode FROM Archivos",
      []
    );
    if (rows && rows.length > 0 && rows[0].NextCode != null) {
      return rows[0].NextCode;
    }
    return 1;
  } catch (error) {
    console.error("❌ Error obteniendo Next ArchCodTabla:", error);
    return 1;
  }
};

export const insertArchivoLocal = async ({
  archTipo,    // 0 = foto, 1 = audio
  archTabla,   // 'Deficiencias'
  archCodTabla,
  archNombre,  // ruta relativa SIGRE/.../archivo.ext
  archLatit,   // latitude
  archLong,    // longitude
  archFech,    // 'YYYY-MM-DD HH:mm:ss'
  archActiv = 1,
}) => {
  try {
    await runQuery(
      `
      INSERT INTO Archivos
        (ArchTipo, ArchTabla, ArchCodTabla, ArchNombre,
         ArchLatitud, ArchLongitud, ArchFecha, ArchActivo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        archTipo,
        archTabla,
        archCodTabla,
        archNombre,
        archLatit,   // → ArchLatitud
        archLong,    // → ArchLongitud
        archFech,    // → ArchFecha
        archActiv,   // → ArchActivo
      ]
    );
  } catch (error) {
    console.error("❌ Error insertando en Archivos:", error);
    throw error;
  }
};
