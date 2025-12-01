import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import { useState } from "react";
import { api } from "../config";

export const useOffline = () => {
  const [loading, setLoading] = useState(false);
  const [dbVersion, setDbVersion] = useState(0);
  const client = api();

  const downloadDatabase = async (userId, feeders = [], Id) => {
    setLoading(true);
    try {
      console.log(Id);
      const endpoint = "/Feeder/export";
      const res = await client.post(endpoint, { UserId: userId, Feeders: feeders, x_id: Id }, { responseType: "arraybuffer" });

      if (!res.data) throw new Error("No se recibió la base de datos");

      const folder = FileSystem.documentDirectory + "SQLite";
      await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
      const fileUri = folder + "/sigre_offline.db";

      const base64 = Buffer.from(res.data).toString("base64");
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });

      console.log("✅ Base SQLite guardada en:", fileUri);

      setDbVersion(prev => prev + 1);
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
    dbVersion,
  };
};