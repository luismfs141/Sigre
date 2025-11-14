// import { StyleSheet, View } from "react-native";
// import MapView from "react-native-maps";

// export const options = {
//   title: "", 
// };


// export default function Map() {
//   return (
//     <View style={styles.container}>
//       <MapView
//         style={styles.map}
//         initialRegion={{
//           latitude: -12.0464, // Lima, Perú
//           longitude: -77.0428,
//           latitudeDelta: 0.05,
//           longitudeDelta: 0.05,
//         }}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   map: { width: "100%", height: "100%" },
// });
///////////////////////////////////////////








// import { StyleSheet, View } from "react-native";
// import MapView from "react-native-maps";
// import ListBox from "../../components/ui/ListBox"; // 👈 importa el nuevo componente

// export default function Map() {
//   return (
//     <View style={styles.container}>
//       {/* Cabecera con ListBox */}
//       <View style={styles.header}>
//         <ListBox />
//       </View>

//       {/* Mapa */}
//       <MapView
//         style={styles.map}
//         initialRegion={{
//           latitude: -12.0464,
//           longitude: -77.0428,
//           latitudeDelta: 0.05,
//           longitudeDelta: 0.05,
//         }}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   header: {
//     position: "absolute",
//     top: 40,
//     alignSelf: "center",
//     zIndex: 2,
//     backgroundColor: "white",
//     borderRadius: 8,
//     padding: 5,
//     elevation: 5,
//   },
//   map: { width: "100%", height: "100%" },
// });







///////////////////////////






import { StyleSheet, View } from "react-native";
import MapView from "react-native-maps";

export default function Map() {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: -12.0464,
          longitude: -77.0428,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: "100%", height: "100%" },
});
