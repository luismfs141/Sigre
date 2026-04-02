import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import { useState } from "react";
import { api } from "../config";
import { useDatos } from "../context/DatosContext";
import { useConnectivity } from "./useConnectivity";
import { useDeficiency } from "./useDeficiency";
import { useFiles } from "./useFiles";
import { useGap } from "./useGap";
import { usePost } from "./usePost";

/* ==========================================================
   🧠 NORMALIZADORES
========================================================== */
const toBooleanOrNull = (v) => {
  if (v === null || v === undefined) return null;
  if (v === true || v === false) return v;
  if (v === 1 || v === "1") return true;
  if (v === 0 || v === "0") return false;
  return null;
};

const toIsoDate = (value) => {
  if (!value) return null;
  if (typeof value === "string" && value.includes("T")) return value;

  const date = new Date(value.replace(" ", "T"));
  if (isNaN(date.getTime())) return null;

  return date.toISOString();
};

const normalizeDeficiencyForSync = (d) => ({
  ...d,

  DefiFechaDenuncia: toIsoDate(d.DefiFechaDenuncia),
  DefiFechaInspeccion: toIsoDate(d.DefiFechaInspeccion),
  DefiFechaSubsanacion: toIsoDate(d.DefiFechaSubsanacion),
  DefiFecRegistro: toIsoDate(d.DefiFecRegistro),
  DefiFecModificacion: toIsoDate(d.DefiFecModificacion),
  DefiFechaCreacion: toIsoDate(d.DefiFechaCreacion),

  DefiResponsable: toBooleanOrNull(d.DefiResponsable),
  DefiActivo: toBooleanOrNull(d.DefiActivo),
  DefiInspeccionado: toBooleanOrNull(d.DefiInspeccionado),
});

const normalizeArchivoForSync = (a, serverDefiId) => ({
  ...a,

  ArchCodTabla: serverDefiId,
  ArchTabla: "Deficiencias",

  DefiUuid: (a.DefiUuid ?? a.DefiUUID ?? null)?.toString().slice(0, 50) ?? null,

  ArchActivo: toBooleanOrNull(a.ArchActivo),
  ArchPrincipal: toBooleanOrNull(a.ArchPrincipal),
  ArchFecRegistro: toIsoDate(a.ArchFecRegistro),
  ArchFecModificacion: toIsoDate(a.ArchFecModificacion),
});

const _num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Normaliza cualquier resultado (number/array/object) a stats numéricos
const normalizeSyncStats = (res) => {
  if (res == null) return { ok: false, total: 0, synced: 0, remaining: 0 };

  if (typeof res === "number") {
    return { ok: true, total: res, synced: res, remaining: 0 };
  }

  if (Array.isArray(res)) {
    return { ok: true, total: res.length, synced: res.length, remaining: 0 };
  }

  if (typeof res === "object") {
    const ok = res.ok !== undefined ? !!res.ok : true;

    const totalRaw =
      res.totalPending ?? res.total ?? res.pending ?? res.toSync ?? res.count ?? res.totalCount;

    const syncedRaw =
      res.syncedCount ?? res.synced ?? res.sent ?? res.uploaded ?? res.success ?? res.okCount;

    const remainingRaw =
      res.remainingPending ?? res.remaining ?? res.left ?? res.pendingAfter ?? res.failed ?? res.errorCount;

    let total = _num(totalRaw);
    let synced = _num(syncedRaw);
    let remaining = _num(remainingRaw);

    // Si no viene total pero sí vienen synced/remaining, lo calculamos
    if (total === 0 && (synced > 0 || remaining > 0)) total = synced + remaining;

    // Si no viene remaining pero sí total y synced, lo calculamos
    if (remaining === 0 && total > 0 && synced >= 0 && synced <= total) remaining = total - synced;

    return { ok, total, synced, remaining };
  }

  return { ok: true, total: 0, synced: 0, remaining: 0 };
};


/* ==========================================================
   🪝 HOOK
========================================================== */
export const useOffline = () => {
  const { setNewDatabase } = useDatos();
  const { isOnline } = useConnectivity();
  const [downloading, setDownloading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const client = api();
  const { syncAllDeficiencies, countPendingDeficienciesLocal } = useDeficiency();
  const { syncAllArchivos, countPendingArchivosLocal } = useFiles();
  const { syncAllPosts, countPendingPostsLocal } = usePost();
  const { syncAllGaps, countPendingGapsLocal } = useGap();


  const ensureOnline = () => {
    if (!isOnline) {
      throw new Error("📴 Sin conexión a internet");
    }
  };

  /* ============================
     📥 DESCARGA DB (SIN CAMBIOS)
  ============================ */
  const downloadDatabase = async (userId, ids, project, newFileName) => {
    try {
      setDownloading(true);

      const tempUri = `${FileSystem.documentDirectory}${newFileName}`;
      const sqliteFolder = `${FileSystem.documentDirectory}SQLite/`;
      const finalUri = `${sqliteFolder}${newFileName}`;

      const response = await client.post(
        "/Feeder/export",
        { UserId: userId, Ids: ids, Project: project, FileName: newFileName },
        { responseType: "arraybuffer" }
      );

      const base64 = Buffer.from(response.data, "binary").toString("base64");

      await FileSystem.writeAsStringAsync(tempUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const sqliteInfo = await FileSystem.getInfoAsync(sqliteFolder);
      if (!sqliteInfo.exists) {
        await FileSystem.makeDirectoryAsync(sqliteFolder, { intermediates: true });
      }

      await FileSystem.moveAsync({ from: tempUri, to: finalUri });
      await setNewDatabase(newFileName);

      return { ok: true, name: newFileName };
    } catch (err) {
      console.log("❌ Error descargando DB:", err);
      return { ok: false };
    } finally {
      setDownloading(false);
    }
  };


  //------------ Sume de pendientes de sincronización
  const readPendingCounts = async () => {
    let def = 0;
    let arch = 0;
    let post = 0;
    let gap = 0;

    try {
      post = await countPendingPostsLocal();
      gap = await countPendingGapsLocal();
      def = await countPendingDeficienciesLocal();
      arch = await countPendingArchivosLocal();
    } catch (e) {
      console.log("❌ Error contando pendientes:", e);
    }

    return {
      def,
      arch,
      post,
      gap,
      total: def + arch + post + gap,
    };
  };


  const getPendingSyncSummary = async () => {
    const counts = await readPendingCounts();

    return {
      ok: true,
      totalPending: counts.total,
      syncedCount: 0,
      remainingPending: counts.total,
      synced: 0,
      detail: {
        def: { before: counts.def, after: counts.def },
        arch: { before: counts.arch, after: counts.arch },
        post: { before: counts.post, after: counts.post },
        gap: { before: counts.gap, after: counts.gap },
      },
    };
  };

  /* ============================
   🔄 SINCRONIZACIÓN OFFLINE
============================ */
  const syncAllPending = async (onProgress) => {
    setSyncing(true);

    const before = await readPendingCounts();
    const totalPending = before.total;

    const online =
      typeof isOnline === "function" ? await isOnline() : !!isOnline;

    if (!online) {
      setSyncing(false);
      return {
        ok: false,
        totalPending,
        syncedCount: 0,
        remainingPending: totalPending,
        synced: 0,
        stage: "offline",
        detail: {
          def: { before: before.def, after: before.def },
          arch: { before: before.arch, after: before.arch },
          post: { before: before.post, after: before.post },
          gap: { before: before.gap, after: before.gap },
          reason: "offline",
        },
      };
    }

    const buildStageFail = async (stage, reason) => {
      const after = await readPendingCounts();
      const syncedCount = Math.max(totalPending - after.total, 0);

      return {
        ok: false,
        totalPending,
        syncedCount,
        remainingPending: after.total,
        synced: syncedCount,
        stage,
        detail: {
          def: { before: before.def, after: after.def },
          arch: { before: before.arch, after: after.arch },
          post: { before: before.post, after: after.post },
          gap: { before: before.gap, after: after.gap },
          reason,
        },
      };
    };

    try {
      const postResult = await syncAllPosts(onProgress);
      if (!postResult?.ok || Number(postResult.synced ?? 0) !== Number(postResult.total ?? 0)) {
        return await buildStageFail("postes", postResult?.error ?? "POST_STAGE_FAILED");
      }

      const gapResult = await syncAllGaps(onProgress);
      if (!gapResult?.ok || Number(gapResult.synced ?? 0) !== Number(gapResult.total ?? 0)) {
        return await buildStageFail("vanos", gapResult?.error ?? "GAP_STAGE_FAILED");
      }

      const defResult = await syncAllDeficiencies(onProgress);
      if (!defResult?.ok || Number(defResult.synced ?? 0) !== Number(defResult.total ?? 0)) {
        return await buildStageFail("deficiencias", defResult?.error ?? "DEF_STAGE_FAILED");
      }

      const archResult = await syncAllArchivos(onProgress);
      if (!archResult?.ok || Number(archResult.synced ?? 0) !== Number(archResult.total ?? 0)) {
        return await buildStageFail("archivos", archResult?.error ?? "FILE_STAGE_FAILED");
      }

      const after = await readPendingCounts();
      const remainingPending = after.total;
      const syncedCount = Math.max(totalPending - remainingPending, 0);

      return {
        ok: remainingPending === 0,
        totalPending,
        syncedCount,
        remainingPending,
        synced: syncedCount,
        stage: "completed",
        detail: {
          def: { before: before.def, after: after.def },
          arch: { before: before.arch, after: after.arch },
          post: { before: before.post, after: after.post },
          gap: { before: before.gap, after: after.gap },
        },
      };
    } catch (err) {
      console.log("❌ Sync general falló:", err?.message ?? err);
      return await buildStageFail("unexpected", err?.message ?? "UNKNOWN_ERROR");
    } finally {
      setSyncing(false);
    }
  };

  return {
    downloading,
    syncing,
    downloadDatabase,
    syncAllPending,
    getPendingSyncSummary,
  };
};
