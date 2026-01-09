import { Ionicons } from '@expo/vector-icons';
import { Picker } from "@react-native-picker/picker";
import * as Application from "expo-application";
import { useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
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
  // false al inicio para que la contraseña esté oculta por defecto
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

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
  // if (!user) {
  //   return (
  //     <View style={LoginStyles.container}>
  //       <Text style={LoginStyles.title}>Iniciar Sesión</Text>

  //       <TextInput
  //         placeholder="Usuario"
  //         value={username}
  //         onChangeText={setUsername}
  //         style={LoginStyles.input}
  //         color="#000"
  //         placeholderTextColor="#666"
  //       />

  //       <TextInput
  //         placeholder="Contraseña"
  //         secureTextEntry
  //         value={password}
  //         onChangeText={setPassword}
  //         style={LoginStyles.input}
  //         color="#000"
  //         placeholderTextColor="#666"
  //       />

  //       <Text style={LoginStyles.label}>Selecciona un proyecto:</Text>

  //       <View style={LoginStyles.picker}>
  //         <Picker
  //           selectedValue={selectedProject}
  //           onValueChange={(v) => setSelectedProject(v)}
  //           style={{ color: "#000" }}       
  //           dropdownIconColor="#000"

  //         >
  //           <Picker.Item label="Baja Tensión" value={0} />
  //           <Picker.Item label="Media Tensión" value={1} />
  //         </Picker>
  //       </View>

  //       <View style={LoginStyles.button}>
  //         <Button title="Iniciar sesión" onPress={handleLogin} />
  //       </View>

  //       <View style={{ marginTop: 20 }}>
  //         <Text style={{ fontSize: 12, color: "gray", textAlign: "center" }}>
  //           ID dispositivo: {deviceId}
  //         </Text>
  //       </View>
  //     </View>
  //   );
  // }

  if (!user) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={LoginStyles.container}>
              <Text style={LoginStyles.title}>Iniciar Sesión</Text>

              <TextInput
                placeholder="Usuario"
                value={username}
                onChangeText={setUsername}
                style={LoginStyles.input}
                placeholderTextColor="#666"
                color="#000"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />

              {/* Password:Contenedor que envuelve el input y el icono */}
              <View style={[LoginStyles.inputContainer, { color: "#000" }]}>
                <TextInput
                  placeholder="Contraseña"
                  // Si isPasswordVisible es true, secureTextEntry es false (se ve el texto)
                  secureTextEntry={!isPasswordVisible}
                  value={password}
                  onChangeText={setPassword}
                  // Usamos un estilo modificado para el input interno
                  style={LoginStyles.inputInside}
                  placeholderTextColor="#666"
                  // color="#000" // Movemos el color al estilo o al padre si es necesario
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                {/* Botón del ojito */}
                <TouchableOpacity
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  style={LoginStyles.iconButton}
                >
                  <Ionicons
                    // Cambia el nombre del icono según el estado
                    name={isPasswordVisible ? "eye-off" : "eye"}
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>

              <Text style={LoginStyles.label}>Selecciona un proyecto:</Text>

              <View style={LoginStyles.picker}>
                <Picker
                  selectedValue={selectedProject}
                  onValueChange={(v) => setSelectedProject(v)}
                  style={{ color: "#000" }}
                  dropdownIconColor="#000"
                >
                  <Picker.Item label="Baja Tensión" value={0} color="#000" />
                  <Picker.Item label="Media Tensión" value={1} color="#000" />
                </Picker>
              </View>

              <View style={LoginStyles.button}>
                <Button title="INICIAR SESIÓN" onPress={handleLogin} />
              </View>

              <View style={{ marginTop: 20 }}>
                <Text style={{ fontSize: 12, color: "gray", textAlign: "center" }}>
                  ID dispositivo: {deviceId}
                </Text>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    );
  }


  return null;
}
