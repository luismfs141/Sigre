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

// 🔹 Guardar o actualizar un poste
export const saveOrUpdatePost = async (post) => {
  try {
    if (post.PostInterno) {
      const estado = post.EstadoOffLine == null ? 1 : post.EstadoOffLine;

      const updateQuery = `
        UPDATE Postes
        SET
          PostCodigoNodo = ?,
          PostEtiqueta = ?,
          PostMaterial = ?,
          PostArmadoMaterial = ?,
          PostRetenidaTipo = ?,
          PostRetenidaMaterial = ?,
          PostTerceros = ?,
          PostTramo = ?,
          EstadoOffLine = ?,
          PostAltura = ?
        WHERE PostInterno = ?
      `;

      await runQuery(updateQuery, [
        post.PostCodigoNodo ?? "",
        post.PostEtiqueta ?? "",
        post.PostMaterial ?? "",
        post.PostArmadoMaterial ?? "",
        post.PostRetenidaTipo ?? "",
        post.PostRetenidaMaterial ?? "",
        post.PostTerceros == null ? 0 : Number(post.PostTerceros),
        post.PostTramo ?? null,
        estado,
        post.PostAltura ?? null,
        post.PostInterno
      ]);

      return post.PostInterno;
    } else {
      const insertQuery = `
        INSERT INTO Postes (
          PostCodigoNodo,
          PostEtiqueta,
          PostMaterial,
          PostArmadoMaterial,
          PostRetenidaTipo,
          PostRetenidaMaterial,
          PostTerceros,    
          PostTramo,  
          EstadoOffLine,
          PostAltura
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await runQuery(insertQuery, [
        post.PostCodigoNodo ?? "",
        post.PostEtiqueta ?? "",
        post.PostMaterial ?? "",
        post.PostArmadoMaterial ?? "",
        post.PostRetenidaTipo ?? "",
        post.PostRetenidaMaterial ?? "",
        post.PostTerceros == null ? 0 : Number(post.PostTerceros),
        post.PostTramo ?? null,
        2,
        post.PostAltura ?? null
      ]);

      return result?.insertId ?? null;
    }
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


