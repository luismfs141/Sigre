


import { runQuery } from "./db";

// const emptyToNull = (v) =>
//   typeof v === "string" && v.trim() === "" ? null : v;

export const getDeficiencyByIdLocal = async (defiInterno) => {
  try {
    const rows = await runQuery(
      `SELECT *
       FROM Deficiencias
       WHERE DefiInterno = ?
       LIMIT 1`,
      [defiInterno]
    );

    return rows?.[0] ?? null;

  } catch (error) {
    console.error("❌ Error obteniendo deficiencia por ID local:", error);
    return null;
  }
};

export const getDeficiencyByTypificationElement = async (idElement, typeElement, idTypification) => {
  try {
    const deficiency = await runQuery(
      `SELECT *
       FROM Deficiencias d
       WHERE d.DefiIdElemento = ? AND d.DefiTipoElemento = ? AND d.TipiInterno = ? AND d.DefiActivo = 1`,
      [idElement, typeElement, idTypification]
    );

    if (!deficiency || deficiency.length === 0) {
      console.warn(`⚠ No se encontró deficiencia para el elemento ${idElement}`);
      return [];
    }

    return deficiency;
  } catch (error) {
    console.error(`❌ Error al obtener la deficiencia:`, error);
    return [];
  }
};

export const getDeficienciesByElement = async (idElement, typeElement) => {
  try {
    const deficiency = await runQuery(
      `SELECT *
       FROM Deficiencias d
       WHERE d.DefiIdElemento = ? AND d.DefiTipoElemento = ? AND d.DefiActivo = 1`,
      [idElement, typeElement]
    );

    if (!deficiency || deficiency.length === 0) {
      console.warn(`⚠ No se encontró deficiencia para el elemento ${idElement}`);
      return [];
    }

    return deficiency;
  } catch (error) {
    console.error(`❌ Error al obtener la deficiencia:`, error);
    return [];
  }
};


export const saveOrUpdateDeficiency = async (def) => {
  try {
    const allFields = [
      "DefiInterno",
      "DefiEstado",
      "TablInterno",
      "DefiCodigoElemento",
      "TipiInterno",
      "DefiNumSuministro",
      "DefiFechaDenuncia",
      "DefiFechaInspeccion",
      "DefiObservacion",
      "DefiEstadoSubsanacion",
      "DefiLatitud",
      "DefiLongitud",
      "DefiTipoElemento",
      "DefiDistHorizontal",
      "DefiDistVertical",
      "DefiDistTransversal",
      "DefiIdElemento",
      "DefiFecRegistro",
      "DefiCodAmt",
      "DefiFecModificacion",
      "DefiFechaCreacion",
      "DefiPozoTierra",
      "DefiResponsable",
      "DefiComentario",
      "DefiPozoTierra2",
      "DefiUsuarioInic",
      "DefiUsuarioMod",
      "DefiActivo",
      "DefiEstadoCriticidad",
      "DefiInspeccionado",
      "DefiCol1",
      "DefiAccesibilidad",
      "DefiTipoCruce",
      "EstadoOffLine"
    ];

    // ---------------- UPDATE ----------------
    if (def.DefiInterno) {
      const updateFields = allFields.filter(f => f !== "DefiInterno");

      // 🔴 FIX: UPDATE = 1
      const estado = def.EstadoOffLine == null ? 1 : def.EstadoOffLine;

      const updateQuery = `
        UPDATE Deficiencias
        SET ${updateFields.map(f => `${f} = ?`).join(", ")}
        WHERE DefiInterno = ?
      `;

      const updateValues = [
        ...updateFields.map(f =>
          f === "EstadoOffLine" ? estado : def[f] ?? null
        ),
        def.DefiInterno
      ];

      // const updateValues = [
      //   ...updateFields.map(f =>
      //     f === "EstadoOffLine"
      //       ? estado
      //       : (emptyToNull(def[f]) ?? null)
      //   ),
      //   def.DefiInterno
      // ];


      await runQuery(updateQuery, updateValues);
      return def.DefiInterno;
    }

    // ---------------- INSERT ----------------
    const insertFields = allFields.filter(f => f !== "DefiInterno");

    const insertQuery = `
      INSERT INTO Deficiencias (${insertFields.join(", ")})
      VALUES (${insertFields.map(() => "?").join(", ")})
    `;

    const insertValues = insertFields.map(f =>
      f === "EstadoOffLine" ? 2 : def[f] ?? null
    );
    // const insertValues = insertFields.map(f =>
    //   f === "EstadoOffLine"
    //     ? 2
    //     : (emptyToNull(def[f]) ?? null)
    // );



    const result = await runQuery(insertQuery, insertValues);

    return result?.lastInsertRowId ?? null;

  } catch (error) {
    console.error("❌ Error guardando o actualizando deficiencia:", error);
    throw error;
  }
};

export const deleteDeficiencyById = async (defiInterno) => {
  await runQuery(`
    UPDATE Deficiencias
    SET DefiActivo = 0,
        EstadoOffLine = 3
    WHERE DefiInterno = ?
  `, [defiInterno]);

  return true;
};


export const getDeficienciesPendientes = async () => {
  return await runQuery(`
    SELECT *
    FROM Deficiencias
    WHERE EstadoOffLine IN (1, 2, 3)
  `);
};

export const markDeficiencyAsSynced = async (defiInterno) => {
  const query = `
    UPDATE Deficiencias
    SET EstadoOffLine = NULL
    WHERE DefiInterno = ?
  `;
  await runQuery(query, [defiInterno]);
};

export const updateDeficiencyIdAfterSync = async (localId, serverId) => {
  const query = `
    UPDATE Deficiencias
    SET DefiServerId = ?, EstadoOffLine = NULL
    WHERE DefiInterno = ? OR DefiServerId = ?
  `;
  await runQuery(query, [serverId, localId, localId]);
};

export const getDeficienciesByElementAndTypi = async (idElement, typeElement, tipiInterno) => {
  try {
    const deficiencias = await runQuery(
      `SELECT *
       FROM Deficiencias
       WHERE DefiIdElemento = ?
         AND DefiTipoElemento = ?
         AND TipiInterno = ?
         AND DefiActivo = 1`,
      [idElement, typeElement, tipiInterno]
    );

    if (!deficiencias || deficiencias.length === 0) {
      console.warn(`⚠ No se encontraron deficiencias para el elemento ${idElement} y tipiInterno ${tipiInterno}`);
      return [];
    }

    return deficiencias;
  } catch (error) {
    console.error(`❌ Error al obtener deficiencias:`, error);
    return [];
  }
};


// export const fetchDeficienciesForFlatList = async (elementId, typeElement) => {
//   try {
//     const query = `
//       SELECT 
//         d.DefiInterno,
//         d.TablInterno,
//         d.DefiIdElemento,
//         d.DefiTipoElemento,
//         d.DefiNumSuministro,
//         t.TypificationId AS TipiInterno,
//         t.Code,
//         t.Component,
//         t.Deficiency
//       FROM Deficiencias d
//       LEFT JOIN Tipificaciones t
//         ON d.TipiInterno = t.TypificationId
//       WHERE d.DefiIdElemento = ?
//         AND d.DefiTipoElemento = ?
//         AND DefiActivo = 1
//       ORDER BY d.DefiInterno ASC;
//     `;
//     const results = await runQuery(query, [elementId, typeElement]);
//     return results;
//   } catch (error) {
//     console.error("Error fetching deficiencies for FlatList:", error);
//     return [];
//   }
// };

export const fetchDeficienciesForFlatList = async (elementId, typeElement) => {
  try {
    const query = `
      SELECT 
        d.DefiInterno,
        d.TablInterno,
        d.DefiIdElemento,
        d.DefiTipoElemento,
        d.DefiNumSuministro,

        -- ✅ NUEVO: campos que quieres mostrar en la lista
        d.DefiObservacion,
        d.DefiComentario,
        d.DefiDistVertical,
        d.DefiDistHorizontal,

        t.TypificationId AS TipiInterno,
        t.Code,
        t.Component,
        t.Deficiency,
        t.Typification

      FROM Deficiencias d
      LEFT JOIN Tipificaciones t
        ON d.TipiInterno = t.TypificationId
      WHERE d.DefiIdElemento = ?
        AND d.DefiTipoElemento = ?
        AND d.DefiActivo = 1
      ORDER BY d.DefiInterno ASC;
    `;

    const results = await runQuery(query, [elementId, typeElement]);
    return results;
  } catch (error) {
    console.error("Error fetching deficiencies for FlatList:", error);
    return [];
  }
};


export const markDeficiencyAsSyncing = async (defiInterno) => {
  await runQuery(
    `
    UPDATE Deficiencias
    SET EstadoOffLine = 4
    WHERE DefiInterno = ?
    `,
    [defiInterno]
  );

  return true;
};

export const getDeficienciesPendientesReanudables = async () => {
  return await runQuery(`
    SELECT *
    FROM Deficiencias
    WHERE EstadoOffLine IN (1, 2, 3, 4)
    ORDER BY DefiInterno
  `);
};