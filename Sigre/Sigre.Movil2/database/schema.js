export const createDeficienciesTable = `
CREATE TABLE IF NOT EXISTS Deficiencias (
  DEFI_Interno TEXT PRIMARY KEY,
  DEFI_Descripcion TEXT,
  PosteId TEXT,
  pendingSync INTEGER DEFAULT 0,
  lastModified TEXT
)`;

export const createFilesTable = `
CREATE TABLE IF NOT EXISTS Archivos (
  ARCH_Interno TEXT PRIMARY KEY,
  ARCH_Nombre TEXT,
  ARCH_Tipo TEXT,
  DEFI_Interno TEXT,
  pendingSync INTEGER DEFAULT 0,
  lastModified TEXT
)`;

export const createPostesTable = `
CREATE TABLE IF NOT EXISTS Postes (
  POSTE_Interno TEXT PRIMARY KEY,
  POSTE_Codigo TEXT,
  POSTE_Latitud REAL,
  POSTE_Longitud REAL,
  pendingSync INTEGER DEFAULT 0,
  lastModified TEXT
)`;

export const createVanosTable = `
CREATE TABLE IF NOT EXISTS Vanos (
  VANO_Interno TEXT PRIMARY KEY,
  PosteOrigen TEXT,
  PosteDestino TEXT,
  Longitud REAL,
  pendingSync INTEGER DEFAULT 0,
  lastModified TEXT
)`;

export const createSedsTable = `
CREATE TABLE IF NOT EXISTS Seds (
  SED_Interno TEXT PRIMARY KEY,
  SED_Codigo TEXT,
  SED_Nombre TEXT,
  SED_Latitud REAL,
  SED_Longitud REAL,
  pendingSync INTEGER DEFAULT 0,
  lastModified TEXT
)`;