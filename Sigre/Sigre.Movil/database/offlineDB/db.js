// import * as SQLite from 'expo-sqlite';
// let db = null;

// export const openDatabase = async () => {
//   if (!db) {
//     // 🔹 Espera mínima para evitar NullPointerException tras reemplazo
//     await new Promise(resolve => setTimeout(resolve, 150));
//     db = await SQLite.openDatabaseAsync("sigre_offline.db");
//     console.log("✅ Conexión SQLite abierta");
//   }
//   return db;
// };

// export const closeDatabase = async () => {
//   if (db) {
//     try {
//       await db.closeAsync();
//       db = null;
//       console.log("✅ Conexión SQLite cerrada");
//     } catch (error) {
//       console.warn("No se pudo cerrar la conexión:", error);
//     }
//   }
// };

// export const runQuery = async (sql, params = []) => {
//   try {
//     // Asegúrate de abrir base si no hay conexión o si la conexión anterior fue cerrada
//     if (!db) {
//       await openDatabase();
//       // 🔹 Espera mínima para que el sistema nativo inicialice la base
//       await new Promise(resolve => setTimeout(resolve, 100));
//     }
//     return await db.getAllAsync(sql, params);
//   } catch (error) {
//     console.error("Error en runQuery:", error);
//     throw error;
//   }
// };

// database/openDatabase.js

// database/offlineDB/db.js
import * as FileSystem from "expo-file-system/legacy";
import * as SQLite from "expo-sqlite";

let db = null;

/**
 * Abre la DB con el nombre indicado. Si ya está abierta y coincide, devuelve la instancia.
 * dbName puede incluir o no la extensión ".db"
 */
export const openDatabase = async (dbName = "sigre_offline.db") => {
  try {
    // Normaliza nombre (asegura .db)
    if (!dbName.endsWith(".db")) dbName = `${dbName}.db`;

    // Si ya tenemos db y la nombramos igual, la devolvemos
    if (db && db._dbName === dbName) return db;

    // Si hay una conexión previa, reseteamos referencia para forzar re-apertura
    db = null;

    // Pequeña espera para evitar race conditions después de reemplazo de archivo
    await new Promise((r) => setTimeout(r, 150));

    // expo-sqlite acepta abrir por nombre de archivo
    db = await SQLite.openDatabaseAsync(dbName);

    // Guardamos nombre en la instancia para comparaciones posteriores
    try { db._dbName = dbName; } catch (e) { /* no crítico */ }

    console.log("✅ openDatabase -> abierta:", dbName);
    return db;
  } catch (error) {
    console.error("❌ openDatabase error:", error);
    throw error;
  }
};

/**
 * Cierra la referencia en memoria. (expo-sqlite no expone close; liberar referencia)
 */
export const closeDatabase = async () => {
  try {
    // Si la implementación nativa tuviera close, llamarlo aquí.
    db = null;
    // pequeña espera para que el SO suelte el descriptor
    await new Promise((r) => setTimeout(r, 80));
    console.log("🟡 closeDatabase -> referencia liberada");
  } catch (err) {
    console.warn("⚠ closeDatabase:", err);
  }
};

/**
 * Comprueba que exista el archivo físico en el device.
 * dbName puede venir con/sin .db
 */
export const isDatabaseAvailable = async (dbName = "sigre_offline.db") => {
  try {
    if (!dbName.endsWith(".db")) dbName = `${dbName}.db`;
    const path = `${FileSystem.documentDirectory}SQLite/${dbName}`;
    const info = await FileSystem.getInfoAsync(path);
    return !!info.exists;
  } catch (err) {
    console.warn("⚠ isDatabaseAvailable error:", err);
    return false;
  }
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
