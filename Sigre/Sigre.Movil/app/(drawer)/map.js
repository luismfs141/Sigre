// maps app
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { Fragment, useContext, useEffect, useMemo, useRef, useState } from "react";
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

import { mapStyles, pinStyles } from "../../assets/styles/Map.js";
import { DropDown } from "../../components/DropDown.js";
import { DropDownSed } from "../../components/DropDownSed";
import { AuthContext } from "../../context/AuthContext";
import { useDatos } from "../../context/DatosContext.js";
import { useFeeder } from "../../hooks/useFeeder.js";
import { useMap } from "../../hooks/useMap.js";
import { usePost } from "../../hooks/usePost.js";
import { useSed } from "../../hooks/useSed.js";
import { getGapColorByInspected, getSourceImageFromType2 } from "../../utils/utils.js";

// ---------------- CONFIG ----------------
const ZOOM_THRESHOLD = 0.003;

// Tamaños
const ICON_SIZES = {
  DEFAULT: 22,
  SED: 35,
};

const LABEL_GAP = 2;

const isSedType = (type) => Number(type) === 1 || Number(type) === 2;
const isPostType = (type) => Number(type) === 5;

const getIconSizeByType = (type) =>
  isSedType(type) ? ICON_SIZES.SED : ICON_SIZES.DEFAULT;

const getLabelOffsetByType = (type) => {
  const size = getIconSizeByType(type);
  return size / 2 + LABEL_GAP;
};

const Map = () => {
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
  const { getPostData } = usePost();
  const { fetchAndSelectSed } = useSed();

  const [loadingPins, setLoadingPins] = useState(false);
  const [loadingGaps, setLoadingGaps] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [heading, setHeading] = useState(0);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showGapSelector, setShowGapSelector] = useState(false);
  const [overlappedGaps, setOverlappedGaps] = useState([]);

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

  // ------------------- GPS -------------------
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

  // ------------------- ORIENTACIÓN -------------------
  useEffect(() => {
    let headingSub;
    const initHeading = async () => {
      try {
        headingSub = await Location.watchHeadingAsync((e) =>
          setHeading(e.trueHeading || 0)
        );
      } catch (err) {
        console.warn("Error heading:", err);
      }
    };

    initHeading();
    return () => headingSub && headingSub.remove();
  }, []);

  // ------------------- IR A UBICACIÓN -------------------
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

  // ------------------- MEMO PINS -------------------
  const memoPins = useMemo(() => {
    if (!Array.isArray(pins)) return [];
    return pins
      .filter((p) => p.Type !== 0 && p.Latitude != null && p.Longitude != null)
      .map((p) => ({
        ...p,
        Latitude: Number(p.Latitude),
        Longitude: Number(p.Longitude)
      }))
      .filter((p) => Number.isFinite(p.Latitude) && Number.isFinite(p.Longitude));
  }, [pins]);

  const pinsSed = useMemo(
    () => memoPins.filter((p) => isSedType(p.Type)),
    [memoPins]
  );

  const pinsPost = useMemo(() => {
    if (!shouldShowPins) return [];
    return memoPins.filter((p) => isPostType(p.Type));
  }, [memoPins, shouldShowPins]);

  const memoGaps = useMemo(() => (Array.isArray(gaps) ? gaps : []), [gaps]);

  // ------------------- AUX -------------------
  const formatLabel = (label) =>
    label?.replace(/\r?\n|\r/g, " - ").trim() || "";

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
              router.push("inspection");
            }
          }
        ]
      );
    } catch (err) {
      console.warn("Error al seleccionar marker:", err);
    }
  };

  const areCoordsEqual = (a, b, tolerance = 0.00001) => {
    return Math.abs(Number(a) - Number(b)) <= tolerance;
  };

  const findOverlappedGaps = (gap, allGaps) => {
    return allGaps.filter(g =>
      areCoordsEqual(g.VanoLatitudIni, gap.VanoLatitudIni) &&
      areCoordsEqual(g.VanoLongitudIni, gap.VanoLongitudIni) &&
      areCoordsEqual(g.VanoLatitudFin, gap.VanoLatitudFin) &&
      areCoordsEqual(g.VanoLongitudFin, gap.VanoLongitudFin)
    );
  };

  const getCleanLabel = (pin) => {
    const raw = pin.Label || pin.ElementCode || "";

    if (!raw) return "";

    // Corta en el primer salto de línea y elimina espacios
    return String(raw).split("\n")[0].trim();
  };

  // ------------------- PLACEHOLDER -------------------
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

  // ------------------- RENDER -------------------
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
        {/* GAPS */}
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
            onPress={() => {
              const overlapped = findOverlappedGaps(gap, memoGaps);

              if (overlapped.length === 1) {
                onMarkerPress(overlapped[0]);
              } else if (overlapped.length > 1) {
                setOverlappedGaps(overlapped);
                setShowGapSelector(true);
              }
            }}
          />
        ))}

        {/* POSTES: ICONO + LABEL */}
        {pinsPost.map((pin, i) => {
          const iconSize = getIconSizeByType(pin.Type);
          const cleanLabel = formatLabel(pin.ElementCode || pin.Label);
          const showLabel = cleanLabel.length > 0;

          const coordinate = {
            latitude: pin.Latitude,
            longitude: pin.Longitude
          };

          return (
            <Fragment key={`pin-post-${pin.Id || i}`}>
              {/* ICONO */}
              <Marker
                coordinate={coordinate}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={true}
                onPress={() => onMarkerPress(pin)}
                zIndex={10}
              >
                <View style={pinStyles.iconCanvas} collapsable={false}>
                  <View style={pinStyles.iconWrapper}>
                    <Image
                      source={getSourceImageFromType2(pin)}
                      style={[pinStyles.pinIcon, { width: iconSize, height: iconSize }]}
                    />
                  </View>
                </View>
              </Marker>

              {/* LABEL */}
              {showLabel && (
                <Marker
                  coordinate={coordinate}
                  anchor={{ x: 0.5, y: 0.0 }}
                  centerOffset={{ x: 0, y: getLabelOffsetByType(pin.Type) }}
                  tracksViewChanges={true}
                  zIndex={999}
                  tappable
                  onPress={() => onMarkerPress(pin)}
                >
                  <View style={pinStyles.labelCanvas} collapsable={false} pointerEvents="none">
                    <View style={pinStyles.labelBox}>
                      <Text style={pinStyles.labelText}>{cleanLabel}</Text>
                    </View>
                  </View>
                </Marker>
              )}
            </Fragment>
          );
        })}

        {/* SED: SIEMPRE VISIBLE - SOLO ICONO + LABEL */}
        {pinsSed.map((pin, i) => {
          const coordinate = {
            latitude: pin.Latitude,
            longitude: pin.Longitude
          };
          const label = getCleanLabel(pin);

          return (
            <Fragment key={`pin-sed-${pin.Id || i}`}>
              
              {/* ICONO */}
              <Marker
                coordinate={coordinate}
                anchor={{ x: 0.5, y: 1.5 }}
                tracksViewChanges={true}
                zIndex={2000}
                onPress={() => onMarkerPress(pin)}
              >
                <View collapsable={false}>
                  <Image
                    source={getSourceImageFromType2(pin)}
                    style={{ width: 35, height: 35, resizeMode: "contain" }}
                  />
                </View>
              </Marker>

              {/* LABEL */}
              {label !== "" && (
                <Marker
                  coordinate={coordinate}
                  anchor={{ x: 0.5, y: 1.9 }}
                  centerOffset={{ x: 0, y: 30 }}   // mueve el texto debajo del icono
                  tracksViewChanges={true}
                  zIndex={2001}
                  tappable={false}
                >
                  <View style={pinStyles.labelCanvas} collapsable={false} pointerEvents="none">
                    <View style={pinStyles.labelBox}>
                      <Text style={pinStyles.labelText}>{label}</Text>
                    </View>
                  </View>
                </Marker>
              )}
            </Fragment>
          );
        })}

      </MapView>
      {/* 🔽 MODAL FUERA DEL MAPVIEW */}
        {showGapSelector && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Seleccione un Vano</Text>

              {overlappedGaps.map((gap, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.modalItem}
                  onPress={() => {
                    setShowGapSelector(false);
                    onMarkerPress(gap);
                  }}
                >
                  <Text style={styles.modalText}>
                    {gap.VanoCodigo || "Vano sin código"} - {gap.VanoEtiqueta || ""}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowGapSelector(false)}
              >
                <Text style={{ color: "red" }}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
  map: { width: "100%", height: "100%" },
  modalOverlay: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.4)", // fondo oscuro
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,     // iOS
  elevation: 20    // Android
},

modalBox: {
  width: "85%",
  backgroundColor: "#fff",
  borderRadius: 10,
  padding: 15,
},

modalTitle: {
  fontSize: 16,
  fontWeight: "bold",
  marginBottom: 10,
  textAlign: "center",
},

modalItem: {
  paddingVertical: 10,
  borderBottomWidth: 1,
  borderBottomColor: "#eee",
},

modalText: {
  fontSize: 14,
  color: "#333",
},

modalCancel: {
  marginTop: 10,
  alignItems: "center",
}

});

export default Map;
