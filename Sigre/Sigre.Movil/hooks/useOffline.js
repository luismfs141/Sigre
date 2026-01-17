import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import { useState } from "react";
import { api } from "../config";
import { useDatos } from "../context/DatosContext";
import { useConnectivity } from "./useConnectivity";

// ======================= DEFICIENCIAS =======================
import {
  getDeficienciesPendientesReanudables,
  markDeficiencyAsSynced,
  updateDeficiencyIdAfterSync
} from "../database/offlineDB/deficiencies";

// ======================= ARCHIVOS ===========================
import {
  getArchivosPendientes,
  markArchivoAsSynced,
  updateArchivoIdAfterSync
} from "../database/offlineDB/files";

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

  // 🧠 normalización backend .NET
  ArchActivo: toBooleanOrNull(a.ArchActivo),
  ArchPrincipal: toBooleanOrNull(a.ArchPrincipal),
  ArchFecRegistro: toIsoDate(a.ArchFecRegistro),
  ArchFecModificacion: toIsoDate(a.ArchFecModificacion),
});

/* ==========================================================
   🪝 HOOK
========================================================== */
export const useOffline = () => {
  const { setNewDatabase } = useDatos();
  const { isOnline } = useConnectivity();
  const [downloading, setDownloading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const client = api();

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

    try {
      ensureOnline();

      /* ==========================================================
         1️⃣ PRECARGA GLOBAL
      ========================================================== */
      const deficiencias = await getDeficienciesPendientesReanudables();
      const archivos = await getArchivosPendientes();

      console.log("📦 Deficiencias pendientes:", deficiencias.length);
      console.log("📁 Archivos pendientes:", archivos.length);

      let totalSynced = 0;

      /* ==========================================================
         2️⃣ ITERACIÓN POR DEFICIENCIA
      ========================================================== */
      for (const def of deficiencias) {
        try {
          ensureOnline();

          console.log("🔄 Sync deficiencia:", def.DefiInterno);

          /* ------------------------------------------------------
             2.1 Archivos de esta deficiencia
          ------------------------------------------------------ */
          const archivosDef = archivos.filter(
            a => a.ArchCodTabla === def.DefiInterno
          );

          /* ------------------------------------------------------
             2.2 Subir DEFICIENCIA
          ------------------------------------------------------ */
          const response = await client.post(
            "/Deficiency/SyncFromSQLite",
            [normalizeDeficiencyForSync(def)],
            { timeout: 15000 }
          );

          let serverDefiId = def.DefiInterno;

          if (Array.isArray(response.data) && response.data.length > 0) {
            const map = response.data[0];

            if (map.localId && map.serverId && map.localId !== map.serverId) {
              await updateDeficiencyIdAfterSync(map.localId, map.serverId);
              serverDefiId = map.serverId;
            }
          }

          /* ------------------------------------------------------
             2.3 Subir ARCHIVOS
          ------------------------------------------------------ */
          if (archivosDef.length > 0) {
            const archivosPayload = archivosDef.map(a =>
              normalizeArchivoForSync(a, serverDefiId)
            );

            await client.post(
              "/File/SyncFromSQLite",
              archivosPayload,
              { timeout: 30000 }
            );

            for (const a of archivosDef) {
              await updateArchivoIdAfterSync(a.ArchInterno, serverDefiId);
              await markArchivoAsSynced(a.ArchInterno);
            }
          }

          /* ------------------------------------------------------
             2.4 CIERRE TRANSACCIONAL
          ------------------------------------------------------ */
          await markDeficiencyAsSynced(serverDefiId);
          totalSynced++;

        } catch (err) {
          console.log(
            `❌ Error en deficiencia ${def.DefiInterno}`,
            err?.response?.data || err.message
          );
          break; // ⛔ reanudable
        }
      }

      return { ok: true, synced: totalSynced };

    } catch (err) {
      console.log("❌ Sync general falló:", err.message);
      return { ok: false };
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
