// maps app
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import {
  Fragment,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";


import MapView, { Marker, Polyline } from "react-native-maps";

import { Ionicons } from "@expo/vector-icons";
import { mapStyles, pinStyles } from "../../assets/styles/Map.js";
import { DropDown } from "../../components/DropDown.js";
import { DropDownSed } from "../../components/DropDownSed";
import { AuthContext } from "../../context/AuthContext";
import { useDatos } from "../../context/DatosContext.js";
import { useFeeder } from "../../hooks/useFeeder.js";
import { useMap } from "../../hooks/useMap.js";
import { usePost } from "../../hooks/usePost.js";
import { useSed } from "../../hooks/useSed.js";
import { modalStyles } from "../../styles/modalStyles.js";
import {
  getGapColorByInspected,
  getSourceImageFromType2,
} from "../../utils/utils.js";

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
  // 🔥 NUEVO: Referencia para guardar los pines "frescos"
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
  // Estados para el Modal de Búsqueda
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSearchResult, setSelectedSearchResult] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);


  const shouldShowPins = region?.latitudeDelta < ZOOM_THRESHOLD;

  // ===========================
  // ✅ REFRESH SIN MOVER LA CÁMARA (vista actual)
  // ===========================
  const regionRef = useRef(region);
  useEffect(() => {
    regionRef.current = region;
  }, [region]);

  const getPinsVisibleInRegion = (pinsArray, reg) => {
    if (!Array.isArray(pinsArray)) return [];
    if (!reg) return pinsArray;

    // misma regla que useMap.getPinsByRegion
    if (reg.latitudeDelta > 0.008) return [];

    const { latitude, longitude, latitudeDelta, longitudeDelta } = reg;

    const minLat = latitude - latitudeDelta * 0.6;
    const maxLat = latitude + latitudeDelta * 0.6;
    const minLng = longitude - longitudeDelta * 0.6;
    const maxLng = longitude + longitudeDelta * 0.6;

    return pinsArray.filter(
      (p) =>
        Number(p.Latitude) >= minLat &&
        Number(p.Latitude) <= maxLat &&
        Number(p.Longitude) >= minLng &&
        Number(p.Longitude) <= maxLng,
    );
  };

  const loadMapData = async ({ recenter = false, keepView = false } = {}) => {
    // Validación de selección
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

      // ✅ pinsRef = universo completo (para búsqueda)
      pinsRef.current = pinsLoaded;

      // ✅ si es refresh: mantener vista y pintar solo visibles en la región actual
      if (keepView) {
        const visible = getPinsVisibleInRegion(pinsLoaded, regionRef.current);
        setPins(visible);
      } else {
        // carga normal
        setPins(pinsLoaded);
      }

      // ✅ recentrar solo cuando corresponde
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



  // ------------------- CARGA DE PINS Y GAPS -------------------
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

    // cambio de selección => carga normal con recenter
    loadMapData({ recenter: true, keepView: false });
  }, [
    user?.proyecto,
    selectedFeeder?.AlimInterno,
    selectedSed?.SedInterno,
  ]);




  // ------------------- GPS -------------------
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
          (loc) => {
            if (loc?.coords) {
              setUserLocation({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
              });
            }
          },
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
          setHeading(e.trueHeading || 0),
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

  // ------------------- MEMO PINS -------------------
  const memoPins = useMemo(() => {
    if (!Array.isArray(pins)) return [];
    return pins
      .filter((p) => p.Type !== 0 && p.Latitude != null && p.Longitude != null)
      .map((p) => ({
        ...p,
        Latitude: Number(p.Latitude),
        Longitude: Number(p.Longitude),
      }))
      .filter(
        (p) => Number.isFinite(p.Latitude) && Number.isFinite(p.Longitude),
      );
  }, [pins]);

  const pinsSed = useMemo(
    () => memoPins.filter((p) => isSedType(p.Type)),
    [memoPins],
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
    //console.log(item);
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
            },
          },
        ],
      );
    } catch (err) {
      console.warn("Error al seleccionar marker:", err);
    }
  };

  const areCoordsEqual = (a, b, tolerance = 0.00001) => {
    return Math.abs(Number(a) - Number(b)) <= tolerance;
  };

  const findOverlappedGaps = (gap, allGaps) => {
    return allGaps.filter(
      (g) =>
        areCoordsEqual(g.VanoLatitudIni, gap.VanoLatitudIni) &&
        areCoordsEqual(g.VanoLongitudIni, gap.VanoLongitudIni) &&
        areCoordsEqual(g.VanoLatitudFin, gap.VanoLatitudFin) &&
        areCoordsEqual(g.VanoLongitudFin, gap.VanoLongitudFin),
    );
  };

  const getCleanLabel = (pin) => {
    const raw = pin.Label || pin.ElementCode || "";

    if (!raw) return "";

    // Corta en el primer salto de línea y elimina espacios
    return String(raw).split("\n")[0].trim();
  };

  // ------------------- PLACEHOLDER -------------------
  if (
    (user?.proyecto === 1 && !selectedFeeder) ||
    (user?.proyecto === 0 && !selectedSed)
  ) {
    return (
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>
          {user?.proyecto === 1
            ? "Seleccione un alimentador"
            : "Seleccione una SED"}
        </Text>

        {user?.proyecto === 1 && (
          <DropDown onSelectFeeder={setSelectedFeeder} />
        )}
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


  // ------------------- BÚSQUEDA (LISTA + UBICAR/SELECCIONAR) -------------------
  const normalizeText = (s) =>
    String(s ?? "")
      .replace(/\r?\n|\r/g, " ")
      .trim()
      .toLowerCase();

  const scoreText = (text, query) => {
    if (!text || !query) return 0;
    if (text === query) return 100;
    if (text.startsWith(query)) return 80;
    if (text.includes(query)) return 60;
    return 0;
  };

  const centerMap = (lat, lng) => {
    const _lat = Number(lat);
    const _lng = Number(lng);
    if (!Number.isFinite(_lat) || !Number.isFinite(_lng)) return;

    mapRef.current?.animateToRegion(
      {
        latitude: _lat,
        longitude: _lng,
        latitudeDelta: 0.0005,
        longitudeDelta: 0.0005,
      },
      800
    );
  };

  const buildSearchResults = (queryRaw) => {
    const query = normalizeText(queryRaw);
    if (!query) return [];

    const currentPins = Array.isArray(pinsRef.current) ? pinsRef.current : [];
    const currentGaps = Array.isArray(gaps) ? gaps : [];

    const pinResults = currentPins
      .map((pin) => {
        const code = normalizeText(pin.ElementCode);
        const label = normalizeText(pin.Label);

        const sc = Math.max(scoreText(code, query), scoreText(label, query));
        if (sc <= 0) return null;

        const t = Number(pin.Type);
        const subKind = t === 5 ? "Poste" : isSedType(t) ? "SED" : "Pin";

        const lat = Number(pin.Latitude);
        const lng = Number(pin.Longitude);

        return {
          key: `PIN_${pin.Id ?? pin.IdOriginal ?? Math.random()}`,
          kind: "PIN",
          subKind,
          code: pin.ElementCode ?? "",
          label: pin.Label ?? "",
          lat,
          lng,
          raw: pin,
          score: sc,
        };
      })
      .filter(Boolean);

    const gapResults = currentGaps
      .map((gap, idx) => {
        const code = normalizeText(gap.VanoCodigo);
        const label = normalizeText(gap.VanoEtiqueta);

        const sc = Math.max(scoreText(code, query), scoreText(label, query));
        if (sc <= 0) return null;

        const lat = Number(gap.VanoLatitudIni);
        const lng = Number(gap.VanoLongitudIni);

        return {
          key: `VANO_${gap.VanoInterno ?? gap.VanoCodigo ?? idx}`,
          kind: "VANO",
          subKind: "Vano",
          code: gap.VanoCodigo ?? "",
          label: gap.VanoEtiqueta ?? "",
          lat,
          lng,
          raw: gap,
          score: sc,
        };
      })
      .filter(Boolean);

    // Orden: mejor score primero
    const all = [...pinResults, ...gapResults].sort((a, b) => b.score - a.score);

    // Limitar para no reventar el modal (ajusta si quieres)
    return all.slice(0, 80);
  };

  const handleDoSearch = () => {
    const q = normalizeText(searchText);
    if (!q) return;

    const res = buildSearchResults(q);

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

  const handleLocateSelected = () => {
    if (!selectedSearchResult) return;

    centerMap(selectedSearchResult.lat, selectedSearchResult.lng);
    cleanupSearchModal();
  };

  const handleSelectSelected = async () => {
    if (!selectedSearchResult) return;

    try {
      // primero ubica (siempre)
      centerMap(selectedSearchResult.lat, selectedSearchResult.lng);

      let datoElemento = null;

      // POSTE
      if (selectedSearchResult.kind === "PIN" && selectedSearchResult.subKind === "Poste") {
        const pin = selectedSearchResult.raw;
        const postId = pin?.IdOriginal ?? pin?.Id ?? null;

        datoElemento = await getPostData(postId);
        if (!datoElemento) {
          Alert.alert("Error", "No se pudo cargar el poste desde SQLite.");
          return;
        }
      }
      // SED
      else if (selectedSearchResult.kind === "PIN" && selectedSearchResult.subKind === "SED") {
        const pin = selectedSearchResult.raw;
        const sedId = pin?.IdOriginal ?? pin?.Id ?? null;

        const sed = await fetchAndSelectSed(sedId);
        datoElemento = sed ?? pin; // fallback
      }
      // VANO
      else if (selectedSearchResult.kind === "VANO") {
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
                      style={[
                        pinStyles.pinIcon,
                        { width: iconSize, height: iconSize },
                      ]}
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
                  <View
                    style={pinStyles.labelCanvas}
                    collapsable={false}
                    pointerEvents="none"
                  >
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
            longitude: pin.Longitude,
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
                  centerOffset={{ x: 0, y: 30 }} // mueve el texto debajo del icono
                  tracksViewChanges={true}
                  zIndex={2001}
                  tappable={false}
                >
                  <View
                    style={pinStyles.labelCanvas}
                    collapsable={false}
                    pointerEvents="none"
                  >
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
                  {gap.VanoCodigo || "Vano sin código"} -{" "}
                  {gap.VanoEtiqueta || ""}
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

      {/* 🔽 BOTONES TOP RIGHT: BUSCAR + REFRESCAR */}
      <View style={styles.topRightButtons}>
        {/* 🔎 Buscar */}
        <TouchableOpacity
          onPress={() => {
            setShowSearchModal(true);
            setSearchText("");
            setSearchResults([]);
            setSelectedSearchResult(null);
            setHasSearched(false);
          }}

          disabled={loadingPins || loadingGaps || loadingLocation}
          style={[
            styles.circleBtn,
            (loadingPins || loadingGaps || loadingLocation) && { opacity: 0.6 },
          ]}
        >
          <Ionicons name="search" size={24} color="#333" />
        </TouchableOpacity>


        {/* 🔄 Refresh */}
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



      {/* 🔽 MODAL DE BÚSQUEDA */}
      {showSearchModal && (
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalContainer}>
            <Text style={modalStyles.modalTitle}>Buscar Elemento</Text>

            <Text style={styles.inputLabel}>Ingrese código o etiqueta:</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.inputField}
                value={searchText}
                onChangeText={(t) => setSearchText(t)}
                placeholder="Ej: 035840 / VBT..."
                placeholderTextColor="#999"
                autoCapitalize="none"
              />

              {searchText.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchText("");
                    setSearchResults([]);
                    setSelectedSearchResult(null);
                    setHasSearched(false);
                  }}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {/* Botón Buscar */}
            <TouchableOpacity
              style={[modalStyles.saveButton, { marginTop: 6 }]}
              onPress={handleDoSearch}
            >
              <Text style={modalStyles.saveButtonText}>Buscar</Text>
            </TouchableOpacity>

            {/* Resultados (con scroll + recorte) */}
            <View style={styles.resultsBox}>
              {!hasSearched ? (
                <Text style={styles.hintText}>Escribe algo y presiona “Buscar”.</Text>
              ) : searchResults.length === 0 ? (
                <Text style={styles.hintText}>Sin resultados.</Text>
              ) : (
                <ScrollView
                  style={styles.resultsScroll}
                  contentContainerStyle={styles.resultsContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator
                >
                  {searchResults.map((r) => {
                    const isSelected = selectedSearchResult?.key === r.key;

                    return (
                      <TouchableOpacity
                        key={r.key}
                        style={[
                          styles.resultItem,
                          isSelected && styles.resultItemSelected,
                        ]}
                        onPress={() => setSelectedSearchResult(r)}
                      >
                        <Text style={styles.resultTitle}>
                          {r.subKind} — {String(r.code ?? "").trim() || "(sin código)"}
                        </Text>

                        {!!String(r.label ?? "").trim() && (
                          <Text style={styles.resultSubtitle} numberOfLines={2}>
                            {String(r.label).replace(/\r?\n|\r/g, " - ").trim()}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>


            {/* Footer: Cancelar / Ubicar / Seleccionar */}
            <View style={modalStyles.footerButtons}>
              <TouchableOpacity
                style={[modalStyles.cancelButton, { flex: 1, marginRight: 8 }]}
                onPress={cleanupSearchModal}
              >
                <Text style={modalStyles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  modalStyles.saveButton,
                  { flex: 1, marginHorizontal: 8 },
                  !selectedSearchResult && { opacity: 0.5 },
                ]}
                disabled={!selectedSearchResult}
                onPress={handleLocateSelected}
              >
                <Text style={modalStyles.saveButtonText}>Ubicar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  modalStyles.saveButton,
                  { flex: 1, marginLeft: 8 },
                  !selectedSearchResult && { opacity: 0.5 },
                ]}
                disabled={!selectedSearchResult}
                onPress={handleSelectSelected}
              >
                <Text style={modalStyles.saveButtonText}>Seleccionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}




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
    elevation: 5,
  },
  btnImg: { width: 40, height: 40, resizeMode: "contain" },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: "#555",
    marginBottom: 20,
    textAlign: "center",
  },
  loadingOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    zIndex: 100,
  },
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
    zIndex: 9999, // iOS
    elevation: 20, // Android
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
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  inputLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
    marginTop: 10,
  },
  btnSearch: {
    backgroundColor: "#000", // O tu color primario
  },
  inputContainer: {
    flexDirection: "row", // 👈 OBLIGATORIO: Pone los elementos en fila horizontal
    alignItems: "center", // 👈 OBLIGATORIO: Centra verticalmente la X
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 10,
    marginBottom: 10,
    height: 50, // Altura fija recomendada
  },

  inputField: {
    flex: 1, // 👈 OBLIGATORIO: Ocupa todo el espacio sobrante
    fontSize: 16,
    color: "#333",
    height: "100%",
  },

  clearButton: {
    padding: 5, // Espacio para el dedo
    marginLeft: 5, // Separación del texto
    justifyContent: "center",
    alignItems: "center",
  },


  circleBtn: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  topRightButtons: {
    position: "absolute",
    top: 70,
    right: 20,
    zIndex: 10,
    alignItems: "center",
  },

  resultsBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 8,
    backgroundColor: "#fff",
    maxHeight: 260,
  },

  resultsList: {
    maxHeight: 240,
  },

  hintText: {
    color: "#666",
    fontSize: 13,
    paddingVertical: 10,
    textAlign: "center",
  },

  resultsScroll: {
    maxHeight: 260,       // asegura que el ScrollView se limite al contenedor
  },

  resultsContent: {
    padding: 8,
  },

  resultItem: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    borderRadius: 6,
  },
  resultItemSelected: {
    backgroundColor: "#eef6ff",
    borderColor: "#cfe6ff",
    borderWidth: 1,
  },
  resultTitle: {
    fontWeight: "700",
    color: "#222",
    fontSize: 14,
  },
  resultSubtitle: {
    marginTop: 3,
    color: "#555",
    fontSize: 13,
  },
  kav: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  searchModalContainer: {
    width: "90%",
    maxHeight: "80%", // 🔥 clave para que el teclado no lo tape
  },

  resultsBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    maxHeight: 260,       // controla el alto para que no empuje el footer
    overflow: "hidden",   // 🔥 CLAVE: evita que la lista se salga del borde
  },

  resultsList: {
    maxHeight: 240,
  },

  resultItem: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    borderRadius: 6,
  },

  

});

export default Map;
