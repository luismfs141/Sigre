// // database/offlineDB/files.js
// import { runQuery } from "./db";

// export const getNextArchCodTablaLocal = async () => {
//   try {
//     const rows = await runQuery(
//       "SELECT COALESCE(MAX(ArchCodTabla), 0) + 1 AS NextCode FROM Archivos",
//       []
//     );
//     if (rows && rows.length > 0 && rows[0].NextCode != null) {
//       return rows[0].NextCode;
//     }
//     return 1;
//   } catch (error) {
//     console.error("❌ Error obteniendo Next ArchCodTabla:", error);
//     return 1;
//   }
// };

// export const insertArchivoLocal = async ({
//   archTipo,    // 0 = foto, 1 = audio
//   archTabla,   // 'Deficiencias'
//   archCodTabla,
//   archNombre,  // ruta relativa SIGRE/.../archivo.ext
//   archLatit,   // latitude
//   archLong,    // longitude
//   archFech,    // 'YYYY-MM-DD HH:mm:ss'
//   archActiv = 1,
// }) => {
//   try {
//     await runQuery(
//       `
//       INSERT INTO Archivos
//         (ArchTipo, ArchTabla, ArchCodTabla, ArchNombre,
//          ArchLatitud, ArchLongitud, ArchFecha, ArchActivo)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
//       `,
//       [
//         archTipo,
//         archTabla,
//         archCodTabla,
//         archNombre,
//         archLatit,   // → ArchLatitud
//         archLong,    // → ArchLongitud
//         archFech,    // → ArchFecha
//         archActiv,   // → ArchActivo
//       ]
//     );
//   } catch (error) {
//     console.error("❌ Error insertando en Archivos:", error);
//     throw error;
//   }
// };



// database/offlineDB/files.js
import { runQuery } from "./db";

/**
 * Obtiene el siguiente ArchCodTabla (grupo lógico de archivos).
 * Lo calculamos como MAX(ArchCodTabla) + 1.
 */
export const getNextArchCodTablaLocal = async () => {
  try {
    const rows = await runQuery(
      `SELECT COALESCE(MAX(ArchCodTabla), 0) + 1 AS NextCod FROM Archivos;`,
      []
    );

    if (rows && rows.length > 0) {
      return rows[0].NextCod;
    }

    return 1;
  } catch (error) {
    console.error("❌ Error en getNextArchCodTablaLocal:", error);
    throw error;
  }
};

/**
 * Inserta un archivo en la tabla Archivos.
 *
 * ⚠️ Ahora la semántica de ArchTipo cambia:
 *   - Fotos: sufijo del slot (1..6)
 *     1 = Frontal
 *     2 = P. derecho
 *     3 = P. izquierdo
 *     4 = Panorámico
 *     5 = Medidor
 *     6 = Adicional
 *   - Audios: siempre 0
 */
export const insertArchivoLocal = async ({
  archTipo,
  archTabla,
  archCodTabla,
  archNombre,
  archLatit,
  archLong,
  archFech,
  archActiv = 1,
}) => {
  try {
    await runQuery(
      `
      INSERT INTO Archivos (
        ArchTipo,
        ArchTabla,
        ArchCodTabla,
        ArchNombre,
        ArchLatitud,
        ArchLongitud,
        ArchFecha,
        ArchActivo,
        EstadoOffLine
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL);
    `,
      [
        String(archTipo), // guardamos como TEXT
        archTabla,
        archCodTabla,
        archNombre,
        archLatit,
        archLong,
        archFech,
        archActiv,
      ]
    );

    return true;
  } catch (error) {
    console.error("❌ Error en insertArchivoLocal:", error);
    throw error;
  }
};

/**
 * Obtiene los archivos ACTIVOS (ArchActivo = 1) cuya ruta (ArchNombre)
 * comienza con un prefijo dado (por ejemplo, 'SIGRE/.../DEF001/Fotos/').
 *
 * Se usa para reconstruir las fotos y audios de una deficiencia
 * a partir de la base de datos offline.
 */
export const getArchivosByBasePathLocal = async (basePathPrefix) => {
  try {
    const rows = await runQuery(
      `
      SELECT
        ArchInterno,
        ArchTipo,
        ArchTabla,
        ArchCodTabla,
        ArchNombre,
        ArchLatitud,
        ArchLongitud,
        ArchFecha,
        ArchActivo,
        EstadoOffLine
      FROM Archivos
      WHERE ArchTabla = 'Deficiencias'
        AND ArchActivo = 1
        AND ArchNombre LIKE ?;
    `,
      [`${basePathPrefix}%`]
    );

    return rows || [];
  } catch (error) {
    console.error("❌ Error en getArchivosByBasePathLocal:", error);
    return [];
  }
};

/**
 * Marca un archivo como BORRADO en la tabla Archivos:
 *   - ArchActivo = 0
 *   - ArchNombre = nueva ruta (misma estructura pero arrancando en BORRADOS)
 *
 * El movimiento físico del archivo a la carpeta BORRADOS se hace
 * en la capa de la UI (registerDef.js).
 */
export const markArchivoDeletedLocal = async (
  archInterno,
  newRelativePath
) => {
  try {
    await runQuery(
      `
      UPDATE Archivos
      SET ArchActivo = 0,
          ArchNombre = ?
      WHERE ArchInterno = ?;
    `,
      [newRelativePath, archInterno]
    );

    return true;
  } catch (error) {
    console.error("❌ Error en markArchivoDeletedLocal:", error);
    throw error;
  }
};
