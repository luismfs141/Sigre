import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import { useState } from "react";
import { api } from "../config";
import { runQuery } from "../database/offlineDB/db"; // ← Importa runQuery desde tu módulo central de DB

export const useOffline = () => {
  const [loading, setLoading] = useState(false);
  const client = api();

  // -----------------------------------------------------
  // DESCARGAR BASE DE DATOS
  // -----------------------------------------------------
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

      // Convertir binario -> Base64
      const base64 = Buffer.from(res.data).toString("base64");

      // Guardar SQLite localmente
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log("✅ Base SQLite guardada en:", fileUri);
      return fileUri;
    } catch (error) {
      console.error("❌ Error descargando la base SQLite:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------
  // MÉTODOS ESPECÍFICOS
  // -----------------------------------------------------
  const getPinsByFeederLocal = async (feederId) => {
    return await runQuery("SELECT * FROM Pines WHERE x_feeder_id = ?", [
      feederId,
    ]);
  };

  const getGapsByFeederLocal = async (feederId) => {
    return await runQuery("SELECT * FROM Vanos WHERE x_feeder_id = ?", [
      feederId,
    ]);
  };


  return {
    loading,
    downloadDatabase,
    getPinsByFeederLocal,
    getGapsByFeederLocal,
  };
};