

import { useState } from "react";
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
  setServerIdToDeficiency,
  updateDefiInspeccionadoLocal
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
      DefiCol3: deficiency.DefiCol3 ?? generateUUID(),
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
        //DefiInspeccionado: 0,
      }),
      DefiUsuarioMod: userId,
      DefiFecModificacion: now
    };
  };

  // ------------------- SET INSPECCIONADO (LOCAL + SYNC) -------------------
  // const setDefiInspeccionadoLocal = async (defiInterno, inspeccionado) => {
  //   const dbOk = await checkDatabase();
  //   if (!dbOk) return false;

  //   try {
  //     await updateDefiInspeccionadoLocal(defiInterno, inspeccionado ? 1 : 0);

  //     // opcional: si ya estaba pendiente por tu lógica normal,
  //     // esto intentará sincronizar sin tocar EstadoOffLine
  //     await autoSyncDeficiency(defiInterno);

  //     return true;
  //   } catch (err) {
  //     console.error("❌ Error actualizando DefiInspeccionado:", err);
  //     return false;
  //   }
  // };

  const setDefiInspeccionadoLocal = async (defiInterno, inspeccionado) => {
    const dbOk = await checkDatabase();
    if (!dbOk) return false;

    try {
      await updateDefiInspeccionadoLocal(defiInterno, inspeccionado ? 1 : 0);

      // ✅ IMPORTANTE: autoSync debe recibir el OBJETO completo, no solo el ID
      const defActual = await getDeficiencyByIdLocal(defiInterno);
      if (!defActual) {
        console.warn("⚠ No se pudo leer la deficiencia tras actualizar inspeccionado:", defiInterno);
        return true; // local quedó ok
      }

      await autoSyncDeficiency(defActual, defActual.DefiInterno);

      return true;
    } catch (err) {
      console.error("❌ Error actualizando DefiInspeccionado:", err);
      return false;
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

      // Iniciar auto-sync
      if (localId) {
        console.log("🔄 Iniciando auto-sync para ID:", localId);
        await autoSyncDeficiency(normalized, localId);
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
      if (!def) return false;

      // 🔴 BORRADO LÓGICO LOCAL SIEMPRE
      await deleteDeficiencyById(defiInterno);

      def.DefiActivo = false;

      console.log(def);

      await autoSyncDeficiency(def);

      return true;

    } catch (err) {
      console.error("❌ Error eliminando deficiencia:", err);
      return false;
    }
  };


  // const normalizeDeficiencyForSync = (def) => ({
  //   ...def,

  //   // 🔹 STRINGS (OBLIGATORIO)
  //   DefiUsuarioInic: def.DefiUsuarioInic != null ? String(def.DefiUsuarioInic) : null,
  //   DefiUsuarioMod: def.DefiUsuarioMod != null ? String(def.DefiUsuarioMod) : null,
  //   DefiUsuCre: def.DefiUsuCre != null ? String(def.DefiUsuCre) : null,
  //   DefiUsuNpc: def.DefiUsuNpc != null ? String(def.DefiUsuNpc) : null,

  //   DefiObservacion: def.DefiObservacion ?? "",
  //   DefiComentario: def.DefiComentario ?? "",

  //   // 🔹 BOOLEANS
  //   DefiActivo: Boolean(def.DefiActivo),
  //   DefiInspeccionado: Boolean(def.DefiInspeccionado),
  //   DefiResponsable: Boolean(def.DefiResponsable),

  //   // 🔹 FECHAS
  //   DefiFecRegistro: normalizeDate(def.DefiFecRegistro),
  //   DefiFecModificacion: normalizeDate(def.DefiFecModificacion),
  //   DefiFechaCreacion: normalizeDate(def.DefiFechaCreacion),
  //   DefiFechaDenuncia: normalizeDate(def.DefiFechaDenuncia),
  //   DefiFechaInspeccion: normalizeDate(def.DefiFechaInspeccion),
  //   DefiFechaSubsanacion: normalizeDate(def.DefiFechaSubsanacion),

  //   // 🔹 IDENTIFICADOR ÚNICO
  //   DefiCol3: def.DefiCol3
  // });
  const normalizeDeficiencyForSync = (def) => {
    const nowIso = new Date().toISOString();

    // ⚠ DefiFecRegistro suele ser requerido en servidor (si es DateTime no-nullable)
    const fecRegistro =
      normalizeDate(def?.DefiFecRegistro) ||
      normalizeDate(def?.DefiFechaCreacion) ||
      nowIso;

    const fecMod =
      normalizeDate(def?.DefiFecModificacion) ||
      nowIso;

    return {
      ...def,

      // 🔹 STRINGS (OBLIGATORIO)
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

      // 🔹 FECHAS (ISO)
      DefiFecRegistro: fecRegistro,
      DefiFecModificacion: fecMod,
      DefiFechaCreacion: normalizeDate(def?.DefiFechaCreacion) || nowIso,
      DefiFechaDenuncia: normalizeDate(def?.DefiFechaDenuncia),
      DefiFechaInspeccion: normalizeDate(def?.DefiFechaInspeccion),
      DefiFechaSubsanacion: normalizeDate(def?.DefiFechaSubsanacion),

      // 🔹 IDENTIFICADOR ÚNICO
      DefiCol3: def?.DefiCol3
    };
  };

  // ------------------- AUTO SYNC -------------------


  // const normalizeDate = (value) => {
  //   if (!value) return null;

  //   // Si ya tiene formato ISO con T, no tocar
  //   if (typeof value === "string" && value.includes("T")) return value;

  //   // Convierte "2026-01-15 09:31:31" -> "2026-01-15T09:31:31"
  //   if (typeof value === "string") {
  //     return value.replace(" ", "T");
  //   }

  //   return value;
  // };
  const normalizeDate = (value) => {
    // Backend (System.Text.Json) suele exigir ISO 8601 válido
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

    // ✅ enviar ISO completo (más compatible)
    return d.toISOString();
  };




  // const autoSyncDeficiency = async (deficiencia, localId) => {
  //   console.log("🔄 [autoSyncDeficiency] Iniciado para ID:", deficiencia);

  //   if (syncing) return;
  //   syncing = true;

  //   try {
  //     const online = await isOnline();
  //     if (!online) {
  //       console.log("📴 Sin conexión, no se sincroniza");
  //       return;
  //     }

  //     const normalized = normalizeDeficiencyForSync(deficiencia);
  //     const payload = [normalized];
  //     console.log(payload);

  //     const response = await client.post(
  //       "/Deficiency/SyncFromSQLite",
  //       payload,
  //       { timeout: 15000 }
  //     );

  //     console.log("📥 Respuesta del servidor:", response.data);

  //     const map = response.data?.[0];
  //     if (!map) {
  //       console.log("⚠ Respuesta vacía del servidor");
  //       return;
  //     }

  //     await setServerIdToDeficiency(localId, map.serverId);
      
  //   } catch (err) {
  //     console.error(
  //       "❌ [autoSyncDeficiency] Falló:",
  //       err?.response?.data || err.message
  //     );
  //   } finally {
  //     syncing = false;
  //   }
  // };

  const autoSyncDeficiency = async (defOrObj, localIdParam) => {
    if (syncing) return;
    syncing = true;

    try {
      const online = await isOnline();
      if (!online) {
        console.log("📴 Sin conexión, no se sincroniza");
        return;
      }

      // ✅ Aceptar ID o objeto
      let def = defOrObj;
      if (typeof defOrObj === "number" || typeof defOrObj === "string") {
        const id = Number(defOrObj);
        def = await getDeficiencyByIdLocal(id);
      }

      if (!def) {
        console.warn("⚠ autoSyncDeficiency: no hay deficiencia para sincronizar");
        return;
      }

      const localId = localIdParam ?? def.DefiInterno;

      // ✅ Asegurar que el payload lleve DefiInterno (útil para el servidor)
      const defToSend = {
        ...def,
        DefiInterno: def.DefiInterno ?? localId
      };

      const normalized = normalizeDeficiencyForSync(defToSend);

      // ✅ IMPORTANTE: el backend espera LISTA COMO ROOT (NO WRAPPER)
      const payload = [normalized];

      console.log("🔄 [autoSyncDeficiency] Enviando (LISTA):", payload);

      const response = await client.post(
        "/Deficiency/SyncFromSQLite",
        payload,
        { timeout: 15000 }
      );

      console.log("📥 Respuesta del servidor:", response.data);

      const map = response.data?.[0] ?? null;
      if (!map?.serverId) {
        console.log("⚠ Respuesta sin serverId:", response.data);
        return;
      }

      await setServerIdToDeficiency(localId, map.serverId);

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
  // const syncAllDeficiencies = async () => {
  //   const online = await isOnline();
  //   if (!online) return { ok: false };

  //   try {
  //     const pendientes = await getDeficienciesPendientes();
  //     if (!pendientes.length) {
  //       return { ok: true, synced: 0 };
  //     }

  //     let syncedCount = 0;

  //     for (const localDef of pendientes) {
  //       // Solo estados sincronizables
  //       if (![1, 2, 3, 4].includes(Number(localDef.EstadoOffLine))) {
  //         continue;
  //       }

  //       const normalized = normalizeDeficiencyForSync(localDef);

  //       try {
  //         const response = await client.post(
  //           "/Deficiency/SyncFromSQLite",
  //           [normalized],
  //           { timeout: 15000 }
  //         );

  //         const map = response.data?.[0];
  //         if (!map?.serverId) {
  //           console.warn("⚠ ServerId inválido:", map);
  //           continue;
  //         }

  //         // ✅ localId VIENE DE SQLITE
  //         await setServerIdToDeficiency(
  //           localDef.DefiInterno,
  //           map.serverId
  //         );

  //         syncedCount++;

  //       } catch (err) {
  //         console.error(
  //           `❌ Error sincronizando DefiInterno ${localDef.DefiInterno}:`,
  //           err?.response?.data || err.message
  //         );
  //         // continúa con el siguiente
  //       }
  //     }

  //     return { ok: true, synced: syncedCount };

  //   } catch (err) {
  //     console.error(
  //       "❌ Sync masivo deficiencias falló:",
  //       err?.response?.data || err.message
  //     );
  //     return { ok: false };
  //   }
  // };
  const syncAllDeficiencies = async () => {
    const online = await isOnline();
    if (!online) return { ok: false };

    try {
      const pendientes = await getDeficienciesPendientes();
      if (!pendientes.length) {
        return { ok: true, synced: 0 };
      }

      let syncedCount = 0;

      for (const localDef of pendientes) {
        if (![1, 2, 3, 4].includes(Number(localDef.EstadoOffLine))) continue;

        // ✅ asegurar DefiInterno
        const defToSend = {
          ...localDef,
          DefiInterno: localDef.DefiInterno
        };

        const normalized = normalizeDeficiencyForSync(defToSend);

        try {
          // ✅ LISTA COMO ROOT
          const response = await client.post(
            "/Deficiency/SyncFromSQLite",
            [normalized],
            { timeout: 15000 }
          );

          const map = response.data?.[0] ?? null;
          if (!map?.serverId) {
            console.warn("⚠ ServerId inválido:", response.data);
            continue;
          }

          await setServerIdToDeficiency(localDef.DefiInterno, map.serverId);
          syncedCount++;

        } catch (err) {
          console.error(
            `❌ Error sincronizando DefiInterno ${localDef.DefiInterno}:`,
            err?.response?.data || err.message
          );
        }
      }

      return { ok: true, synced: syncedCount };

    } catch (err) {
      console.error(
        "❌ Sync masivo deficiencias falló:",
        err?.response?.data || err.message
      );
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


  const generateUUID = () => {
    return uuid.v4();
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
    fetchDeficiencyByIdLocal,
    setDefiInspeccionadoLocal

  };
};
