import { runQuery } from "./db";

export const getPostById = async (id) => {
  try {
    const rows = await runQuery(
      "SELECT * FROM Postes WHERE PostInterno = ?",
      [id]
    );

    if (!rows || rows.length === 0) {
      console.warn(`⚠ No hay poste ${id}`);
      return [];
    }

    return rows;
  } catch (error) {
    console.error(`❌ Error al obtener el poste ${id}:`, error);
    return [];
  }
};

export const getPostMaterial = async () => {
  try {
    const rows = await runQuery(
      "SELECT * FROM PosteMaterials"
    );

    if (!rows || rows.length === 0) {
      console.warn(`⚠ No hay datos de material de poste`);
      return [];
    }

    return rows;
  } catch (error) {
    console.error(`❌ Error al obtener el material de poste`, error);
    return [];
  }
};

export const getPostArmadoMaterial = async () => {
  try {
    const rows = await runQuery(
      "SELECT * FROM ArmadoMaterials"
    );

    if (!rows || rows.length === 0) {
      console.warn(`⚠ No hay datos de material de armado`);
      return [];
    }

    return rows;
  } catch (error) {
    console.error(`❌ Error al obtener el material de armado`, error);
    return [];
  }
};

export const getPostRetenidaTipo = async () => {
  try {
    const rows = await runQuery(
      "SELECT * FROM RetenidaTipos"
    );

    if (!rows || rows.length === 0) {
      console.warn(`⚠ No hay datos de tipo de retenidas`);
      return [];
    }

    return rows;
  } catch (error) {
    console.error(`❌ Error al obtener el tipo de retenidas`, error);
    return [];
  }
};

export const getPostRetenidaMaterial = async () => {
  try {
    const rows = await runQuery(
      "SELECT * FROM RetenidaMaterials"
    );

    if (!rows || rows.length === 0) {
      console.warn(`⚠ No hay datos de material de retenidas`);
      return [];
    }

    return rows;
  } catch (error) {
    console.error(`❌ Error al obtener el material de retenidas`, error);
    return [];
  }
};
