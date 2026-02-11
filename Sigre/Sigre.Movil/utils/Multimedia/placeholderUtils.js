import * as FileSystem from "expo-file-system/legacy";
import { PLACEHOLDER_PREFIX } from "./constants";

export const PLACEHOLDER_DIR =
  FileSystem.documentDirectory + "SIGRE.MOVIL/__PLACEHOLDERS__/";

export const buildPlaceholderFileName = (archRow) => {
  const id = archRow?.ArchInterno ?? "0";
  const tipo = archRow?.ArchTipo ?? "0";
  return `${PLACEHOLDER_PREFIX}ARCH_${id}_T${tipo}.jpg`;
};

export const buildPlaceholderTargetUri = (archRow) =>
  PLACEHOLDER_DIR + buildPlaceholderFileName(archRow);

export const buildPlaceholderLines = (archRow) => {
  if (!archRow) return [];
  const preferred = [
    "ArchInterno", "ArchServerId", "ArchTabla", "ArchCodTabla", "ArchTipo", "ArchNombre",
    "ArchActivo", "ArchPeso", "ArchFech", "ArchFecha", "ArchLatitud", "ArchLongitud",
    "ArchTipoElemento", "ArchIdElemento", "TipiInterno", "EstadoOffLine"
  ];

  const lines = [];
  for (const k of preferred) {
    if (archRow[k] !== undefined) lines.push(`${k}: ${String(archRow[k])}`);
  }

  const used = new Set(preferred);
  for (const k of Object.keys(archRow)) {
    if (used.has(k)) continue;
    const v = archRow[k];
    if (v === undefined) continue;
    lines.push(`${k}: ${String(v)}`);
  }
  return lines;
};
