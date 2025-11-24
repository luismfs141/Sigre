//////////////////////////
// MAPA COMPLETO FUNCIONAL
//////////////////////////

import { StyleSheet, View } from "react-native";
import MapView from "react-native-maps";
import CustomMarker from "../../components/Map/CustomMarker";
import { useFeeder } from "../../hooks/useFeeder";

export default function Map() {
  const { feeders, loading } = useFeeder();

  console.log("Ejemplo de feeder:", feeders[5]); // para verificar datos reales

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: -16.39889,
          longitude: -71.53694,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }}
      >

        {/* ============================
             MARCADORES DEL ALIMENTADOR
           ============================  */}

        {feeders
          .filter(f =>
            f &&
            f.alimLatitud !== null &&
            f.alimLongitud !== null &&
            f.alimLatitud !== 0 &&
            f.alimLongitud !== 0
          )
          .map((f, index) => (
            <CustomMarker
              key={index}
              pin={{
                label: f.alimEtiqueta,
                codigo: f.alimCodigo,
                latitude: f.alimLatitud,
                longitude: f.alimLongitud,
              }}
            />
          ))}

      </MapView>
    </View>
  );
}

/////////////////////

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: "100%", height: "100%" },
});

