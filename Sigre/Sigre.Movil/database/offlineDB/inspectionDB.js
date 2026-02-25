// database/offlineDB/inspectionDB.js
import { runQuery } from "./db";

/**
 * Recalcula PostInspeccionado/VanoInspeccionado en SQLite:
 * Si TODAS las deficiencias activas (DefiActivo=1) tienen DefiInspeccionado=1 => 1
 * Caso contrario => 0
 * Nota: si NO hay deficiencias activas => 0
 */

const getMeta = (typeElement) => {
  if (typeElement === "POST") {
    return { table: "Postes", idCol: "PostInterno", flagCol: "PostInspeccionado" };
  }
  if (typeElement === "VANO") {
    return { table: "Vanos", idCol: "VanoInterno", flagCol: "VanoInspeccionado" };
  }
  return null;
};

const num = (v) => Number(v ?? 0) || 0;

export const recalcElementoInspeccionadoFromDefsLocal = async (elementId, typeElement) => {
    //console.log("📦 Actualizacion de estado")
  try {
    const meta = getMeta(typeElement);
    if (!meta) return { ok: false, reason: "Tipo de elemento no soportado." };
    if (elementId == null) return { ok: false, reason: "Id de elemento inválido." };

    // 1) Total deficiencias activas del elemento
    const rowsTotal = await runQuery(
      `SELECT COUNT(1) AS total
       FROM Deficiencias
       WHERE DefiActivo = 1
         AND DefiTipoElemento = ?
         AND DefiIdElemento = ?`,
      [typeElement, elementId]
    );

    const totalActive = num(rowsTotal?.[0]?.total);

    // 2) Total deficiencias activas inspeccionadas
    const rowsDone = await runQuery(
      `SELECT COUNT(1) AS done
       FROM Deficiencias
       WHERE DefiActivo = 1
         AND DefiInspeccionado = 1
         AND DefiTipoElemento = ?
         AND DefiIdElemento = ?`,
      [typeElement, elementId]
    );

    const doneActive = num(rowsDone?.[0]?.done);

    // Regla
    const inspected = totalActive > 0 && doneActive === totalActive ? 1 : 0;

    // 3) Lee valor actual en tabla Postes/Vanos
    const rowsCurrent = await runQuery(
      `SELECT ${meta.flagCol} AS cur
       FROM ${meta.table}
       WHERE ${meta.idCol} = ?
       LIMIT 1`,
      [elementId]
    );

    if (!rowsCurrent?.length) {
      return { ok: false, reason: `No existe el registro en ${meta.table}.` };
    }

    const current = num(rowsCurrent?.[0]?.cur);
    const changed = current !== inspected;

    // 4) Actualiza solo si cambió
    if (changed) {
      await runQuery(
        `UPDATE ${meta.table}
         SET ${meta.flagCol} = ?
         WHERE ${meta.idCol} = ?`,
        [inspected, elementId]
      );
    }

    return {
      ok: true,
      inspected,
      changed,
      totalActive,
      doneActive,
    };
  } catch (e) {
    console.error("❌ recalcElementoInspeccionadoFromDefsLocal:", e);
    return { ok: false, reason: e?.message ?? "Error en SQLite." };
  }
};
