import { runQuery } from "./db";

// ===============================
// INSPECCIONADO (POSTES)
// ===============================

// Lee PostInspeccionado por PostInterno
export const getPostInspeccionadoByIdOriginalLocal = async (postInterno) => {
  try {
    if (!postInterno) return null;

    // Intento 1: PostInspeccionado (el que tú indicaste)
    const rows = await runQuery(
      `SELECT COALESCE(PostInspeccionado, 0) AS val
       FROM Postes
       WHERE PostInterno = ?
       LIMIT 1;`,
      [postInterno]
    );

    if (!rows || rows.length === 0) return null;
    return Number(rows[0]?.val ?? 0);
  } catch (e1) {
    // Fallback por si en tu SQLite el campo se llama distinto
    try {
      const rows2 = await runQuery(
        `SELECT COALESCE(POST_Inspeccionado, 0) AS val
         FROM Postes
         WHERE PostInterno = ?
         LIMIT 1;`,
        [postInterno]
      );

      if (!rows2 || rows2.length === 0) return null;
      return Number(rows2[0]?.val ?? 0);
    } catch (e2) {
      console.error("❌ getPostInspeccionadoByIdOriginalLocal:", e2);
      return null;
    }
  }
};

// Actualiza PostInspeccionado por PostInterno
export const updatePostInspeccionadoByIdOriginalLocal = async (postInterno, value) => {
  try {
    if (!postInterno) return false;

    // Intento 1: PostInspeccionado
    await runQuery(
      `UPDATE Postes
       SET PostInspeccionado = ?
       WHERE PostInterno = ?;`,
      [Number(value) ? 1 : 0, postInterno]
    );
    return true;
  } catch (e1) {
    // Fallback por si se llama POST_Inspeccionado
    try {
      await runQuery(
        `UPDATE Postes
         SET POST_Inspeccionado = ?
         WHERE PostInterno = ?;`,
        [Number(value) ? 1 : 0, postInterno]
      );
      return true;
    } catch (e2) {
      console.error("❌ updatePostInspeccionadoByIdOriginalLocal:", e2);
      return false;
    }
  }
};


// 🔹 Obtener un poste por su PostInterno
export const getPostByIdLocal = async (postInterno) => {
  try {
    if (!postInterno) return null;

    const rows = await runQuery(
      "SELECT * FROM Postes WHERE PostInterno = ?",
      [postInterno]
    );

    if (!rows || rows.length === 0) {
      console.warn(`⚠ No se encontró el poste con PostInterno=${postInterno}`);
      return null;
    }

    return rows[0]; // PostInterno es único
  } catch (error) {
    console.error(`❌ Error al obtener poste ${postInterno}:`, error);
    return null;
  }
};

// ===============================
// HELPERS internos (para no romper si tu schema cambia)
// ===============================
let _postesColsCache = null;

const _getPostesCols = async () => {
  if (_postesColsCache) return _postesColsCache;

  const rows = await runQuery(`PRAGMA table_info(Postes);`);
  const set = new Set((rows ?? []).map((r) => String(r?.name ?? "")));
  _postesColsCache = set;
  return set;
};

const _hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const _toInt01 = (v, fallback = 0) => {
  if (v == null) return fallback;
  return Number(v) ? 1 : 0;
};

const _updatePinForPostLocal = async ({
  postInterno,
  PostEtiqueta,
  PostCodigoNodo,
  PostLatitud,
  PostLongitud,
  AlimInterno,
  PostSubestacion,
  PostInspeccionado,
  PostTerceros,
}) => {
  const id = Number(postInterno);
  if (!Number.isFinite(id)) return 0;

  const label =
    String(PostEtiqueta ?? "").trim() ||
    String(PostCodigoNodo ?? "").trim() ||
    `${id}`;

  const elementCode =
    String(PostCodigoNodo ?? "").trim() ||
    `PTO_${id}`;

  const lat = Number(PostLatitud);
  const lng = Number(PostLongitud);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return 0;

  const feederId = Number(AlimInterno);
  const sedId = PostSubestacion == null ? null : Number(PostSubestacion);

  const upd = await runQuery(
    `UPDATE Pines
     SET Label = ?,
         Latitude = ?,
         Longitude = ?,
         IdAlimentador = ?,
         IdSed = ?,
         ElementCode = ?,
         Inspeccionado = ?,
         Tercero = ?
     WHERE IdOriginal = ? AND Type = 5;`,
    [
      label,
      lat,
      lng,
      Number.isFinite(feederId) ? feederId : 0,
      sedId,
      elementCode,
      _toInt01(PostInspeccionado, 0),
      _toInt01(PostTerceros, 0),
      id,
    ]
  );

  return Number(upd?.changes ?? 0);
};

const _insertPinForPostLocal = async ({
  postInterno,
  PostEtiqueta,
  PostCodigoNodo,
  PostLatitud,
  PostLongitud,
  AlimInterno,
  PostSubestacion,
  PostInspeccionado,
  PostTerceros,
}) => {
  const id = Number(postInterno);
  if (!Number.isFinite(id)) return;

  const label =
    String(PostEtiqueta ?? "").trim() ||
    String(PostCodigoNodo ?? "").trim() ||
    `${id}`;

  const elementCode =
    String(PostCodigoNodo ?? "").trim() ||
    `PTO_${id}`;

  const lat = Number(PostLatitud);
  const lng = Number(PostLongitud);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  const feederId = Number(AlimInterno);
  const sedId = PostSubestacion == null ? null : Number(PostSubestacion);

  await runQuery(
    `INSERT INTO Pines (
        IdOriginal, Label, Type, Latitude, Longitude,
        IdAlimentador, IdSed, ElementCode,
        Inspeccionado, Tercero,
        NodoInicial, NodoFinal
      )
      VALUES (?, ?, 5, ?, ?, ?, ?, ?, ?, ?, NULL, NULL);`,
    [
      id,
      label,
      lat,
      lng,
      Number.isFinite(feederId) ? feederId : 0,
      sedId,
      elementCode,
      _toInt01(PostInspeccionado, 0),
      _toInt01(PostTerceros, 0),
    ]
  );
};

// ===============================
// GUARDAR / ACTUALIZAR POSTE
// ===============================
export const saveOrUpdatePost = async (post) => {
  try {
    const cols = await _getPostesCols();

    // ✅ UPDATE ONLY
    if (post?.PostInterno == null) {
      throw new Error("saveOrUpdatePost: este método es SOLO UPDATE (falta PostInterno).");
    }

    const id = Number(post.PostInterno);
    if (!Number.isFinite(id)) throw new Error("PostInterno inválido.");

    const sets = [];
    const vals = [];

    const setIfHas = (col, value) => {
      if (!cols.has(col)) return;
      if (!_hasOwn(post, col)) return; // ✅ solo si viene en el payload (null permitido)
      sets.push(`${col} = ?`);
      vals.push(value);
    };

    setIfHas("PostCodigoNodo", post.PostCodigoNodo ?? null);
    setIfHas("PostEtiqueta", post.PostEtiqueta ?? null);
    setIfHas("PostLatitud", post.PostLatitud ?? null);
    setIfHas("PostLongitud", post.PostLongitud ?? null);
    setIfHas("AlimInterno", post.AlimInterno ?? null);
    setIfHas("PostMaterial", post.PostMaterial ?? null);
    setIfHas("PostRetenidaTipo", post.PostRetenidaTipo ?? null);
    setIfHas("PostRetenidaMaterial", post.PostRetenidaMaterial ?? null);
    setIfHas("PostArmadoTipo", post.PostArmadoTipo ?? null);
    setIfHas("PostArmadoMaterial", post.PostArmadoMaterial ?? null);
    setIfHas("PostSubestacion", post.PostSubestacion ?? null);
    setIfHas("PostEsMt", post.PostEsMt == null ? null : _toInt01(post.PostEsMt));
    setIfHas("PostEsBt", post.PostEsBt == null ? null : _toInt01(post.PostEsBt));
    setIfHas("PostInspeccionado", post.PostInspeccionado == null ? null : _toInt01(post.PostInspeccionado));
    setIfHas("PostTerceros", post.PostTerceros == null ? null : _toInt01(post.PostTerceros));

    // EstadoOffLine: update = 1
    if (cols.has("EstadoOffLine")) {
      const estado = post.EstadoOffLine == null ? 1 : post.EstadoOffLine;
      sets.push(`EstadoOffLine = ?`);
      vals.push(estado);
    }

    // PostAltura / PostTramo si existen
    if (cols.has("PostAltura") && _hasOwn(post, "PostAltura")) {
      sets.push(`PostAltura = ?`);
      vals.push(post.PostAltura ?? null);
    }
    if (cols.has("PostTramo") && _hasOwn(post, "PostTramo")) {
      sets.push(`PostTramo = ?`);
      vals.push(post.PostTramo ?? null);
    }

    if (sets.length) {
      await runQuery(
        `UPDATE Postes
         SET ${sets.join(", ")}
         WHERE PostInterno = ?;`,
        [...vals, id]
      );
    }



    // ✅ UPDATE pin (SIN INSERT aquí)
    await _updatePinForPostLocal({ postInterno: id, ...post });

    return id;
  } catch (error) {
    console.error("❌ Error UPDATE poste:", error);
    throw error;
  }
};

// ===============================
// INSERTAR POSTE Y PIN
// ===============================
export const insertPostAndPin = async (post) => {
  const cols = await _getPostesCols();

  // defaults para INSERT (nuevo)
  const payload = {
    EstadoOffLine: 2,
    PostTerceros: _toInt01(post?.PostTerceros, 0),
    PostInspeccionado: _toInt01(post?.PostInspeccionado, 0),
    PostEsMt: post?.PostEsMt == null ? 0 : _toInt01(post.PostEsMt, 0),
    PostEsBt: post?.PostEsBt == null ? 1 : _toInt01(post.PostEsBt, 1),

    PostRetenidaMaterial: post?.PostRetenidaMaterial ?? null,
    PostArmadoTipo: post?.PostArmadoTipo ?? null,
    PostArmadoMaterial: post?.PostArmadoMaterial ?? null,

    PostCodigoNodo: post?.PostCodigoNodo ?? null,
    PostEtiqueta: post?.PostEtiqueta ?? null,
    PostLatitud: post?.PostLatitud ?? null,
    PostLongitud: post?.PostLongitud ?? null,
    AlimInterno: post?.AlimInterno ?? null,
    PostMaterial: post?.PostMaterial ?? null,
    PostRetenidaTipo: post?.PostRetenidaTipo ?? null,
    PostSubestacion: post?.PostSubestacion ?? null,

    PostAltura: post?.PostAltura ?? null,
    PostTramo: post?.PostTramo ?? null,
  };

  // mínimos
  if (!String(payload.PostCodigoNodo ?? "").trim()) throw new Error("PostCodigoNodo obligatorio.");
  if (!String(payload.PostEtiqueta ?? "").trim()) throw new Error("PostEtiqueta obligatorio.");
  if (!Number.isFinite(Number(payload.PostLatitud))) throw new Error("PostLatitud obligatorio.");
  if (!Number.isFinite(Number(payload.PostLongitud))) throw new Error("PostLongitud obligatorio.");
  if (!Number.isFinite(Number(payload.AlimInterno))) throw new Error("AlimInterno obligatorio.");

  await runQuery("BEGIN TRANSACTION;");

  try {
    const insertCols = [];
    const insertVals = [];

    const addIfCol = (col, val) => {
      if (!cols.has(col)) return;
      insertCols.push(col);
      insertVals.push(val);
    };

    for (const [k, v] of Object.entries(payload)) addIfCol(k, v);

    await runQuery(
      `INSERT INTO Postes (${insertCols.join(", ")})
       VALUES (${insertCols.map(() => "?").join(", ")});`,
      insertVals
    );

    const row = await runQuery(`SELECT last_insert_rowid() AS id;`);
    const newId = Number(row?.[0]?.id);
    if (!Number.isFinite(newId) || newId <= 0) throw new Error("No se pudo obtener el ID insertado.");

    // ✅ INSERT pin (aquí sí se permite)
    await _insertPinForPostLocal({ postInterno: newId, ...payload });

    await runQuery("COMMIT;");
    return newId;
  } catch (e) {
    await runQuery("ROLLBACK;");
    console.error("❌ Error INSERT poste+pin:", e);
    throw e;
  }
};


export const getPostesPendientes = async () => {
  try {
    const query = `
      SELECT *
      FROM Postes
      WHERE EstadoOffLine IS NOT NULL
      ORDER BY PostInterno
    `;

    const rows = await runQuery(query);

    if (!rows || rows.length === 0) {
      console.log("✅ No hay postes pendientes de sincronización");
      return [];
    }

    console.log(`📤 Postes pendientes: ${rows.length}`);
    return rows;

  } catch (error) {
    console.error("❌ Error obteniendo postes pendientes:", error);
    return [];
  }
};

// 🔹 Actualizar ID local por ID servidor
export const updatePostIdAfterSync = async (localId, serverId) => {
  await runQuery("BEGIN TRANSACTION;");
  try {
    await runQuery(
      `UPDATE Postes
       SET PostInterno = ?, EstadoOffLine = NULL
       WHERE PostInterno = ?;`,
      [serverId, localId]
    );

    // ✅ actualizar pin asociado (IdOriginal guarda el id del poste)
    await runQuery(
      `UPDATE Pines
       SET IdOriginal = ?
       WHERE IdOriginal = ? AND Type = 5;`,
      [serverId, localId]
    );

    await runQuery("COMMIT;");
  } catch (e) {
    await runQuery("ROLLBACK;");
    throw e;
  }
};

// 🔹 Marcar como sincronizado (solo UPDATEs)
export const markPostAsSynced = async (postInterno) => {
  const query = `
    UPDATE Postes
    SET EstadoOffLine = NULL
    WHERE PostInterno = ?
  `;
  await runQuery(query, [postInterno]);
};





// 🔹 Datos de referencia (material, armado, retenidas)
export const getPostMaterial = async () => await runQuery("SELECT * FROM PosteMaterials");
export const getPostArmadoMaterial = async () => await runQuery("SELECT * FROM ArmadoMaterials");
export const getPostRetenidaTipo = async () => await runQuery("SELECT * FROM RetenidaTipos");
export const getPostRetenidaMaterial = async () => await runQuery("SELECT * FROM RetenidaMaterials");


