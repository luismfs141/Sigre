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
 * ✅ Semántica actual de ArchTipo (fotos por slot 1..6):
 *   1 = Panorámica
 *   2 = Frontal
 *   3 = Izquierda
 *   4 = Derecha
 *   5 = Medidor
 *   6 = Adicional
 *
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
  archTipoElemento,
  archIdElemento,
  tipiInterno,
  defiUUID = null,

  archActiv = 1,
}) => {
  try {
    // 🔎 LOG COMPLETO
    console.log("🧪 insertArchivoLocal → payload:", {
      archTipo,
      archTabla,
      archCodTabla,
      archNombre,
      archLatit,
      archLong,
      archFech,
      archTipoElemento,
      archIdElemento,
      tipiInterno,
      defiUUID,
      archActiv,
    });
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

        archTipoElemento,
        archIdElemento,
        tipiInterno,
        DefiUUID,

        ArchActivo,
        EstadoOffLine
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 2);
      `,
      [
        String(archTipo),
        archTabla,
        archCodTabla,
        archNombre,
        archLatit,
        archLong,
        archFech,
        archTipoElemento,
        archIdElemento,
        tipiInterno,
        defiUUID,

        archActiv,
      ]
    );

    const row = await runQuery(`SELECT last_insert_rowid() AS id;`);
    return row[0].id;
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
        EstadoOffLine,
         DefiUUID
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
    await runQuery( //---------------------------------------------------------------------------------------------------------------------------------------------------
      `UPDATE Archivos
     SET ArchActivo = 0,
         ArchNombre = ?, 
         EstadoOffLine = 3
     WHERE ArchInterno = ?`,
      [newRelativePath, archInterno]
    );

    return true;
  } catch (error) {
    console.error("❌ Error en markArchivoDeletedLocal:", error);
    throw error;
  }
};

export const getArchivosPendientes = async () => {
  return await runQuery(`
    SELECT *
    FROM Archivos
    WHERE EstadoOffLine IN (1, 2, 3)
  `);
};

export const markArchivoAsSynced = async (archInterno) => {
  await runQuery(
    `
    UPDATE Archivos
    SET EstadoOffLine = NULL
    WHERE ArchInterno = ?
    `,
    [archInterno]
  );
};

export const updateArchivoIdAfterSync = async (localId, serverId) => {
  await runQuery(
    `
    UPDATE Archivos
    SET DefiServerId = ?, EstadoOffLine = NULL
    WHERE ArchInterno = ? 
    
    `,
    [serverId, localId]
  );
};

export const markArchivoAsUpdated = async (archInterno) => {
  await runQuery(
    `
    UPDATE Archivos
    SET EstadoOffLine = 1
    WHERE ArchInterno = ?
    `,
    [archInterno]
  );
};

export const getFilesByElementAndTypi = async (idElement, typeElement, tipiInterno) => {
  try {
    const archivos = await runQuery(
      `SELECT *
       FROM Archivos
       WHERE ArchIdElemento = ?
         AND ArchTipoElemento = ?
         AND TipiInterno = ?
         AND ArchActivo = 1`,
      [idElement, typeElement, tipiInterno]
    );

    if (!archivos || archivos.length === 0) {
      console.warn(`⚠ No se encontraron archivos para el elemento ${idElement} y tipiInterno ${tipiInterno}`);
      return [];
    }

    return archivos;
  } catch (error) {
    console.error(`❌ Error al obtener archivos:`, error);
    return [];
  }
};

export const deleteFileById = async (archInterno) => {
  if (!archInterno) return false;

  try {
    await runQuery(
      `
      UPDATE Archivos
      SET ArchActivo = 0,
        EstadoOffLine = 3
      WHERE ArchInterno = ?;
      `,
      [archInterno]
    );

    return true;
  } catch (error) {
    console.error("❌ Error en markArchivoInactiveLocal:", error);
    return false;
  }
};

// Alias explícito para el caso “falta archivo en carpeta pública”
// (solo baja ArchActivo a 0; NO mueve nada a Eliminados)
export const markArchivoInactiveLocal = async (archInterno) => {
  return await deleteFileById(archInterno);
};


export const saveOrUpdateArchivoLocal = async (arch) => {
  try {
    // ✅ ÚNICA FUENTE: DefiUUID (NO usar DefiUuid nunca)
    const normalized = {
      ...arch,
      DefiUUID: arch?.DefiUUID ?? null,
    };

    // ✅ Limita a 50
    if (normalized.DefiUUID != null) {
      normalized.DefiUUID = String(normalized.DefiUUID).slice(0, 50);
    }

    const allFields = [
      "ArchInterno",
      "ArchTipo",
      "ArchTabla",
      "ArchCodTabla",
      "ArchNombre",
      "ArchLatitud",
      "ArchLongitud",
      "ArchFecha",
      "ArchTipoElemento",
      "ArchIdElemento",
      "TipiInterno",
      "ArchActivo",
      "EstadoOffLine",
      "DefiServerId",
      "DefiUUID",
    ];

    // ---------------- UPDATE ----------------
    if (normalized.ArchInterno !== null && normalized.ArchInterno !== undefined) {
      const updateFields = allFields.filter((f) => f !== "ArchInterno");

      const estado =
        normalized.EstadoOffLine == null ? 1 : normalized.EstadoOffLine;

      const updateQuery = `
        UPDATE Archivos
        SET ${updateFields.map((f) => `${f} = ?`).join(", ")}
        WHERE ArchInterno = ?
      `;

      const updateValues = [
        ...updateFields.map((f) =>
          f === "EstadoOffLine" ? estado : (normalized[f] ?? null)
        ),
        normalized.ArchInterno,
      ];

      await runQuery(updateQuery, updateValues);
      return normalized.ArchInterno;
    }

    // ---------------- INSERT ----------------
    const insertFields = allFields.filter((f) => f !== "ArchInterno");

    const insertQuery = `
      INSERT INTO Archivos (${insertFields.join(", ")})
      VALUES (${insertFields.map(() => "?").join(", ")})
    `;

    const insertValues = insertFields.map((f) =>
      f === "EstadoOffLine" ? 2 : (normalized[f] ?? null)
    );

    await runQuery(insertQuery, insertValues);

    const row = await runQuery(`SELECT last_insert_rowid() AS id;`, []);
    return row?.[0]?.id ?? null;
  } catch (error) {
    console.error("❌ Error guardando o actualizando archivo:", error);
    throw error;
  }
};




export const getMediosByDeficienciaIdLocal = async (deficienciaId) => {
  try {
    const rows = await runQuery(
      `
      SELECT *
      FROM Archivos
      WHERE ArchTabla = 'Deficiencias'
        AND ArchCodTabla = ?
        AND ArchActivo = 1
      ORDER BY ArchInterno ASC;
      `,
      [deficienciaId]
    );

    return rows || [];
  } catch (error) {
    console.error(
      "❌ Error en getMediosByDeficienciaIdLocal:",
      error
    );
    return [];
  }
};

export const getArchivoByIdLocal = async (archInterno) => {
  if (!archInterno) return null;

  try {
    const rows = await runQuery(
      `
      SELECT *
      FROM Archivos
      WHERE ArchInterno = ?
      LIMIT 1;
      `,
      [archInterno]
    );

    return rows && rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error("❌ Error en getArchivoByIdLocal:", error);
    return null;
  }
};