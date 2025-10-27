import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import { useState } from "react";
import { api } from "../config";

export const useOffline = () => {
  const [loading, setLoading] = useState(false);
  const client = api();

  const downloadDatabase = async (userId, feeders = []) => {
    setLoading(true);
    try {
      const endpoint = "/Feeder/export";

      const res = await client.post(
        endpoint,
        { UserId: userId, Feeders: feeders },
        { responseType: "arraybuffer" }
      );

      if (!res.data) throw new Error("No se recibió la base de datos");

      const fileUri = FileSystem.documentDirectory + "SQLite/sigre_offline.db";

      // Crear carpeta SQLite si no existe
      await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + "SQLite", { intermediates: true });

      // Convertir ArrayBuffer a Base64 usando Buffer
      const base64 = Buffer.from(res.data).toString("base64");

      // Guardar archivo en el dispositivo
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });

      console.log("✅ Base SQLite guardada en:", fileUri);
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
  };
};