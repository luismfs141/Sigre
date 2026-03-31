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

const POST_SYNC_BATCH_SIZE = 100;

const chunkArray = (items, size) => {
  if (!Array.isArray(items) || !items.length) return [];
  if (!Number.isFinite(size) || size <= 0) return [items];

  const chunks = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
};

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
  const syncAllPosts = async (onProgress) => {
    const online = await isOnline();
    if (!online) {
      return { ok: false, total: 0, synced: 0, error: "OFFLINE" };
    }

    let total = 0;
    let synced = 0;

    try {
      const dbOk = await checkDatabase();
      if (!dbOk) {
        return { ok: false, total: 0, synced: 0, error: "DB_NOT_READY" };
      }

      const pendientes = await getPostsPendientes();
      if (!Array.isArray(pendientes) || !pendientes.length) {
        return { ok: true, total: 0, synced: 0 };
      }

      const aSincronizar = pendientes.filter((d) =>
        [1, 2, 3].includes(Number(d?.EstadoOffLine))
      );

      total = aSincronizar.length;

      if (!total) {
        return { ok: true, total: 0, synced: 0 };
      }

      const lotes = chunkArray(aSincronizar, POST_SYNC_BATCH_SIZE);

      for (let i = 0; i < lotes.length; i++) {
        const lote = lotes[i];

        onProgress?.({
          stage: "postes",
          currentBatch: i + 1,
          totalBatches: lotes.length,
          batchSize: lote.length,
          totalRecords: total,
          syncedRecords: synced,
        });

        const payload = lote.map((p) => normalizePostForSync(p));

        const response = await client.post("/Post/SyncFromSQLite", payload, {
          timeout: 30000,
        });

        const respList = Array.isArray(response.data) ? response.data : [];

        if (respList.length !== lote.length) {
          throw new Error(
            `POST_SYNC_PARTIAL_RESPONSE: lote=${i + 1}, enviados=${lote.length}, respondidos=${respList.length}`
          );
        }

        for (const r of respList) {
          const localId = Number(r?.localId);
          const serverId = Number(r?.serverId);

          if (
            !Number.isFinite(localId) ||
            !Number.isFinite(serverId) ||
            localId <= 0 ||
            serverId <= 0
          ) {
            throw new Error(`POST_SYNC_INVALID_MAPPING: ${JSON.stringify(r)}`);
          }
        }

        for (const r of respList) {
          const localId = Number(r.localId);
          const serverId = Number(r.serverId);

          if (localId !== serverId) {
            await updatePostIdAfterSync(localId, serverId);
          } else {
            await markPostAsSynced(serverId);
          }
        }

        synced += lote.length;
      }

      return { ok: true, total, synced };
    } catch (err) {
      console.error("❌ Sync masivo postes falló:", err?.response?.data || err?.message || err);
      return {
        ok: false,
        total,
        synced,
        error: err?.response?.data?.message || err?.message || "POST_SYNC_FAILED",
      };
    }
  };

  const normalizePostForSync = (post) => ({
    ...post,
    EstadoOffLine:
      post.EstadoOffLine === "" || post.EstadoOffLine == null || Number(post.EstadoOffLine) === 0
        ? 1
        : Number(post.EstadoOffLine),
    AlimInterno: Number(post.AlimInterno),

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

      return pendientes.filter((d) =>
        [1, 2, 3].includes(Number(d?.EstadoOffLine))
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
