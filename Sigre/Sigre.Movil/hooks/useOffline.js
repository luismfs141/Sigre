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

  // 🔑 relación servidor
  ArchCodTabla: serverDefiId,
  ArchTabla: "DEFICIENCIA",

  DefiUUID: (a.DefiUUID ?? a.DefiUUID ?? null)?.toString().slice(0, 50) ?? null,

  // 🧠 normalización backend .NET
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

  /* ============================
   🔄 SINCRONIZACIÓN OFFLINE
============================ */
  const syncAllPending = async () => {
    setSyncing(true);

    // 1) contar pendientes ANTES (siempre, incluso offline)
    let defBefore = 0;
    let archBefore = 0;
    let postBefore = 0;
    let gapBefore = 0;

    try {
      defBefore = await countPendingDeficienciesLocal();
      archBefore = await countPendingArchivosLocal();
      postBefore = await countPendingPostsLocal();
      gapBefore = await countPendingGapsLocal();
    } catch (e) {
      console.log("❌ Error contando pendientes (antes):", e);
    }

    const totalPending = defBefore + archBefore + postBefore + gapBefore;

    // 2) detectar online (tu hook a veces devuelve fn, a veces bool)
    const online =
      typeof isOnline === "function" ? await isOnline() : !!isOnline;

    // 3) si NO hay internet -> NO sync, pero reporta 0 de N
    if (!online) {
      setSyncing(false);
      return {
        ok: false,
        totalPending,
        syncedCount: 0,
        remainingPending: totalPending,
        synced: 0,
        detail: {
          def: { before: defBefore, after: defBefore },
          arch: { before: archBefore, after: archBefore },
          post: { before: postBefore, after: postBefore },
          gap: { before: gapBefore, after: gapBefore },
          reason: "offline",
        },
      };
    }

    try {
      // 4) intentar sync
      await syncAllDeficiencies();
      await syncAllArchivos();
      await syncAllPosts();
      await syncAllGaps();

      // 5) contar pendientes DESPUÉS (real)
      let defAfter = 0;
      let archAfter = 0;
      let postAfter = 0;
      let gapAfter = 0;

      try {
        defAfter = await countPendingDeficienciesLocal();
        archAfter = await countPendingArchivosLocal();
        postAfter = await countPendingPostsLocal();
        gapAfter = await countPendingGapsLocal();

        console.log(`✅ Sync completado. Pendientes antes: ${totalPending} (Def: ${defBefore}, Arch: ${archBefore}, Post: ${postBefore}, Gap: ${gapBefore}). Pendientes después: ${defAfter + archAfter + postAfter + gapAfter} (Def: ${defAfter}, Arch: ${archAfter}, Post: ${postAfter}, Gap: ${gapAfter}).`);
      } catch (e) {
        console.log("❌ Error contando pendientes (después):", e);
      }

      const remainingPending = defAfter + archAfter + postAfter + gapAfter;
      const syncedCount = Math.max(totalPending - remainingPending, 0);
      const ok = remainingPending === 0;

      return {
        ok,
        totalPending,
        syncedCount,
        remainingPending,
        synced: syncedCount,
        detail: {
          def: { before: defBefore, after: defAfter },
          arch: { before: archBefore, after: archAfter },
          post: { before: postBefore, after: postAfter },
          gap: { before: gapBefore, after: gapAfter },
        },
      };
    } catch (err) {
      console.log("❌ Sync general falló:", err?.message ?? err);

      // si falló, igual devuelve lo que pudo (usando conteo final si se puede)
      let defAfter = defBefore;
      let archAfter = archBefore;
      let postAfter = postBefore;
      let gapAfter = gapBefore;

      try {
        defAfter = await countPendingDeficienciesLocal();
        archAfter = await countPendingArchivosLocal();
        postAfter = await countPendingPostsLocal();
        gapAfter = await countPendingGapsLocal();
      } catch (e) {
        console.log("❌ Error contando pendientes después de sync fallido:", e);
      }

      const remainingPending = defAfter + archAfter + postAfter + gapAfter;
      const syncedCount = Math.max(totalPending - remainingPending, 0);

      return {
        ok: false,
        totalPending,
        syncedCount,
        remainingPending,
        synced: syncedCount,
        detail: {
          def: { before: defBefore, after: defAfter },
          arch: { before: archBefore, after: archAfter },
          post: { before: postBefore, after: postAfter },
          gap: { before: gapBefore, after: gapAfter },
          reason: err?.message ?? "unknown_error",
        },
      };
    } finally {
      setSyncing(false);
    }
  };

  return {
    downloading,
    syncing,
    downloadDatabase,
    syncAllPending,
  };
};
