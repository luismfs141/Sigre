

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

  // const deleteDeficiency = async (defiInterno) => {
  //   const dbOk = await checkDatabase();
  //   if (!dbOk) return false;

  //   try {
  //     const def = await getDeficiencyByIdLocal(defiInterno);
  //     //console.log(def);
  //     if (!def) return false;

  //     // 🔴 BORRADO LÓGICO SIEMPRE
  //     await deleteDeficiencyById(defiInterno);

  //     // 🔴 SOLO SI EXISTE EN SERVIDOR → SYNC
  //     if (def.DefiServerId) {
  //       console.log("🌐 Deficiencia existe en servidor, sincronizando eliminación...");
  //       await autoSyncDeficiency(defiInterno);
  //     } else {
  //       console.log("📱 Deficiencia solo local, no se sincroniza");
  //     }

  //     return true;

  //   } catch (err) {
  //     console.error("❌ Error eliminando deficiencia:", err);
  //     return false;
  //   }
  // };

  const deleteDeficiency = async (defiInterno) => {
    const dbOk = await checkDatabase();
    if (!dbOk) return false;

    try {
      const def = await getDeficiencyByIdLocal(defiInterno);
      if (!def) return false;

      // 🔴 BORRADO LÓGICO LOCAL SIEMPRE
      await deleteDeficiencyById(defiInterno);

      // 🌐 VALIDAR EN SERVIDOR (descargados + creados)
      const existeEnServidor = await checkDeficiencyOnServer(def);

      if (existeEnServidor) {
        console.log("🌐 Deficiencia existe en servidor, sincronizando eliminación...");
        await autoSyncDeficiency(defiInterno);
      } else {
        console.log("📱 Deficiencia no existe o no coincide en servidor, no se sincroniza");
      }

      return true;

    } catch (err) {
      console.error("❌ Error eliminando deficiencia:", err);
      return false;
    }
  };



  // ------------------- NORMALIZE PARA SYNC -------------------
  // const normalizeDeficiencyForSync = (def) => ({
  //   ...def,

  //   EstadoOffLine: Number(def.EstadoOffLine),
  //   DefiInspeccionado: Boolean(def.DefiInspeccionado),
  //   DefiActivo: def.DefiActivo !== null ? Boolean(def.DefiActivo) : true,
  //   DefiResponsable: def.DefiResponsable !== null ? Boolean(def.DefiResponsable) : false,
  //   DefiServerId: def.DefiServerId ?? null
  // });

  const normalizeDeficiencyForSync = (def) => ({
    ...def,

    DefiActivo: Boolean(def.DefiActivo),
    DefiInspeccionado: Boolean(def.DefiInspeccionado),
    DefiResponsable: Boolean(def.DefiResponsable),

    // 🔥 Fechas corregidas
    DefiFecRegistro: normalizeDate(def.DefiFecRegistro),
    DefiFecModificacion: normalizeDate(def.DefiFecModificacion),
    DefiFechaCreacion: normalizeDate(def.DefiFechaCreacion),
    DefiFechaDenuncia: normalizeDate(def.DefiFechaDenuncia),
    DefiFechaInspeccion: normalizeDate(def.DefiFechaInspeccion),
    DefiFechaSubsanacion: normalizeDate(def.DefiFechaSubsanacion),
  });


  // ------------------- AUTO SYNC -------------------


  const normalizeDate = (value) => {
    if (!value) return null;

    // Si ya tiene formato ISO con T, no tocar
    if (typeof value === "string" && value.includes("T")) return value;

    // Convierte "2026-01-15 09:31:31" -> "2026-01-15T09:31:31"
    if (typeof value === "string") {
      return value.replace(" ", "T");
    }

    return value;
  };

const autoSyncDeficiency = async (defiInternoLocal) => {
  console.log("🔄 [autoSyncDeficiency] Iniciado para ID:", defiInternoLocal);

  if (syncing) return;
  syncing = true;

  try {
    const online = await isOnline();
    if (!online) {
      console.log("📴 Sin conexión, no se sincroniza");
      return;
    }

    const pendientes = await getDeficienciesPendientes();
    console.log("📋 Pendientes:", pendientes);

    const def = pendientes.find(d =>
      (d.DefiInterno === defiInternoLocal || d.DefiServerId === defiInternoLocal) &&
      [1, 2, 3].includes(Number(d.EstadoOffLine))
    );

    if (!def) {
      console.log("⚠ No se encontró deficiencia pendiente para:", defiInternoLocal);
      return;
    }

    console.log("🧾 Deficiencia seleccionada para sync:", def);

    const normalized = normalizeDeficiencyForSync(def);
    console.log("📦 Payload normalizado:", normalized);

    const payload = [normalized];

    console.log("📤 Enviando payload a /Deficiency/SyncFromSQLite:");
    console.log(JSON.stringify(payload, null, 2));

    const response = await client.post(
      "/Deficiency/SyncFromSQLite",
      payload,
      { timeout: 15000 }
    );

    console.log("📥 Respuesta del servidor:", response.data);

    const map = response.data?.[0];
    if (!map) {
      console.log("⚠ Respuesta vacía del servidor");
      return;
    }

    if (map.localId !== map.serverId) {
      await updateDeficiencyIdAfterSync(map.localId, map.serverId);
    } else {
      await markDeficiencyAsSynced(map.serverId);
    }

  } catch (err) {
    console.error(
      "❌ [autoSyncDeficiency] Falló:",
      err?.response?.data || err.message
    );
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
      const rawDefs = await fetchDeficienciesForFlatList(elementId, typeElement);

      const flatListData = rawDefs.map(def => {
        const hasTypification = !!def.TipiInterno;

        return {
          id: def.DefiInterno,
          type: "def",
          defId: def.DefiInterno,

          // 🧠 Si NO tiene tipificación → es "Sin Deficiencia"
          name: hasTypification
            ? `${def.Code} → ${def.Component ?? "Sin descripción"}${
                def.DefiNumSuministro ? ` Suministro: ${def.DefiNumSuministro}` : ""
              }`
            : `0000 → ${def.Deficiency ?? "Sin Deficiencia"}`,

          data: {
            detail: def.Deficiency ?? "No se seleccionará ninguna deficiencia",
            elementId: def.DefiIdElemento,
            typeElement: def.DefiTipoElemento,

            // 🔹 Sin Deficiencia: no hay tipificación
            typificationId: def.TipiInterno ?? 0,
            typificationCode: def.Code ?? "0000",
            tableId: def.TablInterno ?? null,
            numSuministro: def.DefiNumSuministro
          },

          photos: [],
          audio: null
        };
      });

      return flatListData;
    } catch (error) {
      console.error("❌ Error fetching deficiencies for FlatList:", error);
      return [];
    }
  };


  // ------------------- VALIDAR EN SERVIDOR (DESCARGADOS + CREADOS) -------------------
  const checkDeficiencyOnServer = async (localDef) => {
    try {
      const online = await isOnline();
      if (!online) {
        console.log("📴 Sin conexión, no se valida en servidor");
        return false;
      }

      // 🔎 Determinar qué ID usar para consultar
      const serverId = localDef.DefiServerId || localDef.DefiInterno;

      if (!serverId) {
        console.log("⚠ No hay DefiInterno ni DefiServerId, no se puede validar");
        return false;
      }

      console.log("🌐 Consultando servidor por ID:", serverId);

      const response = await client.get("/Deficiency/GetById", {
        params: { x_defiInterno: serverId },
        timeout: 15000
      });

      const serverDef = response.data;

      if (!serverDef) {
        console.log("❌ No existe en servidor");
        return false;
      }

      // 🔎 Normalizar nombres de propiedades
      const serverCodigoElemento = serverDef.defiCodigoElemento ?? serverDef.DefiCodigoElemento;
      const serverTipiInterno = serverDef.tipiInterno ?? serverDef.TipiInterno;
      const serverInterno = serverDef.defiInterno ?? serverDef.DefiInterno;
      const serverActivo = serverDef.defiActivo ?? serverDef.DefiActivo;

      // 🔎 COMPARACIÓN DE CAMPOS CLAVE
      const isSame =
        (localDef.DefiServerId
          ? Number(serverInterno) === Number(localDef.DefiServerId)  // caso creado + sync
          : Number(serverInterno) === Number(localDef.DefiInterno)) && // caso descargado
        String(serverCodigoElemento).trim() === String(localDef.DefiCodigoElemento).trim() &&
        Number(serverTipiInterno) === Number(localDef.TipiInterno) &&
        Boolean(serverActivo) === true;

      if (!isSame) {
        console.log("⚠ Deficiencia encontrada pero NO coincide con los criterios:");
        console.log("Servidor:", serverDef);
        console.log("Local:", localDef);
        return false;
      }

      console.log("✅ Deficiencia válida y activa en servidor");
      return true;

    } catch (err) {
      if (err?.response?.status === 404) {
        console.log("❌ No existe en servidor (404)");
        return false;
      }

      console.error("❌ Error validando deficiencia en servidor:", err?.response?.data || err.message);
      return false;
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
