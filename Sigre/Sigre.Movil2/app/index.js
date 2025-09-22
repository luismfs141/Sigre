import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { Alert, Button, Text, TextInput, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import LoginStyles from '../styles/LoginStyles';

export default function Login() {
  const { user, signIn } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedProject, setSelectedProject] = useState('project1');
  const router = useRouter();

  useEffect(() => {
    if (user) {
      // cuando el usuario inicia sesión, podrías redirigir al proyecto elegido
      router.replace('(drawer)/map');
    }
  }, [user]);

  const handleLogin = () => {
    if (!username || !password) {
      Alert.alert('Error', 'Ingresa usuario y contraseña');
      return;
    }
    // Aquí pasas también el proyecto elegido si quieres guardarlo en el contexto
    signIn(username, password, selectedProject);
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
          <Picker.Item label="Project 1" value="project1" />
          <Picker.Item label="Project 2" value="project2" />
        </Picker>
      </View>

      <View style={LoginStyles.button}>
        <Button title="Iniciar sesión" onPress={handleLogin} />
      </View>
    </View>
  );
}