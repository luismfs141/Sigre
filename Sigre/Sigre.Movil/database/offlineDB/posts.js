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
      // UPDATE: si EstadoOffLine es null, ponemos 1
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
          EstadoOffLine = ?
        WHERE PostInterno = ?
      `;

      await runQuery(updateQuery, [
        post.PostCodigoNodo ?? "",
        post.PostEtiqueta ?? "",
        post.PostMaterial ?? "",
        post.PostArmadoMaterial ?? "",
        post.PostRetenidaTipo ?? "",
        post.PostRetenidaMaterial ?? "",
        estado,
        post.PostInterno
      ]);

      return post.PostInterno;
    } else {
      // INSERT: EstadoOffLine = 2
      const insertQuery = `
        INSERT INTO Postes (
          PostCodigoNodo,
          PostEtiqueta,
          PostMaterial,
          PostArmadoMaterial,
          PostRetenidaTipo,
          PostRetenidaMaterial,
          EstadoOffLine
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await runQuery(insertQuery, [
        post.PostCodigoNodo ?? "",
        post.PostEtiqueta ?? "",
        post.PostMaterial ?? "",
        post.PostArmadoMaterial ?? "",
        post.PostRetenidaTipo ?? "",
        post.PostRetenidaMaterial ?? "",
        2
      ]);

      return result?.insertId ?? null;
    }
  } catch (error) {
    console.error("❌ Error guardando o actualizando poste:", error);
    throw error;
  }
};


// 🔹 Datos de referencia (material, armado, retenidas)
export const getPostMaterial = async () => await runQuery("SELECT * FROM PosteMaterials");
export const getPostArmadoMaterial = async () => await runQuery("SELECT * FROM ArmadoMaterials");
export const getPostRetenidaTipo = async () => await runQuery("SELECT * FROM RetenidaTipos");
export const getPostRetenidaMaterial = async () => await runQuery("SELECT * FROM RetenidaMaterials");
