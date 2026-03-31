// hooks/useGap.js
import { useState } from "react";
import { api } from "../config";
import { useDatos } from "../context/DatosContext";
import { useConnectivity } from "./useConnectivity";

import {
  getGapsByFeederLocal,
  getGapsBySedLocal,
  getVanoByIdLocal,
  getVanosPendientes,
  markVanoAsSynced,
  saveOrUpdateVano,
  updateVanoIdAfterSync
} from "../database/offlineDB/gaps";


const GAP_SYNC_BATCH_SIZE = 100;

const chunkArray = (items, size) => {
  if (!Array.isArray(items) || !items.length) return [];
  if (!Number.isFinite(size) || size <= 0) return [items];

  const chunks = [];

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }

  return chunks;
};


export const useGap = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isOnline } = useConnectivity();
  const { checkDatabase, isAutoSyncOnline } = useDatos();
  const client = api();

  // ------------------- GAPS POR ALIMENTADOR -------------------
  const fetchGapsByFeeder = async (feederId) => {
    setLoading(true);
    setError(null);
    try {
      return await getGapsByFeederLocal(feederId);
    } catch (err) {
      console.error("❌ Error cargando gaps por feeder:", err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // ------------------- GAPS POR SED -------------------
  const fetchGapsBySed = async (sedId) => {
    setLoading(true);
    setError(null);
    try {
      return await getGapsBySedLocal(sedId);
    } catch (err) {
      console.error("❌ Error cargando gaps por SED:", err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // ------------------- GUARDAR + AUTO-SYNC -------------------
  const saveVano = async (vano) => {
    setLoading(true);
    setError(null);
    try {
      const localId = await saveOrUpdateVano(vano);

      // 🔥 AUTO-SYNC (igual que Post)
      if (localId) autoSyncVano(localId);

      return localId;
    } catch (err) {
      console.error("❌ Error guardando vano:", err);
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ------------------- OBTENER VANO -------------------
  const fetchVanoById = async (vanoInterno) => {
    setLoading(true);
    setError(null);
    try {
      return await getVanoByIdLocal(vanoInterno);
    } catch (err) {
      console.error("❌ Error cargando vano:", err);
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ------------------- NORMALIZAR -------------------
  const normalizeVanoForSync = (vano) => ({
    ...vano,

    VanoInterno: vano?.VanoInterno != null ? Number(vano.VanoInterno) : null,
    VanoInternoLocal: vano?.VanoInterno != null ? Number(vano.VanoInterno) : 0,

    EstadoOffLine:
      vano?.EstadoOffLine === "" || vano?.EstadoOffLine == null || Number(vano?.EstadoOffLine) === 0
        ? 1
        : Number(vano.EstadoOffLine),

    AlimInterno: Number(vano?.AlimInterno),

    VanoTerceros: vano?.VanoTerceros === true || Number(vano?.VanoTerceros) === 1,
    VanoInspeccionado: vano?.VanoInspeccionado === true || Number(vano?.VanoInspeccionado) === 1,
    VanoEsMt: vano?.VanoEsMt === true || Number(vano?.VanoEsMt) === 1,
    VanoEsBt: vano?.VanoEsBt === true || Number(vano?.VanoEsBt) === 1,

    VanoSubestacion:
      vano?.VanoSubestacion != null && vano?.VanoSubestacion !== ""
        ? Number(vano.VanoSubestacion)
        : null,
  });

  // ------------------- AUTO-SYNC DE UN VANO -------------------
  const autoSyncVano = async (vanoInternoLocal) => {
    if (!isAutoSyncOnline) return;

    const dbOk = await checkDatabase();
    if (!dbOk) return;

    try {
      const online = await isOnline();
      if (!online) return;

      const vano = await getVanoByIdLocal(vanoInternoLocal);
      if (!vano || vano.EstadoOffLine == null) return;

      const vanoToSync = normalizeVanoForSync(vano);

      //console.log("📤 Sincronización Update de Vano");

      const response = await client.post(
        "/Gap/SyncFromSQLite",
        [vanoToSync],
        { timeout: 6000 }
      );

      const result = response.data;
      if (!Array.isArray(result) || !result.length) return;

      const { localId, serverId } = result[0];

      if (localId !== serverId) {
        await updateVanoIdAfterSync(localId, serverId);
      } else {
        await markVanoAsSynced(serverId);
      }
    } catch (err) {
      // sin logs
    }
  };

  // ------------------- SYNC MASIVO (robusto + compatible) -------------------
  const syncAllGaps = async (onProgress) => {
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

      const pendientes = await getVanosPendientes();
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

      const lotes = chunkArray(aSincronizar, GAP_SYNC_BATCH_SIZE);

      for (let i = 0; i < lotes.length; i++) {
        const lote = lotes[i];

        onProgress?.({
          stage: "vanos",
          currentBatch: i + 1,
          totalBatches: lotes.length,
          batchSize: lote.length,
          totalRecords: total,
          syncedRecords: synced,
        });

        const payload = lote.map((v) => normalizeVanoForSync(v));

        const response = await client.post("/Gap/SyncFromSQLite", payload, {
          timeout: 30000,
        });

        const respList = Array.isArray(response.data) ? response.data : [];

        if (respList.length !== lote.length) {
          throw new Error(
            `GAP_SYNC_PARTIAL_RESPONSE: lote=${i + 1}, enviados=${lote.length}, respondidos=${respList.length}`
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
            throw new Error(`GAP_SYNC_INVALID_MAPPING: ${JSON.stringify(r)}`);
          }
        }

        for (const r of respList) {
          const localId = Number(r.localId);
          const serverId = Number(r.serverId);

          if (localId !== serverId) {
            await updateVanoIdAfterSync(localId, serverId);
          } else {
            await markVanoAsSynced(serverId);
          }
        }

        synced += lote.length;
      }

      return { ok: true, total, synced };
    } catch (err) {
      console.error("❌ Sync masivo vanos falló:", err?.response?.data || err?.message || err);
      return {
        ok: false,
        total,
        synced,
        error: err?.response?.data?.message || err?.message || "GAP_SYNC_FAILED",
      };
    }
  };

  const countPendingGapsLocal = async () => {
    const dbOk = await checkDatabase();
    if (!dbOk) return 0;

    try {
      const pendientes = await getVanosPendientes();
      if (!Array.isArray(pendientes) || !pendientes.length) return 0;

      return pendientes.filter((d) =>
        [1, 2, 3].includes(Number(d?.EstadoOffLine))
      ).length;
    } catch (err) {
      console.error("❌ Error contando vanos pendientes:", err);
      return 0;
    }
  };

  return {
    loading,
    error,
    fetchGapsByFeeder,
    fetchGapsBySed,
    saveVano,
    fetchVanoById,
    syncAllGaps,
    countPendingGapsLocal
  };
};
