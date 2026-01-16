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

const toNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export function useFiles() {
  const { checkDatabase } = useDatos();
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

      // ✅ OBLIGATORIO: el backend lo espera como STRING
      ArchTipo: String(arch.ArchTipo),

      //ArchNombre: arch.ArchNombre,------------------------------------------------------------------------------------------------- modi
      ArchNombre: arch.ArchNombre ?? arch.ARCH_NOMBRE ?? arch.archNombre ?? null,

      ArchLatitud: arch.ArchLatitud ?? null,
      ArchLongitud: arch.ArchLongitud ?? null,

      // ✅ robusto
      ArchFecha: arch.ArchFecha
        ? String(arch.ArchFecha).replace(" ", "T")
        : nowPeruISO(),

      ArchTipoElemento: arch.ArchTipoElemento ?? null,
      ArchIdElemento: arch.ArchIdElemento ?? null,
      TipiInterno: arch.TipiInterno ?? null,

      DefiServerId: arch.DefiServerId ?? null,

      // ✅ boolean REAL (no Boolean("0"))
      ArchActivo: activoNum === 1,

      EstadoOffLine: toNum(arch.EstadoOffLine ?? 0, 0),
    };
  };

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
        [1, 2, 3].includes(toNum(a.EstadoOffLine))
      );

      if (!arch) return;

      const payload = [normalizeArchivoForSync(arch)];
      //console.log("📤 Payload:", payload);

console.log("🧾 ArchNombre a sincronizar:", arch.ArchNombre);
console.log("🧾 EstadoOffLine a sincronizar:", arch.EstadoOffLine);



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
  // 💾 SAVE / UPDATE (SQLite)
  // ===============================
  const saveArchivoLocal = useCallback(async (data) => {
    const dbOk = await checkDatabase();
    if (!dbOk) return null;

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

      // ✅ 0/1 numérico en SQLite (tu Multimedia manda "0")
      ArchActivo: normalized.archActiv,

      // ✅ evita nulls raros
      EstadoOffLine: data.EstadoOffLine ?? 1,
      DefiServerId: data.DefiServerId ?? null
    };

    console.log("💾 saveOrUpdateArchivoLocal:", archivoForDB);

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

  return {
    getNextArchCodTabla: useCallback(() => getNextArchCodTablaLocal(), []),
    saveArchivoLocal,
    getArchivosByBasePath: useCallback((basePathPrefix) => getArchivosByBasePathLocal(basePathPrefix), []),
    markArchivoAsDeleted,
    fetchFilesByElementAndTypi,
    fetchMediosByDeficienciaId,
    deletedFile
  };
}
