import { useDatos } from '@/context/DatosContext';
import { Ionicons } from '@expo/vector-icons'; // 👈 iconos de Expo
import { Picker } from '@react-native-picker/picker';
import * as Application from 'expo-application';
import { useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { Alert, Button, Text, TextInput, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import LoginStyles from '../styles/LoginStyles';

export default function Login() {
  const { user, signIn } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const router = useRouter();
  const { selectedProject, setSelectedProject } = useDatos();

  useEffect(() => {
    if (user) {
      router.replace('(drawer)/map');
    }
  }, [user]);

  useEffect(() => {
    // obtener datos del dispositivo
    const fetchDeviceInfo = async () => {
      const id = await Application.getAndroidId;
      setDeviceId(id);
    };
    fetchDeviceInfo();
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Ingresa usuario y contraseña");
      return;
    }

    const success = await signIn(username, password, selectedProject);

    if (!success) {
      Alert.alert("Error", "Usuario o contraseña incorrectos");
    }
    setSelectedProject(selectedProject);
  };

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
          onValueChange={(itemValue) => setSelectedProject(itemValue)}
        >
          <Picker.Item label="Baja Tensión" value="1" />
          <Picker.Item label="Media Tensión" value="2" />
        </Picker>
      </View>

      <View style={LoginStyles.button}>
        <Button title="Iniciar sesión" onPress={handleLogin} />
      </View>

      {/* 👇 sección del device info */}
      <View style={{ marginTop: 30 }}>
        <Text style={{ fontSize: 12, color: 'gray', textAlign: 'center' }}>
          ID de dispositivo: {deviceId}
        </Text>
      </View>
    </View>
  );
}



