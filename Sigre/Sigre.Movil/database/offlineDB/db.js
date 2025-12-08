import * as FileSystem from "expo-file-system/legacy";
import * as SQLite from "expo-sqlite";

let db = null;

/**
 * Abre la DB con el nombre indicado.
 * dbName debe ser siempre proporcionado y no null.
 */
export const openDatabase = async (dbName) => {
  if (!dbName) throw new Error("openDatabase -> dbName no puede ser null");

  // Normaliza extensión
  if (!dbName.endsWith(".db")) dbName = `${dbName}.db`;

  // Devuelve instancia existente si coincide
  if (db && db._dbName === dbName) return db;

  // Reset de referencia para reabrir
  db = null;

  // Espera mínima por seguridad
  await new Promise((r) => setTimeout(r, 150));

  db = await SQLite.openDatabaseAsync(dbName);

  // Guardamos el nombre en la instancia
  try { db._dbName = dbName; } catch (e) { /* no crítico */ }

  console.log("✅ openDatabase -> abierta:", dbName);
  return db;
};

/**
 * Cierra la referencia en memoria
 */
export const closeDatabase = async () => {
  if (!db) return;
  db = null;
  await new Promise((r) => setTimeout(r, 80));
  console.log("🟡 closeDatabase -> referencia liberada");
};

export const isDatabaseAvailable = async (dbName) => {
  if (!dbName) return false;
  let fileName = dbName.endsWith(".db") ? dbName : dbName; // no agrega .db
  const path = `${FileSystem.documentDirectory}SQLite/${fileName}`;
  const info = await FileSystem.getInfoAsync(path);
  return !!info.exists;
};

export const runQuery = async (sql, params = []) => {
  try {
    // Asegúrate de abrir base si no hay conexión o si la conexión anterior fue cerrada
    if (!db) {
      await openDatabase();
      // 🔹 Espera mínima para que el sistema nativo inicialice la base
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return await db.getAllAsync(sql, params);
  } catch (error) {
    console.error("Error en runQuery:", error);
    throw error;
  }
};