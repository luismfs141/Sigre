import { StyleSheet, View } from "react-native";
import MapView from "react-native-maps";

export default function Map() {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: -12.0464, // Lima, Perú
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