import * as FileSystem from "expo-file-system/legacy";

export const ensureDirExists = async (dir) => {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
};
