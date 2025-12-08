import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system/legacy";
import { useState } from "react";
import { api } from "../config";
import { useDatos } from "../context/DatosContext";

export const useOffline = () => {
  const { setNewDatabase } = useDatos();
  const [downloading, setDownloading] = useState(false);
  const client = api();

  const downloadDatabase = async (userId, ids, project,newFileName) => {
    try {
      setDownloading(true);

      // Nombre único
      // const newFileName = `sigre_offline_${Date.now()}.db`;

      // 1️⃣ Ruta temporal de descarga
      const tempUri = `${FileSystem.documentDirectory}${newFileName}`;
      console.log(newFileName);

      // 2️⃣ Carpeta final obligatoria donde Expo SQLite carga bases
      const sqliteFolder = `${FileSystem.documentDirectory}SQLite/`;
      const finalUri = `${sqliteFolder}${newFileName}`;

      console.log("⬇️ Descargando DB:", newFileName);

      // GET BINARY FILE
      const response = await client.post(
        "/Feeder/export",
        {
          UserId: userId,
          Ids: ids,
          Project: project,
          FileName: newFileName,
        },
        { responseType: "arraybuffer" }
      );
      // Convertir respuesta a Base64
      const base64 = Buffer.from(response.data, "binary").toString("base64");

      // Guardar temporalmente
      await FileSystem.writeAsStringAsync(tempUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log("📦 Archivo temporal guardado:", tempUri);

      // 3️⃣ Crear carpeta SQLite si no existe
      const sqliteInfo = await FileSystem.getInfoAsync(sqliteFolder);
      if (!sqliteInfo.exists) {
        await FileSystem.makeDirectoryAsync(sqliteFolder, { intermediates: true });
        console.log("📁 Carpeta SQLite creada");
      }

      // 4️⃣ Mover archivo a carpeta SQLite
      await FileSystem.moveAsync({
        from: tempUri,
        to: finalUri,
      });

      console.log("📦 Base movida a /SQLite/:", finalUri);

      // 5️⃣ Actualizar DataContext
      await setNewDatabase(newFileName);

      return { ok: true, name: newFileName };

    } catch (error) {
      console.log("❌ Error descargando DB:", error);
      return { ok: false };
    } finally {
      setDownloading(false);
    }
  };

  return {
    downloading,
    downloadDatabase,
  };
};

