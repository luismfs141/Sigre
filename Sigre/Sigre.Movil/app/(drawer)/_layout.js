import { Ionicons } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        headerShown: true,
        drawerType: 'slide', // sidebar que se oculta
      }}
    >
      <Drawer.Screen
        name="profile"
        options={{
          title: 'Mis Datos',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="man" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="map"
        options={{
          title: 'Mapa',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="new"
        options={{
          title: 'New',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="create" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="sync"
        options={{
          title: 'Sincronizar',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="sync" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="user"
        options={{
          title: 'Usuarios',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}