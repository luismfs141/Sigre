//maps app
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";



import * as Location from "expo-location";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";




import { getGapColorByInspected, getSourceImageFromType2 } from "../../utils/utils.js";

import { DropDown } from "../../components/DropDown.js";
import { DropDownSed } from "../../components/DropDownSed";
import { PinCallout } from "../../components/PinCallout";

import { mapStyles, pinStyles } from "../../assets/styles/Map.js";

import { AuthContext } from "../../context/AuthContext";
import { useDatos } from "../../context/DatosContext.js";
import { useFeeder } from "../../hooks/useFeeder.js";
import { useMap } from "../../hooks/useMap.js";
import { usePost } from "../../hooks/usePost.js";
import { useSed } from "../../hooks/useSed.js";

//const ZOOM_THRESHOLD = 0.007;
const ZOOM_THRESHOLD = 0.003;

//S.E. independiente
const ICON_SIZES = {
  DEFAULT: 22,
  SED: 100,      // 👈 tamaño mayor para subestación
};

const getIconSizeByType = (type) => {
  if (Number(type) === 8) {
    return ICON_SIZES.SED; // Subestación
  }
  return ICON_SIZES.DEFAULT;
};

const getLabelOffsetByType = (type) => {
  const size = getIconSizeByType(type);
  return size / 2 + LABEL_GAP;
};


// 🔧 Ajustes finos (en pixeles)
const ICON_SIZE = 22;       // debe coincidir con pinStyles.pinIcon (width/height)
const LABEL_GAP = 2;        // separación entre icono y label
const LABEL_OFFSET_Y = ICON_SIZE / 2 + LABEL_GAP; // baja el label desde la coordenada

export const Map = () => {
  const router = useRouter();
  const mapRef = useRef(null);

  const { user } = useContext(AuthContext);
  const {
    selectedFeeder,
    setSelectedFeeder,
    selectedSed,
    setSelectedSed,
    pins,
    setPins,
    gaps,
    setGaps,
    region,
    setRegion,
    setSelectedItem,
    setSelectedPin,
    setSelectedGap,
    feeders,
    setFeeders
  } = useDatos();

  const {
    getPinsByFeeder,
    getGapsByFeeder,
    getPinsBySed,
    getGapsBySed,
    setRegionByCoordinate,
    setRegionByFeeder,
    getPinsByRegion,
    setRegionBySed
  } = useMap();

  const { fetchLocalFeeders } = useFeeder();
  const { fetchAndSelectPost, getPostData } = usePost();
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
    if (user?.proyecto === 1 && !selectedFeeder) {
      setPins([]);
      setGaps([]);
      return;
    }

    if (user?.proyecto === 0 && !selectedSed) {
      setPins([]);
      setGaps([]);
      return;
    }

    const loadData = async () => {
      setLoadingPins(true);
      setLoadingGaps(true);

      try {
        let pinsLoaded = [];
        let gapsLoaded = [];

        if (user?.proyecto === 1) {
          const feederId = selectedFeeder.AlimInterno;

          [pinsLoaded, gapsLoaded] = await Promise.all([
            getPinsByFeeder(feederId),
            getGapsByFeeder(feederId)
          ]);
        } else {
          const sedId = selectedSed.SedInterno;

          [pinsLoaded, gapsLoaded] = await Promise.all([
            getPinsBySed(sedId),
            getGapsBySed(sedId)
          ]);
        }

        setPins(pinsLoaded);
        setGaps(gapsLoaded);

        if (pinsLoaded.length > 0) {
          if (user?.proyecto === 1) {
            setRegionByFeeder(pinsLoaded);
          } else {
            setRegionBySed(pinsLoaded, selectedSed);
          }
        }
      } catch (error) {
        console.error("❌ Error al cargar datos:", error);
      } finally {
        setLoadingPins(false);
        setLoadingGaps(false);
      }
    };

    loadData();
  }, [selectedFeeder, selectedSed, user?.proyecto]);

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
            if (loc?.coords) {
              setUserLocation({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude
              });
            }
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
      if (status !== "granted") return;

      const { coords } = await Location.getCurrentPositionAsync({
        enableHighAccuracy: true,
        accuracy: Location.Accuracy.Highest
      });
      if (!coords) return;

      const newRegion = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005
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
    return pins
      .filter((p) => p.Type !== 0 && p.Latitude != null && p.Longitude != null)
      .map((p) => ({
        ...p,
        Latitude: Number(p.Latitude),
        Longitude: Number(p.Longitude)
      }))
      .filter((p) => Number.isFinite(p.Latitude) && Number.isFinite(p.Longitude));
  }, [pins, shouldShowPins]);

  const memoGaps = useMemo(() => (Array.isArray(gaps) ? gaps : []), [gaps]);

  // ------------------- AUX -------------------
  const formatLabel = (label) => label?.replace(/\r?\n|\r/g, " - ").trim() || "";

  const onMarkerPress = async (item) => {
    try {
      let tipoElemento = "";
      let codigoElemento = "";
      let datoElemento = null;
      let codigoEtiqueta = null;

      if (item.Type === 5) {
        const data = await getPostData(item.IdOriginal);
        datoElemento = data;
        tipoElemento = "Poste";
        codigoElemento = datoElemento.PostCodigoNodo;
        codigoEtiqueta = datoElemento.PostEtiqueta
      } else if (!item.Type && item.VanoCodigo) {
        tipoElemento = "Vano";

        //console.log("⚠️ Error: ", item);

        codigoElemento = item.VanoCodigo;
        codigoEtiqueta = item.VanoEtiqueta;
        datoElemento = item;
      } else {
        tipoElemento = "Desconocido";
        codigoElemento = "";
        datoElemento = item;
      }

      Alert.alert(
        "Elemento seleccionado",
        
        `Tipo: ${tipoElemento}\nCódigo: ${codigoElemento}\nEtiqueta: ${codigoEtiqueta}`,
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
  if ((user?.proyecto === 1 && !selectedFeeder) || (user?.proyecto === 0 && !selectedSed)) {
    return (
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>
          {user?.proyecto === 1 ? "Seleccione un alimentador" : "Seleccione una SED"}
        </Text>

        {user?.proyecto === 1 && <DropDown onSelectFeeder={setSelectedFeeder} />}
        {user?.proyecto === 0 && <DropDownSed onSelectSed={setSelectedSed} />}

        <MapView
          style={styles.map}
          initialRegion={{
            latitude: -12.0464,
            longitude: -77.0428,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05
          }}
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
        initialRegion={region}
        mapType="satellite"
        showsUserLocation={true}
        followsUserLocation={false}
        showsMyLocationButton={false}
        onTouchStart={() => setIsUserInteracting(true)}
        onPanDrag={() => setIsUserInteracting(true)}
        onRegionChangeComplete={(reg) => {
          setRegion(reg);
          getPinsByRegion(reg);
        }}
      >
        {memoGaps.map((gap, i) => (
          <Polyline
            key={`gap-${i}`}
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



        {memoPins.map((pin, i) => {
          const iconSize = getIconSizeByType(pin.Type);

          const cleanLabel = formatLabel(pin.ElementCode);
          const showLabel = Number(pin.Type) !== 8 && cleanLabel.length > 0;

          const coordinate = {
            latitude: Number(pin.Latitude),
            longitude: Number(pin.Longitude)
          };



          // Tipo 8: solo icono, sin label, sin interacción
          if (Number(pin.Type) === 8) {
            return (
              <Marker
                key={`pin-icon-${pin.Id || i}`}
                coordinate={coordinate}
                anchor={{ x: 1.0, y: 1.0 }}
                tracksViewChanges={true}
                pointerEvents="none"
              >
                {/* 🟢 BOUNDING BOX REAL DEL ICONO */}
                <View style={pinStyles.iconCanvasSE} collapsable={false}>
                  <View style={pinStyles.iconWrapperSE}>

                    <Image
                      source={getSourceImageFromType2(pin)}
                      style={[
                        pinStyles.pinIconSE,
                        {
                          width: 80,
                          height: 80,
                        },
                      ]}
                    />
                  </View>
                </View>
              </Marker>

            );
          }




          return (
            <React.Fragment key={`pin-frag-${pin.Id || i}`}>


              {/* Marker A: ICONO */}
              <Marker
                key={`pin-icon-${pin.Id || i}`}
                coordinate={coordinate}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={true}
                onPress={() => onMarkerPress(pin)}
              >
                {/* 🟢 BOUNDING BOX REAL DEL ICONO */}
                <View style={pinStyles.iconCanvas} collapsable={false}>
                  <View style={pinStyles.iconWrapper}>

                    <Image
                      source={getSourceImageFromType2(pin)}
                      style={[
                        pinStyles.pinIcon,
                        {
                          width: iconSize,
                          height: iconSize,
                        },
                      ]}
                    />

                  </View>
                </View>

                <PinCallout pin={pin} />
              </Marker>

              {/* Marker B: LABEL independiente */}

              {showLabel && (
                <Marker
                  key={`pin-label-${pin.Id || i}`}
                  coordinate={coordinate}
                  anchor={{ x: 0.5, y: 0.0 }}
                  centerOffset={{ x: 0, y: getLabelOffsetByType(pin.Type) }}

                  tracksViewChanges={true}
                  zIndex={999}

                  // ✅ CLAVE: si el label se come el toque, que también seleccione
                  tappable={true}
                  onPress={() => onMarkerPress(pin)}
                >
                  {/* ✅ pointerEvents aquí adentro, no en el Marker */}
                  <View style={pinStyles.labelCanvas} collapsable={false} pointerEvents="none">
                    <View style={pinStyles.labelBox}>
                      <Text style={pinStyles.labelText}>{cleanLabel}</Text>
                    </View>
                  </View>
                </Marker>
              )}







            </React.Fragment>
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
    position: "absolute",
    top: "2%",
    right: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
    elevation: 5
  },
  btnImg: { width: 40, height: 40, resizeMode: "contain" },
  placeholderContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  placeholderText: { fontSize: 16, color: "#555", marginBottom: 20, textAlign: "center" },
  loadingOverlay: { position: "absolute", top: "50%", left: "50%", zIndex: 100 },
  map: { width: "100%", height: "100%" }
});

export default Map;
