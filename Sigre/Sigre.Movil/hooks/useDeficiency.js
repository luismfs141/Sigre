import { useRef, useState } from "react";
import uuid from "react-native-uuid";
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
  saveOrUpdateDeficiency,
  updateDefiInspeccionadoLocal,
} from "../database/offlineDB/deficiencies";
import {
  getPinInspeccionadoByIdOriginalLocal,
  updatePinInspeccionadoByIdOriginalLocal,
} from "../database/offlineDB/pins";
import { nowPeruISO } from "../utils/dateUtils";
import { useConnectivity } from "./useConnectivity";

export const useDeficiency = () => {
  const {
    checkDatabase,
    isAdmin,
    isSupervisor,
    isInspector, // (puede quedar aunque no lo uses)
    currentUserId,
  } = useDatos();

  const { isOnline } = useConnectivity();
  const client = api();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Evita auto-sync simultáneo (persistente entre renders)
  const syncingRef = useRef(false);

  // ✅ Acceso dinámico a exports (para que compile aunque en tu módulo existan o no)
  const deficienciesDb = require("../database/offlineDB/deficiencies");
  const safeCall = async (fnName, ...args) => {
    const fn = deficienciesDb?.[fnName];
    if (typeof fn === "function") return await fn(...args);
    return undefined;
  };

  const generateUUID = () => uuid.v4();

  // ------------------- NORMALIZAR FECHAS -------------------
  const normalizeDate = (value) => {
    if (value === null || value === undefined || value === "") return null;

    // Si viene como número (timestamp)
    if (typeof value === "number") {
      const ms = value > 1e12 ? value : value * 1000; // heurística ms/seg
      const d = new Date(ms);
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    }

    if (typeof value !== "string") return null;

    let s = value.trim();
    if (!s) return null;

    // "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DDTHH:mm:ss"
    if (s.includes(" ") && !s.includes("T")) s = s.replace(" ", "T");

    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return null;

    return d.toISOString();
  };

  // ------------------- GET BY ID LOCAL -------------------
  const fetchDeficiencyByIdLocal = async (defiInterno) => {
    const dbOk = await checkDatabase();
    if (!dbOk) return null;

    try {
      const def = await getDeficiencyByIdLocal(defiInterno);
      return def ?? null;
    } catch (err) {
      console.error("❌ Error obteniendo deficiencia por ID local:", err);
      return null;
    }
  };

  // ------------------- FETCH -------------------
  const fetchDeficiencyByTypificationElement = async (
    idElement,
    typeElement,
    idTypification
  ) => {
    const dbOk = await checkDatabase();
    if (!dbOk) return [];

    try {
      return await getDeficiencyByTypificationElement(
        idElement,
        typeElement,
        idTypification
      );
    } catch (err) {
      console.error("❌ Error obteniendo deficiencias:", err);
      return [];
    }
  };

  // ------------------- NORMALIZAR ANTES DE GUARDAR -------------------
  const normalizeDeficiencyBeforeSave = (deficiency, userId) => {
    const now = nowPeruISO?.() ?? new Date().toISOString();
    const isNew = !deficiency?.DefiInterno;

    return {
      ...deficiency,

      // ✅ defaults para columnas nuevas
      DefiCol3: deficiency?.DefiCol3 ?? generateUUID(),
      DefiAccesibilidad: deficiency?.DefiAccesibilidad ?? "",
      DefiTipoCruce: deficiency?.DefiTipoCruce ?? "",

      ...(isNew && {
        DefiEstado: deficiency?.DefiEstado || "N",
        DefiFechaCreacion: now,
        DefiFecRegistro: now,
        DefiUsuarioInic: userId,
        DefiLatitud: deficiency?.DefiLatitud ?? 0,
        DefiLongitud: deficiency?.DefiLongitud ?? 0,
        DefiInspeccionado: deficiency?.DefiInspeccionado ?? 0,
      }),

      DefiUsuarioMod: userId,
      DefiFecModificacion: now,
    };
  };

  // ------------------- NORMALIZE PARA SYNC -------------------
  const normalizeDeficiencyForSync = (def) => {
    const nowIso = new Date().toISOString();

    const fecRegistro =
      normalizeDate(def?.DefiFecRegistro) ||
      normalizeDate(def?.DefiFechaCreacion) ||
      nowIso;

    const fecMod = normalizeDate(def?.DefiFecModificacion) || nowIso;

    return {
      ...def,

      // 🔹 STRINGS (compatibilidad server)
      DefiUsuarioInic: def?.DefiUsuarioInic != null ? String(def.DefiUsuarioInic) : null,
      DefiUsuarioMod: def?.DefiUsuarioMod != null ? String(def.DefiUsuarioMod) : null,
      DefiUsuCre: def?.DefiUsuCre != null ? String(def.DefiUsuCre) : null,
      DefiUsuNpc: def?.DefiUsuNpc != null ? String(def.DefiUsuNpc) : null,

      DefiObservacion: def?.DefiObservacion ?? "",
      DefiComentario: def?.DefiComentario ?? "",

      // 🔹 BOOLEANS
      DefiActivo: Boolean(def?.DefiActivo),
      DefiInspeccionado: Boolean(def?.DefiInspeccionado),
      DefiResponsable: Boolean(def?.DefiResponsable),

      // 🔹 FECHAS ISO
      DefiFecRegistro: fecRegistro,
      DefiFecModificacion: fecMod,
      DefiFechaCreacion: normalizeDate(def?.DefiFechaCreacion) || nowIso,
      DefiFechaDenuncia: normalizeDate(def?.DefiFechaDenuncia),
      DefiFechaInspeccion: normalizeDate(def?.DefiFechaInspeccion),
      DefiFechaSubsanacion: normalizeDate(def?.DefiFechaSubsanacion),

      // 🔹 IDENTIFICADOR ÚNICO
      DefiCol3: def?.DefiCol3 ?? null,
    };
  };

  // ------------------- AUTO SYNC (robusto + compatible) -------------------
  const autoSyncDeficiency = async (defOrId) => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    try {
      const online = await isOnline();
      if (!online) {
        console.log("📴 Sin conexión, no se sincroniza");
        return;
      }

      // ✅ Acepta ID o objeto
      let def = defOrId;

      if (typeof defOrId === "number" || typeof defOrId === "string") {
        const id = Number(defOrId);

        // 1) Intentar desde pendientes (mejor, porque trae EstadoOffLine y campos listos)
        const pendientes = await getDeficienciesPendientes();
        def =
          pendientes.find(
            (d) =>
              (Number(d?.DefiInterno) === id || Number(d?.DefiServerId) === id) &&
              [1, 2, 3, 4].includes(Number(d?.EstadoOffLine))
          ) ?? null;

        // 2) Fallback: leer directo
        if (!def) def = await getDeficiencyByIdLocal(id);
      }

      if (!def) {
        console.warn("⚠ autoSyncDeficiency: no hay deficiencia para sincronizar");
        return;
      }

      // ✅ asegurar DefiInterno
      const localId = def?.DefiInterno ?? (typeof defOrId === "number" ? defOrId : null);
      const defToSend = {
        ...def,
        DefiInterno: def?.DefiInterno ?? localId,
      };

      const normalized = normalizeDeficiencyForSync(defToSend);
      const payload = [normalized]; // ✅ el backend espera LISTA ROOT

      console.log("🔄 [autoSyncDeficiency] Enviando payload (LISTA):", payload);

      const response = await client.post("/Deficiency/SyncFromSQLite", payload, {
        timeout: 15000,
      });

      console.log("📥 Respuesta del servidor:", response.data);

      const map = response.data?.[0] ?? null;
      if (!map) {
        console.log("⚠ Respuesta vacía del servidor");
        return;
      }

      // ✅ compatibilidad con respuestas
      const ok = map?.ok !== false; // si no viene ok, asumimos true
      if (!ok) {
        console.log("⛔ Sync rechazado por servidor:", map?.error || "Sin detalle");
        return;
      }

      const serverId = map?.serverId ?? map?.ServerId ?? null;
      const returnedLocalId =
        map?.localId ?? map?.LocalId ?? defToSend?.DefiInterno ?? localId ?? null;

      if (!serverId || !returnedLocalId) {
        console.log("⚠ Respuesta sin serverId/localId:", map);
        return;
      }

      // ✅ Aplica mapping / mark synced (según lo que exista en tu offlineDB)
      if (Number(returnedLocalId) !== Number(serverId)) {
        const did = await safeCall("updateDeficiencyIdAfterSync", returnedLocalId, serverId);
        if (did === undefined) {
          // fallback
          await safeCall("setServerIdToDeficiency", returnedLocalId, serverId);
        }
      } else {
        const did = await safeCall("markDeficiencyAsSynced", serverId);
        if (did === undefined) {
          // fallback mínimo
          await safeCall("setServerIdToDeficiency", returnedLocalId, serverId);
        }
      }
    } catch (err) {
      console.error(
        "❌ [autoSyncDeficiency] Falló:",
        err?.response?.data || err?.message || err
      );
    } finally {
      syncingRef.current = false;
    }
  };

  // ------------------- SYNC MASIVO (robusto + compatible) -------------------
  const syncAllDeficiencies = async () => {
    const online = await isOnline();
    if (!online) return { ok: false };

    try {
      const pendientes = await getDeficienciesPendientes();
      if (!pendientes.length) return { ok: true, synced: 0 };

      const aSincronizar = pendientes.filter((d) =>
        [1, 2, 3, 4].includes(Number(d?.EstadoOffLine))
      );

      if (!aSincronizar.length) return { ok: true, synced: 0 };

      // ✅ preparar payload
      const payload = aSincronizar.map((d) =>
        normalizeDeficiencyForSync({
          ...d,
          DefiInterno: d?.DefiInterno,
        })
      );

      const sentLocalIds = aSincronizar.map((d) => d?.DefiInterno);

      const response = await client.post("/Deficiency/SyncFromSQLite", payload, {
        timeout: 15000,
      });

      const respList = Array.isArray(response.data) ? response.data : [];
      let syncedCount = 0;

      for (let i = 0; i < respList.length; i++) {
        const map = respList[i] ?? null;
        if (!map) continue;

        const ok = map?.ok !== false;
        if (!ok) {
          console.log("⛔ Sync rechazado:", map?.error || "Sin detalle", map);
          continue;
        }

        const serverId = map?.serverId ?? map?.ServerId ?? null;
        const returnedLocalId =
          map?.localId ??
          map?.LocalId ??
          sentLocalIds?.[i] ??
          null;

        if (!serverId || !returnedLocalId) {
          console.warn("⚠ Respuesta inválida (sin ids):", map);
          continue;
        }

        if (Number(returnedLocalId) !== Number(serverId)) {
          const did = await safeCall("updateDeficiencyIdAfterSync", returnedLocalId, serverId);
          if (did === undefined) {
            await safeCall("setServerIdToDeficiency", returnedLocalId, serverId);
          }
        } else {
          const did = await safeCall("markDeficiencyAsSynced", serverId);
          if (did === undefined) {
            await safeCall("setServerIdToDeficiency", returnedLocalId, serverId);
          }
        }

        syncedCount++;
      }

      return { ok: true, synced: syncedCount };
    } catch (err) {
      console.error("❌ Sync masivo deficiencias falló:", err?.response?.data || err?.message || err);
      return { ok: false };
    }
  };

  // ------------------- SAVE + AUTO SYNC -------------------
  const saveDeficiency = async (deficiency, userId) => {
    const dbOk = await checkDatabase();
    if (!dbOk) return null;

    try {
      const normalized = normalizeDeficiencyBeforeSave(deficiency, userId);
      const localId = await saveOrUpdateDeficiency(normalized);

      console.log("✅ Deficiencia guardada con ID local:", localId);

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

  // ------------------- SET INSPECCIONADO (LOCAL + SYNC) -------------------
  const setDefiInspeccionadoLocal = async (defiInterno, inspeccionado) => {
    const dbOk = await checkDatabase();
    if (!dbOk) return false;

    try {
      await updateDefiInspeccionadoLocal(defiInterno, inspeccionado ? 1 : 0);

      // ✅ intenta sync si corresponde
      await autoSyncDeficiency(defiInterno);

      return true;
    } catch (err) {
      console.error("❌ Error actualizando DefiInspeccionado:", err);
      return false;
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

      const serverId = localDef?.DefiServerId || localDef?.DefiInterno;
      if (!serverId) {
        console.log("⚠ No hay DefiInterno ni DefiServerId, no se puede validar");
        return false;
      }

      console.log("🌐 Consultando servidor por ID:", serverId);

      const response = await client.get("/Deficiency/GetById", {
        params: { x_defiInterno: serverId },
        timeout: 15000,
      });

      const serverDef = response.data;
      if (!serverDef) {
        console.log("❌ No existe en servidor");
        return false;
      }

      const serverCodigoElemento = serverDef.defiCodigoElemento ?? serverDef.DefiCodigoElemento;
      const serverTipiInterno = serverDef.tipiInterno ?? serverDef.TipiInterno;
      const serverInterno = serverDef.defiInterno ?? serverDef.DefiInterno;
      const serverActivo = serverDef.defiActivo ?? serverDef.DefiActivo;

      const isSame =
        (localDef?.DefiServerId
          ? Number(serverInterno) === Number(localDef.DefiServerId)
          : Number(serverInterno) === Number(localDef.DefiInterno)) &&
        String(serverCodigoElemento).trim() === String(localDef?.DefiCodigoElemento).trim() &&
        Number(serverTipiInterno) === Number(localDef?.TipiInterno) &&
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

      console.error("❌ Error validando deficiencia en servidor:", err?.response?.data || err?.message || err);
      return false;
    }
  };

  // ------------------- DELETE (PERMISOS + VALIDACIÓN + SYNC) -------------------
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

      // 🌐 VALIDAR EN SERVIDOR ANTES DE SINCRONIZAR
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

  // ------------------- Recalcula Pines.Inspeccionado para POSTE -------------------
  async function recalcularPinInspeccionadoParaPoste(postId) {
    const dbOk = await checkDatabase();
    if (!dbOk) return { ok: false };

    const previo = await getPinInspeccionadoByIdOriginalLocal(postId);

    const defs = await getDeficienciesByElement(postId, "POST");
    const todasInspeccionadas =
      defs?.length > 0 && defs.every((d) => Number(d?.DefiInspeccionado) === 1);

    const nuevo = todasInspeccionadas ? 1 : 0;
    const ok = await updatePinInspeccionadoByIdOriginalLocal(postId, nuevo);

    return {
      ok,
      previo,
      nuevo,
      totalDeficiencias: defs?.length ?? 0,
    };
  }

  // ------------------- LISTADOS -------------------
  const fetchDeficienciesByElementAndTypi = async (idElement, typeElement, tipiInterno) => {
    const dbOk = await checkDatabase();
    if (!dbOk) return [];

    try {
      return await getDeficienciesByElementAndTypi(idElement, typeElement, tipiInterno);
    } catch (err) {
      console.error("❌ Error obteniendo deficiencias por tipificación:", err);
      return [];
    }
  };

  const fetchDeficienciesByElement = async (idElement, typeElement) => {
    const dbOk = await checkDatabase();
    if (!dbOk) return [];

    try {
      return await getDeficienciesByElement(idElement, typeElement);
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

        contadorPorCode[code] = (contadorPorCode[code] ?? 0) + 1;
        const nroEnCodigo = contadorPorCode[code];

        return {
          id: def.DefiInterno,
          type: "def",
          defId: def.DefiInterno,

          order: idx + 1,
          orderInCode: nroEnCodigo,

          name: hasTypification
            ? `${def.Code} → ${def.Component ?? "Sin descripción"}${
                def.DefiNumSuministro ? `\nSuministro: ${def.DefiNumSuministro}` : ""
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

            // ✅ RESTAURADO
            ownerUserId: def.DefiUsuarioInic ?? null,
          },

          photos: [],
          audio: null,
        };
      });

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
    fetchDeficiencyByIdLocal,

    saveDeficiency,
    deleteDeficiency,

    setDefiInspeccionadoLocal,
    recalcularPinInspeccionadoParaPoste,

    autoSyncDeficiency,
    syncAllDeficiencies,

    fetchDeficienciesByElementAndTypi,
    fetchDeficienciesByElement,
    deficienciesForFlatList,
  };
};
