import * as Location from 'expo-location';
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { DropDown } from '../../components/DropDown.js';
import { PinCallout } from '../../components/PinCallout';

import { mapStyles, pinStyles } from '../../assets/styles/Map.js';
import { getGapColorByInspected, getSourceImageFromType2 } from '../../utils/utils.js';

import { useDatos } from "../../context/DatosContext.js";
import { useFeeder } from '../../hooks/useFeeder.js';
import { useMap } from '../../hooks/useMap.js';
import { usePost } from '../../hooks/usePost.js';
import { useSed } from '../../hooks/useSed.js';

const ZOOM_THRESHOLD = 0.007;

export const Map = () => {
  const router = useRouter();
  const mapRef = useRef(null);

  const {
    selectedFeeder, setSelectedFeeder,
    pins, setPins,
    gaps, setGaps,
    region, setRegion,
    setSelectedItem, setSelectedPin, setSelectedGap,
    feeders, setFeeders
  } = useDatos();

  const { getPinsByFeeder, getGapsByFeeder, setRegionByCoordinate, setRegionByFeeder, getPinsByRegion } = useMap();
  const { fetchLocalFeeders } = useFeeder();
  const { fetchAndSelectPost } = usePost();
  const { fetchAndSelectSed } = useSed();

  const [loadingPins, setLoadingPins] = useState(false);
  const [loadingGaps, setLoadingGaps] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [heading, setHeading] = useState(0);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const shouldShowPins = region?.latitudeDelta < ZOOM_THRESHOLD;

  // ------------------- CARGA DE PINS Y GAPS -------------------
  useEffect(() => {
    if (!selectedFeeder) return;

    const loadData = async () => {
      setLoadingPins(true);
      setLoadingGaps(true);
      try {
        const [pinsLoaded, gapsLoaded] = await Promise.all([
          getPinsByFeeder(selectedFeeder.AlimInterno),
          getGapsByFeeder(selectedFeeder.AlimInterno)
        ]);
        if (Array.isArray(pinsLoaded)) setPins(pinsLoaded);
        if (Array.isArray(gapsLoaded)) setGaps(gapsLoaded);
        setRegionByFeeder(pinsLoaded);
      } catch (err) {
        console.warn("Error cargando pins/gaps:", err);
      } finally {
        setLoadingPins(false);
        setLoadingGaps(false);
      }
    };

    loadData();
  }, [selectedFeeder]);

  // ------------------- GPS EN TIEMPO REAL -------------------
  useEffect(() => {
    let subscription;
    const initLocation = async () => {
      try {
        setLoadingLocation(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Highest, timeInterval: 1000, distanceInterval: 1 },
          (loc) => {
            if (loc?.coords) setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          }
        );
      } catch (err) {
        console.warn("Error GPS:", err);
      } finally {
        setLoadingLocation(false);
      }
    };
    initLocation();
    return () => subscription && subscription.remove();
  }, []);

  // ------------------- ORIENTACIÓN DEL CELULAR -------------------
  useEffect(() => {
    let headingSub;
    const initHeading = async () => {
      try {
        headingSub = await Location.watchHeadingAsync((e) => setHeading(e.trueHeading || 0));
      } catch (err) {
        console.warn("Error heading:", err);
      }
    };
    initHeading();
    return () => headingSub && headingSub.remove();
  }, []);

  // ------------------- IR A UBICACIÓN DEL USUARIO -------------------
  const goToUserLocation = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const { coords } = await Location.getCurrentPositionAsync({ enableHighAccuracy: true, accuracy: Location.Accuracy.Highest });
      if (!coords) return;

      const newRegion = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      mapRef.current?.animateToRegion(newRegion, 600);
      setRegionByCoordinate(coords.latitude, coords.longitude);
    } catch (err) {
      console.warn("Error al ir a ubicación:", err);
    } finally {
      setLoadingLocation(false);
    }
  };

  // ------------------- MEMOIZACIÓN DE PINS Y GAPS -------------------
  const memoPins = useMemo(() => {
    if (!shouldShowPins || !Array.isArray(pins)) return [];
    return pins.filter(p => p.Type !== 0 && p.Latitude && p.Longitude);
  }, [pins, shouldShowPins]);

  const memoGaps = useMemo(() => (Array.isArray(gaps) ? gaps : []), [gaps]);

  // ------------------- FUNCIONES AUXILIARES -------------------
  const formatLabel = (label) => label?.replace(/\r?\n|\r/g, " - ").trim() || "";

  const onMarkerPress = async (item) => {
    try {
      let tipoElemento = item.VanoCodigo ? "Vano" : item.ElementCode ? "Elemento" : "Desconocido";
      let codigo = item.VanoCodigo || item.ElementCode || "";

      Alert.alert(
        "Elemento seleccionado",
        `Tipo: ${tipoElemento}\nCódigo: ${codigo}`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Inspeccionar",
            onPress: async () => {
              if (item.VanoCodigo) setSelectedItem(item);
              else if (item.Type === 5) await fetchAndSelectPost(item.IdOriginal);
              else if (![7,8].includes(item.Type)) await fetchAndSelectSed(item.IdOriginal);
              router.push("/(drawer)/inspection");
            }
          }
        ]
      );
    } catch (err) {
      console.warn("Error al seleccionar marker:", err);
    }
  };

  // ------------------- RENDER -------------------
  if (!selectedFeeder) {
    return (
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>Selecciona un alimentador para mostrar el mapa</Text>
        <DropDown onSelectFeeder={setSelectedFeeder} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <DropDown onSelectFeeder={setSelectedFeeder} />

      {(loadingPins || loadingGaps || loadingLocation) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      )}

      <MapView
        ref={mapRef}
        style={mapStyles.mapContainer}
        region={region}
        initialRegion={region}
        mapType="satellite"
        onTouchStart={() => setIsUserInteracting(true)}
        onPanDrag={() => setIsUserInteracting(true)}
        onRegionChangeComplete={(reg) => {
          setRegion(reg);
          getPinsByRegion(reg);
        }}
      >
        {userLocation && (
          <Marker coordinate={userLocation} anchor={{ x:0.5, y:0.5 }} tracksViewChanges>
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <Image source={require("../../assets/transparent.png")}
                     style={{ width: 34, height: 34, tintColor: "#0066FF", transform: [{ rotate: `${heading}deg` }] }}/>
              <View style={{ width:16, height:16, backgroundColor:"#4285F4", borderRadius:8, borderWidth:3, borderColor:"white", position:"absolute" }} />
            </View>
          </Marker>
        )}

        {memoGaps.map((gap,i) => (
          <Polyline
            key={i}
            coordinates={[ { latitude: gap.VanoLatitudIni, longitude: gap.VanoLongitudIni },
                           { latitude: gap.VanoLatitudFin, longitude: gap.VanoLongitudFin } ]}
            strokeWidth={3}
            strokeColor={getGapColorByInspected(gap)}
            tappable
            onPress={() => onMarkerPress(gap)}
          />
        ))}

        {memoPins.map((pin,i) => {
          const cleanLabel = formatLabel(pin.Label);
          const showLabel = Number(pin.Type) !== 8 && cleanLabel?.length > 0;

          if (Number(pin.Type) === 8) return (
            <Marker key={pin.Id || i} coordinate={{ latitude: pin.Latitude, longitude: pin.Longitude }} tracksViewChanges pointerEvents="none">
              <View style={pinStyles.pinWrapper}>
                <Image source={getSourceImageFromType2(pin)} style={pinStyles.pinIcon} resizeMode="contain"/>
              </View>
            </Marker>
          );

          return (
            <Marker key={pin.Id || i} coordinate={{ latitude: pin.Latitude, longitude: pin.Longitude }} tracksViewChanges onPress={() => onMarkerPress(pin)}>
              <View style={pinStyles.pinWrapper}>
                <Image source={getSourceImageFromType2(pin)} style={pinStyles.pinIcon} resizeMode="contain"/>
                {showLabel && (
                  <View style={pinStyles.labelBox}>
                    <Text style={pinStyles.labelText}>{cleanLabel}</Text>
                  </View>
                )}
              </View>
              <PinCallout pin={pin}/>
            </Marker>
          );
        })}
      </MapView>

      <TouchableOpacity style={styles.floatBtn} onPress={goToUserLocation}>
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
  btnImg: { width: 40, height: 40, resizeMode: 'contain' },
  placeholderContainer: { flex:1, justifyContent:"center", alignItems:"center", padding:20 },
  placeholderText: { fontSize:16, color:"#555", marginBottom:20, textAlign:"center" },
  loadingOverlay: { position:'absolute', top:'50%', left:'50%', zIndex:100 }
});

export default Map;
