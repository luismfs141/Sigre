// import { Text, View } from 'react-native';

// export default function Profile() {
//   return (
//     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//       <Text>Pantalla de Perfil de usuario</Text>
//     </View>
//   );
// }




import { Ionicons } from "@expo/vector-icons";
import { useContext } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AuthContext } from "../../context/AuthContext";

export default function Profile() {
  const { user } = useContext(AuthContext);

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.infoText}>No hay sesión activa</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Encabezado */}
      <View style={styles.header}>
        <Ionicons name="person-circle-outline" size={90} color="#007bff" />
        <Text style={styles.name}>{user.nombre}</Text>
        <Text style={styles.email}>{user.correo}</Text>
      </View>

      {/* Detalles del usuario */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Datos de Usuario</Text>
        <View style={styles.row}>
          <Text style={styles.label}>ID Interno:</Text>
          <Text style={styles.value}>{user.id}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Proyecto actual:</Text>
          <Text style={styles.value}>{user.proyecto}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Correo electrónico:</Text>
          <Text style={styles.value}>{user.correo}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Dispositivo asignado:</Text>
          <Text style={styles.value}>{user.deviceId}</Text>
        </View>
      </View>

      {/* Estado de cuenta */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estado</Text>
        <View style={styles.row}>
          <Ionicons name="checkmark-circle" size={20} color="green" />
          <Text style={styles.activeText}>Cuenta activa</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9", padding: 20 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { alignItems: "center", marginBottom: 25 },
  name: { fontSize: 22, fontWeight: "bold", marginTop: 10, color: "#333" },
  email: { fontSize: 15, color: "#666" },
  section: { backgroundColor: "white", borderRadius: 10, padding: 15, marginBottom: 20, elevation: 2 },
  sectionTitle: { fontWeight: "bold", fontSize: 16, color: "#007bff", marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  label: { fontWeight: "600", color: "#555" },
  value: { color: "#333", flex: 1, textAlign: "right" },
  infoText: { fontSize: 16, color: "#999" },
  activeText: { marginLeft: 5, color: "green", fontWeight: "600" },
});
