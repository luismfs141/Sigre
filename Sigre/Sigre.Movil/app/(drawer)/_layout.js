import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../../context/AuthContext";

export default function DrawerLayout() {
  const { user, signOut } = useContext(AuthContext);
  const router = useRouter();

  const [selected, setSelected] = useState(null);
  const items = useMemo(
    () => [
      { id: 0, name: "Baja Tensión" },
      { id: 1, name: "Media Tensión" },
    ],
    []
  );

  // 🔒 Protege el Drawer: si no hay usuario, redirige a login
  useEffect(() => {
    if (!user) {
      router.replace("/"); // index.js
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    router.replace("/"); // ir a login
  };

  return (
    <Drawer
      screenOptions={{
        headerShown: true,
        drawerType: "slide",
      }}
    >
      <Drawer.Screen
        name="profile"
        options={{
          title: 'Mis Datos',
          drawerIcon: ({ color, size }) => <Ionicons name="man" size={size} color={color} />,
        }}
      />

      <Drawer.Screen
        name="map"
        options={{
          title: 'Mapa',
          drawerIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />,
        }}
      />

      <Drawer.Screen
        name="new"
        options={{
          title: "Nuevo",
          drawerIcon: ({ color, size }) => <Ionicons name="create" size={size} color={color} />,
        }}
      />

      <Drawer.Screen
        name="sync"
        options={{
          title: "Sincronizar",
          drawerIcon: ({ color, size }) => <Ionicons name="sync" size={size} color={color} />,
        }}
      />

      <Drawer.Screen
        name="user"
        options={{
          title: 'Usuarios',
          drawerIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Drawer.Screen
        name="dailyZip"
        options={{
          title: "Reporte Diario (ZIP)",
          drawerIcon: ({ color, size }) => <Ionicons name="archive" size={size} color={color} />,
        }}
      />

      {/* Botón de logout */}
      <Drawer.Screen
        name="logout"
        options={{
          title: "Salir",
          drawerIcon: ({ color, size }) => <Ionicons name="exit-outline" size={size} color={color} />,
          // 👉 redirige al logout al presionar
          headerRight: () => null,
        }}
        listeners={{
          drawerItemPress: (e) => {
            e.preventDefault();
            handleLogout();
          },
        }}
      />
      {/*Expo Router es automático. Como tienes los archivos inspection.js, multimedia.js y registerDef.js dentro de la carpeta (drawer), Expo asume automáticamente que quieres mostrarlos en el menú, 1. Ocultar Inspection */}
      <Drawer.Screen
        name="inspection"  // Nombre exacto del archivo sin .js
        options={{
          drawerItemStyle: { display: 'none' }, // Esto lo oculta del menú
          headerTitle: "Inspección" // Título si navegas a él
        }}
      />

      {/* 2. Ocultar Multimedia */}
      <Drawer.Screen
        name="multimedia"
        options={{
          drawerItemStyle: { display: 'none' }
        }}
      />

      {/* 3. Ocultar RegisterDef */}
      <Drawer.Screen
        name="registerDef"
        options={{
          drawerItemStyle: { display: 'none' }
        }}
      />
    </Drawer>

    
  );
}
