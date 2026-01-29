

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
  updateDeficiencyIdAfterSync,
  updateDefiInspeccionadoLocal
} from "../database/offlineDB/deficiencies";
import {
  getPinInspeccionadoByIdOriginalLocal,
  updatePinInspeccionadoByIdOriginalLocal,
} from "../database/offlineDB/pins";
import { nowPeruISO } from "../utils/dateUtils";
import { useConnectivity } from "./useConnectivity";

export const useDeficiency = () => {
  const { checkDatabase, isAdmin, isSupervisor, isInspector, currentUserId } = useDatos();
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
  }

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
        DefiInspeccionado: deficiency.DefiInspeccionado ?? 0,
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

      // ✅ PERMISOS
      const privileged = isAdmin || isSupervisor;

      if (!privileged) {
        // inspector (u otros) solo si es dueño
        const owner = def.DefiUsuarioInic;
        const me = currentUserId;

        const isOwner =
          owner != null &&
          me != null &&
          String(owner).trim() === String(me).trim();

        if (!isOwner) {
          console.log("⛔ No permitido: inspector intentando eliminar deficiencia de otro usuario");
          return false;
        }
      }

      // 🔴 BORRADO LÓGICO LOCAL
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
      const ok = map?.ok !== false; // por compatibilidad: si no viene ok, asumimos true
      if (!ok) {
        console.log("⛔ Sync rechazado por servidor:", map?.error || "Sin detalle");
        return;
      }


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
        const ok = map?.ok !== false;
        if (!ok) {
          console.log("⛔ Sync rechazado:", map?.error || "Sin detalle", map);
          continue;
        }

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

      const contadorPorCode = {};

      const flatListData = rawDefs.map((def, idx) => {
        const hasTypification = !!def.TipiInterno;
        const code = String(def.Code ?? "0000").trim();

        // ✅ contador por tipificación (7004 #1, 7004 #2, etc.)
        contadorPorCode[code] = (contadorPorCode[code] ?? 0) + 1;
        const nroEnCodigo = contadorPorCode[code];

        return {
          id: def.DefiInterno,
          type: "def",
          defId: def.DefiInterno,

          // ✅ ORDEN GENERAL en la lista (1,2,3…)
          order: idx + 1,

          // ✅ ORDEN dentro del mismo código (7004 #1, #2…)
          orderInCode: nroEnCodigo,

          name: hasTypification
            ? `${def.Code} → ${def.Component ?? "Sin descripción"}${def.DefiNumSuministro ? `\nSuministro: ${def.DefiNumSuministro}` : ""
            }`
            : `0000 → ${def.Deficiency ?? "Sin Deficiencia"}`,

          data: {
            detail: def.Deficiency ?? "No se seleccionará ninguna deficiencia",
            elementId: def.DefiIdElemento,
            typeElement: def.DefiTipoElemento,
            typificationId: def.TipiInterno ?? 0,
            typificationCode: def.Code ?? "0000",
            tableId: def.TablInterno ?? null,
            numSuministro: def.DefiNumSuministro,

            observacion: def.DefiObservacion ?? "",
            comentario: def.DefiComentario ?? "",
            distVertical: def.DefiDistVertical ?? 0,
            distHorizontal: def.DefiDistHorizontal ?? 0,

            infoTipificacion: def.Code ?? "0000",
            infoDeficiencia: def.Deficiency ?? "",
            infoDescripcion: (def.Typification ?? def.Component) ?? "",

            // ✅ NUEVO
            ownerUserId: def.DefiUsuarioInic ?? null,
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




  // ✅ Setea DefiInspeccionado (validaciones post-guardar/finalizar)
  async function setDefiInspeccionadoLocal(defiInterno, inspeccionado) {
    const dbOk = await checkDatabase();
    if (!dbOk) return false;

    return await updateDefiInspeccionadoLocal(defiInterno, inspeccionado);
  }

  // ✅ Recalcula Pines.Inspeccionado para POSTE según el estado de TODAS sus deficiencias activas
  async function recalcularPinInspeccionadoParaPoste(postId) {
    const dbOk = await checkDatabase();
    if (!dbOk) return { ok: false };

    const previo = await getPinInspeccionadoByIdOriginalLocal(postId);

    const defs = await getDeficienciesByElement(postId, "POST");
    const todasInspeccionadas =
      defs?.length > 0 &&
      defs.every((d) => Number(d?.DefiInspeccionado) === 1);

    const nuevo = todasInspeccionadas ? 1 : 0;
    const ok = await updatePinInspeccionadoByIdOriginalLocal(postId, nuevo);

    return {
      ok,
      previo,
      nuevo,
      totalDeficiencias: defs?.length ?? 0,
    }

  }

  return {
    loading,
    error,
    fetchDeficiencyByTypificationElement,
    setDefiInspeccionadoLocal,
    recalcularPinInspeccionadoParaPoste,
    saveDeficiency,
    deleteDeficiency,
    syncAllDeficiencies,
    autoSyncDeficiency,
    fetchDeficienciesByElementAndTypi,
    fetchDeficienciesByElement,
    deficienciesForFlatList,
    fetchDeficiencyByIdLocal
  }

};
