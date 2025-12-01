import { runQuery } from "./db";

export const getSedById = async (id) => {
  try {
    const rows = await runQuery(
      "SELECT * FROM Seds WHERE SedInterno = ?",
      [id]
    );

    if (!rows || rows.length === 0) {
      console.warn(`⚠ No hay SED ${id}`);
      return [];
    }

    return rows;
  } catch (error) {
    console.error(`❌ Error al obtener el SED ${id}:`, error);
    return [];
  }
};

export const getAllSedsLocal = async () => {
  try {
    const sql = `
      SELECT 
        SedInterno,
        EstadoOffLine,
        SedEtiqueta,
        SedLatitud,
        SedLongitud,
        SedTipo,
        AlimInterno,
        SedCodigo,
        SedSimbolo,
        SedTerceros,
        SedMaterial,
        SedInspeccionado,
        SedNumPostes,
        SedArmadoTipo,
        SedArmadoMaterial,
        SedRetenidaTipo,
        SedRetenidaMaterial,
        SedArmadoMaterialNavigationArmmtInterno,
        SedArmadoTipoNavigationArmtpInterno,
        SedMaterialNavigationSedInterno,
        SedRetenidaMaterialNavigationRtnmtInterno,
        SedRetenidaTipoNavigationRtntpInterno
      FROM Seds
      ORDER BY SedEtiqueta ASC;
    `;

    const rows = await runQuery(sql, [], true);

    if (!rows || rows.length === 0) {
      console.warn("⚠ No hay SEDs en la base local");
      return [];
    }

    return rows;
  } catch (error) {
    console.error("❌ Error al obtener todas las SEDs:", error);
    return [];
  }
};