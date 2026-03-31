import { useCallback, useRef } from "react";
import { api } from "../config";
import { useDatos } from "../context/DatosContext";
import { nowPeruISO } from "../utils/dateUtils";
import { useConnectivity } from "./useConnectivity";


import {
  deleteFileById,
  getArchivoByIdLocal,
  getArchivosByBasePathLocal,
  getArchivosPendientes,
  getFilesByElementAndTypi,
  getMediosByDeficienciaIdLocal,
  getNextArchCodTablaLocal,
  markArchivoDeletedLocal,
  markArchivoInactiveLocal,
  saveOrUpdateArchivoLocal,
  updateArchivoIdAfterSync
} from "../database/offlineDB/files";

const toNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const chunkArray = (items, size) => {
  if (!Array.isArray(items) || !items.length) return [];
  if (!Number.isFinite(size) || size <= 0) return [items];

  const chunks = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
};

const FILE_SYNC_BATCH_SIZE = 100;

export function useFiles() {
  const { checkDatabase, isAutoSyncOnline } = useDatos();
  const { isOnline } = useConnectivity();
  const client = api();

  const syncingRef = useRef(false);

  // ===============================
  // 🔹 NORMALIZAR ANTES DE GUARDAR (SQLite)
  // ===============================
  const normalizeArchivoBeforeSave = useCallback((archivo) => {
    // console.log("🧪 archivo:", archivo);

    return {
      archTipo: toNum(archivo.ArchTipo, 0),
      archTabla: archivo.ArchTabla ?? "Deficiencias",
      archCodTabla: toNum(archivo.ArchCodTabla, 0),
      archNombre: archivo.ArchNombre,

      archLatit: archivo.ArchLatitud ?? null,
      archLong: archivo.ArchLongitud ?? null,

      // soporta fechaISO / ArchFecha / ArchFech
      archFech: archivo.fechaISO ?? archivo.ArchFecha ?? archivo.ArchFech ?? nowPeruISO(),

      archTipoElemento: archivo.ArchTipoElemento ?? null,
      archIdElemento: archivo.ArchIdElemento ?? null,
      tipiInterno: archivo.TipiInterno ?? null,

      // ✅ CLAVE: acepta 0/1 o "0"/"1"
      archActiv: toNum(archivo.ArchActivo ?? archivo.ArchActiv ?? 1, 1),
    };
  }, []);

  // ===============================
  // 🔹 NORMALIZAR PARA SYNC (API)
  // ===============================
  const normalizeArchivoForSync = (arch) => {
    const activoNum = toNum(arch.ArchActivo ?? 1, 1);

    return {
      ArchInterno: arch.ArchInterno,
      ArchServerId: arch.ArchServerId ?? null,

      ArchTabla: arch.ArchTabla ?? "Deficiencias",
      ArchCodTabla: arch.ArchCodTabla ?? null,

      ArchTipo: String(arch.ArchTipo),
      ArchNombre: arch.ArchNombre ?? arch.ARCH_NOMBRE ?? arch.archNombre ?? null,

      ArchLatitud: arch.ArchLatitud ?? null,
      ArchLongitud: arch.ArchLongitud ?? null,

      ArchFecha: arch.ArchFecha
        ? String(arch.ArchFecha).replace(" ", "T")
        : nowPeruISO(),

      ArchTipoElemento: arch.ArchTipoElemento ?? null,
      ArchIdElemento: arch.ArchIdElemento ?? null,
      TipiInterno: arch.TipiInterno ?? null,

      DefiServerId: arch.DefiServerId ?? null,

      // ✅ ÚNICO NOMBRE
      DefiUUID: arch.DefiUUID ?? null,

      ArchActivo: activoNum === 1,
      EstadoOffLine: toNum(arch.EstadoOffLine ?? 0, 0),
    };
  };





  const autoSyncArchivo = useCallback(async (archInternoLocal) => {
    //const log = (...a) => console.log("[AUTO-SYNC][FILE]", ...a);
    const log = () => { };

    if (!isAutoSyncOnline) {
      log("modo OFFLINE manual activo => autosync omitido");
      return;
    }

    if (syncingRef.current) return;
    syncingRef.current = true;

    try {
      log("start archInternoLocal =", archInternoLocal);

      const dbOk = await checkDatabase();
      log("dbOk =", dbOk);
      if (!dbOk) return;

      const online = await isOnline();
      log("online =", online);
      if (!online) return;

      const arch = await getArchivoByIdLocal(archInternoLocal);
      if (!arch) {
        log("no existe archivo local");
        return;
      }

      log("local EstadoOffLine =", arch?.EstadoOffLine, "ArchActivo =", arch?.ArchActivo);

      const payload = [normalizeArchivoForSync(arch)];

      let response;
      try {
        response = await client.post("/File/SyncFromSQLite", payload, { timeout: 15000 });
        log("POST OK status =", response?.status, "data =", response?.data);
      } catch (err) {
        log(
          "POST FAIL status=",
          err?.response?.status,
          "data=",
          err?.response?.data,
          "msg=",
          err?.message
        );
        return;
      }

      const map = Array.isArray(response?.data) ? response.data?.[0] : null;
      if (!map) {
        log("respuesta sin item [0]");
        return;
      }

      const localId = map?.localId;
      const serverId = map?.serverId;

      log("map =", map);

      if (!localId) {
        log("sin localId => NO se puede actualizar SQLite");
        return;
      }
      if (serverId == null) {
        log("sin serverId => NO se limpia EstadoOffLine (ojo deletes)");
        return;
      }

      await updateArchivoIdAfterSync(localId, serverId);
      log("✅ update ok localId->serverId", localId, "->", serverId);

      const pendingAfter = await getArchivosPendientes();
      log("pendientes DESPUÉS =", pendingAfter?.length ?? 0);
    } catch (err) {
      console.error("❌ [autoSyncArchivo]", err?.response?.data || err?.message || err);
    } finally {
      syncingRef.current = false;
    }
  }, [checkDatabase, isOnline, client]);




  // ===============================
  // 💾 SAVE / UPDATE (SQLite)
  // ===============================
  const saveArchivoLocal = useCallback(async (data) => {
    const dbOk = await checkDatabase();
    if (!dbOk) return null;

    //console.log("💾 saveArchivoLocal - data:", data);
    const normalized = normalizeArchivoBeforeSave(data);

    const archivoForDB = {
      ArchInterno: data.ArchInterno ?? null,   // 👈 clave para UPDATE
      ArchTipo: normalized.archTipo,
      ArchTabla: normalized.archTabla,
      ArchCodTabla: normalized.archCodTabla,
      ArchNombre: normalized.archNombre,
      ArchLatitud: normalized.archLatit,
      ArchLongitud: normalized.archLong,
      ArchFecha: normalized.archFech,
      ArchTipoElemento: normalized.archTipoElemento,
      ArchIdElemento: normalized.archIdElemento,
      TipiInterno: normalized.tipiInterno,
      DefiUUID: data.DefiUUID ?? null,

      // ✅ 0/1 numérico en SQLite (tu Multimedia manda "0")
      ArchActivo: normalized.archActiv,

      // ✅ evita nulls raros
      EstadoOffLine: data.EstadoOffLine ?? 1,
      DefiServerId: data.DefiServerId ?? null
    };

    //console.log("💾 saveOrUpdateArchivoLocal:", archivoForDB);

    const localId = await saveOrUpdateArchivoLocal(archivoForDB);

    if (localId) {
      await autoSyncArchivo(localId);
    }

    return localId;
  }, [checkDatabase, autoSyncArchivo, normalizeArchivoBeforeSave]);

  // ===============================
  // 🗑️ MARK DELETED (solo ruta/activo)
  // ===============================
  const markArchivoAsDeleted = useCallback(async (archInterno, newRelativePath) => {
    const dbOk = await checkDatabase();
    if (!dbOk) return false;

    await markArchivoDeletedLocal(archInterno, newRelativePath);
    await autoSyncArchivo(archInterno);

    return true;
  }, [checkDatabase, autoSyncArchivo]);



  // ✅ Baja ArchActivo a 0 sin mover archivos (caso: “falta foto en carpeta pública”)
  const markArchivoAsInactive = useCallback(
    async (archInterno) => {
      const dbOk = await checkDatabase();
      if (!dbOk) return false;

      const ok = await markArchivoInactiveLocal(archInterno);
      if (ok) await autoSyncArchivo(archInterno);

      return ok;
    },
    [checkDatabase, autoSyncArchivo]
  );


  const deletedFile = useCallback(async (archInterno) => {
    const dbOk = await checkDatabase();
    if (!dbOk) return false;

    await deleteFileById(archInterno);
    await autoSyncArchivo(archInterno);

    return true;
  }, [checkDatabase, autoSyncArchivo]);

  const fetchFilesByElementAndTypi = useCallback(async (idElement, typeElement, tipiInterno) => {
    const dbOk = await checkDatabase();
    if (!dbOk) return [];

    try {
      return await getFilesByElementAndTypi(idElement, typeElement, tipiInterno);
    } catch (err) {
      console.error("❌ Error obteniendo archivos por tipificación:", err);
      return [];
    }
  }, [checkDatabase]);

  const fetchMediosByDeficienciaId = useCallback(async (deficienciaId) => {
    const dbOk = await checkDatabase();
    if (!dbOk) return [];

    try {
      return await getMediosByDeficienciaIdLocal(deficienciaId);
    } catch (err) {
      console.error("❌ Error obteniendo medios por deficiencia:", err);
      return [];
    }
  }, [checkDatabase]);

  const countPendingArchivosLocal = useCallback(async () => {
    const dbOk = await checkDatabase();
    if (!dbOk) return 0;

    try {
      const pendientes = await getArchivosPendientes();
      if (!Array.isArray(pendientes) || !pendientes.length) return 0;

      // mismo criterio que usas para sincronizar
      return pendientes.filter((a) =>
        [1, 2, 3].includes(Number(a?.EstadoOffLine))
      ).length;
    } catch (err) {
      console.error("❌ Error contando archivos pendientes:", err);
      return 0;
    }
  }, [checkDatabase]);



  const syncAllArchivos = useCallback(async (onProgress) => {
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

      const pendientes = await getArchivosPendientes();
      if (!Array.isArray(pendientes) || !pendientes.length) {
        return { ok: true, total: 0, synced: 0 };
      }

      const aSincronizar = pendientes.filter((a) =>
        [1, 2, 3].includes(Number(a?.EstadoOffLine))
      );

      total = aSincronizar.length;

      if (!total) {
        return { ok: true, total: 0, synced: 0 };
      }

      const lotes = chunkArray(aSincronizar, FILE_SYNC_BATCH_SIZE);

      for (let i = 0; i < lotes.length; i++) {
        const lote = lotes[i];

        onProgress?.({
          stage: "archivos",
          currentBatch: i + 1,
          totalBatches: lotes.length,
          batchSize: lote.length,
          totalRecords: total,
          syncedRecords: synced,
        });

        const payload = lote.map(normalizeArchivoForSync);

        const response = await client.post("/File/SyncFromSQLite", payload, {
          timeout: 60000,
        });

        const respList = Array.isArray(response?.data) ? response.data : [];

        if (respList.length !== lote.length) {
          throw new Error(
            `FILE_SYNC_PARTIAL_RESPONSE: lote=${i + 1}, enviados=${lote.length}, respondidos=${respList.length}`
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
            throw new Error(
              `FILE_SYNC_INVALID_MAPPING: lote=${i + 1}, data=${JSON.stringify(r)}`
            );
          }
        }

        for (const r of respList) {
          await updateArchivoIdAfterSync(Number(r.localId), Number(r.serverId));
        }

        synced += lote.length;
      }

      return { ok: true, total, synced };
    } catch (err) {
      console.error(
        "❌ Sync masivo archivos falló:",
        err?.response?.data || err?.message || err
      );

      return {
        ok: false,
        total,
        synced,
        error: err?.response?.data?.message || err?.message || "FILE_SYNC_FAILED",
      };
    }
  }, [checkDatabase, isOnline, client]);


  return {
    getNextArchCodTabla: useCallback(() => getNextArchCodTablaLocal(), []),
    saveArchivoLocal,
    getArchivosByBasePath: useCallback((basePathPrefix) => getArchivosByBasePathLocal(basePathPrefix), []),
    markArchivoAsDeleted,
    fetchFilesByElementAndTypi,
    fetchMediosByDeficienciaId,
    deletedFile,
    markArchivoAsInactive,
    syncAllArchivos,
    countPendingArchivosLocal
  };
}
