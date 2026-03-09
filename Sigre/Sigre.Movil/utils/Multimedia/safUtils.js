import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import { basenameFromAnyPath, normalizeRelativePath, safeSeg, stripExt } from "./pathUtils";

export const SAF = FileSystem.StorageAccessFramework;

export const safDisplayName = (uri) => {
  try {
    const dec = decodeURIComponent(uri);
    const afterDocument = dec.includes("/document/") ? dec.split("/document/")[1] : dec;
    const path = afterDocument.includes(":") ? afterDocument.split(":").slice(1).join(":") : afterDocument;
    const parts = path.split("/");
    return parts[parts.length - 1];
  } catch (e) {
    return "";
  }
};

export const guessMime = (fileName, fallback) => {
  if (/\.png$/i.test(fileName)) return "image/png";
  if (/\.jpe?g$/i.test(fileName)) return "image/jpeg";
  if (/\.m4a$/i.test(fileName)) return "audio/mp4";
  if (/\.mp3$/i.test(fileName)) return "audio/mpeg";
  return fallback;
};

export const safNameMatches = (uri, fileName) => {
  const n = String(safDisplayName(uri) || "").toLowerCase();
  const a = String(fileName || "").toLowerCase();
  const b = stripExt(fileName).toLowerCase();
  return n === a || n === b || stripExt(n).toLowerCase() === b;
};

export const getOrRequestPublicDir = async (rootFolderName, storageKey) => {
  if (Platform.OS !== "android") return null;
  const saved = await AsyncStorage.getItem(storageKey);
  if (saved) return saved;

  try {
    const initialUri = SAF.getUriForDirectoryInRoot(rootFolderName);
    const perm = await SAF.requestDirectoryPermissionsAsync(initialUri);
    if (!perm.granted) return null;
    await AsyncStorage.setItem(storageKey, perm.directoryUri);
    return perm.directoryUri;
  } catch (e) {
    console.log("SAF Request cancelled or failed", e);
    return null;
  }
};

export const getSavedPublicDir = async (storageKey) => {
  if (Platform.OS !== "android") return null;
  try {
    const saved = await AsyncStorage.getItem(storageKey);
    return saved || null;
  } catch {
    return null;
  }
};

const ensureSafSubdir = async (parentUri, dirNameRaw) => {
  const dirName = safeSeg(dirNameRaw);
  try {
    const children = await SAF.readDirectoryAsync(parentUri);
    const existing = children.find((u) => safDisplayName(u) === dirName);
    if (existing) return existing;
    return await SAF.makeDirectoryAsync(parentUri, dirName);
  } catch (e) {
    console.warn(`Error check SAF ${dirName}:`, e.message);
    return await SAF.makeDirectoryAsync(parentUri, dirName);
  }
};

export const ensureSafPath = async (rootUri, segments) => {
  let current = rootUri;
  for (const seg of segments) {
    current = await ensureSafSubdir(current, seg);
  }
  return current;
};

const findSafSubdir = async (parentUri, dirNameRaw) => {
  const dirName = safeSeg(dirNameRaw);
  try {
    const children = await SAF.readDirectoryAsync(parentUri);
    const existing = children.find((u) => safDisplayName(u) === dirName);
    return existing ?? null;
  } catch {
    return null;
  }
};

const findSafPath = async (rootUri, segments) => {
  let current = rootUri;
  for (const seg of segments) {
    const next = await findSafSubdir(current, seg);
    if (!next) return null;
    current = next;
  }
  return current;
};

export const safDirForRelativeFileReadOnly = async (rootUri, relativePath) => {
  const segs = String(relativePath || "")
    .split("?")[0]
    .split("/")
    .filter(Boolean);

  segs.pop();
  if (!segs.length) return null;

  return await findSafPath(rootUri, segs);
};

export const safDirForRelativeFile = async (rootUri, relativePath) => {
  const segs = String(relativePath || "")
    .split("?")[0]
    .split("/")
    .filter(Boolean);

  segs.pop();
  return ensureSafPath(rootUri, segs);
};

export const safTrashDirForRelativeFile = async (rootUri, relativePath) => {
  const segs = String(relativePath || "")
    .split("?")[0]
    .split("/")
    .filter(Boolean);

  segs.pop();
  if (segs.length > 0) segs[0] = "ELIMINADOS";
  return ensureSafPath(rootUri, segs);
};

export const writeFileIntoSafDir = async ({ dirUri, fileName, mimeType, sourceFileUri }) => {
  const finalMime = guessMime(fileName, mimeType);

  const base64 = await FileSystem.readAsStringAsync(sourceFileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const children = await SAF.readDirectoryAsync(dirUri);
  const existing = children.find((u) => safNameMatches(u, fileName));

  const safFileUri =
    existing ??
    (await SAF.createFileAsync(dirUri, stripExt(fileName), finalMime));

  await FileSystem.writeAsStringAsync(safFileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return safFileUri;
};

export const resolvePublicUriFromDbPath = async ({ rootUri, archNombre, listDirCached }) => {
  if (Platform.OS !== "android" || !rootUri) return null;

  const rel = normalizeRelativePath(archNombre);
  const fileName = basenameFromAnyPath(rel);
  if (!fileName) return null;

  const dirUri = await safDirForRelativeFileReadOnly(rootUri, rel);
  if (!dirUri) return null;

  const children = await listDirCached(dirUri);
  return children.find((u) => safNameMatches(u, fileName)) ?? null;
};

export const cleanupEmptyAncestorsSaf = async (rootUri, relativeFilePath, stopAtSeg = "SIGRE.MOVIL") => {
  try {
    if (Platform.OS !== "android") return;
    if (!rootUri || !relativeFilePath) return;

    const rel = normalizeRelativePath(relativeFilePath);
    const segs = rel.split("?")[0].split("/").filter(Boolean);

    // quitamos el archivo (último segmento)
    segs.pop();
    if (!segs.length) return;

    const stopIdx = segs.indexOf(stopAtSeg);
    const minLen = stopIdx >= 0 ? stopIdx + 1 : 1; // nunca borres stopAtSeg

    for (let i = segs.length; i > minLen; i--) {
      const currentSegs = segs.slice(0, i);
      const dirUri = await findSafPath(rootUri, currentSegs); // ✅ usa el helper interno
      if (!dirUri) break;

      const children = (await SAF.readDirectoryAsync(dirUri)) ?? [];
      if (children.length > 0) break; // ya no está vacía

      await SAF.deleteAsync(dirUri);
    }
  } catch {
    // silencioso
  }
};