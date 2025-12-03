// import { Buffer } from "buffer";
// import * as FileSystem from "expo-file-system/legacy";
// import { useState } from "react";
// import { api } from "../config";

// export const useOffline = () => {
//   const [loading, setLoading] = useState(false);
//   const [dbVersion, setDbVersion] = useState(0);
//   const client = api();

//   const downloadDatabase = async (userId, feeders = [], Id) => {
//     setLoading(true);
//     try {
//       const endpoint = "/Feeder/export";
//       const res = await client.post(endpoint, { UserId: userId, Feeders: feeders, x_id: Id }, { responseType: "arraybuffer" });

//       if (!res.data) throw new Error("No se recibió la base de datos");

//       const folder = FileSystem.documentDirectory + "SQLite";
//       await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
//       const fileUri = folder + "/sigre_offline.db";

//       const base64 = Buffer.from(res.data).toString("base64");
//       await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });

//       console.log("✅ Base SQLite guardada en:", fileUri);

//       setDbVersion(prev => prev + 1);
//       return fileUri;
//     } catch (error) {
//       console.error("❌ Error descargando la base SQLite:", error);
//       return null;
//     } finally {
//       setLoading(false);
//     }
//   };

//   return {
//     loading,
//     downloadDatabase,
//     dbVersion,
//   };
// };

// hooks/useOffline.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import { useEffect, useState } from "react";
import { api } from "../config";
import { useDatos } from "../context/DatosContext";

/**
 * Hook useOffline: descarga DB dinámica y expone dbName
 *
 * downloadDatabase(userId, feeders, Id, fileNameWithoutExtension)
 */
export const useOffline = () => {
  const [loading, setLoading] = useState(false);
  const [offlineLoading, setOfflineLoading] = useState(false);
  const [dbVersion, setDbVersion] = useState(0);
  const { dbName, setDbName } = useDatos();

  const client = api();

  // Leer dbName guardado al iniciar (si no lo hace otro lugar)
  useEffect(() => {
    loadDbName();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDbName = async () => {
    try {
      const saved = await AsyncStorage.getItem("offline_db_name");
      if (saved) setDbName(saved);
    } catch (e) {
      console.warn("loadDbName error:", e);
    }
  };

  /**
   * Descarga la base SQLite dinámica
   * @param {number} userId
   * @param {Array<number>} feeders
   * @param {number} Id
   * @param {string} fileName nombre dinámico (SIN .db)
   */
  const downloadDatabase = async (userId, feeders = [], Id, fileName) => {
    setOfflineLoading(true);
    try {
      if (!fileName) throw new Error("Falta fileName (sin .db)");

      // Asegurar que fileName no traiga .db repetida
      if (fileName.endsWith(".db")) fileName = fileName.replace(/\.db$/, "");

      const endpoint = "/Feeder/export";

      const body = {
        UserId: userId,
        Feeders: feeders,
        x_id: Id,
        FileName: fileName,
      };

      const res = await client.post(endpoint, body, {
        responseType: "arraybuffer",
      });

      if (!res.data) throw new Error("No se recibió la base de datos");

      const folder = FileSystem.documentDirectory + "SQLite";
      await FileSystem.makeDirectoryAsync(folder, { intermediates: true });

      const fileUri = `${folder}/${fileName}.db`;

      const base64 = Buffer.from(res.data).toString("base64");
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Guardar el nombre EXACTO (con extensión) en AsyncStorage y contexto
      const storedName = `${fileName}.db`;
      await AsyncStorage.setItem("offline_db_name", storedName);
      setDbName(storedName);

      console.log("✅ Base SQLite guardada como:", storedName);

      setDbVersion((prev) => prev + 1);
      return fileUri;
    } catch (error) {
      console.error("❌ Error descargando la base SQLite:", error);
      return null;
    } finally {
      setOfflineLoading(false);
    }
  };

  return {
    offlineLoading,
    downloadDatabase,
    dbVersion,
    dbName,
  };
};
