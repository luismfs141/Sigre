import { useFeeder } from "../../hooks/useFeeder";

import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView from "react-native-maps";
import CustomMarker from "../../components/Map/CustomMarker";

export default function Map() {
  const mapRef = useRef(null);
  const [selectedPin, setSelectedPin] = useState(null);
  const [bubblePos, setBubblePos] = useState({ x: 0, y: 0 });

  const { feeders } = useFeeder();

  const handleSelectPin = async (pin) => {
    setSelectedPin(pin);

    if (!mapRef.current) return;

    const point = await mapRef.current.coordinateForPoint({
      latitude: pin.latitude,
      longitude: pin.longitude,
    });

    setBubblePos({
      x: point.x,
      y: point.y - 40, 
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: -16.39889,
          longitude: -71.53694,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }}
        onPress={() => setSelectedPin(null)}
      >
        {feeders
          .filter(f => f.alimLatitud && f.alimLongitud)
          .map(f => (
            <CustomMarker
              key={f.alimInterno}
              pin={{
                label: f.alimEtiqueta,
                codigo: f.alimCodigo,
                latitude: f.alimLatitud,
                longitude: f.alimLongitud,
              }}
              onPress={handleSelectPin}
            />
          ))}
      </MapView>

      {/* GLOBO FLOTANTE */}
      {selectedPin && (
        <View
          style={[
            styles.bubble,
            { top: bubblePos.y, left: bubblePos.x }
          ]}
        >
          <Text style={styles.title}>{selectedPin.label}</Text>
          <Text style={styles.code}>Código: {selectedPin.codigo}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { width: "100%", height: "100%" },

  bubble: {
    position: "absolute",
    backgroundColor: "white",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#666",
    elevation: 5,
  },

  title: {
    fontWeight: "bold",
    fontSize: 14,
  },

  code: {
    fontSize: 12,
    color: "#333",
  },
});
