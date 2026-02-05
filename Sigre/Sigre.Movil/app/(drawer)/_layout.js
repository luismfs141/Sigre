// // app/(drawer)/_layout.js
// import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { Drawer } from "expo-router/drawer";
// import { useContext, useEffect } from "react";
// import { AuthContext } from "../../context/AuthContext";

// export default function DrawerLayout() {
//   const { user, signOut } = useContext(AuthContext);
//   const router = useRouter();

//   // ✅ role desde login (ya lo tienes en user.perfilNombre)
//   const role = String(user?.perfilNombre ?? "").trim().toUpperCase();
//   const isAdmin = role === "ADMINISTRADOR" || role === "ADMIN";

//   useEffect(() => {
//     if (!user) router.replace("/");
//   }, [user]);

//   const handleLogout = async () => {
//     await signOut();
//     router.replace("/");
//   };

//   return (
//     <Drawer screenOptions={{ headerShown: true, drawerType: "slide" }}>
//       <Drawer.Screen
//         name="profile"
//         options={{
//           title: "Mis Datos",
//           drawerIcon: ({ color, size }) => (
//             <Ionicons name="man" size={size} color={color} />
//           ),
//         }}
//       />

//       <Drawer.Screen
//         name="map"
//         options={{
//           title: "Mapa",
//           drawerIcon: ({ color, size }) => (
//             <Ionicons name="map" size={size} color={color} />
//           ),
//         }}
//       />

//       <Drawer.Screen
//         name="new"
//         options={{
//           title: "Nuevo",
//           drawerIcon: ({ color, size }) => (
//             <Ionicons name="create" size={size} color={color} />
//           ),
//         }}
//       />

//       <Drawer.Screen
//         name="sync"
//         options={{
//           title: "Sincronizar",
//           drawerIcon: ({ color, size }) => (
//             <Ionicons name="sync" size={size} color={color} />
//           ),
//         }}
//       />

//       {/* ✅ Usuarios: visible solo para ADMIN */}
//       <Drawer.Screen
//         name="user"
//         options={{
//           title: "Usuarios",
//           drawerIcon: ({ color, size }) => (
//             <Ionicons name="people" size={size} color={color} />
//           ),
//           drawerItemStyle: { display: isAdmin ? "flex" : "none" },
//         }}
//       />

//       <Drawer.Screen
//         name="dailyZip"
//         options={{
//           title: "Reporte Diario (ZIP)",
//           drawerIcon: ({ color, size }) => (
//             <Ionicons name="archive" size={size} color={color} />
//           ),
//         }}
//       />

//       <Drawer.Screen
//         name="logout"
//         options={{
//           title: "Salir",
//           drawerIcon: ({ color, size }) => (
//             <Ionicons name="exit-outline" size={size} color={color} />
//           ),
//           headerRight: () => null,
//         }}
//         listeners={{
//           drawerItemPress: (e) => {
//             e.preventDefault();
//             handleLogout();
//           },
//         }}
//       />

//       {/* ocultos */}
//       <Drawer.Screen
//         name="inspection"
//         options={{ drawerItemStyle: { display: "none" }, headerTitle: "Inspección" }}
//       />
//       <Drawer.Screen name="multimedia" options={{ drawerItemStyle: { display: "none" } }} />
//       <Drawer.Screen name="registerDef" options={{ drawerItemStyle: { display: "none" } }} />
//     </Drawer>
//   );
// }





// app/(drawer)/_layout.js
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRootNavigationState } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useContext, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";

export default function DrawerLayout() {
  const { user, loading, signOut } = useContext(AuthContext);

  // ✅ Evita redirigir / renderizar navegación antes de que el Root esté montado
  const rootNav = useRootNavigationState();

  // ✅ Evita doble logout si el usuario toca varias veces
  const loggingOutRef = useRef(false);

  // Mientras carga sesión o aún no monta el root navigator, no hagas nada
  if (!rootNav?.key || loading) return null;

  // ✅ Si no hay sesión: redirección declarativa (NO router.replace)
  if (!user) return <Redirect href="/" />;

  // ✅ role desde login (ya lo tienes en user.perfilNombre)
  const role = String(user?.perfilNombre ?? "").trim().toUpperCase();
  const isAdmin = role === "ADMINISTRADOR" || role === "ADMIN";

  const handleLogout = async () => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;

    try {
      await signOut();
      // ✅ NO navegues aquí.
      // Al quedar user=null => este layout se re-renderiza y hace <Redirect href="/" />
    } catch (e) {
      console.log("Logout error:", e);
    } finally {
      // Si quieres permitir reintento luego de un fallo:
      loggingOutRef.current = false;
    }
  };

  return (
    <Drawer screenOptions={{ headerShown: true, drawerType: "slide" }}>
      <Drawer.Screen
        name="profile"
        options={{
          title: "Mis Datos",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="man" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="map"
        options={{
          title: "Mapa",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="new"
        options={{
          title: "Nuevo",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="create" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="sync"
        options={{
          title: "Sincronizar",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="sync" size={size} color={color} />
          ),
        }}
      />

      {/* ✅ Usuarios: visible solo para ADMIN */}
      <Drawer.Screen
        name="user"
        options={{
          title: "Usuarios",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
          drawerItemStyle: { display: isAdmin ? "flex" : "none" },
        }}
      />

      <Drawer.Screen
        name="dailyZip"
        options={{
          title: "Reporte Diario (ZIP)",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="archive" size={size} color={color} />
          ),
        }}
      />

      {/* ✅ "Salir" como botón (sin navegar) */}
      <Drawer.Screen
        name="logout"
        options={{
          title: "Salir",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="exit-outline" size={size} color={color} />
          ),
          headerRight: () => null,
        }}
        listeners={{
          drawerItemPress: (e) => {
            e.preventDefault(); // evita que intente abrir una ruta "logout"
            handleLogout();
          },
        }}
      />

      {/* ocultos */}
      <Drawer.Screen
        name="inspection"
        options={{
          drawerItemStyle: { display: "none" },
          headerTitle: "Inspección",
        }}
      />
      <Drawer.Screen
        name="multimedia"
        options={{ drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="registerDef"
        options={{ drawerItemStyle: { display: "none" } }}
      />
    </Drawer>
  );
}
