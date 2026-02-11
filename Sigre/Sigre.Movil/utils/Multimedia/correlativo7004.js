import * as FileSystem from "expo-file-system/legacy";
import { ROOT_MEDIA, ROOT_TRASH } from "./constants";

export const extract7004IndexFromPath = (path) => {
  if (!path) return null;
  const p = String(path);

  let m = p.match(/(?:^|\/)7004\/(\d+)(?:\/|$)/);
  if (m) return parseInt(m[1], 10);

  m = p.match(/(?:^|\/)7004\.(\d+)(?:\.|\/|$)/);
  if (m) return parseInt(m[1], 10);

  return null;
};

const listNumericSubdirs = async (dirUri) => {
  try {
    const info = await FileSystem.getInfoAsync(dirUri);
    if (!info.exists || !info.isDirectory) return [];

    const children = await FileSystem.readDirectoryAsync(dirUri);
    return children
      .filter((name) => /^\d+$/.test(name))
      .map((name) => parseInt(name, 10))
      .filter((n) => Number.isFinite(n));
  } catch {
    return [];
  }
};

const listOld7004Folders = async (elementDirUri) => {
  try {
    const info = await FileSystem.getInfoAsync(elementDirUri);
    if (!info.exists || !info.isDirectory) return [];

    const children = await FileSystem.readDirectoryAsync(elementDirUri);
    const nums = [];

    for (const name of children) {
      const m = String(name).match(/^7004\.(\d+)(?:\.|$)/);
      if (m) nums.push(parseInt(m[1], 10));
    }

    return nums.filter((n) => Number.isFinite(n));
  } catch {
    return [];
  }
};

export const getNext7004Correlativo = async (elementBaseRel) => {
  const afterRoot = elementBaseRel.startsWith(ROOT_MEDIA)
    ? elementBaseRel.slice(ROOT_MEDIA.length)
    : elementBaseRel;

  const active7004Dir = FileSystem.documentDirectory + `${elementBaseRel}7004/`;
  const trash7004Dir = FileSystem.documentDirectory + `${ROOT_TRASH}${afterRoot}7004/`;

  const activeElementDir = FileSystem.documentDirectory + elementBaseRel;
  const trashElementDir = FileSystem.documentDirectory + `${ROOT_TRASH}${afterRoot}`;

  const nums = [
    ...(await listNumericSubdirs(active7004Dir)),
    ...(await listNumericSubdirs(trash7004Dir)),
    ...(await listOld7004Folders(activeElementDir)),
    ...(await listOld7004Folders(trashElementDir)),
  ];

  const max = nums.length ? Math.max(...nums) : 0;
  return max + 1;
};
