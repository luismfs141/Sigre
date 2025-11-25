import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { DatosProvider } from '../context/DatosContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <DatosProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </DatosProvider>
    </AuthProvider>
  );
}


