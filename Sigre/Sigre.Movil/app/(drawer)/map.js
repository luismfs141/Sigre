// Map.js
import * as Location from 'expo-location';
import { useRouter } from "expo-router";
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { DropDown } from '../../components/DropDown.js';
import { DropDownSed } from "../../components/DropDownSed";
import { PinCallout } from '../../components/PinCallout';

import { mapStyles, pinStyles } from '../../assets/styles/Map.js';
import { getGapColorByInspected, getSourceImageFromType2 } from '../../utils/utils.js';

import { AuthContext } from "../../context/AuthContext";
import { useDatos } from "../../context/DatosContext.js";
import { useGap } from '../../hooks/useGap.js';
import { useMap } from '../../hooks/useMap.js';
import { usePin } from '../../hooks/usePin.js';
import { usePost } from '../../hooks/usePost.js';

// ------------------- ZOOM PARA ETIQUETAS -------------------
const ZOOM_THRESHOLD = 0.00025;

export const Map = () => {
  const router = useRouter();
  const mapRef = useRef(null);

  const { user } = useContext(AuthContext);
  const {
    selectedFeeder, setSelectedFeeder,
    selectedSed, setSelectedSed,
    pins, setPins,
    gaps, setGaps,
    region, setRegion,
    setSelectedItem,
  } = useDatos();

  const { getPinsByRegion, setRegionByCoordinate, setRegionByFeeder, setRegionBySed } = useMap();
  const { getPostData } = usePost();

  const { fetchPinsByFeeder, fetchPinsBySed } = usePin();
  const { fetchGapsByFeeder, fetchGapsBySed } = useGap();

  const [loadingPins, setLoadingPins] = useState(false);
  const [loadingGaps, setLoadingGaps] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [heading, setHeading] = useState(0);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const shouldShowPins = region?.latitudeDelta >= ZOOM_THRESHOLD;

  // ------------------- CARGA DE PINS Y GAPS -------------------
  const loadData = async () => {
    setLoadingPins(true);
    setLoadingGaps(true);
    try {
      let pinsLoaded = [];
      let gapsLoaded = [];

      if (user?.proyecto === 1 && selectedFeeder) {
        pinsLoaded = await fetchPinsByFeeder(selectedFeeder.AlimInterno);
        gapsLoaded = await fetchGapsByFeeder(selectedFeeder.AlimInterno);
      } else if (user?.proyecto === 0 && selectedSed?.SedInterno) {
        pinsLoaded = await fetchPinsBySed(selectedSed.SedInterno);
        gapsLoaded = await fetchGapsBySed(selectedSed.SedInterno);
      }

      setPins(pinsLoaded);
      setGaps(gapsLoaded.map(g => ({
        ...g,
        VanoLatitudIni: Number(g.VanoLatitudIni),
        VanoLongitudIni: Number(g.VanoLongitudIni),
        VanoLatitudFin: Number(g.VanoLatitudFin),
        VanoLongitudFin: Number(g.VanoLongitudFin),
      })));

      // ------------------- CENTRAR REGIÓN -------------------
      if (pinsLoaded.length > 0) {
        if (user?.proyecto === 1) setRegionByFeeder(pinsLoaded, true); // true = zoom cercano
        else setRegionBySed(pinsLoaded, selectedSed, true);
      }

    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoadingPins(false);
      setLoadingGaps(false);
    }
  };

  useEffect(() => {
    if (mapReady) loadData();
  }, [selectedFeeder, selectedSed, mapReady]);

  // ------------------- GPS Y ORIENTACIÓN -------------------
  useEffect(() => {
    let subscriptionLocation, subscriptionHeading;

    const initLocation = async () => {
      try {
        setLoadingLocation(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        subscriptionLocation = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Highest, timeInterval: 1000, distanceInterval: 1 },
          loc => loc?.coords && setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude })
        );

        subscriptionHeading = await Location.watchHeadingAsync(h => setHeading(h.trueHeading || 0));
      } catch (err) {
        console.warn("Error GPS/Heading:", err);
      } finally {
        setLoadingLocation(false);
      }
    };

    initLocation();
    return () => {
      subscriptionLocation?.remove();
      subscriptionHeading?.remove();
    };
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
        latitudeDelta: 0.0025,
        longitudeDelta: 0.0025,
      };
      mapRef.current?.animateToRegion(newRegion, 600);
      setRegionByCoordinate(coords.latitude, coords.longitude);
    } catch (err) {
      console.warn("Error al ir a ubicación:", err);
    } finally {
      setLoadingLocation(false);
    }
  };

  // ------------------- MEMOIZACIÓN DE PINS -------------------
  const memoPins = useMemo(() => {
    if (!Array.isArray(pins)) return [];
    return pins.filter(p => p.Latitude && p.Longitude);
  }, [pins]);

  // ------------------- AUXILIARES -------------------
  const formatLabel = (label) => label?.replace(/\r?\n|\r/g, " - ").trim() || "";

  const onMarkerPress = async (item) => {
  try {
    let tipoElemento = "";
    let codigoElemento = "";
    let datoElemento = null;

    if (item.Type === 5) {
      const data = await getPostData(item.IdOriginal);
      datoElemento = data; // ya es un objeto, no un array
      tipoElemento = "Poste";
      codigoElemento = datoElemento.PostCodigoNodo;
    } else if (!item.Type && item.VanoCodigo) {
      tipoElemento = "Vano";
      codigoElemento = item.VanoCodigo;
      datoElemento = item;
    } else {
      tipoElemento = "Desconocido";
      codigoElemento = "";
      datoElemento = item;
    }

    Alert.alert(
      "Elemento seleccionado",
      `Tipo: ${tipoElemento}\nCódigo: ${codigoElemento}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Inspeccionar",
          onPress: () => {
            setSelectedItem(datoElemento);
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
  if ((user?.proyecto === 1 && !selectedFeeder) ||
      (user?.proyecto === 0 && !selectedSed)) {
    return (
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>
          {user?.proyecto === 1 ? "Seleccione un alimentador" : "Seleccione una SED"}
        </Text>
        {user?.proyecto === 1 && <DropDown onSelectFeeder={setSelectedFeeder} />}
        {user?.proyecto === 0 && <DropDownSed onSelectSed={setSelectedSed} />}
        <MapView
          style={styles.map}
          initialRegion={{ latitude: -12.0464, longitude: -77.0428, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {user?.proyecto === 0 ? (
        <DropDownSed onSelectSed={setSelectedSed} />
      ) : (
        <DropDown onSelectFeeder={setSelectedFeeder} />
      )}

      {(loadingPins || loadingGaps || loadingLocation) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      )}

      <MapView
        ref={mapRef}
        style={mapStyles.mapContainer}
        region={region}
        mapType="satellite"
        showsUserLocation={true}
        onMapReady={() => setMapReady(true)}
        onTouchStart={() => setIsUserInteracting(true)}
        onPanDrag={() => setIsUserInteracting(true)}
        onRegionChangeComplete={(reg) => {
          setRegion(reg);

          if (reg.latitudeDelta < ZOOM_THRESHOLD) {
            getPinsByRegion(reg);
          }
        }}
      >
        {/* GAPS */}
        {Array.isArray(gaps) && gaps.map((gap, i) => (
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

        {/* PINS */}
        {memoPins.map((pin, i) => {
          const cleanLabel = formatLabel(pin.ElementCode);
          const showLabel = shouldShowPins && Number(pin.Type) !== 8 && cleanLabel?.length > 0;

          return (
            <Marker
              key={pin.Id || i}
              coordinate={{ latitude: pin.Latitude, longitude: pin.Longitude }}
              tracksViewChanges
              onPress={() => onMarkerPress(pin)}
            >
              <View style={pinStyles.pinWrapper}>
                <Image source={getSourceImageFromType2(pin)} style={pinStyles.pinIcon} resizeMode="contain" />
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
  placeholderContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  placeholderText: { fontSize: 16, color: "#555", marginBottom: 20, textAlign: "center" },
  loadingOverlay: { position: 'absolute', top: '50%', left: '50%', zIndex: 100 }
});

export default Map;
