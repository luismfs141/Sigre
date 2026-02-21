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

// // 🔹 Guardar o actualizar un poste
// export const saveOrUpdatePost = async (post) => {
//   try {
//     if (post.PostInterno) {
//       const estado = post.EstadoOffLine == null ? 1 : post.EstadoOffLine;

//       const updateQuery = `
//         UPDATE Postes
//         SET
//           PostCodigoNodo = ?,
//           PostEtiqueta = ?,
//           PostMaterial = ?,
//           PostArmadoMaterial = ?,
//           PostRetenidaTipo = ?,
//           PostRetenidaMaterial = ?,
//           PostTerceros = ?,
//           PostTramo = ?,
//           EstadoOffLine = ?,
//           PostAltura = ?
//         WHERE PostInterno = ?
//       `;

//       await runQuery(updateQuery, [
//         post.PostCodigoNodo ?? "",
//         post.PostEtiqueta ?? "",
//         post.PostMaterial ?? "",
//         post.PostArmadoMaterial ?? "",
//         post.PostRetenidaTipo ?? "",
//         post.PostRetenidaMaterial ?? "",
//         post.PostTerceros == null ? 0 : Number(post.PostTerceros),
//         post.PostTramo ?? null,
//         estado,
//         post.PostAltura ?? null,
//         post.PostInterno
//       ]);

//       return post.PostInterno;
//     } else {
//       const insertQuery = `
//         INSERT INTO Postes (
//           PostCodigoNodo,
//           PostEtiqueta,
//           PostMaterial,
//           PostArmadoMaterial,
//           PostRetenidaTipo,
//           PostRetenidaMaterial,
//           PostTerceros,    
//           PostTramo,  
//           EstadoOffLine,
//           PostAltura
//         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//       `;

//       const result = await runQuery(insertQuery, [
//         post.PostCodigoNodo ?? "",
//         post.PostEtiqueta ?? "",
//         post.PostMaterial ?? "",
//         post.PostArmadoMaterial ?? "",
//         post.PostRetenidaTipo ?? "",
//         post.PostRetenidaMaterial ?? "",
//         post.PostTerceros == null ? 0 : Number(post.PostTerceros),
//         post.PostTramo ?? null,
//         2,
//         post.PostAltura ?? null
//       ]);

//       return result?.insertId ?? null;
//     }
//   } catch (error) {
//     console.error("❌ Error guardando o actualizando poste:", error);
//     throw error;
//   }
// };


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

const _upsertPinForPostLocal = async ({
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

  const label = String(PostEtiqueta ?? "").trim() || String(PostCodigoNodo ?? "").trim() || `${id}`;
  const elementCode = String(PostCodigoNodo ?? "").trim() || `PTO_${id}`;

  const lat = Number(PostLatitud);
  const lng = Number(PostLongitud);

  // si no hay coords, no insertes pin (evita pines 0,0)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  const feederId = Number(AlimInterno);
  const sedId = PostSubestacion == null ? null : Number(PostSubestacion);

  // UPDATE primero
  const upd = await runQuery(
    `UPDATE Pines
     SET Label = COALESCE(?, Label),
         Latitude = COALESCE(?, Latitude),
         Longitude = COALESCE(?, Longitude),
         IdAlimentador = COALESCE(?, IdAlimentador),
         IdSed = ?,
         ElementCode = COALESCE(?, ElementCode),
         Inspeccionado = COALESCE(?, Inspeccionado),
         Tercero = COALESCE(?, Tercero)
     WHERE IdOriginal = ? AND Type = 5;`,
    [
      label,
      lat,
      lng,
      Number.isFinite(feederId) ? feederId : null,
      sedId,
      elementCode,
      _toInt01(PostInspeccionado, 0),
      _toInt01(PostTerceros, 0),
      id,
    ]
  );

  const changes = Number(upd?.changes ?? 0);
  if (changes > 0) return;

  // si no existía, INSERT
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

    // -----------------------------------------
    // UPDATE
    // -----------------------------------------
    if (post?.PostInterno != null) {
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

      // EstadoOffLine: si existe columna, marca update como 1 (como antes)
      if (cols.has("EstadoOffLine")) {
        const estado = post.EstadoOffLine == null ? 1 : post.EstadoOffLine;
        sets.push(`EstadoOffLine = ?`);
        vals.push(estado);
      }

      // PostAltura / PostTramo: solo si existen en tu DB
      if (cols.has("PostAltura") && _hasOwn(post, "PostAltura")) {
        sets.push(`PostAltura = ?`);
        vals.push(post.PostAltura ?? null);
      }
      if (cols.has("PostTramo") && _hasOwn(post, "PostTramo")) {
        sets.push(`PostTramo = ?`);
        vals.push(post.PostTramo ?? null);
      }

      if (!sets.length) return id;

      await runQuery(
        `UPDATE Postes
         SET ${sets.join(", ")}
         WHERE PostInterno = ?;`,
        [...vals, id]
      );

      // ✅ sincroniza/crea pin (Label/coords/sed/etc)
      await _upsertPinForPostLocal({ postInterno: id, ...post });

      return id;
    }

    // -----------------------------------------
    // INSERT
    // -----------------------------------------
    const hasEstado = _hasOwn(post, "EstadoOffLine");
    const estadoInsert = hasEstado ? post.EstadoOffLine : 2; // ✅ si no viene, mantiene comportamiento viejo (2)

    // defaults pedidos (si tu columna existe)
    const payload = {
      EstadoOffLine: estadoInsert,

      PostTerceros: _toInt01(post?.PostTerceros, 0),
      PostInspeccionado: _toInt01(post?.PostInspeccionado, 0),
      PostEsMt: post?.PostEsMt == null ? 0 : _toInt01(post.PostEsMt, 0),
      PostEsBt: post?.PostEsBt == null ? 1 : _toInt01(post.PostEsBt, 1),

      PostRetenidaMaterial: post?.PostRetenidaMaterial ?? null,
      PostArmadoTipo: post?.PostArmadoTipo ?? null,
      PostArmadoMaterial: post?.PostArmadoMaterial ?? null,

      PostArmadoMaterialNavigationArmmtInterno: null,
      PostArmadoTipoNavigationArmtpInterno: null,
      PostMaterialNavigationPosmtInterno: null,
      PostRetenidaMaterialNavigationRtnmtInterno: null,
      PostRetenidaTipoNavigationRtntpInterno: null,

      // lo que viene del form
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

    // mínimos obligatorios del schema típico
    if (!payload.PostEtiqueta) throw new Error("PostEtiqueta es obligatorio.");
    if (!Number.isFinite(Number(payload.AlimInterno))) throw new Error("AlimInterno es obligatorio.");

    const insertCols = [];
    const insertVals = [];

    const addIfCol = (col, val) => {
      if (!cols.has(col)) return;
      insertCols.push(col);
      insertVals.push(val);
    };

    // agrega solo lo que realmente existe
    for (const [k, v] of Object.entries(payload)) addIfCol(k, v);

    // si tu DB NO tiene PostAltura/PostTramo, se ignora automáticamente

    const q = `
      INSERT INTO Postes (${insertCols.join(", ")})
      VALUES (${insertCols.map(() => "?").join(", ")});
    `;

    await runQuery(q, insertVals);

    const row = await runQuery(`SELECT last_insert_rowid() AS id;`);
    const newId = Number(row?.[0]?.id);

    // ✅ crea/actualiza PIN para que aparezca en mapa
    await _upsertPinForPostLocal({ postInterno: newId, ...payload });

    return Number.isFinite(newId) ? newId : null;
  } catch (error) {
    console.error("❌ Error guardando o actualizando poste:", error);
    throw error;
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
  const query = `
    UPDATE Postes
    SET PostInterno = ?, EstadoOffLine = NULL
    WHERE PostInterno = ?
  `;
  await runQuery(query, [serverId, localId]);
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


