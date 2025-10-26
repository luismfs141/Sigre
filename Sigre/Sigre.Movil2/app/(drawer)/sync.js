import { Picker } from "@react-native-picker/picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Text,
  View
} from "react-native";
import { useOffline } from "../../hooks/useOffline";

export default function Sync() {
  const { loading, setupDatabase, downloadDeficiencies, getLocalDeficiencies } =
    useOffline();

  const [feeders, setFeeders] = useState([null, null, null]);
  const [dbExists, setDbExists] = useState(false);
  const dbName = "mydb.db";

  // 📦 Verifica si existe base local al iniciar
  useEffect(() => {
    checkDatabase();
  }, []);

  // 🔍 Verifica si existe la base de datos SQLite
  const checkDatabase = async () => {
    try {
      const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      setDbExists(fileInfo.exists);
    } catch (error) {
      console.error("Error verificando base local:", error);
      Alert.alert("Error", "No se pudo verificar la base local");
    }
  };

  // 🧭 Maneja cambio de combo sin repetir valores
  const handleFeederChange = (index, value) => {
    if (feeders.includes(value)) {
      Alert.alert("Duplicado", "Ya seleccionaste este número en otro combo.");
      return;
    }
    const updated = [...feeders];
    updated[index] = value;
    setFeeders(updated);
  };

  // 📥 Descargar data desde servidor
  const handleDownload = async () => {
    try {
      await downloadDeficiencies(feeders);
      Alert.alert("Éxito", "Datos descargados correctamente.");
      await checkDatabase();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Fallo al descargar datos.");
    }
  };

  // 📤 Subir data al servidor
  const handleUpload = async () => {
    try {
      const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;
      const fileInfo = await FileSystem.getInfoAsync(dbPath);

      if (fileInfo.exists) {
        await FileSystem.deleteAsync(dbPath, { idempotent: true });
        setDbExists(false);
        Alert.alert("Subida simulada", "Se eliminó la base local correctamente.");
      } else {
        Alert.alert("Sin base local", "No se encontró la base de datos.");
      }
    } catch (error) {
      console.error("Error al eliminar base local:", error);
      Alert.alert("Error", "No se pudo eliminar la base local.");
    }
  };

  // 💾 Exportar backup (copia de la base)
  const handleExportBackup = async () => {
    try {
      const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      if (!fileInfo.exists) {
        Alert.alert("Sin base local", "No se encontró una base SQLite local.");
        return;
      }

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(
          "No disponible",
          "La función de compartir no está disponible en este dispositivo."
        );
        return;
      }

      await Sharing.shareAsync(dbPath);
    } catch (error) {
      console.error("Error exportando backup:", error);
      Alert.alert("Error", "No se pudo exportar la base de datos.");
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#f9f9f9",
      }}
    >
      {loading ? (
        <View style={{ alignItems: "center", marginVertical: 20 }}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={{ marginTop: 10 }}>Procesando...</Text>
        </View>
      ) : (
        <>
          <Text style={{ fontSize: 18, marginBottom: 10, fontWeight: "bold" }}>
            Selecciona los feeders:
          </Text>

          {[0, 1, 2].map((i) => (
            <Picker
              key={i}
              selectedValue={feeders[i]}
              style={{
                height: 50,
                width: 200,
                backgroundColor: "#fff",
                marginBottom: 10,
              }}
              onValueChange={(val) => handleFeederChange(i, val)}
            >
              <Picker.Item label={`Feeder ${i + 1}`} value={null} />
              <Picker.Item label="1" value={1} />
              <Picker.Item label="2" value={2} />
              <Picker.Item label="3" value={3} />
            </Picker>
          ))}

          <View style={{ marginTop: 20, width: "100%" }}>
            <Button title="Inicializar BD" onPress={setupDatabase} />
          </View>

          <View style={{ marginTop: 15, width: "100%" }}>
            <Button
              title="📥 Descargar Data"
              onPress={handleDownload}
              disabled={dbExists}
              color={dbExists ? "gray" : "#007bff"}
            />
          </View>

          <View style={{ marginTop: 15, width: "100%" }}>
            <Button
              title="📤 Subir Data"
              onPress={handleUpload}
              disabled={!dbExists}
              color={!dbExists ? "gray" : "#28a745"}
            />
          </View>

          <View style={{ marginTop: 15, width: "100%" }}>
            <Button
              title="💾 Exportar Backup"
              onPress={handleExportBackup}
              color="#6c757d"
            />
          </View>

          <Text
            style={{
              marginTop: 20,
              color: dbExists ? "green" : "red",
              fontWeight: "bold",
            }}
          >
            {dbExists
              ? "📦 Base local detectada"
              : "⚠️ No hay base de datos local"}
          </Text>
        </>
      )}
    </View>
  );
}