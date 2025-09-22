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
          title: 'Profile',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="map"
        options={{
          title: 'Map',
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
          title: 'Sync',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="sync" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}