import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import { basenameFromAnyPath, normalizeRelativePath, safeSeg, stripExt } from "./pathUtils";

export const SAF = FileSystem.StorageAccessFramework;



export const readSafDirectoryAsync = async (dirUri) => {
  if (!dirUri) return [];

  try {
    return (await SAF.readDirectoryAsync(dirUri)) ?? [];
  } catch (e) {
    console.log("[SAF] readDirectoryAsync no legible:", dirUri, e?.message ?? e);
    return [];
  }
};

const isSafDirAccessible = async (dirUri) => {
  if (!dirUri) return null;

  try {
    await SAF.readDirectoryAsync(dirUri);
    return dirUri;
  } catch (e) {
    console.log("[SAF] URI inválido o sin permiso:", dirUri, e?.message ?? e);
    return null;
  }
};

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

  try {
    const saved = await AsyncStorage.getItem(storageKey);

    // 1) Si hay uno guardado, validarlo antes de usarlo
    const validSaved = await isSafDirAccessible(saved);
    if (validSaved) {
      return validSaved;
    }

    // 2) Si estaba guardado pero ya murió, limpiarlo
    if (saved) {
      try {
        await AsyncStorage.removeItem(storageKey);
      } catch { }
    }

    // 3) Pedir permiso otra vez
    const initialUri = SAF.getUriForDirectoryInRoot(rootFolderName);
    const perm = await SAF.requestDirectoryPermissionsAsync(initialUri);

    if (!perm?.granted || !perm?.directoryUri) {
      return null;
    }

    // 4) Validar el nuevo antes de guardarlo
    const validNew = await isSafDirAccessible(perm.directoryUri);
    if (!validNew) {
      return null;
    }

    await AsyncStorage.setItem(storageKey, validNew);
    return validNew;
  } catch (e) {
    console.log("[SAF] Request cancelled or failed", e);
    return null;
  }
};

export const getSavedPublicDir = async (storageKey) => {
  if (Platform.OS !== "android") return null;

  try {
    const saved = await AsyncStorage.getItem(storageKey);
    if (!saved) return null;

    const validSaved = await isSafDirAccessible(saved);
    if (validSaved) {
      return validSaved;
    }

    try {
      await AsyncStorage.removeItem(storageKey);
    } catch { }

    return null;
  } catch (e) {
    console.log("[SAF] Saved dir inválido:", e?.message ?? e);
    return null;
  }
};

const ensureSafSubdir = async (parentUri, dirNameRaw) => {
  const dirName = safeSeg(dirNameRaw);

  if (!parentUri) {
    throw new Error(`SAF parentUri inválido para crear carpeta: ${dirName}`);
  }

  const childrenBefore = await readSafDirectoryAsync(parentUri);
  const existing = childrenBefore.find((u) => safDisplayName(u) === dirName);

  if (existing) return existing;

  await SAF.makeDirectoryAsync(parentUri, dirName);

  // MUY IMPORTANTE:
  // no usar la URI cruda devuelta por makeDirectoryAsync;
  // volver a listar el padre y recuperar la URI real utilizable.
  const childrenAfter = await readSafDirectoryAsync(parentUri);
  const createdResolved = childrenAfter.find((u) => safDisplayName(u) === dirName);

  if (createdResolved) return createdResolved;

  throw new Error(`No se pudo resolver la carpeta SAF creada: ${dirName}`);
};

export const ensureSafPath = async (rootUri, segments) => {
  if (!rootUri) {
    throw new Error("SAF rootUri inválido");
  }

  let current = rootUri;

  for (const seg of segments) {
    current = await ensureSafSubdir(current, seg);
  }

  return current;
};

const findSafSubdir = async (parentUri, dirNameRaw) => {
  const dirName = safeSeg(dirNameRaw);

  if (!parentUri) return null;

  try {
    const children = await readSafDirectoryAsync(parentUri);
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

export const writeFileIntoSafDir = async ({
  dirUri,
  fileName,
  mimeType,
  sourceFileUri,
  skipLookup = false,
}) => {
  if (!dirUri) {
    throw new Error("SAF dirUri inválido");
  }

  const finalMime = guessMime(fileName, mimeType);

  const base64 = await FileSystem.readAsStringAsync(sourceFileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  let safFileUri = null;

  if (!skipLookup) {
    const children = await readSafDirectoryAsync(dirUri);
    const existing = children.find((u) => safNameMatches(u, fileName));
    safFileUri = existing ?? null;
  }

  if (!safFileUri) {
    safFileUri = await SAF.createFileAsync(dirUri, stripExt(fileName), finalMime);
  }

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

    // quitamos el archivo
    segs.pop();
    if (!segs.length) return;

    const stopIdx = segs.indexOf(stopAtSeg);
    const minLen = stopIdx >= 0 ? stopIdx + 1 : 1;

    for (let i = segs.length; i > minLen; i--) {
      const currentSegs = segs.slice(0, i);
      const dirUri = await findSafPath(rootUri, currentSegs);
      if (!dirUri) break;

      const children = await readSafDirectoryAsync(dirUri);
      if (children.length > 0) break;

      await SAF.deleteAsync(dirUri);
    }
  } catch {
    // silencioso
  }
};