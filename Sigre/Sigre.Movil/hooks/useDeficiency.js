import {
  getVanoInspeccionadoByIdOriginalLocal,
  updateVanoInspeccionadoByIdOriginalLocal,
} from "../database/offlineDB/gaps";



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
  updateDeficiencyIdAfterSync,
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

  // ------------------- HELPERS PIN -------------------
  const extractPinValue = (v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === "object") {
      // por si tu query devuelve row { Inspeccionado: 0/1 } o similar
      const possible =
        v.Inspeccionado ??
        v.inspeccionado ??
        v.PIN_Inspeccionado ??
        v.PinInspeccionado ??
        v.value ??
        null;
      return possible === null || possible === undefined ? null : Number(possible);
    }
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

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

    // Si no existe el pin, no podemos explicar cambio real
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

    // Motivo más claro
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

  const normalizeSqlServerDate = (value) => {
    if (!value || typeof value !== "string") return value;

    // Detecta exactamente: "2026-02-01 23:41:00"
    const sqlServerFormat = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

    if (!sqlServerFormat.test(value)) {
      // No es el formato problemático → no toca nada
      return value;
    }

    // Normaliza: "YYYY-MM-DD HH:mm:ss" → "YYYY-MM-DDTHH:mm:ss"
    return value.replace(" ", "T");
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

  // ------------------- NORMALIZAR ANTES DE GUARDAR -------------------
const normalizeDeficiencyBeforeSave = (deficiency, userId) => {
  const now = nowPeruISO?.() ?? new Date().toISOString();
  const isNew = !deficiency?.DefiInterno;

  const base = deficiency ?? {};

  return {
    ...base,

    // ✅ defaults para columnas nuevas
    DefiCol3: base?.DefiCol3 ?? generateUUID(),
    DefiCol2: base?.DefiCol2 ?? "",
    DefiAccesibilidad: base?.DefiAccesibilidad ?? "",
    DefiTipoCruce: base?.DefiTipoCruce ?? "",

    ...(isNew && {
      DefiEstado: base?.DefiEstado || "N",
      DefiFechaCreacion: now,
      DefiFecRegistro: now,
      DefiUsuarioInic: userId,
      DefiLatitud: base?.DefiLatitud ?? 0,
      DefiLongitud: base?.DefiLongitud ?? 0,
      DefiInspeccionado: base?.DefiInspeccionado ?? 0,
    }),

    DefiUsuarioMod: userId,
    DefiFecModificacion: now,
  };
};


  

  // ------------------- NORMALIZE PARA SYNC -------------------
const normalizeDeficiencyForSync = (def) => {
  const nowIso = new Date().toISOString();
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
      if (!online) {
        console.log("📴 Sin conexión, no se sincroniza");
        return;
      }

      const def = await getDeficiencyByIdLocal(defOrId);
      console.log("🔄 [autoSyncDeficiency] START →", def);

      const normalized = normalizeDeficiencyForSync(def);
      const payload = [normalized];

      const response = await client.post("/Deficiency/SyncFromSQLite", payload, { timeout: 15000 });

      console.log("📥 Respuesta del servidor:", response.data);

      // ✅ ACTUALIZAR SQLITE
      if (Array.isArray(response.data)) {
        for (const r of response.data) {
          await updateDeficiencyIdAfterSync(r.localId, r.serverId);
        }
      }
    } catch (err) {
      console.error("❌ [autoSyncDeficiency] Falló:", err?.response?.data || err?.message || err);
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

  // ------------------- SAVE + AUTO SYNC (+ PIN MSG SIEMPRE) -------------------
  // ------------------- SAVE + AUTO SYNC (+ PIN MSG PRE/POST) -------------------
  const saveDeficiency = async (deficiency, userId) => {
    const dbOk = await checkDatabase();
    if (!dbOk) return { ok: false, error: "DB_NOT_READY" };

    try {
      const isNew = !(deficiency?.DefiInterno ?? deficiency?.defiInterno);

      // ✅ Normalizar (pero OJO: aún no guardamos)
      const normalized = normalizeDeficiencyBeforeSave(deficiency, userId);

      // ✅ ID/TIPO del elemento (robusto)
      const idOriginalRaw =
        normalized?.DefiIdElemento ??
        normalized?.elementId ??
        deficiency?.DefiIdElemento ??
        deficiency?.elementId;

      const typeElementRaw =
        normalized?.DefiTipoElemento ??
        normalized?.typeElement ??
        deficiency?.DefiTipoElemento ??
        deficiency?.typeElement;

      const idOriginal =
        idOriginalRaw != null && String(idOriginalRaw).trim() !== ""
          ? Number(idOriginalRaw)
          : null;

      const typeElement =
        typeElementRaw != null && String(typeElementRaw).trim() !== ""
          ? String(typeElementRaw).trim().toUpperCase()
          : null;

      console.log("📍 [PIN][SAVE] target:", { idOriginal, typeElement, isNew });

      // =========================
      // 1) PRE: recalcular ANTES
      // =========================
      let preRes = null;
      if (idOriginal != null && typeElement) {
        preRes = await recalcularPinInspeccionadoParaElemento(idOriginal, typeElement);
        console.log("🟦 [PIN][SAVE][PRE] =>", preRes);
      }

      // =========================
      // 2) GUARDAR DEFICIENCIA
      // =========================
      const localId = await saveOrUpdateDeficiency(normalized);
      console.log("✅ Deficiencia guardada con ID local:", localId);

      // =========================
      // 3) POST: recalcular DESPUÉS
      // =========================
      let postRes = null;
      if (idOriginal != null && typeElement) {
        postRes = await recalcularPinInspeccionadoParaElemento(idOriginal, typeElement);
        console.log("🟩 [PIN][SAVE][POST] =>", postRes);
      }

      // =========================
      // 4) Mensaje PRE → POST
      // =========================
      let pinMsg = null;

      if (idOriginal != null && typeElement && preRes && postRes) {
        const tipo = labelTipoElemento(typeElement);

        const antesVal = extractPinValue(preRes?.nuevo);
        const despuesVal = extractPinValue(postRes?.nuevo);

        const antesTxt = labelEstadoPin(antesVal);
        const despuesTxt = labelEstadoPin(despuesVal);

        const iconAntes = iconEstadoPin(antesVal);
        const iconDespues = iconEstadoPin(despuesVal);

        const beforeTotal = Number(preRes?.totalDeficiencias ?? 0);
        const beforePend = Number(preRes?.pendientes ?? 0);

        const afterTotal = Number(postRes?.totalDeficiencias ?? 0);
        const afterPend = Number(postRes?.pendientes ?? 0);

        let motivo = "";
        if (Number(despuesVal) === 1) {
          motivo = "Todas las deficiencias asociadas están finalizadas.";
        } else if (afterTotal === 0) {
          motivo = "No hay deficiencias activas asociadas.";
        } else {
          motivo = `Aún hay ${afterPend} deficiencia(s) pendiente(s) por completar.`;
        }

        pinMsg =
          `📌 Estado del PIN recalculado\n\n` +
          `📍 Elemento: ${tipo} ${idOriginal}\n` +
          `🔁 Estado: ${iconAntes} ${antesTxt} → ${iconDespues} ${despuesTxt}\n` +
          `📊 Antes: Activas ${beforeTotal} (Pendientes ${beforePend})\n` +
          `📊 Después: Activas ${afterTotal} (Pendientes ${afterPend})\n` +
          `ℹ️ Motivo: ${motivo}\n` +
          `🛠️ Acción: ${isNew ? "Se registró una nueva deficiencia" : "Se actualizó la deficiencia"}`;

        console.log("📌 [PIN MSG][SAVE]\n" + pinMsg);
      } else if (idOriginal != null && typeElement) {
        pinMsg =
          `⚠️ No se pudo armar mensaje PRE/POST del PIN.\n\n` +
          `📍 Elemento: ${labelTipoElemento(typeElement)} ${idOriginal}\n` +
          `🧩 Motivo: faltó PRE o POST recalculo (revisa logs).`;
        console.warn("⚠️ [PIN][SAVE] faltó preRes/postRes", { preRes, postRes });
      }

      // ✅ Auto-sync
      if (localId) {
        console.log("🔄 Iniciando auto-sync para ID:", localId);
        await autoSyncDeficiency(localId);
      }

      return { ok: true, localId, pinMsg, preRes, postRes, isNew };
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

  // ------------------- DELETE (PRE/POST PIN + PERMISOS + VALIDACIÓN + SYNC) -------------------
  const deleteDeficiency = async (defiInterno) => {
    const dbOk = await checkDatabase();
    if (!dbOk) return { ok: false };

    try {
      const def = await getDeficiencyByIdLocal(defiInterno);
      if (!def) return { ok: false };

      // ✅ PERMISOS
      const privileged = isAdmin || isSupervisor;

      if (!privileged) {
        const owner = def.DefiUsuarioInic;
        const me = currentUserId;

        const isOwner =
          owner != null &&
          me != null &&
          String(owner).trim() === String(me).trim();

        if (!isOwner) {
          console.log("⛔ No permitido: inspector intentando eliminar deficiencia de otro usuario");
          return { ok: false, reason: "NO_PERMISSION" };
        }
      }

      const idOriginal = def?.DefiIdElemento != null ? Number(def.DefiIdElemento) : null;
      const typeElement = def?.DefiTipoElemento != null ? String(def.DefiTipoElemento).trim().toUpperCase() : null;

      console.log("📍 [PIN][DEL] target:", { idOriginal, typeElement });

      // =========================
      // 1) PRE: recalcular ANTES
      // =========================
      let preRes = null;
      if (idOriginal != null && typeElement) {
        preRes = await recalcularPinInspeccionadoParaElemento(idOriginal, typeElement);
        console.log("🟦 [PIN][DEL][PRE] =>", preRes);
      }

      // =========================
      // 2) BORRADO LÓGICO LOCAL
      // =========================
      await deleteDeficiencyById(defiInterno);

      // =========================
      // 3) POST: recalcular DESPUÉS
      // =========================
      let postRes = null;
      if (idOriginal != null && typeElement) {
        postRes = await recalcularPinInspeccionadoParaElemento(idOriginal, typeElement);
        console.log("🟩 [PIN][DEL][POST] =>", postRes);
      }

      // =========================
      // 4) Mensaje PRE → POST
      // =========================
      let pinMsg = null;

      if (idOriginal != null && typeElement && preRes && postRes) {
        const tipo = labelTipoElemento(typeElement);

        const antesVal = extractPinValue(preRes?.nuevo);
        const despuesVal = extractPinValue(postRes?.nuevo);

        const antesTxt = labelEstadoPin(antesVal);
        const despuesTxt = labelEstadoPin(despuesVal);

        const iconAntes = iconEstadoPin(antesVal);
        const iconDespues = iconEstadoPin(despuesVal);

        const beforeTotal = Number(preRes?.totalDeficiencias ?? 0);
        const beforePend = Number(preRes?.pendientes ?? 0);

        const afterTotal = Number(postRes?.totalDeficiencias ?? 0);
        const afterPend = Number(postRes?.pendientes ?? 0);

        let motivo = "";
        if (Number(despuesVal) === 1) {
          motivo = "Todas las deficiencias asociadas están finalizadas.";
        } else if (afterTotal === 0) {
          motivo = "No hay deficiencias activas asociadas.";
        } else {
          motivo = `Aún hay ${afterPend} deficiencia(s) pendiente(s) por completar.`;
        }

        pinMsg =
          `📌 Estado del PIN recalculado\n\n` +
          `📍 Elemento: ${tipo} ${idOriginal}\n` +
          `🔁 Estado: ${iconAntes} ${antesTxt} → ${iconDespues} ${despuesTxt}\n` +
          `📊 Antes: Activas ${beforeTotal} (Pendientes ${beforePend})\n` +
          `📊 Después: Activas ${afterTotal} (Pendientes ${afterPend})\n` +
          `ℹ️ Motivo: ${motivo}\n` +
          `🛠️ Acción: Se eliminó una deficiencia`;

        console.log("📌 [PIN MSG][DEL]\n" + pinMsg);
      } else if (idOriginal != null && typeElement) {
        pinMsg =
          `⚠️ No se pudo armar mensaje PRE/POST del PIN.\n\n` +
          `📍 Elemento: ${labelTipoElemento(typeElement)} ${idOriginal}\n` +
          `🧩 Motivo: faltó PRE o POST recalculo (revisa logs).`;
        console.warn("⚠️ [PIN][DEL] faltó preRes/postRes", { preRes, postRes });
      }

      // 🌐 VALIDAR EN SERVIDOR ANTES DE SINCRONIZAR
      const existeEnServidor = await checkDeficiencyOnServer(def);

      if (existeEnServidor) {
        console.log("🌐 Deficiencia existe en servidor, sincronizando eliminación...");
        await autoSyncDeficiency(defiInterno);
      } else {
        console.log("📱 Deficiencia no existe o no coincide en servidor, no se sincroniza");
      }

      return { ok: true, pinMsg, preRes, postRes };
    } catch (err) {
      console.error("❌ Error eliminando deficiencia:", err);
      return { ok: false, error: String(err?.message || err) };
    }
  };


  // ------------------- Recalcula inspección para POST/VANO/SED -------------------
  async function recalcularPinInspeccionadoParaElemento(idOriginal, typeElement) {
    const dbOk = await checkDatabase();
    if (!dbOk) return { ok: false };

    const t = String(typeElement ?? "").trim().toUpperCase();
    const id = idOriginal != null ? Number(idOriginal) : null;

    if (!Number.isFinite(id)) {
      return { ok: false, error: "ID_INVALIDO", previo: null, nuevo: null };
    }

    // 1) PREVIO: leer desde la tabla correcta
    let previoRaw = null;

    if (t === "VANO") {
      // ✅ VANO -> tabla Vanos
      previoRaw = await getVanoInspeccionadoByIdOriginalLocal(id);
    } else {
      // ✅ POST/SED/otros -> tabla Pines
      previoRaw = await getPinInspeccionadoByIdOriginalLocal(id);
    }

    const previo = extractPinValue(previoRaw);

    // 2) Deficiencias activas del elemento
    const defs = await getDeficienciesByElement(id, t);

    const totalDeficiencias = defs?.length ?? 0;
    const inspeccionadas =
      defs?.filter((d) => Number(d?.DefiInspeccionado) === 1).length ?? 0;
    const pendientes = Math.max(0, totalDeficiencias - inspeccionadas);

    // Regla: inspeccionado SOLO si existen deficiencias y TODAS están inspeccionadas
    const todasInspeccionadas = totalDeficiencias > 0 && pendientes === 0;
    const nuevo = todasInspeccionadas ? 1 : 0;

    // 3) UPDATE: escribir en la tabla correcta
    let ok = false;

    if (t === "VANO") {
      ok = await updateVanoInspeccionadoByIdOriginalLocal(id, nuevo);
    } else {
      ok = await updatePinInspeccionadoByIdOriginalLocal(id, nuevo);
    }

    return {
      ok,
      previo,
      nuevo,
      totalDeficiencias,
      inspeccionadas,
      pendientes,
      tablaActualizada: t === "VANO" ? "Vanos.VanoInspeccionado" : "Pines.Inspeccionado",
    };
  }



  // ✅ Mantén esta función para no romper llamadas existentes
  async function recalcularPinInspeccionadoParaPoste(postId) {
    return await recalcularPinInspeccionadoParaElemento(postId, "POST");
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
            ? `${def.Code} → ${def.Component ?? "Sin descripción"}${def.DefiNumSuministro ? `\nSuministro: ${def.DefiNumSuministro}` : ""}`
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

    // ✅ NECESARIO para Multimedia.js
    recalcularPinInspeccionadoParaElemento,

    // ✅ Compatibilidad (si lo llamas en otros lados)
    recalcularPinInspeccionadoParaPoste,

    autoSyncDeficiency,
    syncAllDeficiencies,

    fetchDeficienciesByElementAndTypi,
    fetchDeficienciesByElement,
    deficienciesForFlatList,
  };


};
