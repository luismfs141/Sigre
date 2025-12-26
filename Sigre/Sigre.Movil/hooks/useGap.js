// hooks/useGap.js
import { useState } from "react";
import { api } from "../config";
import { useConnectivity } from "./useConnectivity";

import {
  getGapsByFeederLocal,
  getGapsBySedLocal,
  getVanoByIdLocal,
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
      if (!online) {
        console.log("ℹ️ Auto-sync vano no realizada, queda offline");
        return;
      }

      const vano = await getVanoByIdLocal(vanoInternoLocal);
      if (!vano || vano.EstadoOffLine == null) return;

      const vanoToSync = normalizeVanoForSync(vano);

      console.log("📤 Payload vano sync:", JSON.stringify([vanoToSync], null, 2));

      const response = await client.post(
        "/Gap/SyncFromSQLite",
        [vanoToSync], // 🔥 ARRAY DIRECTO (uniforme)
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

      console.log("✅ Vano sincronizado correctamente");

    } catch (err) {
      if (err.response) {
        console.log("❌ Sync vano error:", err.response.status, err.response.data);
      } else if (err.request) {
        console.log("❌ Sin respuesta del servidor (vano)");
      } else {
        console.log("❌ Error vano:", err.message);
      }
    }
  };

  return {
    loading,
    error,
    fetchGapsByFeeder,
    fetchGapsBySed,
    saveVano,
    fetchVanoById,
  };
};
