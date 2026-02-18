import { formatLocalISO, getUniqueNowMs, roundMsForSqlDatetime } from "../../utils/dateUtils";

import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

import { KEY_MUSIC_DIR, KEY_PICTURES_DIR } from "../../utils/Multimedia/constants";
import { ensureDirExists } from "../../utils/Multimedia/fsUtils";

import {
  basenameFromAnyPath,
  getDirFromRelative,
  normalizeRelativePath,
  toTrashRelativePath,
} from "../../utils/Multimedia/pathUtils";

import {
  SAF,
  getOrRequestPublicDir,
  safDirForRelativeFile,
  safNameMatches,
  safTrashDirForRelativeFile,
  writeFileIntoSafDir,
} from "../../utils/Multimedia/safUtils";



import { runQuery } from "./db";

// const emptyToNull = (v) =>
//   typeof v === "string" && v.trim() === "" ? null : v;

export const getDeficiencyByIdLocal = async (defiInterno) => {
  try {
    const rows = await runQuery(
      `SELECT *
          FROM Deficiencias
          WHERE DefiInterno = ?
          LIMIT 1`,
      [defiInterno]
    );

    return rows?.[0] ?? null;

  } catch (error) {
    console.error("❌ Error obteniendo deficiencia por ID local:", error);
    return null;
  }
};

// ✅ Actualiza solo el flag DefiInspeccionado (usado en validaciones post-guardar/finalizar)
export const updateDefiInspeccionadoLocal = async (
  defiInterno,
  inspeccionado,
  usuarioId = null,
  nowIso = null
) => {
  try {
    const now =
      nowIso ??
      (() => {
        const msRaw = getUniqueNowMs();
        const ms = roundMsForSqlDatetime(msRaw);
        return formatLocalISO(ms);
      })();

    await runQuery(
      `UPDATE Deficiencias
          SET DefiInspeccionado = ?,
              DefiUsuarioMod = COALESCE(?, DefiUsuarioMod),
              DefiFecModificacion = ?,
              EstadoOffLine = CASE WHEN EstadoOffLine = 2 THEN 2 ELSE 1 END
          WHERE DefiInterno = ?`,
      [
        Number(inspeccionado) ? 1 : 0,
        usuarioId != null ? String(usuarioId) : null,
        now,
        defiInterno,
      ]
    );

    return true;
  } catch (error) {
    console.error("❌ Error actualizando DefiInspeccionado:", error);
    return false;
  }
};





// export const updateDefiInspeccionadoLocal = async (defiInterno, inspeccionado) => {
//   const val = Number(inspeccionado) === 1 ? 1 : 0;

//   await runQuery(
//     `
//     UPDATE Deficiencias
//     SET DefiInspeccionado = ?
//     WHERE DefiInterno = ?
//     `,
//     [val, defiInterno]
//   );

//   return true;
// };






export const getDeficiencyByTypificationElement = async (idElement, typeElement, idTypification) => {
  try {
    const deficiency = await runQuery(
      `SELECT *
          FROM Deficiencias d
          WHERE d.DefiIdElemento = ? AND d.DefiTipoElemento = ? AND d.TipiInterno = ? AND d.DefiActivo = 1`,
      [idElement, typeElement, idTypification]
    );

    if (!deficiency || deficiency.length === 0) {
      console.warn(`⚠ No se encontró deficiencia para el elemento ${idElement}`);
      return [];
    }

    return deficiency;
  } catch (error) {
    console.error(`❌ Error al obtener la deficiencia:`, error);
    return [];
  }
};

export const getDeficienciesByElement = async (idElement, typeElement) => {
  try {
    const deficiency = await runQuery(
      `SELECT *
          FROM Deficiencias d
          WHERE d.DefiIdElemento = ? AND d.DefiTipoElemento = ? AND d.DefiActivo = 1`,
      [idElement, typeElement]
    );

    if (!deficiency || deficiency.length === 0) {
      console.warn(`⚠ No se encontró deficiencia para el elemento ${idElement}`);
      return [];
    }

    return deficiency;
  } catch (error) {
    console.error(`❌ Error al obtener la deficiencia:`, error);
    return [];
  }
};


export const saveOrUpdateDeficiency = async (def) => {
  try {
    const allFields = [
      "DefiInterno",
      "DefiEstado",
      "TablInterno",
      "DefiCodigoElemento",
      "TipiInterno",
      "DefiNumSuministro",
      "DefiFechaDenuncia",
      "DefiFechaInspeccion",
      "DefiObservacion",
      "DefiEstadoSubsanacion",
      "DefiLatitud",
      "DefiLongitud",
      "DefiTipoElemento",
      "DefiDistHorizontal",
      "DefiDistVertical",
      "DefiDistTransversal",
      "DefiIdElemento",
      "DefiFecRegistro",
      "DefiCodAmt",
      "DefiFecModificacion",
      "DefiFechaCreacion",
      "DefiPozoTierra",
      "DefiResponsable",
      "DefiComentario",
      "DefiPozoTierra2",
      "DefiUsuarioInic",
      "DefiUsuarioMod",
      "DefiActivo",
      "DefiEstadoCriticidad",
      "DefiInspeccionado",
      "DefiCol1",
      "DefiCol2",
      "DefiCol3",
      "DefiAccesibilidad",
      "DefiTipoCruce",
      "EstadoOffLine"
    ];

    // ---------------- UPDATE ----------------
    if (def.DefiInterno) {
      const updateFields = allFields.filter(f => f !== "DefiInterno");

      // 🔴 FIX: UPDATE = 1
      const estado = def.EstadoOffLine == null ? 1 : def.EstadoOffLine;

      const updateQuery = `
            UPDATE Deficiencias
            SET ${updateFields.map(f => `${f} = ?`).join(", ")}
            WHERE DefiInterno = ?
          `;

      const updateValues = [
        ...updateFields.map(f =>
          f === "EstadoOffLine" ? estado : def[f] ?? null
        ),
        def.DefiInterno
      ];

      await runQuery(updateQuery, updateValues);
      return def.DefiInterno;
    }

    // ---------------- INSERT ----------------
    const insertFields = allFields.filter(f => f !== "DefiInterno");

    const insertQuery = `
          INSERT INTO Deficiencias (${insertFields.join(", ")})
          VALUES (${insertFields.map(() => "?").join(", ")})
        `;

    const insertValues = insertFields.map(f =>
      f === "EstadoOffLine" ? 2 : def[f] ?? null
    );

    const result = await runQuery(insertQuery, insertValues);

    return result?.lastInsertRowId ?? null;

  } catch (error) {
    console.error("❌ Error guardando o actualizando deficiencia:", error);
    throw error;
  }
};

export const deleteDeficiencyById = async (
  defiInterno,
  usuarioId = null,
  nowIso = null
) => {
  try {
    // 0) Leer deficiencia (para DefiUUID)
    const defRow = await getDeficiencyByIdLocal(defiInterno);
    if (!defRow) return false;

    const defiUUID = String(defRow.DefiCol3 ?? "").trim(); // tu UUID
    if (!defiUUID) {
      console.warn("⚠ deleteDeficiencyById: DefiCol3 (DefiUUID) vacío.");
    }

    const now =
      nowIso ??
      (() => {
        const msRaw = getUniqueNowMs();
        const ms = roundMsForSqlDatetime(msRaw);
        return formatLocalISO(ms);
      })();

    // 1) Traer archivos activos asociados (por UUID)
    const archivos = defiUUID
      ? await runQuery(
        `
          SELECT ArchInterno, ArchNombre, ArchTipo, EstadoOffLine
          FROM Archivos
          WHERE ArchTabla = 'Deficiencias'
            AND DefiUUID = ?
            AND ArchActivo = 1
        `,
        [defiUUID]
      )
      : [];

    const hasPhotos = (archivos ?? []).some((a) => Number(a?.ArchTipo) > 0);
    const hasAudios = (archivos ?? []).some((a) => Number(a?.ArchTipo) === 0);

    // 2) Preparar roots SAF (Android)
    let picturesRoot = null;
    let musicRoot = null;

    if (Platform.OS === "android") {
      if (hasPhotos) picturesRoot = await getOrRequestPublicDir("Pictures", KEY_PICTURES_DIR);
      if (hasAudios) musicRoot = await getOrRequestPublicDir("Music", KEY_MUSIC_DIR);
      // si no hay root, igual seguimos (BD se marca), pero no se podrá mover físico
      if (hasPhotos && !picturesRoot) console.warn("⚠ No hay PicturesRoot SAF, no se moverán fotos físicas.");
      if (hasAudios && !musicRoot) console.warn("⚠ No hay MusicRoot SAF, no se moverán audios físicos.");
    }

    const movePublicToTrashSaf = async ({ rootUri, oldRel, mimeType }) => {
      if (!rootUri) return false;

      const fileName = basenameFromAnyPath(oldRel);
      if (!fileName) return false;

      const srcDir = await safDirForRelativeFile(rootUri, oldRel);
      const dstDir = await safTrashDirForRelativeFile(rootUri, oldRel);
      if (!srcDir || !dstDir) return false;

      // intentar mover desde pública
      try {
        const files = (await SAF.readDirectoryAsync(srcDir)) ?? [];
        const oldSafFile = files.find((u) => safNameMatches(u, fileName));

        if (oldSafFile) {
          await writeFileIntoSafDir({
            dirUri: dstDir,
            fileName,
            mimeType,
            sourceFileUri: oldSafFile,
          });
          await SAF.deleteAsync(oldSafFile);
          return true;
        }
      } catch { }

      // fallback: si existe en privado (por si acaso), lo copiamos a trash pública
      const oldLocalUri = FileSystem.documentDirectory + oldRel;
      try {
        const info = await FileSystem.getInfoAsync(oldLocalUri);
        if (info.exists) {
          await writeFileIntoSafDir({
            dirUri: dstDir,
            fileName,
            mimeType,
            sourceFileUri: oldLocalUri,
          });
          try { await FileSystem.deleteAsync(oldLocalUri, { idempotent: true }); } catch { }
          return true;
        }
      } catch { }

      return false;
    };

    const movePrivateToTrash = async (oldRel) => {
      const trashRel = toTrashRelativePath(oldRel);
      const oldUri = FileSystem.documentDirectory + oldRel;
      const trashUri = FileSystem.documentDirectory + trashRel;

      try {
        const info = await FileSystem.getInfoAsync(oldUri);
        if (!info.exists) return false;

        const trashDir = FileSystem.documentDirectory + getDirFromRelative(trashRel);
        await ensureDirExists(trashDir);

        await FileSystem.moveAsync({ from: oldUri, to: trashUri });
        return true;
      } catch {
        return false;
      }
    };

    // 3) Mover físico + actualizar BD de Archivos (ArchActivo=0 + ruta a ELIMINADOS)
    for (const a of archivos ?? []) {
      const oldRel = normalizeRelativePath(a.ArchNombre);
      const trashRel = toTrashRelativePath(oldRel);
      const tipo = Number(a?.ArchTipo);

      // mover físico
      try {
        if (Platform.OS === "android") {
          if (tipo === 0) {
            await movePublicToTrashSaf({ rootUri: musicRoot, oldRel, mimeType: "audio/mp4" });
          } else {
            await movePublicToTrashSaf({ rootUri: picturesRoot, oldRel, mimeType: "image/jpeg" });
          }
        } else {
          // iOS: todo está en privado
          await movePrivateToTrash(oldRel);
        }
      } catch (e) {
        console.warn("⚠ move file to trash error:", e?.message ?? e);
      }

      // marcar registro como eliminado en SQLITE
      await runQuery(
        `
        UPDATE Archivos
        SET ArchActivo = 0,
            ArchNombre = ?,
            EstadoOffLine = CASE
              WHEN EstadoOffLine = 2 THEN NULL
              ELSE 3
            END
        WHERE ArchInterno = ?
        `,
        [trashRel, a.ArchInterno]
      );
    }

    // 4) Soft-delete deficiencia
    await runQuery(
      `
      UPDATE Deficiencias
      SET DefiActivo = 0,
          DefiInspeccionado = 0,
          DefiUsuarioMod = COALESCE(?, DefiUsuarioMod),
          DefiFecModificacion = ?,
          EstadoOffLine = CASE
            WHEN EstadoOffLine = 2 AND (DefiServerId IS NULL OR DefiServerId = 0) THEN NULL
            ELSE 3
          END
      WHERE DefiInterno = ?
      `,
      [usuarioId != null ? String(usuarioId) : null, now, defiInterno]
    );

    return true;
  } catch (error) {
    console.error("❌ Error eliminando deficiencia (deleteDeficiencyById):", error);
    return false;
  }
};






export const getDeficienciesPendientes = async () => {
  return await runQuery(`
        SELECT *
        FROM Deficiencias
        WHERE EstadoOffLine IN (1, 2, 3)
      `);
};

export const markDeficiencyAsSynced = async (defiInterno) => {
  const query = `
        UPDATE Deficiencias
        SET EstadoOffLine = NULL
        WHERE DefiInterno = ?
      `;
  await runQuery(query, [defiInterno]);
};

export const updateDeficiencyIdAfterSync = async (localId, serverId) => {
  const query = `
        UPDATE Deficiencias
        SET DefiServerId = ?, 
            EstadoOffLine = NULL
        WHERE DefiInterno = ? 
      `;
  await runQuery(query, [serverId, localId]);
};

export const getDeficienciesByElementAndTypi = async (idElement, typeElement, tipiInterno) => {
  try {
    const deficiencias = await runQuery(
      `SELECT *
          FROM Deficiencias
          WHERE DefiIdElemento = ?
            AND DefiTipoElemento = ?
            AND TipiInterno = ?
            AND DefiActivo = 1`,
      [idElement, typeElement, tipiInterno]
    );

    if (!deficiencias || deficiencias.length === 0) {
      console.warn(`⚠ No se encontraron deficiencias para el elemento ${idElement} y tipiInterno ${tipiInterno}`);
      return [];
    }

    return deficiencias;
  } catch (error) {
    console.error(`❌ Error al obtener deficiencias:`, error);
    return [];
  }
};

export const getComentarioEstandarByTypificationIdLocal = async (typificationId) => {
  try {
    const id = Number(typificationId);
    if (!Number.isFinite(id) || id <= 0) return "";

    const rows = await runQuery(
      `SELECT ComentarioEstandar
          FROM Tipificaciones
          WHERE TypificationId = ?
          LIMIT 1`,
      [id]
    );

    const v = rows?.[0]?.ComentarioEstandar ?? "";
    return String(v ?? "").trim();
  } catch (error) {
    console.error("❌ Error obteniendo ComentarioEstandar (Tipificaciones):", error);
    return "";
  }
};


// export const fetchDeficienciesForFlatList = async (elementId, typeElement) => {
//   try {
//     const query = `
//       SELECT 
//         d.DefiInterno,
//         d.TablInterno,
//         d.DefiIdElemento,
//         d.DefiTipoElemento,
//         d.DefiNumSuministro,
//         t.TypificationId AS TipiInterno,
//         t.Code,
//         t.Component,
//         t.Deficiency
//       FROM Deficiencias d
//       LEFT JOIN Tipificaciones t
//         ON d.TipiInterno = t.TypificationId
//       WHERE d.DefiIdElemento = ?
//         AND d.DefiTipoElemento = ?
//         AND DefiActivo = 1
//       ORDER BY d.DefiInterno ASC;
//     `;
//     const results = await runQuery(query, [elementId, typeElement]);
//     return results;
//   } catch (error) {
//     console.error("Error fetching deficiencies for FlatList:", error);
//     return [];
//   }
// };

export const fetchDeficienciesForFlatList = async (elementId, typeElement) => {
  try {
    const query = `
          SELECT 
            d.DefiInterno,
            d.TablInterno,
            d.DefiIdElemento,
            d.DefiTipoElemento,
            d.DefiNumSuministro,
            d.DefiUsuarioInic,
            d.DefiObservacion,
            d.DefiComentario,
            d.DefiDistVertical,
            d.DefiDistHorizontal,
            t.TypificationId AS TipiInterno,
            t.Code,
            t.Component,
            t.Deficiency,
            t.Typification
          FROM Deficiencias d
          LEFT JOIN Tipificaciones t
            ON d.TipiInterno = t.TypificationId
          WHERE d.DefiIdElemento = ?
            AND d.DefiTipoElemento = ?
            AND d.DefiActivo = 1
          ORDER BY d.DefiInterno ASC;
        `;

    const results = await runQuery(query, [elementId, typeElement]);
    return results;
  } catch (error) {
    console.error("Error fetching deficiencies for FlatList:", error);
    return [];
  }
};


export const markDeficiencyAsSyncing = async (defiInterno) => {
  await runQuery(
    `
        UPDATE Deficiencias
        SET EstadoOffLine = 4
        WHERE DefiInterno = ?
        `,
    [defiInterno]
  );

  return true;
};

export const getDeficienciesPendientesReanudables = async () => {
  return await runQuery(`
        SELECT *
        FROM Deficiencias
        WHERE EstadoOffLine IN (1, 2, 3, 4)
        ORDER BY DefiInterno
      `);
};

export const setServerIdToDeficiency = async (localId, serverId) => {
  try {
    await runQuery(
      `
          UPDATE Deficiencias
          SET DefiServerId = ?,
              EstadoOffLine = NULL
          WHERE DefiInterno = ?
          `,
      [serverId, localId]
    );

    return true;
  } catch (error) {
    console.error(
      "❌ Error asignando DefiServerId a la deficiencia:",
      error
    );
    return false;
  }
};


// ✅ Recalcula si el ELEMENTO (POST/VANO) está inspeccionado según sus deficiencias activas.
// Regla: si NO hay deficiencias activas => inspeccionado = 0
export const recalcElementoInspeccionadoLocal = async (elementId, typeElement) => {
  try {
    const eid = Number(elementId);
    const te = String(typeElement || "").trim().toUpperCase();

    if (!Number.isFinite(eid) || eid <= 0) {
      return { ok: false, reason: "elementId inválido", inspected: 0, total: 0, done: 0 };
    }

    if (te !== "POST" && te !== "VANO") {
      return { ok: false, reason: "typeElement inválido", inspected: 0, total: 0, done: 0 };
    }

    const rowsTotal = await runQuery(
      `SELECT COUNT(*) AS c
       FROM Deficiencias
       WHERE DefiActivo = 1
         AND DefiIdElemento = ?
         AND DefiTipoElemento = ?`,
      [eid, te]
    );

    const total = Number(rowsTotal?.[0]?.c ?? 0);

    const rowsDone = await runQuery(
      `SELECT COUNT(*) AS c
       FROM Deficiencias
       WHERE DefiActivo = 1
         AND DefiIdElemento = ?
         AND DefiTipoElemento = ?
         AND DefiInspeccionado = 1`,
      [eid, te]
    );

    const done = Number(rowsDone?.[0]?.c ?? 0);

    // ✅ regla pedida: todas las activas deben tener DefiInspeccionado=1
    // ✅ si no hay activas => 0
    const inspected = total > 0 && done === total ? 1 : 0;

    if (te === "POST") {
      await runQuery(
        `UPDATE Postes
         SET PostInspeccionado = ?
         WHERE PostInterno = ?`,
        [inspected, eid]
      );
    } else {
      await runQuery(
        `UPDATE Vanos
         SET VanoInspeccionado = ?
         WHERE VanoInterno = ?`,
        [inspected, eid]
      );
    }

    return { ok: true, inspected, total, done };
  } catch (e) {
    console.error("❌ recalcElementoInspeccionadoLocal error:", e);
    return { ok: false, reason: String(e?.message ?? e), inspected: 0, total: 0, done: 0 };
  }
};
