export const getDeficiencyIdElement = async (idElement, typeElement, idTypification) => {
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