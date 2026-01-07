import * as FileSystem from "expo-file-system";
import * as Network from "expo-network";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import * as HttpServer from "react-native-http-server"; // Necesitamos un servidor HTTP simple
import { SafeAreaView } from "react-native-safe-area-context";

const ROOT_PATH = FileSystem.documentDirectory + "SigreMovil/";

export default function MediaExport() {
  const [ip, setIp] = useState(null);
  const [serverStarted, setServerStarted] = useState(false);

  useEffect(() => {
    (async () => {
      const ipAddress = await Network.getIpAddressAsync();
      setIp(ipAddress);

      startServer();
    })();
  }, []);

  const startServer = async () => {
    try {
      // 🔹 Servidor HTTP simple
      const server = await HttpServer.start({
        port: 8080,
        root: ROOT_PATH, // Carpeta que se sirve
      });

      console.log("Servidor HTTP iniciado en http://localhost:8080");
      console.log("📂 Ruta servida:", ROOT_PATH);
      setServerStarted(true);
    } catch (e) {
      console.error("❌ Error iniciando servidor HTTP", e);
      Alert.alert("Error", "No se pudo iniciar el servidor HTTP");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>📤 Exportar multimedia por Wi-Fi</Text>

        {serverStarted && ip ? (
          <View style={styles.ipBox}>
            <Text style={styles.text}>Desde tu PC abre:</Text>
            <Text selectable style={styles.ip}>http://{ip}:8080</Text>
            <Text style={styles.note}>✔ PC y celular deben estar en la misma red Wi-Fi</Text>
          </View>
        ) : (
          <Text>Cargando servidor...</Text>
        )}

        <ScrollView style={{ marginTop: 20 }}>
          <Text style={styles.info}>
            La carpeta completa "SigreMovil" se sirve por HTTP. Desde tu PC podrás navegar:
          </Text>
          <Text style={styles.info}>Tipo → Código → Sesión → Photos / Audios</Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F6F6F6" },
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  ipBox: { backgroundColor: "#E0F2FE", padding: 12, borderRadius: 10 },
  text: { fontSize: 14 },
  ip: { fontSize: 16, fontWeight: "700", color: "#2563EB", marginVertical: 4 },
  note: { fontSize: 12, color: "#555" },
  info: { fontSize: 14, marginVertical: 2 },
});
