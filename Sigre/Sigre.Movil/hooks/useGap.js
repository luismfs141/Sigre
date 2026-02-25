// hooks/useGap.js
import { useState } from "react";
import { api } from "../config";
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

export const useGap = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isOnline } = useConnectivity();
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

    // INT
    EstadoOffLine: Number(vano.EstadoOffLine ?? 1),
    AlimInterno: Number(vano.AlimInterno),

    // BOOL
    VanoTerceros: Boolean(vano.VanoTerceros),
    VanoInspeccionado: Boolean(vano.VanoInspeccionado),
    VanoEsMt: Boolean(vano.VanoEsMt),
    VanoEsBt: Boolean(vano.VanoEsBt),

    // Limpieza
    VanoSubestacion: vano.VanoSubestacion ?? null,
  });

  // ------------------- AUTO-SYNC DE UN VANO -------------------
  const autoSyncVano = async (vanoInternoLocal) => {
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
  const syncAllGaps = async () => {
    const online = await isOnline();
    if (!online) return { ok: false };

    try {
      const pendientes = await getVanosPendientes();
      if (!pendientes.length) return { ok: true, synced: 0 };

      const aSincronizar = pendientes.filter((d) => [1, 2, 3, 4].includes(Number(d?.EstadoOffLine)));
      if (!aSincronizar.length) return { ok: true, synced: 0 };

      // 🔹 Normalizar TODAS
      const payload = aSincronizar.map((v) => normalizeVanoForSync(v));

      const response = await client.post("/Gap/SyncFromSQLite", payload, { timeout: 20000 });

      const respList = Array.isArray(response.data) ? response.data : [];
      let syncedCount = 0;

      for (const r of respList) {
        if (!r?.localId || !r?.serverId) {
          console.warn("⚠ Respuesta inválida:", r);
          continue;
        }

        await updateVanoIdAfterSync(r.localId, r.serverId);
        syncedCount++;
      }

      return { ok: true, synced: syncedCount };
    } catch (err) {
      console.error("❌ Sync masivo deficiencias falló:", err?.response?.data || err?.message || err);
      return { ok: false };
    }
  };

  const countPendingGapsLocal = async () => {
    const dbOk = await checkDatabase();
    if (!dbOk) return 0;

    try {
      const pendientes = await getVanosPendientes();
      if (!Array.isArray(pendientes) || !pendientes.length) return 0;

      // mismo criterio que usas para sincronizar
      return pendientes.filter((d) =>
        [1, 2, 3, 4].includes(Number(d?.EstadoOffLine))
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
