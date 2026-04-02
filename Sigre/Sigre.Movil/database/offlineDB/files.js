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
  defiUuid = null,
  archUuid = null,
  esgoInterno = null,
  defiServerId = null,
  archActiv = 1,
}) => {
  try {
    const uuid = defiUuid != null ? String(defiUuid).slice(0, 50) : null;

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
        ArchTipoElemento,
        ArchIdElemento,
        TipiInterno,
        DefiUuid,
        ArchUuid,
        EsgoInterno,
        DefiServerId,
        ArchActivo,
        EstadoOffLine
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 2);
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
        uuid,
        archUuid,
        esgoInterno,
        defiServerId,
        archActiv,
      ]
    );

    const row = await runQuery(`SELECT last_insert_rowid() AS id;`);
    return row?.[0]?.id ?? null;
  } catch (error) {
    console.error("❌ Error en insertArchivoLocal:", error);
    throw error;
  }
};

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
        DefiUuid,
        DefiServerId,
        ArchUuid,
        EsgoInterno
      FROM Archivos
      WHERE ArchTabla = 'Deficiencias'
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

export const markArchivoDeletedLocal = async (archInterno, newRelativePath) => {
  try {
    await runQuery(
      `
      UPDATE Archivos
      SET ArchActivo = 0,
          ArchNombre = ?,
          EstadoOffLine = CASE
            WHEN EstadoOffLine = 2 AND DefiServerId IS NULL THEN 2
            ELSE 3
          END
      WHERE ArchInterno = ?
      `,
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

/**
 * OJO:
 * serverId aquí es el ID del archivo en servidor.
 * NO debe pisar DefiServerId.
 *
 * Como en tu SQLite no tienes ArchServerId, solo limpiamos EstadoOffLine.
 */
export const updateArchivoIdAfterSync = async (localId, _serverId) => {
  await runQuery(
    `
    UPDATE Archivos
    SET EstadoOffLine = NULL
    WHERE ArchInterno = ?
    `,
    [localId]
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
      `
      SELECT *
      FROM Archivos
      WHERE ArchIdElemento = ?
        AND ArchTipoElemento = ?
        AND TipiInterno = ?
        AND ArchActivo = 1
      `,
      [idElement, typeElement, tipiInterno]
    );

    if (!archivos || archivos.length === 0) {
      console.warn(`⚠ No se encontraron archivos para el elemento ${idElement} y tipiInterno ${tipiInterno}`);
      return [];
    }

    return archivos;
  } catch (error) {
    console.error("❌ Error al obtener archivos:", error);
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
          EstadoOffLine = CASE
            WHEN EstadoOffLine = 2 AND DefiServerId IS NULL THEN 2
            ELSE 3
          END
      WHERE ArchInterno = ?;
      `,
      [archInterno]
    );

    return true;
  } catch (error) {
    console.error("❌ Error en deleteFileById:", error);
    return false;
  }
};

export const markArchivoInactiveLocal = async (archInterno) => {
  return await deleteFileById(archInterno);
};

export const saveOrUpdateArchivoLocal = async (arch) => {
  try {
    const normalized = {
      ...arch,
      DefiUuid: arch?.DefiUuid ?? arch?.DefiUUID ?? null,
      ArchUuid: arch?.ArchUuid ?? null,
      EsgoInterno: arch?.EsgoInterno ?? null,
      DefiServerId: arch?.DefiServerId ?? null,
    };

    if (normalized.DefiUuid != null) {
      normalized.DefiUuid = String(normalized.DefiUuid).slice(0, 50);
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
      "DefiUuid",
      "ArchUuid",
      "EsgoInterno",
    ];

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
    console.error("❌ Error en getMediosByDeficienciaIdLocal:", error);
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

/**
 * Mantengo el nombre para no romper imports existentes,
 * pero internamente ya usa la columna nueva DefiUuid.
 */
export const getMediosByDefiUUIDLocal = async (defiUuid) => {
  try {
    const uuid = String(defiUuid ?? "").trim();
    if (!uuid) return [];

    const rows = await runQuery(
      `
      SELECT *
      FROM Archivos
      WHERE ArchTabla = 'Deficiencias'
        AND DefiUuid = ?
        AND ArchActivo = 1
      ORDER BY ArchInterno ASC;
      `,
      [uuid]
    );

    return rows || [];
  } catch (error) {
    console.error("❌ Error en getMediosByDefiUUIDLocal:", error);
    return [];
  }
};

export const markArchivosByDefiRefsInactiveLocal = async ({
  defiInterno = null,
  defiServerId = null,
  defiUuid = null,
} = {}) => {
  try {
    const where = [];
    const params = [];

    const uuid = String(defiUuid ?? "").trim();
    if (uuid) {
      where.push("DefiUuid = ?");
      params.push(uuid);
    }

    const localId = Number(defiInterno);
    if (Number.isFinite(localId) && localId > 0) {
      where.push("ArchCodTabla = ?");
      params.push(localId);
    }

    const serverId = Number(defiServerId);
    if (Number.isFinite(serverId) && serverId > 0) {
      where.push("ArchCodTabla = ?");
      params.push(serverId);
    }

    if (!where.length) return [];

    const whereSql = `(${where.join(" OR ")})`;

    await runQuery(
      `
      UPDATE Archivos
      SET ArchActivo = 0,
          EstadoOffLine = CASE
            WHEN EstadoOffLine = 2 AND DefiServerId IS NULL THEN 2
            ELSE 3
          END
      WHERE ArchTabla = 'Deficiencias'
        AND ${whereSql};
      `,
      params
    );

    const rowsToSync = await runQuery(
      `
      SELECT ArchInterno
      FROM Archivos
      WHERE ArchTabla = 'Deficiencias'
        AND ${whereSql}
        AND EstadoOffLine = 3;
      `,
      params
    );

    return (rowsToSync || []).map((r) => r.ArchInterno).filter(Boolean);
  } catch (error) {
    console.error("❌ Error en markArchivosByDefiRefsInactiveLocal:", error);
    return [];
  }
};