import { runQuery } from "../../database/offlineDB/db";
import { ROOT_MEDIA } from "./constants";

export const extract7004IndexFromPath = (path) => {
  if (!path) return null;

  const p = String(path);

  // Formato nuevo: .../7004/3/...
  let m = p.match(/(?:^|\/)7004\/(\d+)(?:\/|$)/);
  if (m) return parseInt(m[1], 10);

  // Formatos antiguos: .../7004.3/... o .../7004_3/...
  m = p.match(/(?:^|\/)7004[._](\d+)(?:[._\/]|$)/);
  if (m) return parseInt(m[1], 10);

  return null;
};

const escapeLikeValue = (value) => {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
};

const normalizeElementTail = (elementBaseRel) => {
  if (!elementBaseRel) return "";

  let tail = String(elementBaseRel).trim();

  if (tail.startsWith(ROOT_MEDIA)) {
    tail = tail.slice(ROOT_MEDIA.length);
  }

  tail = tail.replace(/^\/+/, "");

  if (tail && !tail.endsWith("/")) {
    tail += "/";
  }

  return tail;
};

const getMax7004CorrelativoByElementFromDb = async (elementBaseRel) => {
  try {
    const afterRoot = normalizeElementTail(elementBaseRel);
    if (!afterRoot) return 0;

    const escapedTail = escapeLikeValue(afterRoot);

    const likeNew = `%${escapedTail}7004/%`;     // .../ALIM/SED/TIPO/COD/7004/3/...
    const likeOldDot = `%${escapedTail}7004.%`; // .../ALIM/SED/TIPO/COD/7004.3/...
    const likeOldUnd = `%${escapedTail}7004\\_%`; // .../ALIM/SED/TIPO/COD/7004_3/...

    const rows = await runQuery(
      `
      SELECT ArchNombre
      FROM Archivos
      WHERE ArchTabla = 'Deficiencias'
        AND (
          ArchNombre LIKE ? ESCAPE '\\'
          OR ArchNombre LIKE ? ESCAPE '\\'
          OR ArchNombre LIKE ? ESCAPE '\\'
        );
      `,
      [likeNew, likeOldDot, likeOldUnd]
    );

    let max = 0;

    for (const row of rows ?? []) {
      const n = extract7004IndexFromPath(row?.ArchNombre);
      if (Number.isFinite(n) && n > max) {
        max = n;
      }
    }

    return max;
  } catch (e) {
    console.warn("⚠️ Error obteniendo correlativo 7004 desde BD local:", e?.message ?? e);
    return 0;
  }
};

export const getNext7004Correlativo = async (elementBaseRel) => {
  const maxDb = await getMax7004CorrelativoByElementFromDb(elementBaseRel);
  return maxDb > 0 ? maxDb + 1 : 1;
};