import { useCallback, useRef } from "react";
import { api } from "../config";
import { useDatos } from "../context/DatosContext";
import { nowPeruISO } from "../utils/dateUtils";
import { useConnectivity } from "./useConnectivity";

import {
  deleteFileById,
  getArchivosByBasePathLocal,
  getArchivosPendientes,
  getFilesByElementAndTypi,
  getMediosByDeficienciaIdLocal,
  getNextArchCodTablaLocal,
  markArchivoAsSynced,
  markArchivoDeletedLocal,
  saveOrUpdateArchivoLocal,
  updateArchivoIdAfterSync
} from "../database/offlineDB/files";

export function useFiles() {
  const { checkDatabase } = useDatos();
  const { isOnline } = useConnectivity();
  const client = api();

  const syncingRef = useRef(false);

  // ===============================
  // 🔹 NORMALIZAR ANTES DE GUARDAR
  // ===============================
  const normalizeArchivoBeforeSave = useCallback((archivo) => ({
    archTipo: Number(archivo.archTipo),
    archTabla: archivo.archTabla ?? "Deficiencias",
    archCodTabla: Number(archivo.archCodTabla),
    archNombre: archivo.archNombre,
    archLatit: archivo.archLatit ?? null,
    archLong: archivo.archLong ?? null,
    archFech: archivo.archFech ?? nowPeruISO(),
    archTipoElemento: archivo.archTipoElemento ?? null,
    archIdElemento: archivo.archIdElemento ?? null,
    tipiInterno: archivo.tipiInterno ?? null,
    archActiv: archivo.archActiv ?? 1
  }), []);


  // ===============================
  // 🔹 NORMALIZAR PARA SYNC
  // ===============================

  const normalizeArchivoForSync = (arch) => ({
    ArchInterno: arch.ArchInterno,
    ArchServerId: arch.ArchServerId ?? null,

    ArchTabla: arch.ArchTabla ?? "Deficiencias",
    ArchCodTabla: arch.ArchCodTabla ?? null,

    // 🔴 CLAVE: STRING
    ArchTipo: String(arch.ArchTipo),

    ArchNombre: arch.ArchNombre,

    ArchLatitud: arch.ArchLatitud ?? null,
    ArchLongitud: arch.ArchLongitud ?? null,

    // ✔️ DateTime compatible con ASP.NET
    ArchFecha: arch.ArchFecha
      ? arch.ArchFecha.replace(" ", "T")
      : nowPeruISO(),

    ArchTipoElemento: arch.ArchTipoElemento ?? null,
    ArchIdElemento: arch.ArchIdElemento ?? null,
    TipiInterno: arch.TipiInterno ?? null,

    // 🔒 Solo informativo (SQLite)
    DefiServerId: arch.DefiServerId ?? null,

    ArchActivo: Boolean(arch.ArchActivo),
    EstadoOffLine: Number(arch.EstadoOffLine)
  });

  // ===============================
  // 🔄 AUTO SYNC
  // ===============================
  const autoSyncArchivo = useCallback(async (archInternoLocal) => {
    console.log("🔄 [autoSyncArchivo] START →", archInternoLocal);

    if (syncingRef.current) return;
    syncingRef.current = true;

    try {
      const online = await isOnline();
      if (!online) return;

      const pendientes = await getArchivosPendientes();

      const arch = pendientes.find(a =>
        a.ArchInterno === archInternoLocal &&
        [1, 2, 3].includes(Number(a.EstadoOffLine))
      );

      if (!arch) return;

      // 🚫 NO VALIDAR DefiServerId
      const payload = [normalizeArchivoForSync(arch)];

      console.log("📤 Payload:", payload);

      const response = await client.post(
        "/File/SyncFromSQLite",
        payload,
        { timeout: 15000 }
      );

      const map = response.data?.[0];
      if (!map) return;

      if (map.localId !== map.serverId) {
        await updateArchivoIdAfterSync(map.localId, map.serverId);
      } else {
        await markArchivoAsSynced(map.serverId);
      }

      console.log("✅ Archivo sincronizado");

    } catch (err) {
      console.error("❌ [autoSyncArchivo]", err?.response?.data || err.message);
    } finally {
      syncingRef.current = false;
      console.log("🔓 [autoSyncArchivo] END");
    }
  }, [isOnline, client]);

  // ===============================
  // 💾 SAVE
  // ===============================
  // const saveArchivoLocal = useCallback(async (data) => {
  //   const dbOk = await checkDatabase();
  //   if (!dbOk) return null;

  //   const normalized = normalizeArchivoBeforeSave(data);
  //   console.log("💾 Guardando archivo:", normalized);

  //   const localId = await insertArchivoLocal(normalized);

  //   if (localId) {
  //     await autoSyncArchivo(localId);
  //   }

  //   return localId;
  // }, [checkDatabase, autoSyncArchivo, normalizeArchivoBeforeSave]);

  const saveArchivoLocal = useCallback(async (data) => {
    const dbOk = await checkDatabase();
    if (!dbOk) return null;

    // 🔹 Normalización EXISTENTE (NO SE TOCA)
    const normalized = normalizeArchivoBeforeSave(data);

    // 🔹 Adaptación a estructura SQLite (saveOrUpdate)
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
      ArchActivo: normalized.archActiv,
      EstadoOffLine: data.EstadoOffLine ?? null,
      DefiServerId: data.DefiServerId ?? null
    };

    console.log("💾 saveOrUpdateArchivoLocal:", archivoForDB);

    const localId = await saveOrUpdateArchivoLocal(archivoForDB);

    // 🔄 Mantener sincronización automática
    if (localId) {
      await autoSyncArchivo(localId);
    }

    return localId;
  }, [
    checkDatabase,
    autoSyncArchivo,
    normalizeArchivoBeforeSave
  ]);


  // ===============================
  // 🗑️ DELETE Y MOD RUTA
  // ===============================
  const markArchivoAsDeleted = useCallback(
    async (archInterno, newRelativePath) => {
      const dbOk = await checkDatabase();
      if (!dbOk) return false;

      await markArchivoDeletedLocal(archInterno, newRelativePath);
      await autoSyncArchivo(archInterno);

      return true;
    },
    [checkDatabase, autoSyncArchivo]
  );

  // ===============================
  // 🗑️ DELETE Y MOD RUTA
  // ===============================
  const deletedFile = useCallback(
    async (archInterno) => {
      const dbOk = await checkDatabase();
      if (!dbOk) return false;

      await deleteFileById(archInterno);
      await autoSyncArchivo(archInterno);

      return true;
    },
    [checkDatabase, autoSyncArchivo]
  );

  // ---------------- Obtener archivos por elemento y tipificación ----------------
  const fetchFilesByElementAndTypi = useCallback(
    async (idElement, typeElement, tipiInterno) => {
      const dbOk = await checkDatabase();
      if (!dbOk) return [];

      try {
        const archivos = await getFilesByElementAndTypi(idElement, typeElement, tipiInterno);
        return archivos;
      } catch (err) {
        console.error("❌ Error obteniendo archivos por tipificación:", err);
        return [];
      }
    },
    [checkDatabase]
  );

  // ---------------- Obtener TODOS los medios por Deficiencia ----------------
  const fetchMediosByDeficienciaId = useCallback(
    async (deficienciaId) => {
      const dbOk = await checkDatabase();
      if (!dbOk) return [];

      try {
        const medios = await getMediosByDeficienciaIdLocal(deficienciaId);
        return medios;
      } catch (err) {
        console.error(
          "❌ Error obteniendo medios por deficiencia:",
          err
        );
        return [];
      }
    },
    [checkDatabase]
  );


  return {
    getNextArchCodTabla: useCallback(() => getNextArchCodTablaLocal(), []),
    saveArchivoLocal,
    getArchivosByBasePath: useCallback(
      (basePathPrefix) => getArchivosByBasePathLocal(basePathPrefix),
      []
    ),
    markArchivoAsDeleted,
    fetchFilesByElementAndTypi,
    fetchMediosByDeficienciaId,
    deletedFile
  };
}
