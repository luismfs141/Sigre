import { Picker } from "@react-native-picker/picker";
import * as Application from "expo-application";
import { useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Text,
  TextInput,
  View
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import LoginStyles from "../styles/LoginStyles";

export default function Index() {
  const { user, loading, signIn } = useContext(AuthContext);
  const router = useRouter();

  // Estados del login
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedProject, setSelectedProject] = useState(0);
  const [deviceId, setDeviceId] = useState("");

  // Obtener ID del dispositivo
  useEffect(() => {
    const loadId = async () => {
      const id = Application.getAndroidId
        ? await Application.getAndroidId()
        : "unknown";

      setDeviceId(id);
    };
    loadId();
  }, []);

  // Si hay usuario → redirigir al drawer
  useEffect(() => {
    if (!loading && user) {
      router.replace("/(drawer)/sync");
    }
  }, [loading, user]);

  const handleLogin = async () => {
    if (!username || !password) {
      alert("Ingresa usuario y contraseña");
      return;
    }

    const ok = await signIn(username, password, selectedProject);
    if (!ok) {
      alert("Usuario o contraseña incorrectos");
    }
  };

  // Mientras AsyncStorage carga sesión guardada
  if (loading) {
    return (
      <View style={LoginStyles.loader}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // 🟢 SI NO HAY USUARIO → MOSTRAR LOGIN AQUÍ MISMO
  if (!user) {
    return (
      <View style={LoginStyles.container}>
        <Text style={LoginStyles.title}>Iniciar Sesión</Text>

        <TextInput
          placeholder="Usuario"
          value={username}
          onChangeText={setUsername}
          style={LoginStyles.input}
        />

        <TextInput
          placeholder="Contraseña"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={LoginStyles.input}
        />

        <Text style={LoginStyles.label}>Selecciona un proyecto:</Text>

        <View style={LoginStyles.picker}>
          <Picker
            selectedValue={selectedProject}
            onValueChange={(v) => setSelectedProject(v)}
          >
            <Picker.Item label="Baja Tensión" value={0} />
            <Picker.Item label="Media Tensión" value={1} />
          </Picker>
        </View>

        <View style={LoginStyles.button}>
          <Button title="Iniciar sesión" onPress={handleLogin} />
        </View>

        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 12, color: "gray", textAlign: "center" }}>
            ID dispositivo: {deviceId}
          </Text>
        </View>
      </View>
    );
  }

  return null;
}
