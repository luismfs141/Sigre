

// database/offlineDB/pins.js
import { runQuery } from "./db";

const hasColumn = async (table, column) => {
  try {
    const cols = await runQuery(`PRAGMA table_info(${table})`);
    return Array.isArray(cols) && cols.some(c => String(c.name).toLowerCase() === String(column).toLowerCase());
  } catch {
    return false;
  }
};

// ========================= GETS =========================
export const getPinsByFeederLocal = async (feederId) => {
  try {
    const rows = await runQuery(
      "SELECT * FROM Pines WHERE IdAlimentador = ?",
      [feederId]
    );

    if (!rows || rows.length === 0) {
      console.warn(`⚠ No hay pines para el alimentador ${feederId}`);
      return [];
    }

    return rows;
  } catch (error) {
    console.error(`❌ Error al obtener pines locales para el alimentador ${feederId}:`, error);
    return [];
  }
};

export const getPinsBySedLocal = async (sedId) => {
  try {
    // Pines asociados a la SED
    const rows = await runQuery(
      "SELECT * FROM Pines WHERE IdSed = ?",
      [sedId]
    );

    // El pin de la SED (IdSed NULL y IdOriginal = sedId)
    const sedRows = await runQuery(
      "SELECT * FROM Pines WHERE IdOriginal = ? AND IdSed IS NULL LIMIT 1",
      [sedId]
    );

    if ((!rows || rows.length === 0) && (!sedRows || sedRows.length === 0)) {
      console.warn(`⚠ No hay pines ni SED para el sedId ${sedId}`);
      return [];
    }

    // Primero SED, luego los demás
    return [
      ...(sedRows ?? []),
      ...(rows ?? [])
    ];
  } catch (error) {
    console.error(`❌ Error al obtener pines locales para sedId ${sedId}:`, error);
    return [];
  }
};

// ✅ Obtiene el estado de inspección de un pin por IdOriginal
export const getPinInspeccionadoByIdOriginalLocal = async (idOriginal) => {
  try {
    const rows = await runQuery(
      `SELECT Inspeccionado
       FROM Pines
       WHERE IdOriginal = ?
       LIMIT 1`,
      [idOriginal]
    );

    if (!rows?.length) return null;
    return Number(rows[0].Inspeccionado) ? 1 : 0;
  } catch (error) {
    console.error("❌ Error obteniendo pin por IdOriginal:", error);
    return null;
  }
};

// ✅ Actualiza Pines.Inspeccionado por IdOriginal
export const updatePinInspeccionadoByIdOriginalLocal = async (idOriginal, inspeccionado) => {
  try {
    await runQuery(
      `UPDATE Pines
       SET Inspeccionado = ?
       WHERE IdOriginal = ?`,
      [Number(inspeccionado) ? 1 : 0, idOriginal]
    );

    return true;
  } catch (error) {
    console.error("❌ Error actualizando Pines.Inspeccionado:", error);
    return false;
  }
};

// ========================= RECÁLCULO MASIVO =========================
// Regla: pin = 1 SOLO si (hay deficiencias activas) Y (todas están inspeccionadas).
// Si no hay deficiencias => pin = 0.
export const recalcularInspeccionadoPinesPorFeederLocal = async (feederId) => {
  try {
    const tieneTipo = await hasColumn("Pines", "TipoElemento");

    if (tieneTipo) {
      await runQuery(
        `
        UPDATE Pines
        SET Inspeccionado = (
          SELECT CASE
            WHEN COUNT(1) > 0
             AND SUM(CASE WHEN COALESCE(d.DefiInspeccionado,0) = 1 THEN 1 ELSE 0 END) = COUNT(1)
            THEN 1 ELSE 0 END
          FROM Deficiencias d
          WHERE COALESCE(d.DefiActivo,1) = 1
            AND d.DefiIdElemento = Pines.IdOriginal
            AND d.DefiTipoElemento = Pines.TipoElemento
        )
        WHERE IdAlimentador = ?
        `,
        [feederId]
      );
    } else {
      // Fallback: si no existe TipoElemento en Pines, recalcula solo por IdOriginal
      await runQuery(
        `
        UPDATE Pines
        SET Inspeccionado = (
          SELECT CASE
            WHEN COUNT(1) > 0
             AND SUM(CASE WHEN COALESCE(d.DefiInspeccionado,0) = 1 THEN 1 ELSE 0 END) = COUNT(1)
            THEN 1 ELSE 0 END
          FROM Deficiencias d
          WHERE COALESCE(d.DefiActivo,1) = 1
            AND d.DefiIdElemento = Pines.IdOriginal
        )
        WHERE IdAlimentador = ?
        `,
        [feederId]
      );
    }

    return true;
  } catch (error) {
    console.error("❌ Error recalculando Inspeccionado por feeder:", error);
    return false;
  }
};

export const recalcularInspeccionadoPinesPorSedLocal = async (sedId) => {
  try {
    const tieneTipo = await hasColumn("Pines", "TipoElemento");

    if (tieneTipo) {
      await runQuery(
        `
        UPDATE Pines
        SET Inspeccionado = (
          SELECT CASE
            WHEN COUNT(1) > 0
             AND SUM(CASE WHEN COALESCE(d.DefiInspeccionado,0) = 1 THEN 1 ELSE 0 END) = COUNT(1)
            THEN 1 ELSE 0 END
          FROM Deficiencias d
          WHERE COALESCE(d.DefiActivo,1) = 1
            AND d.DefiIdElemento = Pines.IdOriginal
            AND d.DefiTipoElemento = Pines.TipoElemento
        )
        WHERE IdSed = ?
           OR (IdSed IS NULL AND IdOriginal = ?)
        `,
        [sedId, sedId]
      );
    } else {
      await runQuery(
        `
        UPDATE Pines
        SET Inspeccionado = (
          SELECT CASE
            WHEN COUNT(1) > 0
             AND SUM(CASE WHEN COALESCE(d.DefiInspeccionado,0) = 1 THEN 1 ELSE 0 END) = COUNT(1)
            THEN 1 ELSE 0 END
          FROM Deficiencias d
          WHERE COALESCE(d.DefiActivo,1) = 1
            AND d.DefiIdElemento = Pines.IdOriginal
        )
        WHERE IdSed = ?
           OR (IdSed IS NULL AND IdOriginal = ?)
        `,
        [sedId, sedId]
      );
    }

    return true;
  } catch (error) {
    console.error("❌ Error recalculando Inspeccionado por SED:", error);
    return false;
  }
};
