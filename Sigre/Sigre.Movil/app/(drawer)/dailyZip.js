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
const TAMANIO_BLOQUE = 50; // 👉 50 archivos por bloque
const RAIZ_MEDIOS = FileSystem.documentDirectory + "SigreMedios/";
const RAIZ_MOVIL = FileSystem.documentDirectory + "SigreMovil/";
const ESTADO_ZIP = (root) => root + ".zip_state.json";
// Carpeta pública (para Android suele resolverse como Download)
const CARPETA_PUBLICA = FileSystem.documentDirectory + "../Download/SigreExport/";
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
 * 💾 Leer estado de exportación (para reanudar ZIP)
 */
const leerEstadoZip = async (root) => {
  try {
    const estado = ESTADO_ZIP(root);
    const info = await FileSystem.getInfoAsync(estado);
    if (!info.exists) return 0;

    const contenido = await FileSystem.readAsStringAsync(estado);
    const json = JSON.parse(contenido);
    return json.lastPart || 0;
  } catch (err) {
    console.log("⚠️ No se pudo leer estado ZIP:", err);
    return 0;
  }
};

/**
 * 📝 Guardar progreso ZIP
 */
const guardarEstadoZip = async (root, parte) => {
  const data = { lastPart: parte };
  await FileSystem.writeAsStringAsync(
    ESTADO_ZIP(root),
    JSON.stringify(data),
    { encoding: FileSystem.EncodingType.UTF8 }
  );
};

/**
 * 🧹 Limpiar estado ZIP
 */
const limpiarEstadoZip = async (root) => {
  try {
    await FileSystem.deleteAsync(ESTADO_ZIP(root), { idempotent: true });
  } catch {}
};

export default function DailyZipScreen() {
  const [loading, setLoading] = useState(false);
  const [totalArchivos, setTotalArchivos] = useState(0);
  const [rootKey, setRootKey] = useState("MEDIOS"); // MEDIOS | MOVIL

  const RAIZ_ACTIVA = rootKey === "MEDIOS" ? RAIZ_MEDIOS : RAIZ_MOVIL;

  /**
   * 🔍 Verifica si existe la raíz activa y cuenta archivos
   */
  const verificarContenido = async () => {
    try {
      const info = await FileSystem.getInfoAsync(RAIZ_ACTIVA);

      if (!info.exists) {
        console.log("❌ No existe la carpeta:", RAIZ_ACTIVA);
        setTotalArchivos(0);
        return;
      }

      const total = await contarArchivos(RAIZ_ACTIVA);
      console.log("📂 Archivos encontrados:", total);
      setTotalArchivos(total);
    } catch (e) {
      console.log("❌ Error verificando:", e);
      setTotalArchivos(0);
    }
  };

  useEffect(() => {
    verificarContenido();
  }, [rootKey]);

  /**
   * 📦 OPCIÓN A: EXPORTAR ZIP EN BLOQUES (CON REANUDACIÓN)
   */
  const exportarZip = async () => {
    try {
      setLoading(true);

      const info = await FileSystem.getInfoAsync(RAIZ_ACTIVA);
      if (!info.exists) {
        setLoading(false);
        return Alert.alert("Sin archivos", "No existe la carpeta seleccionada.");
      }

      if (totalArchivos === 0) {
        setLoading(false);
        return Alert.alert("Vacío", "No hay archivos para exportar.");
      }

      const archivos = await obtenerArchivosRecursivos(RAIZ_ACTIVA);
      if (archivos.length === 0) {
        setLoading(false);
        return Alert.alert("Vacío", "No se encontraron archivos.");
      }

      const totalPartes = Math.ceil(archivos.length / TAMANIO_BLOQUE);
      let parteActual = await leerEstadoZip(RAIZ_ACTIVA);

      Alert.alert(
        "Exportación ZIP",
        `Se exportarán ${totalPartes} partes.\n\nContinuando desde la parte ${parteActual + 1}.`
      );

      for (let p = parteActual; p < totalPartes; p++) {
        const inicio = p * TAMANIO_BLOQUE;
        const bloque = archivos.slice(inicio, inicio + TAMANIO_BLOQUE);
        const zip = new JSZip();

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
          const zipBase64 = await zip.generateAsync({ type: "base64" });
          const tmpName = `tmp_${rootKey}_parte_${p + 1}.zip`;
          const tmpUri = FileSystem.cacheDirectory + tmpName;

          await FileSystem.writeAsStringAsync(tmpUri, zipBase64, {
            encoding: FileSystem.EncodingType.Base64,
          });

          const finalName = `${rootKey}_parte_${p + 1}_de_${totalPartes}.zip`;
          const finalUri = FileSystem.cacheDirectory + finalName;

          await FileSystem.moveAsync({ from: tmpUri, to: finalUri });

          await guardarEstadoZip(RAIZ_ACTIVA, p + 1);

          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(finalUri);
          } else {
            Alert.alert("Exportado", "ZIP creado en:\n" + finalUri);
          }
        } catch (errorZip) {
          console.log("❌ Falló ZIP parte", p + 1, errorZip);
          Alert.alert(
            "Proceso interrumpido",
            `Se detuvo en la parte ${p + 1}. Reintenta y continuará.`
          );
          setLoading(false);
          return;
        }
      }

      await limpiarEstadoZip(RAIZ_ACTIVA);
      setLoading(false);
      Alert.alert("Éxito", "Todos los archivos fueron exportados en ZIP.");
    } catch (error) {
      console.error("❌ Error ZIP:", error);
      setLoading(false);
      Alert.alert("Error", "No se pudo generar los ZIP.");
    }
  };

  /**
   * 📂 OPCIÓN 1: COMPARTIR CARPETA COMPLETA
   */
  const compartirCarpeta = async () => {
    try {
      const info = await FileSystem.getInfoAsync(RAIZ_ACTIVA);
      if (!info.exists) return Alert.alert("No existe", "La carpeta no existe.");

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(RAIZ_ACTIVA);
      } else {
        Alert.alert("No disponible", "Compartir no está disponible.");
      }
    } catch (e) {
      console.log("❌ Error compartiendo carpeta:", e);
      Alert.alert("Error", "No se pudo compartir la carpeta.");
    }
  };

  /**
   * 📤 OPCIÓN 2: COMPARTIR ARCHIVOS POR BLOQUES (SIN ZIP)
   */
  const compartirPorBloques = async () => {
    try {
      setLoading(true);
      const archivos = await obtenerArchivosRecursivos(RAIZ_ACTIVA);
      if (archivos.length === 0) {
        setLoading(false);
        return Alert.alert("Vacío", "No hay archivos.");
      }

      const totalPartes = Math.ceil(archivos.length / TAMANIO_BLOQUE);

      for (let p = 0; p < totalPartes; p++) {
        const bloque = archivos.slice(
          p * TAMANIO_BLOQUE,
          (p + 1) * TAMANIO_BLOQUE
        );

        for (const archivo of bloque) {
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(archivo.uri);
          }
        }
      }

      setLoading(false);
      Alert.alert("Listo", "Archivos compartidos por partes (sin ZIP).");
    } catch (e) {
      console.log("❌ Error compartiendo por bloques:", e);
      setLoading(false);
      Alert.alert("Error", "No se pudieron compartir los archivos.");
    }
  };

  /**
   * 📁 OPCIÓN 3: COPIAR A CARPETA PÚBLICA (USANDO SAF)
   * ✅ Mantiene la estructura de subcarpetas
   */
  const copiarACarpetaPublica = async () => {
    try {
      setLoading(true);

      const archivos = await obtenerArchivosRecursivos(RAIZ_ACTIVA);
      if (archivos.length === 0) {
        setLoading(false);
        return Alert.alert("Vacío", "No hay archivos.");
      }

      // 📂 El usuario elige la carpeta destino (Download, Documents, SD, etc.)
      const permiso =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (!permiso.granted) {
        setLoading(false);
        return Alert.alert("Cancelado", "No se otorgó permiso para acceder a la carpeta.");
      }

      const raizDestino = permiso.directoryUri;
      console.log("📁 Carpeta destino:", raizDestino);

      // 🗂️ Cache de carpetas creadas para no recrearlas
      const carpetasCreadas = {};

      /**
       * Crea (si no existe) una carpeta dentro de otra usando SAF
       * Retorna el URI de la carpeta creada/encontrada
       */
      const asegurarCarpeta = async (parentUri, nombreCarpeta) => {
        const key = parentUri + "/" + nombreCarpeta;
        if (carpetasCreadas[key]) return carpetasCreadas[key];

        // Buscar si ya existe
        const items = await FileSystem.StorageAccessFramework.readDirectoryAsync(parentUri);
        const existente = items.find((uri) => uri.endsWith("/" + nombreCarpeta));

        if (existente) {
          carpetasCreadas[key] = existente;
          return existente;
        }

        // Crear si no existe
        const nueva = await FileSystem.StorageAccessFramework.makeDirectoryAsync(
          parentUri,
          nombreCarpeta
        );
        carpetasCreadas[key] = nueva;
        return nueva;
      };

      // 🔁 Copiar archivo por archivo recreando carpetas
      for (const archivo of archivos) {
        // archivo.name = "cliente1/2024-01/foto1.jpg"
        const partes = archivo.name.split("/");
        const nombreArchivo = partes.pop(); // foto1.jpg
        const carpetas = partes; // ["cliente1", "2024-01"]

        // 📂 Crear la ruta de carpetas en destino
        let destinoActual = raizDestino;
        for (const carpeta of carpetas) {
          destinoActual = await asegurarCarpeta(destinoActual, carpeta);
        }

        // 📄 Crear archivo en la carpeta final
        const archivoDestino =
          await FileSystem.StorageAccessFramework.createFileAsync(
            destinoActual,
            nombreArchivo,
            "application/octet-stream"
          );

        // 📥 Leer origen en base64
        const base64 = await FileSystem.readAsStringAsync(archivo.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // 📤 Escribir en destino
        await FileSystem.writeAsStringAsync(archivoDestino, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      setLoading(false);
      Alert.alert(
        "Exportado",
        "Archivos copiados manteniendo la estructura de carpetas."
      );
    } catch (e) {
      console.log("❌ Error copiando con estructura:", e);
      setLoading(false);
      Alert.alert("Error", "No se pudieron copiar los archivos.");
    }
  };


  /**
   * 🧹 BORRAR TODO (CARPETA ACTIVA)
   */
  const limpiarCarpeta = async () => {
    Alert.alert(
      "Confirmar borrado",
      "¿Deseas eliminar TODOS los archivos de la carpeta seleccionada?\n\n⚠️ No se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, borrar todo",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              const info = await FileSystem.getInfoAsync(RAIZ_ACTIVA);
              if (!info.exists) {
                setLoading(false);
                return Alert.alert("No existe", "La carpeta no existe.");
              }

              await FileSystem.deleteAsync(RAIZ_ACTIVA, { idempotent: true });
              await FileSystem.makeDirectoryAsync(RAIZ_ACTIVA, {
                intermediates: true,
              });

              await limpiarEstadoZip(RAIZ_ACTIVA);

              setLoading(false);
              setTotalArchivos(0);
              Alert.alert("Listo", "La carpeta fue limpiada correctamente.");
            } catch (error) {
              console.error("❌ Error limpiando:", error);
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
      <Text style={styles.subtitle}>
        Carpeta activa: {rootKey === "MEDIOS" ? "SigreMedios" : "SigreMovil"}
      </Text>

      <Text style={styles.info}>
        Archivos encontrados: {totalArchivos}
      </Text>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <>
          {/* Selector de carpeta raíz */}
          <View style={styles.buttonContainer}>
            <Button
              title="📁 Usar SigreMedios"
              onPress={() => setRootKey("MEDIOS")}
            />
          </View>
          <View style={styles.buttonContainer}>
            <Button
              title="📁 Usar SigreMovil"
              onPress={() => setRootKey("MOVIL")}
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button title="🔄 Actualizar" onPress={verificarContenido} />
          </View>

          {/* OPCIÓN A: ZIP */}
          <View style={styles.buttonContainer}>
            <Button title="📦 Generar ZIP (50 archivos c/u)" onPress={exportarZip} />
          </View>

          {/* OPCIÓN 1 */}
          <View style={styles.buttonContainer}>
            <Button title="📂 Compartir carpeta completa" onPress={compartirCarpeta} />
          </View>

          {/* OPCIÓN 2 */}
          <View style={styles.buttonContainer}>
            <Button title="📤 Compartir por bloques (sin ZIP)" onPress={compartirPorBloques} />
          </View>

          {/* OPCIÓN 3 */}
          <View style={styles.buttonContainer}>
            <Button title="📁 Copiar a carpeta pública (Download)" onPress={copiarACarpetaPublica} />
          </View>

          {/* BORRAR */}
          <View style={styles.buttonContainer}>
            <Button
              title="🧹 Borrar Todo"
              color="#DC2626"
              onPress={limpiarCarpeta}
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
    marginBottom: 10,
  },
  info: {
    textAlign: "center",
    marginBottom: 20,
    fontSize: 16,
  },
  buttonContainer: {
    marginVertical: 6,
  },
});
