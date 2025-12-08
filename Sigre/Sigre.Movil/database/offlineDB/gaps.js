import { runQuery } from "./db";

export const getGapsByFeederLocal = async (feederId) => {
  try {
    const rows = await runQuery(
      "SELECT * FROM Vanos WHERE AlimInterno = ?",
      [feederId]
    );

    if (!rows || rows.length === 0) {
      console.warn(`⚠ No hay gaps para el alimentador ${feederId}`);
      return [];
    }

    return rows;
  } catch (error) {
    console.error(`❌ Error al obtener gaps locales para el alimentador ${feederId}:`, error);
    return [];
  }
};

export const getGapsBySedLocal = async (sedId) => {
  try {
    sedId = Number(sedId);
    const rows = await runQuery(
      "SELECT * FROM Vanos WHERE VanoSubestacion = ?",
      [sedId]
    );

    if (!rows || rows.length === 0) {
      console.warn(`⚠ No hay gaps para la subestacion${sedId}`);
      return [];
    }

    return rows;
  } catch (error) {
    console.error(`❌ Error al obtener gaps locales para la subestacion ${sedId}:`, error);
    return [];
  }
};

export const saveOrUpdateVano = async (vano) => {
  try {
    if (vano.VanoInterno) {
      // UPDATE: si EstadoOffLine es null, ponemos 1 (modificado)
      const estado = vano.EstadoOffLine === null || vano.EstadoOffLine === undefined
        ? 1
        : vano.EstadoOffLine; // si ya era 2 o 1, no se cambia

      const updateQuery = `
        UPDATE Vanos
        SET
          VanoCodigo = ?,
          VanoEtiqueta = ?,
          VanoNodoInicial = ?,
          VanoNodoFinal = ?,
          VanoTerceros = ?,
          EstadoOffLine = ?,
          VanoInspeccionado = ?
        WHERE VanoInterno = ?
      `;

      await runQuery(updateQuery, [
        vano.VanoCodigo,
        vano.VanoEtiqueta,
        vano.VanoNodoInicial,
        vano.VanoNodoFinal,
        vano.VanoTerceros,
        estado,
        vano.VanoInspeccionado ?? "",
        vano.VanoInterno
      ]);

      return vano.VanoInterno;
    } else {
      // INSERT: EstadoOffLine = 2
      const insertQuery = `
        INSERT INTO Vanos (
          VanoCodigo,
          VanoEtiqueta,
          VanoNodoInicial,
          VanoNodoFinal,
          VanoTerceros,
          EstadoOffLine,
          VanoInspeccionado,
          AlimInterno,
          VanoSubestacion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await runQuery(insertQuery, [
        vano.VanoCodigo,
        vano.VanoEtiqueta,
        vano.VanoNodoInicial,
        vano.VanoNodoFinal,
        vano.VanoTerceros ?? "",
        2, // Nuevo dato
        vano.VanoInspeccionado ?? "",
        vano.AlimInterno ?? null,
        vano.VanoSubestacion ?? null
      ]);

      return result?.insertId ?? null;
    }
  } catch (error) {
    console.error("❌ Error guardando o actualizando vano:", error);
    throw error;
  }
};