// import * as SQLite from 'expo-sqlite'; // o de donde venga openDatabaseAsync

// let db = null;

// export const openDatabase = async () => {
//   if (!db) {
//     db = await SQLite.openDatabaseAsync("sigre_offline.db"); // async version
//   }
  
//   return db;
// };

// export const runQuery = async (sql, params = []) => {
//   const database = await openDatabase();
//   const rows = await database.getAllAsync(sql, params); // getAllAsync devuelve las filas
//   return rows;
// };

import * as SQLite from 'expo-sqlite';
let db = null;

export const openDatabase = async () => {
  if (!db) {
    // 🔹 Espera mínima para evitar NullPointerException tras reemplazo
    await new Promise(resolve => setTimeout(resolve, 150));
    db = await SQLite.openDatabaseAsync("sigre_offline.db");
    console.log("✅ Conexión SQLite abierta");
  }
  return db;
};

export const closeDatabase = async () => {
  if (db) {
    try {
      await db.closeAsync();
      db = null;
      console.log("✅ Conexión SQLite cerrada");
    } catch (error) {
      console.warn("No se pudo cerrar la conexión:", error);
    }
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