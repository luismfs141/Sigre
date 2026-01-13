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

// ================= CONFIG =================
const TAMANIO_BLOQUE = 50; // 👉 50 archivos por ZIP
const RAIZ_SIGRE = FileSystem.documentDirectory + "SigreMedios/";
const ESTADO_ZIP = RAIZ_SIGRE + ".zip_state.json";
// ========================================

/**
 * 📁 Obtiene TODOS los archivos de forma recursiva
 * Retorna: [{ name: "subcarpeta/archivo.jpg", uri: "..." }]
 */
const obtenerArchivosRecursivos = async (folderUri, basePath = "") => {
  let archivos = [];

  try {
    const items = await FileSystem.readDirectoryAsync(folderUri);

    for (const item of items) {
      const itemUri = folderUri + item;
      const info = await FileSystem.getInfoAsync(itemUri);

      if (info.isDirectory) {
        const sub = await obtenerArchivosRecursivos(
          itemUri + "/",
          basePath + item + "/"
        );
        archivos = archivos.concat(sub);
      } else {
        archivos.push({
          name: basePath + item,
          uri: itemUri,
        });
      }
    }
  } catch (error) {
    console.log("❌ Error leyendo carpeta:", folderUri, error);
  }

  return archivos;
};

/**
 * 🔢 Cuenta archivos recursivamente
 */
const contarArchivos = async (folderUri) => {
  let count = 0;
  try {
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
  } catch (error) {
    console.log("❌ Error contando archivos:", error);
  }

  return count;
};

/**
 * 💾 Leer estado de exportación (para reanudar)
 */
const leerEstadoZip = async () => {
  try {
    const info = await FileSystem.getInfoAsync(ESTADO_ZIP);
    if (!info.exists) return 0;

    const contenido = await FileSystem.readAsStringAsync(ESTADO_ZIP);
    const json = JSON.parse(contenido);
    return json.lastPart || 0;
  } catch (err) {
    console.log("⚠️ No se pudo leer estado ZIP:", err);
    return 0;
  }
};

/**
 * 📝 Guardar progreso
 */
const guardarEstadoZip = async (parte) => {
  const data = { lastPart: parte };
  await FileSystem.writeAsStringAsync(
    ESTADO_ZIP,
    JSON.stringify(data),
    { encoding: FileSystem.EncodingType.UTF8 }
  );
};

/**
 * 🧹 Limpiar estado cuando todo finaliza
 */
const limpiarEstadoZip = async () => {
  try {
    await FileSystem.deleteAsync(ESTADO_ZIP, { idempotent: true });
  } catch {}
};

export default function DailyZipScreen() {
  const [loading, setLoading] = useState(false);
  const [totalArchivos, setTotalArchivos] = useState(0);

  /**
   * 🔍 Verifica si existe SigreMedios y cuenta archivos
   */
  const verificarContenido = async () => {
    try {
      const info = await FileSystem.getInfoAsync(RAIZ_SIGRE);

      if (!info.exists) {
        console.log("❌ No existe SigreMedios");
        setTotalArchivos(0);
        return;
      }

      const total = await contarArchivos(RAIZ_SIGRE);
      console.log("📂 Archivos encontrados:", total);
      setTotalArchivos(total);
    } catch (e) {
      console.log("❌ Error verificando SigreMedios:", e);
      setTotalArchivos(0);
    }
  };

  useEffect(() => {
    verificarContenido();
  }, []);

  /**
   * 📦 EXPORTAR ZIP EN BLOQUES DE 50 (CON REANUDACIÓN)
   */
  const exportarZip = async () => {
    try {
      setLoading(true);

      const info = await FileSystem.getInfoAsync(RAIZ_SIGRE);
      if (!info.exists) {
        setLoading(false);
        return Alert.alert("Sin archivos", "No existe la carpeta SigreMedios.");
      }

      if (totalArchivos === 0) {
        setLoading(false);
        return Alert.alert("Vacío", "No hay archivos para exportar.");
      }

      console.log("🔍 Buscando archivos...");
      const archivos = await obtenerArchivosRecursivos(RAIZ_SIGRE);

      if (archivos.length === 0) {
        setLoading(false);
        return Alert.alert("Vacío", "No se encontraron archivos.");
      }

      const totalPartes = Math.ceil(archivos.length / TAMANIO_BLOQUE);

      // 🔁 Leer desde qué parte continuar
      let parteActual = await leerEstadoZip();

      Alert.alert(
        "Exportación",
        `Se exportarán ${totalPartes} partes.\n\nContinuando desde la parte ${parteActual + 1}.`
      );

      // 🔁 Procesar en bloques
      for (let p = parteActual; p < totalPartes; p++) {
        const inicio = p * TAMANIO_BLOQUE;
        const bloque = archivos.slice(inicio, inicio + TAMANIO_BLOQUE);
        const zip = new JSZip();

        console.log(`📦 Creando ZIP parte ${p + 1} de ${totalPartes}`);

        // ➕ Agregar archivos al ZIP
        for (const archivo of bloque) {
          try {
            const fileBase64 = await FileSystem.readAsStringAsync(archivo.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });

            zip.file(archivo.name, fileBase64, { base64: true });
          } catch (err) {
            console.log("⚠️ Error con archivo:", archivo.name, err);
          }
        }

        try {
          // 🧩 Generar ZIP
          const zipBase64 = await zip.generateAsync({ type: "base64" });

          // 💾 Guardar archivo temporal
          const tmpName = `tmp_SigreMedios_parte_${p + 1}.zip`;
          const tmpUri = FileSystem.cacheDirectory + tmpName;

          await FileSystem.writeAsStringAsync(tmpUri, zipBase64, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // ✅ Renombrar a definitivo
          const finalName = `SigreMedios_parte_${p + 1}_de_${totalPartes}.zip`;
          const finalUri = FileSystem.cacheDirectory + finalName;

          await FileSystem.moveAsync({
            from: tmpUri,
            to: finalUri,
          });

          // 💾 Guardar checkpoint
          await guardarEstadoZip(p + 1);

          // 📤 Compartir ZIP
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(finalUri);
          } else {
            Alert.alert("Exportado", "ZIP creado en:\n" + finalUri);
          }

        } catch (errorZip) {
          console.log("❌ Falló ZIP parte", p + 1, errorZip);
          Alert.alert(
            "Proceso interrumpido",
            `La exportación se detuvo en la parte ${p + 1}.\n\nPuedes reintentar y continuará automáticamente desde aquí.`
          );
          setLoading(false);
          return;
        }
      }

      // 🧹 Todo completado
      await limpiarEstadoZip();
      setLoading(false);

      Alert.alert("Éxito", "Todos los archivos fueron exportados correctamente.");

    } catch (error) {
      console.error("❌ Error general exportando ZIP:", error);
      setLoading(false);
      Alert.alert("Error", "No se pudo generar los ZIP.");
    }
  };

  /**
   * 🧹 BORRAR TODO SigreMedios
   */
  const limpiarSigreMedios = async () => {
    Alert.alert(
      "Confirmar borrado",
      "¿Deseas eliminar TODAS las fotos y audios de SigreMedios?\n\n⚠️ Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, borrar todo",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              const info = await FileSystem.getInfoAsync(RAIZ_SIGRE);
              if (!info.exists) {
                setLoading(false);
                return Alert.alert("No existe", "La carpeta SigreMedios no existe.");
              }

              // Eliminar carpeta completa
              await FileSystem.deleteAsync(RAIZ_SIGRE, { idempotent: true });

              // Volver a crearla vacía
              await FileSystem.makeDirectoryAsync(RAIZ_SIGRE, {
                intermediates: true,
              });

              await limpiarEstadoZip();

              setLoading(false);
              setTotalArchivos(0);

              Alert.alert("Listo", "La carpeta SigreMedios fue limpiada correctamente.");
            } catch (error) {
              console.error("❌ Error limpiando SigreMedios:", error);
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
      <Text style={styles.subtitle}>Ruta: SigreMedios</Text>

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
            <Button title="📦 Generar ZIP (50 archivos c/u)" onPress={exportarZip} />
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="🧹 Borrar Todo"
              color="#DC2626"
              onPress={limpiarSigreMedios}
            />
          </View>
        </>
      )}
    </View>
  );
}

// ================= STYLES =================
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
