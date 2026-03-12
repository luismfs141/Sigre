import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDatos } from "../../context/DatosContext";

export default function LoadDB() {
  const { dbName, setNewDatabase } = useDatos();

  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePickDb = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result?.canceled) return;

      const asset = result?.assets?.[0];
      if (!asset) {
        Alert.alert("Error", "No se pudo obtener el archivo seleccionado.");
        return;
      }

      const pickedName = String(asset?.name ?? "").trim();
      if (!pickedName.toLowerCase().endsWith(".db")) {
        Alert.alert("Archivo no válido", "Solo se permiten archivos .db");
        return;
      }

      setSelectedFile({
        name: pickedName,
        uri: asset.uri,
        size: asset.size ?? null,
      });
    } catch (e) {
      console.log("❌ Error seleccionando .db:", e);
      Alert.alert("Error", "No se pudo seleccionar el archivo.");
    }
  };

  const doImportDb = async () => {
    if (!selectedFile?.uri || !selectedFile?.name) {
      Alert.alert("Aviso", "Primero selecciona un archivo .db");
      return;
    }

    try {
      setLoading(true);

      const sqliteFolder = `${FileSystem.documentDirectory}SQLite/`;
      const importedName = `sigre_imported_${Date.now()}.db`;
      const destinationUri = `${sqliteFolder}${importedName}`;

      const folderInfo = await FileSystem.getInfoAsync(sqliteFolder);
      if (!folderInfo.exists) {
        await FileSystem.makeDirectoryAsync(sqliteFolder, { intermediates: true });
      }

      const sourceInfo = await FileSystem.getInfoAsync(selectedFile.uri);
      if (!sourceInfo.exists) {
        Alert.alert("Error", "El archivo seleccionado ya no está disponible.");
        return;
      }

      await FileSystem.copyAsync({
        from: selectedFile.uri,
        to: destinationUri,
      });

      const copiedInfo = await FileSystem.getInfoAsync(destinationUri);
      if (!copiedInfo.exists) {
        Alert.alert("Error", "No se pudo copiar la base al almacenamiento interno.");
        return;
      }

      await setNewDatabase(importedName);

      Alert.alert(
        "Éxito",
        `Base importada correctamente.\n\nNueva base activa:\n${importedName}`
      );

      setSelectedFile(null);
    } catch (e) {
      console.log("❌ Error importando .db:", e);
      Alert.alert("Error", "No se pudo importar la base.");
    } finally {
      setLoading(false);
    }
  };

  const handleImportPress = async () => {
    if (!selectedFile?.uri || !selectedFile?.name) {
      Alert.alert("Aviso", "Primero selecciona un archivo .db");
      return;
    }

    const currentDbText = dbName
      ? `\n\nBase actual:\n${dbName}\n\nSe cambiará por la base importada.`
      : "\n\nNo hay una base actual activa.";

    Alert.alert(
      "Confirmar carga",
      `Se importará el archivo seleccionado.${currentDbText}`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Cargar", onPress: doImportDb },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.warning}>OPCIÓN SOLO PARA PROGRAMADORES</Text>

        <Text style={styles.subtitle}>
          Desde esta pantalla se cargará una base .db exportada desde otro dispositivo.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Base actual activa</Text>
          <Text style={styles.value}>{dbName || "No hay base activa"}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Archivo seleccionado</Text>
          <Text style={styles.value}>
            {selectedFile?.name || "Ningún archivo seleccionado"}
          </Text>

          {selectedFile?.size != null && (
            <Text style={styles.sizeText}>
              Tamaño: {selectedFile.size} bytes
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handlePickDb}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Seleccionar archivo .db</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.importButton,
            (loading || !selectedFile) && styles.buttonDisabled,
          ]}
          onPress={handleImportPress}
          disabled={loading || !selectedFile}
        >
          <Text style={styles.buttonText}>Cargar base seleccionada</Text>
        </TouchableOpacity>

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>Importando base...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  warning: {
    fontSize: 28,
    fontWeight: "bold",
    color: "red",
    textAlign: "center",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  card: {
    backgroundColor: "#f4f4f4",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#444",
    marginBottom: 6,
  },
  value: {
    fontSize: 15,
    color: "#111",
  },
  sizeText: {
    marginTop: 8,
    fontSize: 13,
    color: "#666",
  },
  button: {
    backgroundColor: "#007bff",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  importButton: {
    backgroundColor: "#28a745",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  loadingBox: {
    marginTop: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 15,
    color: "#333",
  },
});