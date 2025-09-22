import * as SQLite from 'expo-sqlite';

let db = null;

export const openDatabase = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('app.db');
  }
  return db;
};

export const executeSql = async (sql, params = []) => {
  const database = await openDatabase();
  const result = await database.runAsync(sql, params);
  return result;
};

export const initTables = async (schemas) => {
  try {
    const database = await openDatabase();
    for (const schema of schemas) {
      await database.execAsync(schema);
    }
    console.log('Tablas inicializadas correctamente');
  } catch (error) {
    console.error('Error al inicializar tablas:', error);
  }
};

export const getAll = async (sql, params = []) => {
  const database = await openDatabase();
  const rows = await database.getAllAsync(sql, params);
  return rows;
};

export const getOne = async (sql, params = []) => {
  const database = await openDatabase();
  const row = await database.getFirstAsync(sql, params);
  return row;
};