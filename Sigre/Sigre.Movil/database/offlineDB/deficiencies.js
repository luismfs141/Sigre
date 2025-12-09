import { runQuery } from "./db";

export const getDeficiencyByTypificationElement = async (idElement, typeElement, idTypification) => {
  try {
    const deficiency = await runQuery(
      `SELECT *
       FROM Deficiencias d
       WHERE d.DefiIdElemento = ? AND d.DefiTipoElemento = ? AND d.TipiInterno`,
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
      "EstadoOffLine"
    ];

    // ---------------------------------------
    // 🚀 1. UPDATE si existe DefiInterno
    // ---------------------------------------
    if (def.DefiInterno) {
      const updateFields = allFields.filter(f => f !== "DefiInterno");

      const estado = def.EstadoOffLine == null ? 1 : def.EstadoOffLine;

      const updateQuery = `
        UPDATE Deficiencias
        SET ${updateFields.map(f => `${f} = ?`).join(", ")}
        WHERE DefiInterno = ?
      `;

      const updateValues = [
        ...updateFields.map(f => def[f] ?? null).slice(0, -1), // todos menos estadoOffLine
        estado, // valor calculado
        def.DefiInterno
      ];

      await runQuery(updateQuery, updateValues);

      return def.DefiInterno;
    }

    // ---------------------------------------
    // 🚀 2. INSERT si NO existe DefiInterno
    // EstadoOffLine = 2
    // ---------------------------------------
    const insertFields = allFields.filter(f => f !== "DefiInterno");

    const insertQuery = `
      INSERT INTO Deficiencias (
        ${insertFields.join(", ")}
      ) VALUES (
        ${insertFields.map(() => "?").join(", ")}
      )
    `;

    const insertValues = insertFields.map(f =>
      f === "EstadoOffLine" ? 2 : def[f] ?? null
    );

    const result = await runQuery(insertQuery, insertValues);

    return result?.insertId ?? null;

  } catch (error) {
    console.error("❌ Error guardando o actualizando deficiencia:", error);
    throw error;
  }
};
