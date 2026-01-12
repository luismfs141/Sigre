

import { useState } from "react";
import { api } from "../config";
import { useDatos } from "../context/DatosContext";
import {
  deleteDeficiencyById,
  fetchDeficienciesForFlatList,
  getDeficienciesByElement,
  getDeficienciesByElementAndTypi,
  getDeficienciesPendientes,
  getDeficiencyByIdLocal,
  getDeficiencyByTypificationElement,
  markDeficiencyAsSynced,
  saveOrUpdateDeficiency,
  updateDeficiencyIdAfterSync
} from "../database/offlineDB/deficiencies";
import { nowPeruISO } from "../utils/dateUtils";
import { useConnectivity } from "./useConnectivity";

export const useDeficiency = () => {
  const { checkDatabase } = useDatos();
  const { isOnline } = useConnectivity();
  const client = api();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  let syncing = false; // evita auto-sync simultáneo

  // ------------------- GET BY ID LOCAL -------------------
  const fetchDeficiencyByIdLocal = async (defiInterno) => {
    const dbOk = await checkDatabase();
    if (!dbOk) return null;

    try {
      const def = await getDeficiencyByIdLocal(defiInterno);
      return def ?? null;
    } catch (err) {
      console.error(
        "❌ Error obteniendo deficiencia por ID local:",
        err
      );
      return null;
    }
  };

  // ------------------- FETCH -------------------
  const fetchDeficiencyByTypificationElement = async (idElement, typeElement, idTypification) => {
    const dbOk = await checkDatabase();
    if (!dbOk) return [];

    try {
      return await getDeficiencyByTypificationElement(idElement, typeElement, idTypification);
    } catch (err) {
      console.error("❌ Error obteniendo deficiencias:", err);
      return [];
    }
  };

  // ------------------- NORMALIZAR -------------------
  // const normalizeDeficiencyBeforeSave = (deficiency, userId) => {
  //   const now = nowPeruISO();

  //   const isNew = !deficiency.DefiInterno;

  //   return {
  //     ...deficiency,
  //     ...(isNew && {
  //       DefiEstado: deficiency.DefiEstado || "N",
  //       DefiFechaCreacion: now,
  //       DefiFecRegistro: now,
  //       DefiUsuarioInic: userId,
  //       DefiLatitud: deficiency.DefiLatitud ?? 0,
  //       DefiLongitud: deficiency.DefiLongitud ?? 0,
  //       DefiInspeccionado: deficiency.DefiInspeccionado ?? 1,
  //     }),
  //     DefiUsuarioMod: userId,
  //     DefiFecModificacion: now
  //   };
  // };
  const normalizeDeficiencyBeforeSave = (deficiency, userId) => {
    const now = nowPeruISO();
    const isNew = !deficiency.DefiInterno;

    return {
      ...deficiency,

      // ✅ defaults para las nuevas columnas
      DefiAccesibilidad: deficiency.DefiAccesibilidad ?? "",
      DefiTipoCruce: deficiency.DefiTipoCruce ?? "",

      ...(isNew && {
        DefiEstado: deficiency.DefiEstado || "N",
        DefiFechaCreacion: now,
        DefiFecRegistro: now,
        DefiUsuarioInic: userId,
        DefiLatitud: deficiency.DefiLatitud ?? 0,
        DefiLongitud: deficiency.DefiLongitud ?? 0,
        DefiInspeccionado: deficiency.DefiInspeccionado ?? 1,
      }),
      DefiUsuarioMod: userId,
      DefiFecModificacion: now
    };
  };


  // ------------------- SAVE + AUTO SYNC -------------------
  const saveDeficiency = async (deficiency, userId) => {
    const dbOk = await checkDatabase();
    if (!dbOk) return null;

    try {
      const normalized = normalizeDeficiencyBeforeSave(deficiency, userId);
      const localId = await saveOrUpdateDeficiency(normalized);

      console.log("✅ Deficiencia guardada con ID local:", localId);

      // Iniciar auto-sync
      if (localId) {
        console.log("🔄 Iniciando auto-sync para ID:", localId);
        await autoSyncDeficiency(localId);
      }

      return localId;
    } catch (err) {
      console.error("❌ Error guardando deficiencia:", err);
      return null;
    }
  };

  // ------------------- DELETE -------------------

  const deleteDeficiency = async (defiInterno) => {
    const dbOk = await checkDatabase();
    if (!dbOk) return false;

    try {
      const def = await getDeficiencyByIdLocal(defiInterno);
      console.log(def);
      if (!def) return false;

      // 🔴 BORRADO LÓGICO SIEMPRE
      await deleteDeficiencyById(defiInterno);

      // 🔴 SOLO SI EXISTE EN SERVIDOR → SYNC
      if (def.DefiServerId) {
        console.log("🌐 Deficiencia existe en servidor, sincronizando eliminación...");
        await autoSyncDeficiency(defiInterno);
      } else {
        console.log("📱 Deficiencia solo local, no se sincroniza");
      }

      return true;

    } catch (err) {
      console.error("❌ Error eliminando deficiencia:", err);
      return false;
    }
  };


  // ------------------- NORMALIZE PARA SYNC -------------------
  const normalizeDeficiencyForSync = (def) => ({
    ...def,

    EstadoOffLine: Number(def.EstadoOffLine),
    DefiInspeccionado: Boolean(def.DefiInspeccionado),
    DefiActivo: def.DefiActivo !== null ? Boolean(def.DefiActivo) : true,
    DefiResponsable: def.DefiResponsable !== null ? Boolean(def.DefiResponsable) : false,
    DefiServerId: def.DefiServerId ?? null
  });

  // ------------------- AUTO SYNC -------------------
  const autoSyncDeficiency = async (defiInternoLocal) => {



    console.log("🔄 [autoSyncDeficiency] Iniciado para ID:", defiInternoLocal);

    if (syncing) return;
    syncing = true;

    try {
      const online = await isOnline();
      if (!online) return;

      const pendientes = await getDeficienciesPendientes();

      const def = pendientes.find(d =>
        (d.DefiInterno === defiInternoLocal || d.DefiServerId === defiInternoLocal) &&
        [1, 2, 3].includes(Number(d.EstadoOffLine)) // 🔴 FIX
      );



      if (!def) return;
      const payload = [normalizeDeficiencyForSync(def)];
      const response = await client.post(
        "/Deficiency/SyncFromSQLite",
        payload,
        { timeout: 15000 }
      );


      // if (!def) return;

      // const payload = [normalizeDeficiencyForSync(def)];

      // // ✅ LOG CHICO: lo que te interesa validar
      // console.log("📤 SYNC campos clave:", {
      //   DefiInterno: payload[0].DefiInterno,
      //   DefiServerId: payload[0].DefiServerId,
      //   EstadoOffLine: payload[0].EstadoOffLine,

      //   DefiComentario: payload[0].DefiComentario,
      //   DefiDistVertical: payload[0].DefiDistVertical,
      //   DefiNumSuministro: payload[0].DefiNumSuministro,

      //   DefiAccesibilidad: payload[0].DefiAccesibilidad,
      //   DefiTipoCruce: payload[0].DefiTipoCruce,

      //   DefiFecRegistro: payload[0].DefiFecRegistro,
      //   DefiFecModificacion: payload[0].DefiFecModificacion,
      //   DefiFechaCreacion: payload[0].DefiFechaCreacion,
      // });

      // // ✅ LOG GRANDE: payload completo (por si falta un campo)
      // console.log("📤 SYNC payload JSON:", JSON.stringify(payload, null, 2));

      // const response = await client.post(
      //   "/Deficiency/SyncFromSQLite",
      //   payload,
      //   { timeout: 15000 }
      // );











      const map = response.data?.[0];
      if (!map) return;

      if (map.localId !== map.serverId) {
        await updateDeficiencyIdAfterSync(map.localId, map.serverId);
      } else {
        await markDeficiencyAsSynced(map.serverId);
      }

    } catch (err) {
      console.error("❌ [autoSyncDeficiency] Falló:", err?.response?.data || err.message);
    } finally {
      syncing = false;
    }
  };








  // ------------------- SYNC MASIVO -------------------
  const syncAllDeficiencies = async () => {
    const online = await isOnline();
    if (!online) return { ok: false };

    try {
      const pendientes = await getDeficienciesPendientes();
      if (!pendientes.length) return { ok: true, synced: 0 };

      const payload = pendientes
        .filter(d => [1, 2, 3].includes(Number(d.EstadoOffLine)))
        .map(normalizeDeficiencyForSync);
      if (!payload.length) return { ok: true, synced: 0 };

      const response = await client.post("/Deficiency/SyncFromSQLite", payload, { timeout: 15000 });

      for (const map of response.data) {
        if (map.localId !== map.serverId) {
          await updateDeficiencyIdAfterSync(map.localId, map.serverId);
        } else {
          await markDeficiencyAsSynced(map.serverId);
        }
      }

      return { ok: true, synced: response.data.length };

    } catch (err) {
      console.log("❌ Sync masivo deficiencias falló:", err?.response?.data || err.message);
      return { ok: false };
    }

  };

  const fetchDeficienciesByElementAndTypi = async (idElement, typeElement, tipiInterno) => {
    const dbOk = await checkDatabase();
    if (!dbOk) return [];

    try {
      const deficiencias = await getDeficienciesByElementAndTypi(
        idElement,
        typeElement,
        tipiInterno
      );
      return deficiencias;
    } catch (err) {
      console.error("❌ Error obteniendo deficiencias por tipificación:", err);
      return [];
    }
  };

  const fetchDeficienciesByElement = async (idElement, typeElement) => {
    const dbOk = await checkDatabase();
    if (!dbOk) return [];

    try {
      const deficiencias = await getDeficienciesByElement(
        idElement,
        typeElement
      );
      return deficiencias;
    } catch (err) {
      console.error("❌ Error obteniendo deficiencias:", err);
      return [];
    }
  };

  const deficienciesForFlatList = async (elementId, typeElement) => {
    const dbOk = await checkDatabase();
    if (!dbOk) return [];

    try {
      // Obtener deficiencias desde la base de datos usando el hook
      const rawDefs = await fetchDeficienciesForFlatList(elementId, typeElement);
      // Normalizar datos para FlatList
      const flatListData = rawDefs.map(def => ({
        id: def.DefiInterno, // asegurarse que siempre haya id
        type: "def",
        defId: def.DefiInterno, // id de la deficiencia
        name: `${def.Code} → ${def.Component ?? "Sin descripción"}${def.DefiNumSuministro ? ` Suministro: ${def.DefiNumSuministro}` : ""}`,
        data: {
          detail: def.Deficiency ?? "",
          elementId: def.DefiIdElemento,
          typeElement: def.DefiTipoElemento,
          typificationId: def.TipiInterno,
          typificationCode: def.Code,
          tableId: def.TablInterno,
          numSuministro: def.DefiNumSuministro
        },
        photos: [],
        audio: null
      }));

      return flatListData;
    } catch (error) {
      console.error("❌ Error fetching deficiencies for FlatList:", error);
      return [];
    }
  };


  return {
    loading,
    error,
    fetchDeficiencyByTypificationElement,
    saveDeficiency,
    deleteDeficiency,
    syncAllDeficiencies,
    autoSyncDeficiency,
    fetchDeficienciesByElementAndTypi,
    fetchDeficienciesByElement,
    deficienciesForFlatList,
    fetchDeficiencyByIdLocal
  };
};
