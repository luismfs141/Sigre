import * as Location from 'expo-location';
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { DropDown } from '../../components/DropDown.js';
import { PinCallout } from '../../components/PinCallout';

import { mapStyles, pinStyles } from '../../assets/styles/Map.js';
import { getGapColorByInspected, getSourceImageFromType2 } from '../../utils/utils.js';

import { useDatos } from "../../context/DatosContext.js";
import { useFeeder } from '../../hooks/useFeeder.js';
import { useMap } from '../../hooks/useMap';
import { usePost } from '../../hooks/usePost.js';

export const Map = () => {
  const {
    selectedFeeder, setSelectedFeeder, pins, setPins, gaps, setGaps,
    region, setRegion, selectedItem, setSelectedPin, setSelectedGap,
    feeders, setFeeders
  } = useDatos();

  const { getPinsByFeeder, getGapsByFeeder, setRegionByCoordinate, setRegionByFeeder, getPinsByRegion } = useMap();
  const { fetchLocalFeeders } = useFeeder();
  const { fetchAndSelectPost } = usePost();
  const router = useRouter();

  const mapRef = useRef(null);

  // 🔍 Umbral de zoom
  const ZOOM_THRESHOLD = 0.007; // mientras más chico, más zoom exige
  const shouldShowPins = region?.latitudeDelta < ZOOM_THRESHOLD;

  // --------------------------------------------------------------
  // Cargar pins/gaps cuando se selecciona alimentador
  // --------------------------------------------------------------

  useEffect(() => {
    if (!selectedFeeder) return;

    (async () => {
      const [pinsLoaded, gapsLoaded] = await Promise.all([
        getPinsByFeeder(selectedFeeder.AlimInterno),
        getGapsByFeeder(selectedFeeder.AlimInterno)
      ]);

      setGaps(gapsLoaded);

      // centra mapa en primer pin
      setRegionByFeeder(pinsLoaded);

      // muestra solo pines visibles
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.getMapBoundaries().then(b => {
            const regionNow = {
              latitude: (b.northEast.latitude + b.southWest.latitude) / 2,
              longitude: (b.northEast.longitude + b.southWest.longitude) / 2,
              latitudeDelta: Math.abs(b.northEast.latitude - b.southWest.latitude),
              longitudeDelta: Math.abs(b.northEast.longitude - b.southWest.longitude)
            };
            getPinsByRegion(regionNow);
          });
        }
      }, 500);
    })();
  }, [selectedFeeder]);

  // --------------------------------------------------------------
  // GPS
  // --------------------------------------------------------------
  const userLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    const { coords } = await Location.getCurrentPositionAsync({
      enableHighAccuracy: true,
      accuracy: Location.Accuracy.Highest
    });

    const newRegion = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };

    mapRef.current?.animateToRegion(newRegion, 600);
    setRegionByCoordinate(coords.latitude, coords.longitude);
  };

  // --------------------------------------------------------------
  // MEMOIZACIÓN PARA EVITAR RERENDERS DE +1000 PINS
  // --------------------------------------------------------------
const memoPins = useMemo(() => {
  if (!shouldShowPins) return [];

  return Array.isArray(pins)
    ? pins.filter(p => p.Type !== 0 && p.Latitude && p.Longitude)
    : [];
}, [pins, shouldShowPins]);


const memoGaps = useMemo(() => {
  return Array.isArray(gaps) ? gaps : [];
}, [gaps]);


  const formatLabel = (label) => {
    if (!label) return "";
    return label.replace(/\r?\n|\r/g, " - ").trim();
  };

const isValidLabel = (label) => {
  if (!label) return false;
  return /^[0-9]+$/.test(label.trim()); // solo números
};



const onMarkerPress = (item) => {
  Alert.alert(
    "Elemento seleccionado",
    `Tipo: ${item.Type}\nCódigo: ${item.ElementCode}`,
    [
      { text: "Cancelar", style: "cancel" },
      { 
        text: "Inspeccionar",
        onPress: async () => {
          if (item.Type === 0 || item.Type === 8) {
            setSelectedGap(item);  // es un gap
          } else if (item.Type === 5) {
            // es un poste → usar el hook para guardarlo globalmente
            await fetchAndSelectPost(item.Id);
          } else {
            setSelectedPin(item);  // es un pin
          }

          // Navegar a pantalla de inspección
          router.push("/(drawer)/inspection");
        }
      }
    ]
  );
};



  // --------------------------------------------------------------
  // Render
  // --------------------------------------------------------------
  return (
    <View style={{ flex: 1 }}>
      <DropDown onSelectFeeder={setSelectedFeeder} />

      <MapView
        ref={mapRef}
        style={mapStyles.mapContainer}
        region={region}
        mapType="satellite"
        onRegionChangeComplete={(reg) => {
          setRegion(reg);
          getPinsByRegion(reg);
        }}
      >

        {/* GAPs */}
        {memoGaps.map((gap, i) => (
          <Polyline
            key={i}
            coordinates={[
              { latitude: gap.VanoLatitudIni, longitude: gap.VanoLongitudIni },
              { latitude: gap.VanoLatitudFin, longitude: gap.VanoLongitudFin }
            ]}
            strokeWidth={3}
            strokeColor={getGapColorByInspected(gap)}
            tappable
            onPress={() => onMarkerPress(gap)} 
          />
        ))}

        {/* PINES */}

        {memoPins.map((pin, i) => {
          const cleanLabel = formatLabel(pin.Label);




          const showLabel =
  Number(pin.Type) !== 8 &&        // NO mostrar gaps
  cleanLabel && cleanLabel.trim().length > 0;

          return (
            <Marker
              key={pin.Id || i}
              coordinate={{
                latitude: pin.Latitude,
                longitude: pin.Longitude,
              }}
              tracksViewChanges={true}
              onPress={() => onMarkerPress(pin)} 
            >
              <View style={pinStyles.pinWrapper}>
                <Image
                  source={getSourceImageFromType2(pin)}
                  style={pinStyles.pinIcon}
                  resizeMode="contain"
                />

                {showLabel && (
                  <View style={pinStyles.labelBox}>
                    <Text style={pinStyles.labelText}>{cleanLabel}</Text>
                  </View>
                )}
              </View>

              <PinCallout pin={pin} />
            </Marker>
          );
        })}

      </MapView>

      <TouchableOpacity style={styles.floatBtn} onPress={userLocation}>
        <Image source={require("../../assets/GPS.png")} style={styles.btnImg} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  floatBtn: {
    position: 'absolute',
    top: '2%',
    right: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    elevation: 5,
  },
  btnImg: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
});










export default Map;