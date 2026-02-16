// maps app
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { Fragment, useContext, useEffect, useMemo, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, Polyline } from "react-native-maps";

import { mapStyles, pinStyles } from "../../assets/styles/Map.js";
import { DropDown } from "../../components/DropDown.js";
import { DropDownSed } from "../../components/DropDownSed";
import { AuthContext } from "../../context/AuthContext";
import { useDatos } from "../../context/DatosContext.js";
import { useMap } from "../../hooks/useMap.js";
import { usePost } from "../../hooks/usePost.js";
import { useSed } from "../../hooks/useSed.js";

import styles from "../../styles/mapStyles";

import { getGapColorByInspected, getSourceImageFromType2 } from "../../utils/utils.js";

import {
  ZOOM_THRESHOLD,
  buildSearchResults,
  centerMap,
  findOverlappedGaps,
  formatLabel,
  getCleanLabel,
  getIconSizeByType,
  getLabelOffsetByType,
  getPinsVisibleInRegion,
  isPostType,
  isSedType,
  normalizeText,
} from "../../utils/map/mapUtils";

import { GapSelectorModal, SearchModal } from "../../components/Map/MapModals";

const Map = () => {
  const router = useRouter();
  const mapRef = useRef(null);

  // universo completo para búsqueda
  const pinsRef = useRef([]);

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
    setRegionBySed,
  } = useMap();

  const { getPostData } = usePost();
  const { fetchAndSelectSed } = useSed();

  const [loadingPins, setLoadingPins] = useState(false);
  const [loadingGaps, setLoadingGaps] = useState(false);

  const [heading, setHeading] = useState(0);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const [showGapSelector, setShowGapSelector] = useState(false);
  const [overlappedGaps, setOverlappedGaps] = useState([]);

  // búsqueda
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSearchResult, setSelectedSearchResult] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const shouldShowPins = region?.latitudeDelta < ZOOM_THRESHOLD;

  // refresh sin mover cámara
  const regionRef = useRef(region);
  useEffect(() => {
    regionRef.current = region;
  }, [region]);

  const loadMapData = async ({ recenter = false, keepView = false } = {}) => {
    if (user?.proyecto === 1 && !selectedFeeder) {
      pinsRef.current = [];
      setPins([]);
      setGaps([]);
      return;
    }

    if (user?.proyecto === 0 && !selectedSed) {
      pinsRef.current = [];
      setPins([]);
      setGaps([]);
      return;
    }

    setLoadingPins(true);
    setLoadingGaps(true);

    try {
      let pinsLoaded = [];

      if (user?.proyecto === 1) {
        const feederId = selectedFeeder.AlimInterno;

        const result = await Promise.all([
          getPinsByFeeder(feederId),
          getGapsByFeeder(feederId),
        ]);

        pinsLoaded = Array.isArray(result[0]) ? result[0] : [];
      } else {
        const sedId = selectedSed.SedInterno;

        const result = await Promise.all([
          getPinsBySed(sedId),
          getGapsBySed(sedId),
        ]);

        pinsLoaded = Array.isArray(result[0]) ? result[0] : [];
      }

      pinsRef.current = pinsLoaded;

      if (keepView) {
        const visible = getPinsVisibleInRegion(pinsLoaded, regionRef.current);
        setPins(visible);
      } else {
        setPins(pinsLoaded);
      }

      if (recenter && pinsLoaded.length > 0) {
        if (user?.proyecto === 1) setRegionByFeeder(pinsLoaded);
        else setRegionBySed(pinsLoaded, selectedSed);
      }
    } catch (error) {
      console.error("❌ Error al cargar/refresh datos del mapa:", error);
    } finally {
      setLoadingPins(false);
      setLoadingGaps(false);
    }
  };

  const handleRefreshMap = async () => {
    await loadMapData({ recenter: false, keepView: true });
  };

  // cambio selección => carga con recenter
  useEffect(() => {
    if (user?.proyecto === 1 && !selectedFeeder) {
      pinsRef.current = [];
      setPins([]);
      setGaps([]);
      return;
    }

    if (user?.proyecto === 0 && !selectedSed) {
      pinsRef.current = [];
      setPins([]);
      setGaps([]);
      return;
    }

    loadMapData({ recenter: true, keepView: false });
  }, [user?.proyecto, selectedFeeder?.AlimInterno, selectedSed?.SedInterno]);

  // GPS
  useEffect(() => {
    let subscription;
    const initLocation = async () => {
      try {
        setLoadingLocation(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          () => {},
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

  // Heading
  useEffect(() => {
    let headingSub;
    const initHeading = async () => {
      try {
        headingSub = await Location.watchHeadingAsync((e) =>
          setHeading(e.trueHeading || 0),
        );
      } catch (err) {
        console.warn("Error heading:", err);
      }
    };

    initHeading();
    return () => headingSub && headingSub.remove();
  }, []);

  const goToUserLocation = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const { coords } = await Location.getCurrentPositionAsync({
        enableHighAccuracy: true,
        accuracy: Location.Accuracy.Highest,
      });
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

  // memo pins/gaps
  const memoPins = useMemo(() => {
    if (!Array.isArray(pins)) return [];
    return pins
      .filter((p) => p.Type !== 0 && p.Latitude != null && p.Longitude != null)
      .map((p) => ({
        ...p,
        Latitude: Number(p.Latitude),
        Longitude: Number(p.Longitude),
      }))
      .filter((p) => Number.isFinite(p.Latitude) && Number.isFinite(p.Longitude));
  }, [pins]);

  const pinsSed = useMemo(() => memoPins.filter((p) => isSedType(p.Type)), [memoPins]);

  const pinsPost = useMemo(() => {
    if (!shouldShowPins) return [];
    return memoPins.filter((p) => isPostType(p.Type));
  }, [memoPins, shouldShowPins]);

  const memoGaps = useMemo(() => (Array.isArray(gaps) ? gaps : []), [gaps]);

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
        codigoEtiqueta = datoElemento.PostEtiqueta;
      } else if (!item.Type && item.VanoCodigo) {
        tipoElemento = "Vano";
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
            },
          },
        ],
      );
    } catch (err) {
      console.warn("Error al seleccionar marker:", err);
    }
  };

  // placeholder
  if (
    (user?.proyecto === 1 && !selectedFeeder) ||
    (user?.proyecto === 0 && !selectedSed)
  ) {
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
            longitudeDelta: 0.05,
          }}
        />
      </View>
    );
  }

  // search handlers
  const handleDoSearch = () => {
    const q = normalizeText(searchText);
    if (!q) return;

    const res = buildSearchResults(q, pinsRef.current, gaps);

    setHasSearched(true);
    setSearchResults(res);
    setSelectedSearchResult(null);
  };

  const cleanupSearchModal = () => {
    setShowSearchModal(false);
    setSearchText("");
    setSearchResults([]);
    setSelectedSearchResult(null);
    setHasSearched(false);
  };

  const clearSearch = () => {
    setSearchText("");
    setSearchResults([]);
    setSelectedSearchResult(null);
    setHasSearched(false);
  };

  const handleLocateSelected = () => {
    if (!selectedSearchResult) return;
    centerMap(mapRef, selectedSearchResult.lat, selectedSearchResult.lng);
    cleanupSearchModal();
  };

  const handleSelectSelected = async () => {
    if (!selectedSearchResult) return;

    try {
      centerMap(mapRef, selectedSearchResult.lat, selectedSearchResult.lng);

      let datoElemento = null;

      if (selectedSearchResult.kind === "PIN" && selectedSearchResult.subKind === "Poste") {
        const pin = selectedSearchResult.raw;
        const postId = pin?.IdOriginal ?? pin?.Id ?? null;

        datoElemento = await getPostData(postId);
        if (!datoElemento) {
          Alert.alert("Error", "No se pudo cargar el poste desde SQLite.");
          return;
        }
      } else if (selectedSearchResult.kind === "PIN" && selectedSearchResult.subKind === "SED") {
        const pin = selectedSearchResult.raw;
        const sedId = pin?.IdOriginal ?? pin?.Id ?? null;

        const sed = await fetchAndSelectSed(sedId);
        datoElemento = sed ?? pin;
      } else if (selectedSearchResult.kind === "VANO") {
        datoElemento = selectedSearchResult.raw;
      } else {
        datoElemento = selectedSearchResult.raw;
      }

      cleanupSearchModal();
      setSelectedItem(datoElemento);
      router.push("inspection");
    } catch (err) {
      console.warn("Error seleccionando desde búsqueda:", err);
      Alert.alert("Error", "No se pudo seleccionar el elemento.");
    }
  };

  // render
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
              { latitude: gap.VanoLatitudFin, longitude: gap.VanoLongitudFin },
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
          const cleanLabel = formatLabel(pin.Label);
          const showLabel = cleanLabel.length > 0;

          const coordinate = {
            latitude: pin.Latitude,
            longitude: pin.Longitude,
          };

          return (
            <Fragment key={`pin-post-${pin.Id || i}`}>
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
                      style={[
                        pinStyles.pinIcon,
                        { width: iconSize, height: iconSize },
                      ]}
                    />
                  </View>
                </View>
              </Marker>

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

        {/* SED: ICONO + LABEL */}
        {pinsSed.map((pin, i) => {
          const coordinate = {
            latitude: pin.Latitude,
            longitude: pin.Longitude,
          };
          const label = getCleanLabel(pin);

          return (
            <Fragment key={`pin-sed-${pin.Id || i}`}>
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

              {label !== "" && (
                <Marker
                  coordinate={coordinate}
                  anchor={{ x: 0.5, y: 1.9 }}
                  centerOffset={{ x: 0, y: 30 }}
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

      <GapSelectorModal
        visible={showGapSelector}
        overlappedGaps={overlappedGaps}
        onPick={(gap) => {
          setShowGapSelector(false);
          onMarkerPress(gap);
        }}
        onCancel={() => setShowGapSelector(false)}
      />

      <TouchableOpacity style={styles.floatBtn} onPress={goToUserLocation}>
        <Image source={require("../../assets/GPS.png")} style={styles.btnImg} />
      </TouchableOpacity>

      {/* BOTONES TOP RIGHT */}
      <View style={styles.topRightButtons}>
        <TouchableOpacity
          onPress={() => {
            setShowSearchModal(true);
            clearSearch();
          }}
          disabled={loadingPins || loadingGaps || loadingLocation}
          style={[
            styles.circleBtn,
            (loadingPins || loadingGaps || loadingLocation) && { opacity: 0.6 },
          ]}
        >
          <Ionicons name="search" size={24} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleRefreshMap}
          disabled={loadingPins || loadingGaps || loadingLocation}
          style={[
            styles.circleBtn,
            { marginTop: 10 },
            (loadingPins || loadingGaps || loadingLocation) && { opacity: 0.6 },
          ]}
        >
          <Ionicons name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <SearchModal
        visible={showSearchModal}
        searchText={searchText}
        setSearchText={setSearchText}
        hasSearched={hasSearched}
        searchResults={searchResults}
        selectedSearchResult={selectedSearchResult}
        setSelectedSearchResult={setSelectedSearchResult}
        onSearch={handleDoSearch}
        onClear={clearSearch}
        onCancel={cleanupSearchModal}
        onLocate={handleLocateSelected}
        onSelect={handleSelectSelected}
      />
    </View>
  );
};

export default Map;
