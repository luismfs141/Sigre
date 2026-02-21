
import {
  getArchivoByIdLocal,
  markArchivosByDefiRefsInactiveLocal,
  updateArchivoIdAfterSync as updateArchivoIdAfterSyncFile,
} from "../database/offlineDB/files";

import { useRef, useState } from "react";
import uuid from "react-native-uuid";
import { api } from "../config";
import { useDatos } from "../context/DatosContext";
import {
  deleteDeficiencyById,
  fetchDeficienciesForFlatList,
  getComentarioEstandarByTypificationIdLocal,
  getDeficienciesByElement,
  getDeficienciesByElementAndTypi,
  getDeficienciesPendientes,
  getDeficiencyByIdLocal,
  getDeficiencyByTypificationElement,
  saveOrUpdateDeficiency,
  updateDefiInspeccionadoLocal,
  updateDeficiencyIdAfterSync,
} from "../database/offlineDB/deficiencies";


import { formatLocalISO, getUniqueNowMs, roundMsForSqlDatetime } from "../utils/dateUtils";



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

  const syncingFilesRef = useRef(false);

  const toNum = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const normalizeArchivoForSync = (arch) => {
    const activoNum = toNum(arch?.ArchActivo ?? 1, 1);

    return {
      ArchInterno: arch?.ArchInterno,
      ArchServerId: arch?.ArchServerId ?? null, // si existe en tu tabla, ok; si no, queda null

      ArchTabla: arch?.ArchTabla ?? "Deficiencias",
      ArchCodTabla: arch?.ArchCodTabla ?? null,

      ArchTipo: String(arch?.ArchTipo ?? "0"),
      ArchNombre: arch?.ArchNombre ?? null,

      ArchLatitud: arch?.ArchLatitud ?? null,
      ArchLongitud: arch?.ArchLongitud ?? null,

      ArchFecha: arch?.ArchFecha
        ? String(arch.ArchFecha).replace(" ", "T")
        : formatLocalISO(roundMsForSqlDatetime(getUniqueNowMs())),

      ArchTipoElemento: arch?.ArchTipoElemento ?? null,
      ArchIdElemento: arch?.ArchIdElemento ?? null,
      TipiInterno: arch?.TipiInterno ?? null,

      DefiServerId: arch?.DefiServerId ?? null,
      DefiUUID: arch?.DefiUUID ?? null,

      ArchActivo: activoNum === 1,
      EstadoOffLine: toNum(arch?.EstadoOffLine ?? 0, 0),
    };
  };

  const autoSyncArchivosByIds = async (archIds) => {
    if (!Array.isArray(archIds) || !archIds.length) return;

    if (syncingFilesRef.current) return;
    syncingFilesRef.current = true;

    try {
      const dbOk = await checkDatabase();
      if (!dbOk) return;

      const online = await isOnline();
      if (!online) return;

      const rows = await Promise.all(
        archIds.map((id) => getArchivoByIdLocal(id))
      );

      const payload = rows.filter(Boolean).map(normalizeArchivoForSync);
      if (!payload.length) return;

      console.log("📤 Sincronización de update de archivos");


      const response = await client.post("/File/SyncFromSQLite", payload, {
        timeout: 20000,
      });

      const respList = Array.isArray(response.data) ? response.data : [];
      for (const r of respList) {
        if (!r?.localId || !r?.serverId) continue;
        await updateArchivoIdAfterSyncFile(r.localId, r.serverId);
      }
    } catch (err) {
      console.error("❌ autoSyncArchivosByIds falló:", err?.response?.data || err?.message || err);
    } finally {
      syncingFilesRef.current = false;
    }
  };


  // ✅ Acceso dinámico a exports (para que compile aunque en tu módulo existan o no)
  const deficienciesDb = require("../database/offlineDB/deficiencies");
  const safeCall = async (fnName, ...args) => {
    const fn = deficienciesDb?.[fnName];
    if (typeof fn === "function") return await fn(...args);
    return undefined;
  };

  const generateUUID = () => uuid.v4();



  // ------------------- MENSAJE PROFESIONAL (PIN) -------------------
  const labelTipoElemento = (t) => {
    const s = String(t ?? "").trim().toUpperCase();
    if (s === "POST") return "POSTE";
    if (s === "VANO") return "VANO";
    if (s === "SED") return "SED";
    return s || "ELEMENTO";
  };

  const labelEstadoPin = (v) => (Number(v) === 1 ? "INSPECCIONADO" : "NO INSPECCIONADO");
  const iconEstadoPin = (v) => (Number(v) === 1 ? "✅" : "🟡");


  // Extrae 0/1 desde diferentes formatos posibles
  const extractPinValue = (v) => {
    if (v === null || v === undefined) return null;

    if (typeof v === "boolean") return v ? 1 : 0;

    if (typeof v === "number") {
      if (!Number.isFinite(v)) return null;
      return v ? 1 : 0;
    }

    if (typeof v === "string") {
      const s = v.trim();
      if (!s) return null;
      const n = Number(s);
      if (!Number.isFinite(n)) return null;
      return n ? 1 : 0;
    }

    // Si te pasan un objeto, intenta keys comunes
    if (typeof v === "object") {
      const candidate =
        v?.VanoInspeccionado ??
        v?.PostInspeccionado ??
        v?.inspeccionado ??
        v?.estado ??
        v?.value ??
        null;

      if (candidate === null || candidate === undefined) return null;
      const n = Number(candidate);
      if (!Number.isFinite(n)) return null;
      return n ? 1 : 0;
    }

    return null;
  };

  const buildPinMsg = ({
    idOriginal,
    typeElement,
    previo,
    nuevo,
    totalDeficiencias,
    pendientes,
    accion,
  }) => {
    const tipo = labelTipoElemento(typeElement);

    const prev = extractPinValue(previo);
    const next = extractPinValue(nuevo);

    if (prev === null) {
      return (
        `⚠️ No se pudo actualizar el estado del PIN.\n\n` +
        `📍 Elemento: ${tipo} ${idOriginal}\n` +
        `🧩 Motivo: No se encontró el pin asociado a este elemento.`
      );
    }

    const antes = labelEstadoPin(prev);
    const despues = labelEstadoPin(next);

    const iconAntes = iconEstadoPin(prev);
    const iconDespues = iconEstadoPin(next);

    let motivo = "";
    if (Number(next) === 1) {
      motivo = "Todas las deficiencias asociadas están finalizadas.";
    } else if (Number(totalDeficiencias) === 0) {
      motivo = "No hay deficiencias activas asociadas.";
    } else {
      motivo = `Aún hay ${Number(pendientes) || 0} deficiencia(s) pendiente(s) por completar.`;
    }

    const accionTxt = accion ? `🛠️ Acción: ${accion}` : "";

    return (
      `📌 Estado del PIN actualizado\n\n` +
      `📍 Elemento: ${tipo} ${idOriginal}\n` +
      `🔁 Estado: ${iconAntes} ${antes} → ${iconDespues} ${despues}\n` +
      `📊 Deficiencias activas: ${Number(totalDeficiencias) || 0} (Pendientes: ${Number(pendientes) || 0})\n` +
      `ℹ️ Motivo: ${motivo}\n` +
      `${accionTxt}`
    ).trim();
  };






  // ------------------- NORMALIZAR FECHAS -------------------
  const normalizeDate = (value) => {
    if (value === null || value === undefined || value === "") return null;

    // number => epoch (ms o seg)
    if (typeof value === "number") {
      const ms = value > 1e12 ? value : value * 1000;
      const d = new Date(ms);
      if (Number.isNaN(d.getTime())) return null;

      const rounded = roundMsForSqlDatetime(d.getTime());
      return formatLocalISO(rounded); // ✅ LOCAL SIN Z
    }

    if (typeof value !== "string") return null;

    let s = value.trim();
    if (!s) return null;

    // "YYYY-MM-DD HH:mm:ss(.mmm)" -> "YYYY-MM-DDTHH:mm:ss(.mmm)"
    if (s.includes(" ") && !s.includes("T")) s = s.replace(" ", "T");

    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return null;

    const rounded = roundMsForSqlDatetime(d.getTime());
    return formatLocalISO(rounded); // ✅ LOCAL SIN Z
  };


  const normalizeSqlServerDate = (value) => {
    if (value === null || value === undefined) return null;

    // si viene vacío -> null (evita error DateTime? en ASP.NET)
    if (typeof value === "string") {
      let s = value.trim();
      if (!s) return null;

      // si viene "YYYY-MM-DD HH:mm:ss(.fff...)" -> cámbialo a ISO con T
      if (s.includes(" ") && !s.includes("T")) {
        s = s.replace(" ", "T");
      }

      return s;
    }

    // number => epoch (ms o seg) -> ISO local con milis (redondeado)
    if (typeof value === "number") {
      const ms = value > 1e12 ? value : value * 1000;
      const rounded = roundMsForSqlDatetime(ms);
      return formatLocalISO(rounded);
    }

    return null;
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

  // ------------------


  const fetchComentarioEstandarTipiLocal = async (typificationId) => {
    const dbOk = await checkDatabase();
    if (!dbOk) return "";

    try {
      return await getComentarioEstandarByTypificationIdLocal(typificationId);
    } catch (err) {
      console.error("❌ Error fetchComentarioEstandarTipiLocal:", err);
      return "";
    }
  };


  // ------------------- NORMALIZAR ANTES DE GUARDAR -------------------
  const isBlank = (v) => v === null || v === undefined || String(v).trim() === "";

  const normalizeDeficiencyBeforeSave = (deficiency, userId, nowIso) => {
    const base = deficiency ?? {};
    const isNew = !base?.DefiInterno;

    // ✅ defaults
    const normalized = {
      ...base,

      DefiCol3: base?.DefiCol3 ?? generateUUID(),
      DefiCol2: base?.DefiCol2 ?? "",
      DefiAccesibilidad: base?.DefiAccesibilidad ?? "",
      DefiTipoCruce: base?.DefiTipoCruce ?? "",

      // ✅ SIEMPRE se actualiza al guardar
      DefiUsuarioMod: userId != null ? String(userId) : null,
      DefiFecModificacion: nowIso,
    };

    if (isNew) {
      // ✅ CREACIÓN: se estampa al Guardar/Finalizar (NO al abrir modal)
      normalized.DefiEstado = base?.DefiEstado || "N";
      normalized.DefiFechaCreacion = nowIso;
      normalized.DefiFecRegistro = nowIso;

      // ✅ en creación: modificacion == creacion (mismo stamp)
      normalized.DefiFecModificacion = nowIso;

      normalized.DefiUsuarioInic = isBlank(base?.DefiUsuarioInic)
        ? (userId != null ? String(userId) : null)
        : String(base.DefiUsuarioInic);

      normalized.DefiLatitud = base?.DefiLatitud ?? 0;
      normalized.DefiLongitud = base?.DefiLongitud ?? 0;
      normalized.DefiInspeccionado = base?.DefiInspeccionado ?? 0;
    } else {
      // ✅ UPDATE: NO tocar creación (solo asegurar que no quede en blanco)
      if (isBlank(base?.DefiFechaCreacion)) normalized.DefiFechaCreacion = nowIso;
      if (isBlank(base?.DefiFecRegistro)) normalized.DefiFecRegistro = nowIso;
    }

    return normalized;
  };






  // ------------------- NORMALIZE PARA SYNC -------------------
  const normalizeDeficiencyForSync = (def) => {
    const msRaw = getUniqueNowMs();
    const ms = roundMsForSqlDatetime(msRaw);
    const nowIso = formatLocalISO(ms);


    const base = def ?? {};

    const fecRegistro =
      normalizeDate(base?.DefiFecRegistro) ||
      normalizeDate(base?.DefiFechaCreacion) ||
      nowIso;

    const fecMod = normalizeDate(base?.DefiFecModificacion) || nowIso;

    return {
      ...base,

      // 🔹 STRINGS (compatibilidad server)
      DefiUsuarioInic: base?.DefiUsuarioInic != null ? String(base.DefiUsuarioInic) : null,
      DefiUsuarioMod: base?.DefiUsuarioMod != null ? String(base.DefiUsuarioMod) : null,
      DefiUsuCre: base?.DefiUsuCre != null ? String(base.DefiUsuCre) : null,
      DefiUsuNpc: base?.DefiUsuNpc != null ? String(base.DefiUsuNpc) : null,

      DefiObservacion: base?.DefiObservacion ?? "",
      DefiComentario: base?.DefiComentario ?? "",

      // 🔹 BOOLEANS
      DefiActivo: Boolean(base?.DefiActivo),
      DefiInspeccionado: Boolean(base?.DefiInspeccionado),
      DefiResponsable: Boolean(base?.DefiResponsable),

      // 🔹 FECHAS ISO
      DefiFecRegistro: normalizeSqlServerDate(fecRegistro),
      DefiFecModificacion: normalizeSqlServerDate(fecMod),


      DefiFechaCreacion: normalizeSqlServerDate(base?.DefiFechaCreacion),
      DefiFechaDenuncia: normalizeSqlServerDate(base?.DefiFechaDenuncia),
      DefiFechaInspeccion: normalizeSqlServerDate(base?.DefiFechaInspeccion),
      DefiFechaSubsanacion: normalizeSqlServerDate(base?.DefiFechaSubsanacion),

      // 🔹 IDENTIFICADOR ÚNICO
      DefiCol3: base?.DefiCol3 ?? null,
      DefiCol2: base?.DefiCol2 ?? null,
    };
  };


  // ------------------- AUTO SYNC (robusto + compatible) -------------------
  const autoSyncDeficiency = async (defOrId) => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    try {
      const online = await isOnline();
      if (!online) return;

      const def =
        defOrId && typeof defOrId === "object"
          ? defOrId
          : await getDeficiencyByIdLocal(defOrId);

      if (!def) return;

      const normalized = normalizeDeficiencyForSync(def);
      const payload = [normalized];

      console.log("📤 Sincronización de Update de deficiencia");


      const response = await client.post("/Deficiency/SyncFromSQLite", payload, {
        timeout: 15000,
      });

      // ✅ ACTUALIZAR SQLITE
      if (Array.isArray(response.data)) {
        for (const r of response.data) {
          await updateDeficiencyIdAfterSync(r.localId, r.serverId);
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

  const countPendingDeficienciesLocal = async () => {
    const dbOk = await checkDatabase();
    if (!dbOk) return 0;

    try {
      const pendientes = await getDeficienciesPendientes();
      if (!Array.isArray(pendientes) || !pendientes.length) return 0;

      // mismo criterio que usas para sincronizar
      return pendientes.filter((d) =>
        [1, 2, 3, 4].includes(Number(d?.EstadoOffLine))
      ).length;
    } catch (err) {
      console.error("❌ Error contando deficiencias pendientes:", err);
      return 0;
    }
  };

  // ------------------- SYNC MASIVO (robusto + compatible) -------------------
  const syncAllDeficiencies = async () => {
    const online = await isOnline();
    if (!online) return { ok: false };

    try {
      const pendientes = await getDeficienciesPendientes();
      if (!pendientes.length) return { ok: true, synced: 0 };

      const aSincronizar = pendientes.filter((d) => [1, 2, 3, 4].includes(Number(d?.EstadoOffLine)));
      if (!aSincronizar.length) return { ok: true, synced: 0 };

      // 🔹 Normalizar TODAS
      const payload = aSincronizar.map((d) => normalizeDeficiencyForSync(d));

      const response = await client.post("/Deficiency/SyncFromSQLite", payload, { timeout: 20000 });

      const respList = Array.isArray(response.data) ? response.data : [];
      let syncedCount = 0;

      for (const r of respList) {
        if (!r?.localId || !r?.serverId) {
          console.warn("⚠ Respuesta inválida:", r);
          continue;
        }

        await updateDeficiencyIdAfterSync(r.localId, r.serverId);
        syncedCount++;
      }

      return { ok: true, synced: syncedCount };
    } catch (err) {
      console.error("❌ Sync masivo deficiencias falló:", err?.response?.data || err?.message || err);
      return { ok: false };
    }
  };


  // ------------------- SAVE + AUTO SYNC (SIN PIN) -------------------
  const saveDeficiency = async (deficiency, userId) => {
    const dbOk = await checkDatabase();
    if (!dbOk) return { ok: false, error: "DB_NOT_READY" };

    try {
      const isNew = !(deficiency?.DefiInterno ?? deficiency?.defiInterno);

      const capturedAtMsRaw = getUniqueNowMs();
      const capturedAtMs = roundMsForSqlDatetime(capturedAtMsRaw);
      const nowIso = formatLocalISO(capturedAtMs);

      const normalized = normalizeDeficiencyBeforeSave(deficiency, userId, nowIso);

      const localId = await saveOrUpdateDeficiency(normalized);

      if (localId) {
        await autoSyncDeficiency(localId);
      }

      return { ok: true, localId, isNew };
    } catch (err) {
      console.error("❌ Error guardando deficiencia:", err);
      return { ok: false, error: String(err?.message || err) };
    }
  };




  // ------------------- SET INSPECCIONADO (LOCAL + SYNC) -------------------
  const setDefiInspeccionadoLocal = async (defiInterno, inspeccionado) => {
    const dbOk = await checkDatabase();
    if (!dbOk) return false;

    try {
      await updateDefiInspeccionadoLocal(defiInterno, inspeccionado ? 1 : 0);
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
      if (!online) return false;

      const serverId = localDef?.DefiServerId || localDef?.DefiInterno;
      if (!serverId) return false;

      const response = await client.get("/Deficiency/GetById", {
        params: { x_defiInterno: serverId },
        timeout: 15000,
      });

      const serverDef = response.data;
      if (!serverDef) return false;

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

      if (!isSame) return false;

      return true;
    } catch (err) {
      if (err?.response?.status === 404) return false;

      console.error(
        "❌ Error validando deficiencia en servidor:",
        err?.response?.data || err?.message || err
      );
      return false;
    }
  };


  // ------------------- DELETE (SIN PIN) -------------------
  const deleteDeficiency = async (defiInterno) => {
    const dbOk = await checkDatabase();
    if (!dbOk) return { ok: false };

    try {
      const def = await getDeficiencyByIdLocal(defiInterno);
      if (!def) return { ok: false };

      // ✅ PERMISOS (igual que ya tenías)
      const privileged = isAdmin || isSupervisor;

      if (!privileged) {
        const owner = def.DefiUsuarioInic;
        const me = currentUserId;

        const isOwner =
          owner != null &&
          me != null &&
          String(owner).trim() === String(me).trim();

        if (!isOwner) {
          return { ok: false, reason: "NO_PERMISSION" };
        }
      }

      // ✅ mismo “stamp” local
      const ms = roundMsForSqlDatetime(getUniqueNowMs());
      const nowIso = formatLocalISO(ms);

      // 1) BORRADO LÓGICO DEF + forzar inspeccionado 0
      await deleteDeficiencyById(defiInterno, currentUserId, nowIso);

      // 2) CASCADA: bajar ArchActivo=0 y EstadoOffLine inteligente
      const archIdsToSync = await markArchivosByDefiRefsInactiveLocal({
        defiInterno: def?.DefiInterno,
        defiServerId: def?.DefiServerId,
        defiUUID: def?.DefiCol3,
      });

      // 3) SYNC archivos (solo los que realmente quedaron con EstadoOffLine=3)
      if (archIdsToSync.length) {
        await autoSyncArchivosByIds(archIdsToSync);
      }

      // 4) SYNC deficiencia SOLO si ya tiene serverId (evita consultas por gusto)
      if (Number(def?.DefiServerId) > 0) {
        await autoSyncDeficiency(defiInterno);
      }

      return { ok: true, archivosAfectados: archIdsToSync.length };
    } catch (err) {
      console.error("❌ Error eliminando deficiencia:", err);
      return { ok: false, error: String(err?.message || err) };
    }
  };











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

        const defiInspeccionado01 = Number(def.DefiInspeccionado) === 1 ? 1 : 0;

        return {
          id: def.DefiInterno,
          type: "def",
          defId: def.DefiInterno,

          order: idx + 1,
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

            ownerUserId: def.DefiUsuarioInic ?? null,

            // ✅ CAMPO FIJO PARA EL COLOR (0/1)
            defiInspeccionado: defiInspeccionado01,
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



    autoSyncDeficiency,
    syncAllDeficiencies,
    countPendingDeficienciesLocal,

    fetchDeficienciesByElementAndTypi,
    fetchDeficienciesByElement,
    deficienciesForFlatList,
    fetchComentarioEstandarTipiLocal,

  };


};
