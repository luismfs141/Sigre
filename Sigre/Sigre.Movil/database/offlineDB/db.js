import * as SQLite from 'expo-sqlite';

let db = null;

export const openDatabase = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync("sigre_offline.db");
  }
  return db;
};


export const runQuery = async (sql, params = []) => {
  const database = await openDatabase();

  // Ejecuta la consulta con runAsync (para INSERT, UPDATE, DELETE)
  // o getAllAsync (para SELECT que devuelve múltiples filas)
  const rows = await database.getAllAsync(sql, params);

  return rows; // esto es un array
};