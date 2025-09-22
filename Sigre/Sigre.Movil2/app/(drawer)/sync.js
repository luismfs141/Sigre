import { ActivityIndicator, Button, Text, View } from "react-native";
import { useOffline } from "../../hooks/useOffline";

export default function Sync() {
  const { loading, setupDatabase, downloadData, uploadData } = useOffline();

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
          <View style={{ marginBottom: 15, width: "100%" }}>
            <Button title="Inicializar BD" onPress={setupDatabase} />
          </View>
          <View style={{ marginBottom: 15, width: "100%" }}>
            <Button title="📥 Descargar Datos" onPress={downloadData} />
          </View>
          <View style={{ marginBottom: 15, width: "100%" }}>
            <Button title="📤 Subir Datos" onPress={uploadData} />
          </View>
        </>
      )}
    </View>
  );
}