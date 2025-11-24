import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useFeeder } from "../../hooks/useFeeder";

export default function TestMaps() {
  const { feeders, loading, error, fetchFeeders } = useFeeder();
  const [region, setRegion] = useState({
    latitude: -12.0464,
    longitude: -77.0428,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    fetchFeeders();
  }, []);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="blue" />
        <Text>Cargando alimentadores...</Text>
      </View>
    );

  if (error)
    return (
      <View style={styles.center}>
        <Text style={{ color: "red" }}>Error: {error}</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={region}>
        {feeders.map((f) => (
          <Marker
            key={f.alimInterno}
            coordinate={{
              latitude: f.alimLatitud,
              longitude: f.alimLongitud,
            }}
            title={f.alimCodigo}
            description={f.alimEtiqueta}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: "100%", height: "100%" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
