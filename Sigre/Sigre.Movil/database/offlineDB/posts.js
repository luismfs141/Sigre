import { runQuery } from "./db";

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
          PostTerceros = ?,        -- ✅ NUEVO
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
        post.PostTerceros == null ? 0 : Number(post.PostTerceros), // ✅ NUEVO
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
          PostTerceros,         -- ✅ NUEVO
          EstadoOffLine,
          PostAltura
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await runQuery(insertQuery, [
        post.PostCodigoNodo ?? "",
        post.PostEtiqueta ?? "",
        post.PostMaterial ?? "",
        post.PostArmadoMaterial ?? "",
        post.PostRetenidaTipo ?? "",
        post.PostRetenidaMaterial ?? "",
        post.PostTerceros == null ? 0 : Number(post.PostTerceros), // ✅ NUEVO
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
