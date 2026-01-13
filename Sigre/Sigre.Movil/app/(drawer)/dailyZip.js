import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  StyleSheet,
  Text,
  View,
} from "react-native";

// ⚠️ IMPORTANTE: USAR LEGACY
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import JSZip from "jszip";

/**
 * 📁 Agrega una carpeta completa al ZIP de forma recursiva
 */
const addFolderToZip = async (zip, folderUri) => {
  const items = await FileSystem.readDirectoryAsync(folderUri);

  for (const item of items) {
    const itemUri = folderUri + item;
    const info = await FileSystem.getInfoAsync(itemUri);

    if (info.isDirectory) {
      const subFolder = zip.folder(item);
      await addFolderToZip(subFolder, itemUri + "/");
    } else {
      const fileBase64 = await FileSystem.readAsStringAsync(itemUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      zip.file(item, fileBase64, { base64: true });
    }
  }
};

/**
 * 🔢 Cuenta archivos recursivamente
 */
const contarArchivos = async (folderUri) => {
  let count = 0;
  const items = await FileSystem.readDirectoryAsync(folderUri);

  for (const item of items) {
    const itemUri = folderUri + item;
    const info = await FileSystem.getInfoAsync(itemUri);

    if (info.isDirectory) {
      count += await contarArchivos(itemUri + "/");
    } else {
      count++;
    }
  }
  return count;
};

export default function DailyZipScreen() {
  const [loading, setLoading] = useState(false);
  const [totalArchivos, setTotalArchivos] = useState(0);

  // 📁 Ruta raíz
  const raizSigre = FileSystem.documentDirectory + "SigreMovil/";

  /**
   * 🔍 Verifica si existe SigreMovil y cuenta archivos
   */
  const verificarContenido = async () => {
    try {
      const info = await FileSystem.getInfoAsync(raizSigre);

      if (!info.exists) {
        console.log("❌ No existe SigreMovil");
        setTotalArchivos(0);
        return;
      }

      const total = await contarArchivos(raizSigre);
      console.log("📂 Archivos encontrados:", total);
      setTotalArchivos(total);
    } catch (e) {
      console.log("❌ Error verificando SigreMovil:", e);
      setTotalArchivos(0);
    }
  };

  useEffect(() => {
    verificarContenido();
  }, []);

  /**
   * 📦 Generar ZIP con TODO SigreMovil
   */
  const exportarZip = async () => {
    try {
      setLoading(true);

      const info = await FileSystem.getInfoAsync(raizSigre);
      if (!info.exists) {
        setLoading(false);
        return Alert.alert("Sin archivos", "No existe la carpeta SigreMovil.");
      }

      if (totalArchivos === 0) {
        setLoading(false);
        return Alert.alert("Vacío", "No hay archivos para exportar.");
      }

      const zip = new JSZip();

      console.log("📦 Agregando carpeta SigreMovil al ZIP...");
      await addFolderToZip(zip, raizSigre);

      // 🧩 Generar ZIP en base64
      const zipBase64 = await zip.generateAsync({ type: "base64" });

      // 💾 Guardar ZIP en cache
      const fileName = `SigreMovil_Export_${Date.now()}.zip`;
      const zipUri = FileSystem.cacheDirectory + fileName;

      await FileSystem.writeAsStringAsync(zipUri, zipBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setLoading(false);

      // 📤 Compartir ZIP
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(zipUri);
      } else {
        Alert.alert("Exportado", "ZIP creado en:\n" + zipUri);
      }
    } catch (error) {
      console.error("❌ Error exportando ZIP:", error);
      setLoading(false);
      Alert.alert("Error", "No se pudo generar el ZIP.");
    }
  };

  /**
   * 🧹 BORRAR TODO SigreMovil
   */
  const limpiarSigreMovil = async () => {
    Alert.alert(
      "Confirmar borrado",
      "¿Deseas eliminar TODAS las fotos y audios de SigreMovil?\n\n⚠️ Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, borrar todo",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              const info = await FileSystem.getInfoAsync(raizSigre);
              if (!info.exists) {
                setLoading(false);
                return Alert.alert("No existe", "La carpeta SigreMovil no existe.");
              }

              // Eliminar carpeta completa
              await FileSystem.deleteAsync(raizSigre, { idempotent: true });

              // Volver a crearla vacía
              await FileSystem.makeDirectoryAsync(raizSigre, {
                intermediates: true,
              });

              setLoading(false);
              setTotalArchivos(0);

              Alert.alert("Listo", "La carpeta SigreMovil fue limpiada correctamente.");
            } catch (error) {
              console.error("❌ Error limpiando SigreMovil:", error);
              setLoading(false);
              Alert.alert("Error", "No se pudo limpiar la carpeta.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📦 Exportar Evidencias</Text>
      <Text style={styles.subtitle}>Ruta: SigreMovil</Text>

      <Text style={styles.info}>
        Archivos encontrados: {totalArchivos}
      </Text>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <>
          <View style={styles.buttonContainer}>
            <Button title="🔄 Actualizar" onPress={verificarContenido} />
          </View>

          <View style={styles.buttonContainer}>
            <Button title="📦 Generar ZIP" onPress={exportarZip} />
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="🧹 Borrar Todo"
              color="#DC2626"
              onPress={limpiarSigreMovil}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
  },
  info: {
    textAlign: "center",
    marginBottom: 30,
    fontSize: 16,
  },
  buttonContainer: {
    marginVertical: 8,
  },
});
