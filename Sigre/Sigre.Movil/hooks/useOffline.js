import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import { useState } from "react";
import { api } from "../config";

export const useOffline = () => {
  const [loading, setLoading] = useState(false);
  const [dbVersion, setDbVersion] = useState(0); // contador de cambios
  const client = api();

  const downloadDatabase = async (userId, feeders = []) => {
    setLoading(true);
    try {
      const endpoint = "/Feeder/export";
      console.log("📥 Descargando BD desde:", endpoint);

      const res = await client.post(
        endpoint,
        { UserId: userId, Feeders: feeders },
        { responseType: "arraybuffer" }
      );

      if (!res.data) throw new Error("No se recibió la base de datos");

      const folder = FileSystem.documentDirectory + "SQLite";
      const fileUri = folder + "/sigre_offline.db";

      await FileSystem.makeDirectoryAsync(folder, { intermediates: true });

      const base64 = Buffer.from(res.data).toString("base64");

      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log("✅ Base SQLite guardada en:", fileUri);

      setDbVersion(prev => prev + 1); // <--- Notificar cambio
      return fileUri;
    } catch (error) {
      console.error("❌ Error descargando la base SQLite:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    downloadDatabase,
    dbVersion, // <--- exportar dbVersion
  };
};