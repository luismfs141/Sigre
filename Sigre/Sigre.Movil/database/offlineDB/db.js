import * as FileSystem from "expo-file-system/legacy";
import * as SQLite from "expo-sqlite";

let db = null;
let lastDbName = null;
let openingPromise = null;

const shouldRetryReopen = (err) => {
  const msg = String(err?.message ?? err ?? "");
  return (
    msg.includes("NativeDatabase.prepareAsync") ||
    msg.includes("shared object that was already released") ||
    msg.includes("Cannot use shared object") ||
    msg.includes("cannot be cast to type expo.modules.sqlite.NativeDatabase")
  );
};

/**
 * Abre la DB con el nombre indicado.
 * dbName debe ser siempre proporcionado y no null.
 */
export const openDatabase = async (dbName) => {
  if (!dbName) throw new Error("openDatabase -> dbName no puede ser null");

  // Normaliza extensión
  const normalized = dbName.endsWith(".db") ? dbName : `${dbName}.db`;
  lastDbName = normalized;

  // ya abierta y coincide
  if (db && db._dbName === normalized) return db;

  // si hay apertura en curso, espera
  if (openingPromise) {
    await openingPromise;
    if (db && db._dbName === normalized) return db;
  }

  openingPromise = (async () => {
    // intenta cerrar si existía (si ya está liberada, no pasa nada)
    try {
      if (db?.closeAsync) await db.closeAsync();
    } catch (_) {}

    db = null;

    // espera mínima
    await new Promise((r) => setTimeout(r, 50));

    const instance = await SQLite.openDatabaseAsync(normalized);

    try {
      instance._dbName = normalized;
    } catch (_) {
      // no crítico (a veces el objeto no permite props)
    }

    db = instance;
    return db;
  })();

  try {
    await openingPromise;
    return db;
  } finally {
    openingPromise = null;
  }
};

/**
 * Cierra la DB (libera la referencia y cierra si el driver lo soporta)
 */
export const closeDatabase = async () => {
  if (!db) return;

  try {
    if (db.closeAsync) await db.closeAsync();
  } catch (_) {
    // puede estar ya liberada: ignorar
  } finally {
    db = null;
  }

  await new Promise((r) => setTimeout(r, 30));
};

export const isDatabaseAvailable = async (dbName) => {
  if (!dbName) return false;
  const fileName = dbName.endsWith(".db") ? dbName : dbName; // no agrega .db
  const path = `${FileSystem.documentDirectory}SQLite/${fileName}`;
  const info = await FileSystem.getInfoAsync(path);
  return !!info.exists;
};

/**
 * Ejecuta query:
 * - SELECT / PRAGMA / WITH => getAllAsync
 * - resto => runAsync
 * ✅ Si la DB fue liberada, reabre y reintenta 1 vez.
 */
export const runQuery = async (sql, params = [], forceSelect = false) => {
  const execOnce = async () => {
    if (!db) {
      if (lastDbName) {
        await openDatabase(lastDbName);
      } else {
        throw new Error("DB no inicializada. Llama openDatabase primero.");
      }
    }

    const sqlTrim = String(sql ?? "").trim().toUpperCase();

    const isRead =
      forceSelect ||
      sqlTrim.startsWith("SELECT") ||
      sqlTrim.startsWith("PRAGMA") ||
      sqlTrim.startsWith("WITH");

    if (isRead) {
      return await db.getAllAsync(sql, params);
    }

    return await db.runAsync(sql, params);
  };

  try {
    return await execOnce();
  } catch (error) {
    // reintenta 1 vez si es el error típico de "shared object released"
    if (shouldRetryReopen(error) && lastDbName) {
      try {
        await openDatabase(lastDbName);
        return await execOnce();
      } catch (e2) {
        console.error("❌ Error en runQuery (reopen+retry):", e2);
        throw e2;
      }
    }

    console.error("❌ Error en runQuery:", error);
    throw error;
  }
};