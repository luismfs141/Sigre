import { runQuery } from "./db";

// ===============================
// HELPERS internos (para no romper si tu schema cambia)
// ===============================
let _vanosColsCache = null;

const _getVanosCols = async () => {
  if (_vanosColsCache) return _vanosColsCache;

  const rows = await runQuery(`PRAGMA table_info(Vanos);`);
  const set = new Set((rows ?? []).map((r) => String(r?.name ?? "")));
  _vanosColsCache = set;
  return set;
};

const _hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const _toInt01 = (v, fallback = 0) => {
  if (v == null) return fallback;
  return Number(v) ? 1 : 0;
};

const _numOrNull = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// export const getGapsByFeederLocal = async (feederId) => {
//   try {
//     const rows = await runQuery(
//       "SELECT * FROM Vanos WHERE AlimInterno = ?",
//       [feederId]
//     );

//     if (!rows || rows.length === 0) {
//       console.warn(`⚠ No hay gaps para el alimentador ${feederId}`);
//       return [];
//     }

//     return rows;
//   } catch (error) {
//     console.error(`❌ Error al obtener gaps locales para el alimentador ${feederId}:`, error);
//     return [];
//   }
// };


export const getGapsByFeederLocal = async (feederId) => {
  try {
    const rows = await runQuery(
      "SELECT * FROM Vanos WHERE AlimInterno = ? AND IFNULL(VanoTerceros, 0) = 0",
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


// export const getGapsBySedLocal = async (sedId) => {
//   try {
//     sedId = Number(sedId);
//     const rows = await runQuery(
//       "SELECT * FROM Vanos WHERE VanoSubestacion = ?",
//       [sedId]
//     );

//     if (!rows || rows.length === 0) {
//       console.warn(`⚠ No hay gaps para la subestacion${sedId}`);
//       return [];
//     }

//     return rows;
//   } catch (error) {
//     console.error(`❌ Error al obtener gaps locales para la subestacion ${sedId}:`, error);
//     return [];
//   }
// };


export const getGapsBySedLocal = async (sedId) => {
  try {
    sedId = Number(sedId);
    const rows = await runQuery(
      "SELECT * FROM Vanos WHERE VanoSubestacion = ? AND IFNULL(VanoTerceros, 0) = 0",
      [sedId]
    );

    if (!rows || rows.length === 0) {
      console.warn(`⚠ No hay gaps para la subestacion ${sedId}`);
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
    const cols = await _getVanosCols();

    // =========================
    // UPDATE
    // =========================
    if (vano?.VanoInterno != null && Number(vano.VanoInterno) > 0) {
      const id = Number(vano.VanoInterno);

      // UPDATE: si EstadoOffLine es null => 1 (modificado)
      const estadoRaw = vano.EstadoOffLine;
const estado =
  estadoRaw === "" || estadoRaw == null
    ? 1
    : Number(estadoRaw);

      const sets = [];
      const vals = [];

      const setIfHas = (col, value, { force = false } = {}) => {
        if (!cols.has(col)) return;
        if (!force && !_hasOwn(vano, col)) return; // solo si viene en el payload
        sets.push(`${col} = ?`);
        vals.push(value);
      };

      setIfHas("VanoCodigo", vano.VanoCodigo ?? null);
      setIfHas("VanoEtiqueta", vano.VanoEtiqueta ?? null);
      setIfHas("VanoNodoInicial", vano.VanoNodoInicial ?? null);
      setIfHas("VanoNodoFinal", vano.VanoNodoFinal ?? null);

      setIfHas("VanoLatitudIni", _numOrNull(vano.VanoLatitudIni));
      setIfHas("VanoLongitudIni", _numOrNull(vano.VanoLongitudIni));
      setIfHas("VanoLatitudFin", _numOrNull(vano.VanoLatitudFin));
      setIfHas("VanoLongitudFin", _numOrNull(vano.VanoLongitudFin));

      setIfHas("VanoTerceros", _toInt01(vano.VanoTerceros, 0));
      setIfHas("VanoMaterial", vano.VanoMaterial ?? null);
      setIfHas("VanoInspeccionado", _toInt01(vano.VanoInspeccionado, 0));

      setIfHas("VanoSubestacion", vano.VanoSubestacion == null ? null : Number(vano.VanoSubestacion));
      setIfHas("VanoEsMt", vano.VanoEsMt == null ? null : _toInt01(vano.VanoEsMt, 0));
      setIfHas("VanoEsBt", vano.VanoEsBt == null ? null : _toInt01(vano.VanoEsBt, 1));

      setIfHas("AlimInterno", vano.AlimInterno == null ? null : Number(vano.AlimInterno));
      // ✅ esta columna existe en tu dump y es NOT NULL
      if (cols.has("AlimInternoNavigationAlimInterno")) {
        const nav = vano.AlimInternoNavigationAlimInterno ?? vano.AlimInterno ?? null;
        setIfHas("AlimInternoNavigationAlimInterno", nav == null ? null : Number(nav));
      }

      // EstadoOffLine (force)
      if (cols.has("EstadoOffLine")) {
        sets.push(`EstadoOffLine = ?`);
        vals.push(estado);
      }

      if (sets.length) {
        await runQuery(
          `UPDATE Vanos
           SET ${sets.join(", ")}
           WHERE VanoInterno = ?;`,
          [...vals, id]
        );
      }

      return id;
    }

    // =========================
    // INSERT
    // =========================
    const alim = vano?.AlimInterno ?? null;

    const payload = {
      // obligatorios
      VanoCodigo: vano?.VanoCodigo ?? null,
      VanoLatitudIni: _numOrNull(vano?.VanoLatitudIni),
      VanoLongitudIni: _numOrNull(vano?.VanoLongitudIni),
      VanoLatitudFin: _numOrNull(vano?.VanoLatitudFin),
      VanoLongitudFin: _numOrNull(vano?.VanoLongitudFin),
      AlimInterno: alim == null ? null : Number(alim),

      // defaults pedidos
      EstadoOffLine: 2,
      VanoEtiqueta: vano?.VanoEtiqueta ?? ".",
      VanoTerceros: _toInt01(vano?.VanoTerceros, 0),
      VanoMaterial: vano?.VanoMaterial ?? null,
      VanoNodoInicial: vano?.VanoNodoInicial ?? null,
      VanoNodoFinal: vano?.VanoNodoFinal ?? null,
      VanoInspeccionado: _toInt01(vano?.VanoInspeccionado, 0),
      VanoSubestacion: vano?.VanoSubestacion == null ? null : Number(vano.VanoSubestacion),
      VanoEsMt: vano?.VanoEsMt == null ? 0 : _toInt01(vano.VanoEsMt, 0),
      VanoEsBt: vano?.VanoEsBt == null ? 1 : _toInt01(vano.VanoEsBt, 1),

      // ✅ NOT NULL en tu schema
      AlimInternoNavigationAlimInterno:
        vano?.AlimInternoNavigationAlimInterno ?? (alim == null ? null : Number(alim)),
    };

    // mínimos (para evitar NOT NULL)
    if (!String(payload.VanoCodigo ?? "").trim()) throw new Error("VanoCodigo obligatorio.");
    if (!Number.isFinite(Number(payload.VanoLatitudIni))) throw new Error("VanoLatitudIni obligatorio.");
    if (!Number.isFinite(Number(payload.VanoLongitudIni))) throw new Error("VanoLongitudIni obligatorio.");
    if (!Number.isFinite(Number(payload.VanoLatitudFin))) throw new Error("VanoLatitudFin obligatorio.");
    if (!Number.isFinite(Number(payload.VanoLongitudFin))) throw new Error("VanoLongitudFin obligatorio.");
    if (!Number.isFinite(Number(payload.AlimInterno))) throw new Error("AlimInterno obligatorio.");
    if (!String(payload.VanoEtiqueta ?? "").trim()) throw new Error("VanoEtiqueta obligatorio.");

    const insertCols = [];
    const insertVals = [];

    const addIfCol = (col, val) => {
      if (!cols.has(col)) return;
      insertCols.push(col);
      insertVals.push(val);
    };

    for (const [k, v] of Object.entries(payload)) addIfCol(k, v);

    await runQuery(
      `INSERT INTO Vanos (${insertCols.join(", ")})
       VALUES (${insertCols.map(() => "?").join(", ")});`,
      insertVals
    );

    const row = await runQuery(`SELECT last_insert_rowid() AS id;`);
    const newId = Number(row?.[0]?.id);

    return Number.isFinite(newId) && newId > 0 ? newId : null;
  } catch (error) {
    console.error("❌ Error guardando o actualizando vano:", error);
    throw error;
  }
};

export const getVanoByIdLocal = async (vanoInterno) => {
  try {
    if (!vanoInterno) return null;

    const rows = await runQuery(
      "SELECT * FROM Vanos WHERE VanoInterno = ?",
      [vanoInterno]
    );

    if (!rows || rows.length === 0) {
      console.warn(`⚠ No se encontró el vano con VanoInterno=${vanoInterno}`);
      return null;
    }

    // Devolvemos solo el primer resultado (VanoInterno es único)
    return rows[0];
  } catch (error) {
    console.error(`❌ Error al obtener vano ${vanoInterno}:`, error);
    return null;
  }
};

// 🔹 Obtener vanos pendientes de sincronización
export const getVanosPendientes = async () => {
  const query = `
    SELECT * FROM Vanos
    WHERE EstadoOffLine IS NOT NULL
    ORDER BY VanoInterno
  `;
  return await runQuery(query);
};

// 🔹 Marcar vano como sincronizado
export const markVanoAsSynced = async (vanoInterno) => {
  const query = `
    UPDATE Vanos
    SET EstadoOffLine = NULL
    WHERE VanoInterno = ?
  `;
  await runQuery(query, [vanoInterno]);
};

// 🔹 Actualizar ID local por ID servidor (INSERT)
export const updateVanoIdAfterSync = async (localId, serverId) => {
  const query = `
    UPDATE Vanos
    SET VanoInterno = ?, EstadoOffLine = NULL
    WHERE VanoInterno = ?
  `;
  await runQuery(query, [serverId, localId]);
};

// ======================= INSPECCIONADO (VANOS) =======================

export const getVanoInspeccionadoByIdOriginalLocal = async (vanoInterno) => {
  try {
    const id = Number(vanoInterno);
    if (!Number.isFinite(id)) return null;

    const rows = await runQuery(
      "SELECT VanoInspeccionado FROM Vanos WHERE VanoInterno = ? LIMIT 1",
      [id]
    );

    if (!rows || rows.length === 0) return null;
    return rows[0]?.VanoInspeccionado ?? null;
  } catch (error) {
    console.error("❌ Error getVanoInspeccionadoByIdOriginalLocal:", error);
    return null;
  }
};

export const updateVanoInspeccionadoByIdOriginalLocal = async (vanoInterno, inspeccionado) => {
  try {
    const id = Number(vanoInterno);
    if (!Number.isFinite(id)) return false;

    const val = Number(inspeccionado) === 1 ? 1 : 0;

    await runQuery(
      "UPDATE Vanos SET VanoInspeccionado = ? WHERE VanoInterno = ?",
      [val, id]
    );

    return true;
  } catch (error) {
    console.error("❌ Error updateVanoInspeccionadoByIdOriginalLocal:", error);
    return false;
  }
};





