import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';

const servers = {
  dev: "https://servidor-dev.com",
  test: "http://192.168.100.9/SigreHost/api/",
  prod: "https://servidor-prod.com",
};

export default function RootLayout() {
  const baseURL = servers.test;
  return (
    <AuthProvider baseURL={baseURL}>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}