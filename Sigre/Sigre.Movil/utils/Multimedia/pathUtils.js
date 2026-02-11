import * as FileSystem from "expo-file-system/legacy";
import { ROOT_MEDIA, ROOT_TRASH } from "./constants";

export const safeSeg = (value, fallback = "UNK") => {
  const s = String(value ?? "").trim();
  const cleaned = s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "")
    .trim();

  const out = cleaned.length ? cleaned : fallback;
  return out.toUpperCase().slice(0, 60);
};

export const cleanUri = (u) => (u ? u.split("?")[0] : u);

export const basenameFromAnyPath = (p = "") => {
  const clean = String(p).split("?")[0];
  const parts = clean.split("/");
  return parts[parts.length - 1] || "";
};

export const stripExt = (fileName = "") => {
  const clean = basenameFromAnyPath(fileName);
  const dot = clean.lastIndexOf(".");
  return dot > 0 ? clean.slice(0, dot) : clean;
};

export const normalizeRelativePath = (p) => {
  if (!p) return p;
  let s = String(p).split("?")[0];

  if (s.startsWith("file://")) {
    const i1 = s.indexOf("SIGRE.MOVIL");
    const i2 = s.indexOf("ELIMINADOS");
    if (i1 !== -1) s = s.slice(i1);
    else if (i2 !== -1) s = s.slice(i2);
  }

  if (s.startsWith(FileSystem.documentDirectory)) {
    s = s.replace(FileSystem.documentDirectory, "");
  }

  return s.replace(/^\/+/, "");
};

export const toTrashRelativePath = (oldRelativePath) => {
  if (!oldRelativePath) return null;
  if (oldRelativePath.startsWith(ROOT_MEDIA)) {
    return ROOT_TRASH + oldRelativePath.substring(ROOT_MEDIA.length);
  }
  return ROOT_TRASH + oldRelativePath.replace(/^\/+/, "");
};

export const getDirFromRelative = (relPath) => {
  const idx = relPath.lastIndexOf("/");
  return idx >= 0 ? relPath.substring(0, idx + 1) : "";
};

const pad2 = (n) => String(n).padStart(2, "0");

const getStampParts = (d = new Date()) => {
  const y = d.getFullYear();
  const mo = pad2(d.getMonth() + 1);
  const da = pad2(d.getDate());

  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  const ss = pad2(d.getSeconds());
  const cs = pad2(Math.floor(d.getMilliseconds() / 10));

  return { date: `${y}${mo}${da}`, time: `${hh}${mi}${ss}${cs}` };
};

export const getUniqueStampParts = (offsetMs = 0) =>
  getStampParts(new Date(Date.now() + offsetMs));

export const buildMediaName = ({ prefix, sed, codigo, def, suffix, ext, date, time }) => {
  const sSed = safeSeg(sed, "SINSED");
  const sCod = safeSeg(codigo, "UNK");
  const sDef = safeSeg(def, "SINDEF");
  return `${prefix}-${sSed}-${sCod}-${sDef}-${date}-${time}-${suffix}.${ext}`;
};
