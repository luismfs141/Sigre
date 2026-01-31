import { useState } from "react";
import { api } from "../config";
import { useDatos } from "../context/DatosContext";
import {
  getPostArmadoMaterial,
  getPostByIdLocal,
  getPostMaterial,
  getPostRetenidaMaterial,
  getPostRetenidaTipo,
  markPostAsSynced,
  saveOrUpdatePost,
  updatePostIdAfterSync
} from "../database/offlineDB/posts";
import { useConnectivity } from "./useConnectivity";

export const usePost = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isOnline } = useConnectivity();
  const { checkDatabase } = useDatos(); // ✅ Validación de DB
  const client = api();

  // ------------------- OBTENER POSTE -------------------
  const getPostData = async (postInterno) => {
    setLoading(true);
    setError(null);

    const dbOk = await checkDatabase();
    if (!dbOk) {
      console.warn("⚠ Base de datos no disponible, no se puede obtener el poste");
      setLoading(false);
      return null;
    }

    try {
      if (!postInterno) return null;
      const data = await getPostByIdLocal(postInterno);
      if (!data) {
        console.warn("⚠ No se encontró el poste con ID:", postInterno);
        return null;
      }
      return data;
    } catch (err) {
      console.error("❌ Error obteniendo poste:", err);
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ------------------- GUARDAR + AUTO-SYNC -------------------
  const savePost = async (post) => {
    setLoading(true);
    setError(null);

    const dbOk = await checkDatabase();
    if (!dbOk) {
      console.warn("⚠ Base de datos no disponible, no se puede guardar el poste");
      setLoading(false);
      return null;
    }

    try {
      const localId = await saveOrUpdatePost(post);

      // 🔥 AUTO-SYNC (no await)
      if (localId) autoSyncPost(localId);

      return localId;
    } catch (err) {
      console.error("❌ Error guardando poste:", err);
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ------------------- DATOS AUXILIARES -------------------
  const getMaterialsPost = async () => {
    setLoading(true);
    setError(null);

    const dbOk = await checkDatabase();
    if (!dbOk) {
      console.warn("⚠ Base de datos no disponible, no se pueden obtener materiales");
      setLoading(false);
      return [];
    }

    try {
      const data = await getPostMaterial();
      return data || [];
    } catch (err) {
      console.error("❌ Error obteniendo materiales de poste:", err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getArmadoMaterialsPost = async () => {
    setLoading(true);
    setError(null);

    const dbOk = await checkDatabase();
    if (!dbOk) {
      console.warn("⚠ Base de datos no disponible, no se pueden obtener materiales de armado");
      setLoading(false);
      return [];
    }

    try {
      const data = await getPostArmadoMaterial();
      return data || [];
    } catch (err) {
      console.error("❌ Error obteniendo materiales de armado:", err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getTipoRetenidasPost = async () => {
    setLoading(true);
    setError(null);

    const dbOk = await checkDatabase();
    if (!dbOk) {
      console.warn("⚠ Base de datos no disponible, no se pueden obtener tipos de retenidas");
      setLoading(false);
      return [];
    }

    try {
      const data = await getPostRetenidaTipo();
      return data || [];
    } catch (err) {
      console.error("❌ Error obteniendo tipos de retenidas:", err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getMaterialsRetenidasPost = async () => {
    setLoading(true);
    setError(null);

    const dbOk = await checkDatabase();
    if (!dbOk) {
      console.warn("⚠ Base de datos no disponible, no se pueden obtener materiales de retenidas");
      setLoading(false);
      return [];
    }

    try {
      const data = await getPostRetenidaMaterial();
      return data || [];
    } catch (err) {
      console.error("❌ Error obteniendo materiales de retenidas:", err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Auto-sync de UN poste (automático)
  const autoSyncPost = async (postInternoLocal) => {
    const dbOk = await checkDatabase();
    if (!dbOk) {
      console.warn("⚠ Base de datos no disponible, auto-sync cancelado");
      return;
    }

    try {
      const online = await isOnline();
      if (!online) {
        console.log("ℹ️ Auto-sync no realizada, queda offline");
        return;
      }

      const post = await getPostByIdLocal(postInternoLocal);
      if (!post || post.EstadoOffLine == null) return;

      const postToSync = normalizePostForSync(post);
      console.log("📤 Payload sync:", JSON.stringify([postToSync], null, 2));

      const response = await client.post(
        "/Post/SyncFromSQLite",
        [postToSync],
        { timeout: 6000 }
      );

      const result = response.data;
      if (!Array.isArray(result) || result.length === 0) return;

      const map = result[0];
      if (map.localId !== map.serverId) {
        await updatePostIdAfterSync(map.localId, map.serverId);
      } else {
        await markPostAsSynced(map.serverId);
      }

      console.log("✅ Poste sincronizado correctamente");
    } catch (err) {
      if (err.response) {
        console.log("❌ Sync error:", err.response.status, err.response.data);
      } else if (err.request) {
        console.log("❌ Sin respuesta del servidor");
      } else {
        console.log("❌ Error:", err.message);
      }
    }
  };

  const normalizePostForSync = (post) => ({
  ...post,
  EstadoOffLine: Number(post.EstadoOffLine ?? 1),
  AlimInterno: Number(post.AlimInterno),

  // ✅ este es el correcto para campos 0/1
  PostTerceros: Number(post.PostTerceros) === 1,

  PostInspeccionado: Boolean(post.PostInspeccionado),
  PostEsMt: Boolean(post.PostEsMt),
  PostEsBt: Boolean(post.PostEsBt),

  PostMaterial: post.PostMaterial ? Number(post.PostMaterial) : null,
  PostRetenidaTipo: post.PostRetenidaTipo ? Number(post.PostRetenidaTipo) : null,
  PostRetenidaMaterial: post.PostRetenidaMaterial ? Number(post.PostRetenidaMaterial) : null,
  PostArmadoMaterial: post.PostArmadoMaterial ? Number(post.PostArmadoMaterial) : null,

});


  return {
    loading,
    error,
    getPostData,
    savePost,
    getMaterialsPost,
    getArmadoMaterialsPost,
    getTipoRetenidasPost,
    getMaterialsRetenidasPost
  };
};
