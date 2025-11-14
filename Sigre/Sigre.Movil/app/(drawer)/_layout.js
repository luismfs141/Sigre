// import { Ionicons } from '@expo/vector-icons';
// import { Drawer } from 'expo-router/drawer';

// export default function DrawerLayout() {
//   return (
//     <Drawer
//       screenOptions={{
//         headerShown: true,
//         drawerType: 'slide', // sidebar que se oculta
//       }}
//     >
//       <Drawer.Screen
//         name="profile"
//         options={{
//           title: 'Profile',
//           drawerIcon: ({ color, size }) => (
//             <Ionicons name="person" size={size} color={color} />
//           ),
//         }}
//       />
//       <Drawer.Screen
//         name="map"
//         options={{
//           title: 'Map',
//           drawerIcon: ({ color, size }) => (
//             <Ionicons name="map" size={size} color={color} />
//           ),
//         }}
//       />
//       <Drawer.Screen
//         name="new"
//         options={{
//           title: 'New',
//           drawerIcon: ({ color, size }) => (
//             <Ionicons name="create" size={size} color={color} />
//           ),
//         }}
//       />
//       <Drawer.Screen
//         name="sync"
//         options={{
//           title: 'Sync',
//           drawerIcon: ({ color, size }) => (
//             <Ionicons name="sync" size={size} color={color} />
//           ),
//         }}
//       />
//     </Drawer>
//   );
// }






////////////////////////


// import { Ionicons } from "@expo/vector-icons";
// import { Drawer } from "expo-router/drawer";

// export default function DrawerLayout() {
//   return (
//     <Drawer
//       screenOptions={{
//         headerShown: true,
//         drawerType: "slide",
//       }}
//     >
//       <Drawer.Screen
//         name="profile"
//         options={{
//           title: "Perfil",
//           drawerIcon: ({ color, size }) => (
//             <Ionicons name="person" size={size} color={color} />
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

//       {/* 👇 Esta es la nueva opción de salir */}
//       <Drawer.Screen
//         name="logout"
//         options={{
//           title: "Salir",
//           drawerIcon: ({ color, size }) => (
//             <Ionicons name="exit-outline" size={size} color={color} />
//           ),
//         }}
//       />
//     </Drawer>
//   );
// }





////////////////////////////////////





import { Ionicons } from "@expo/vector-icons";
import { Drawer } from "expo-router/drawer";
import { useMemo, useState } from "react";
import { View } from "react-native";
import ListBox from "../../components/ui/ListBox";

export default function DrawerLayout() {
  const [selected, setSelected] = useState(null);
  const items = useMemo(
    () => [
      { id: 1, name: "Proyecto A" },
      { id: 2, name: "Proyecto B" },
      { id: 3, name: "Proyecto C" },
    ],
    []
  );

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
          title: "Perfil",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      
      
      
      <Drawer.Screen
        name="map"
        options={{
          title: "",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
          headerRight: () => (
            <View style={{ marginRight: 10, width: 180 }}>
              <ListBox
                items={items}
                value={selected}
                onChange={setSelected}
                placeholder="Seleccione base..."
              />
            </View>
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

       {/* 👇 Esta es la nueva opción de salir */}
       <Drawer.Screen
         name="logout"
         options={{
           title: "Salir",
           drawerIcon: ({ color, size }) => (
             <Ionicons name="exit-outline" size={size} color={color} />
           ),
         }}
       />

      
    </Drawer>
  );
}
