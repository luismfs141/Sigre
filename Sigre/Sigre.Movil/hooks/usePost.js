import { useState } from "react";
import { api } from "../config";
import { useDatos } from "../context/DatosContext";
import {
  getPostArmadoMaterial,
  getPostByIdLocal,
  getPostMaterial,
  getPostRetenidaMaterial,
  getPostRetenidaTipo,
  getPostsPendientes,
  insertPostAndPin,
  markPostAsSynced,
  saveOrUpdatePost,
  updatePostIdAfterSync
} from "../database/offlineDB/posts";
import { useConnectivity } from "./useConnectivity";

export const usePost = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isOnline } = useConnectivity();
  const { checkDatabase, isAutoSyncOnline } = useDatos(); // ✅ Validación de DB
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
      const isUpdate = post?.PostInterno != null && Number(post.PostInterno) > 0;

      const localId = isUpdate
        ? await saveOrUpdatePost(post)   // ✅ UPDATE ONLY
        : await insertPostAndPin(post);  // ✅ INSERT Postes + Pines

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
    //console.log("📦 log. Lectura de material de postes");
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
    //console.log("📦 log. Lectura tipo de retenida");
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
    if (!isAutoSyncOnline) return;

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


  // ------------------- SYNC MASIVO (robusto + compatible) -------------------
  const syncAllPosts = async () => {
    const online = await isOnline();
    if (!online) return { ok: false };

    try {
      const pendientes = await getPostsPendientes();
      if (!pendientes.length) return { ok: true, synced: 0 };

      const aSincronizar = pendientes.filter((d) => [1, 2, 3, 4].includes(Number(d?.EstadoOffLine)));
      if (!aSincronizar.length) return { ok: true, synced: 0 };

      // 🔹 Normalizar TODAS
      const payload = aSincronizar.map((p) => normalizePostForSync(p));

      const response = await client.post("/Post/SyncFromSQLite", payload, { timeout: 20000 });

      const respList = Array.isArray(response.data) ? response.data : [];
      let syncedCount = 0;

      for (const r of respList) {
        if (!r?.localId || !r?.serverId) {
          console.warn("⚠ Respuesta inválida:", r);
          continue;
        }

        await updatePostIdAfterSync(r.localId, r.serverId);
        syncedCount++;
      }

      return { ok: true, synced: syncedCount };
    } catch (err) {
      console.error("❌ Sync masivo deficiencias falló:", err?.response?.data || err?.message || err);
      return { ok: false };
    }
  };

  const normalizePostForSync = (post) => ({
    ...post,
    EstadoOffLine: Number(post.EstadoOffLine ?? 1),
    AlimInterno: Number(post.AlimInterno),

    // ✅ este es el correcto para campos 0/1
    PostVereda: Number(post.PostVereda) === 1,
    PostTerceros: Number(post.PostTerceros) === 1,

    PostInspeccionado: Boolean(post.PostInspeccionado),
    PostEsMt: Boolean(post.PostEsMt),
    PostEsBt: Boolean(post.PostEsBt),

    PostMaterial: post.PostMaterial ? Number(post.PostMaterial) : null,
    PostRetenidaTipo: post.PostRetenidaTipo ? Number(post.PostRetenidaTipo) : null,
    PostRetenidaMaterial: post.PostRetenidaMaterial ? Number(post.PostRetenidaMaterial) : null,
    PostArmadoMaterial: post.PostArmadoMaterial ? Number(post.PostArmadoMaterial) : null,

  });

  const countPendingPostsLocal = async () => {
    const dbOk = await checkDatabase();
    if (!dbOk) return 0;

    try {
      const pendientes = await getPostsPendientes();
      if (!Array.isArray(pendientes) || !pendientes.length) return 0;

      // mismo criterio que usas para sincronizar
      return pendientes.filter((d) =>
        [1, 2, 3, 4].includes(Number(d?.EstadoOffLine))
      ).length;
    } catch (err) {
      console.error("❌ Error contando posts pendientes:", err);
      return 0;
    }
  };


  return {
    loading,
    error,
    getPostData,
    savePost,
    getMaterialsPost,
    getArmadoMaterialsPost,
    getTipoRetenidasPost,
    getMaterialsRetenidasPost,
    syncAllPosts,
    countPendingPostsLocal
  };
};
