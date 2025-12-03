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



import * as FileSystem from "expo-file-system/legacy";
import * as SQLite from "expo-sqlite";

let db = null;

export const isDatabaseAvailable = async () => {
  const path = `${FileSystem.documentDirectory}SQLite/sigre_offline.db`;
  const file = await FileSystem.getInfoAsync(path);
  return file.exists;
};











// export const openDatabase = async () => {
//   try {
//     const exists = await isDatabaseAvailable();
//     if (!exists) {
//       console.log("⚠ Base no existe aún.");
//       return null;
//     }

//     if (!db) {
//       db = await SQLite.openDatabaseAsync("sigre_offline.db");
//       console.log("✔ SQLite abierta");
//     }

//     return db;

//   } catch (err) {
//     console.error("❌ Error abriendo BD:", err);
//     return null;
//   }
// };

export const openDatabase = async () => {
  try {
    // Asegurar carpeta /SQLite
    const dir = FileSystem.documentDirectory + "SQLite";
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }

    // Revisar si BD existe
    const exists = await isDatabaseAvailable();

    // Si NO existe → copiar desde assets
    if (!exists) {
      console.log("⚠ BD no existe, copiando...");
      await copyDatabaseFromAssets();
    }

    // Abrir BD
    if (!db) {
      db = await SQLite.openDatabaseAsync("sigre_offline.db");
      console.log("✔ SQLite abierta");
    }

    return db;

  } catch (err) {
    console.error("❌ Error abriendo BD:", err);
    return null;
  }
};



export const runQuery = async (sql, params = []) => {
  try {
    if (!db) {
      await openDatabase();
      if (!db) return [];
    }

    return await db.getAllAsync(sql, params);

  } catch (err) {
    console.error("❌ Error en runQuery:", err);
    return [];
  }
};

// Solo úsalo al cerrar sesión
export const closeDatabase = async () => {
  try {
    if (db) {
      await db.closeAsync();
      db = null;
      console.log("SQLite cerrada");
    }
  } catch (err) {
    console.warn("No se pudo cerrar SQLite:", err);
  }
};
