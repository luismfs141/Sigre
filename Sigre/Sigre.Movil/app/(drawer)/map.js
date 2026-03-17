// maps app
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { Fragment, memo, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { ActivityIndicator, Alert, Image, Switch, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { DropDown } from "../../components/DropDown.js";
import { DropDownSed } from "../../components/DropDownSed";
import { AuditInspeccionadoModal, GapSelectorModal, SearchModal } from "../../components/Map/MapModals";
import { AuthContext } from "../../context/AuthContext";
import { useDatos } from "../../context/DatosContext.js";
import { useMap } from "../../hooks/useMap.js";
import { usePost } from "../../hooks/usePost.js";
import { useSed } from "../../hooks/useSed.js";
import styles, { mapStyles, pinStyles } from "../../styles/mapStyles";

import { useNavigation } from "@react-navigation/native";

import { runQuery } from "../../database/offlineDB/db";
import { useGap } from "../../hooks/useGap.js";

import {
  ZOOM_THRESHOLD, buildSearchResults, centerMap, findOverlappedGaps, formatLabel, getCleanLabel, getIconSizeByType,
  getPinsVisibleInRegion, isPostType, isSedType, normalizeText,
} from "../../utils/map/mapUtils";
import { getGapColorByInspected, getSourceImageFromType2 } from "../../utils/utils.js";

const HIDE_POST_ICON = false; // <-- ponlo en false para volver a verlo
const HIDE_POST_LABEL = false; // false para volver a ver el globo+texto

const DEBUG_MARKER_LIFECYCLE = false; // ponlo true para test

const GAP_HANDLE_DEBUG = false; // true = se ven los “handles” para test

const PostWithLabel = memo(function PostWithLabel({
  pin,
  pinKey,
  iconSize,
  coordinate,
  onMarkerPress,
  hideIcon,
  hideLabel,
  onDragEndPin,
  canDrag,
  onDragStartPin,
  onDragFinishPin,
}) {

  const [tracks, setTracks] = useState(true);
  const draggingRef = useRef(false); // ✅ evita que al soltar el drag se dispare onPress

  const cleanLabel = useMemo(() => {
    const raw = pin?.Label ?? getCleanLabel(pin) ?? "";
    return formatLabel(raw);
  }, [pin]);

  const showLabel = cleanLabel.length > 0;

  const labelOffset = (iconSize / 8) * 2;
  const labelCanvasH = 32; // debe coincidir con pinStyles.labelCanvas.height
  const labelAnchorY = -labelOffset / labelCanvasH;

  useEffect(() => {
    if (!DEBUG_MARKER_LIFECYCLE) return;
    console.log(`[MARKER MOUNT] ${pinKey}`);
    return () => console.log(`[MARKER UNMOUNT] ${pinKey}`);
  }, [pinKey]);



  useEffect(() => {
    setTracks(true);
    const t = setTimeout(() => setTracks(false), 250);
    return () => clearTimeout(t);
  }, [
    iconSize,
    hideIcon,
    hideLabel,
    pin?.Type,
    pin?.Label,
    pin?.Inspeccionado,
    pin?.Tercero,
  ]);



  const handlePress = (e) => {
    e?.stopPropagation?.(); // ✅ evita que el mapa “agarre” el toque
    if (draggingRef.current) return;
    onMarkerPress(pin);
  };



  const handleDragStart = () => {
    if (!canDrag) return;
    const ok = onDragStartPin?.(pinKey);
    if (ok === false) return;
    draggingRef.current = true;
  };


  const handleDragEnd = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    onDragEndPin?.(pinKey, { latitude, longitude });
    onDragFinishPin?.(pinKey);


    // evita click fantasma al soltar
    setTimeout(() => {
      draggingRef.current = false;
    }, 200);
  };

  return (
    <Fragment>
      {/* ICONO */}
      <Marker
        coordinate={coordinate}
        anchor={{ x: 0.5, y: 0.5 }}
        tracksViewChanges={tracks}
        onPress={handlePress}
        zIndex={10}
        draggable={!!canDrag}                 // ✅ SIEMPRE draggable (long-press + drag)
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <View style={pinStyles.iconCanvas} collapsable={false}>
          <View style={pinStyles.iconWrapper}>
            <Image
              source={getSourceImageFromType2(pin)}
              style={[
                pinStyles.pinIcon,
                { width: iconSize, height: iconSize, opacity: hideIcon ? 0 : 1 },
              ]}
            />
          </View>
        </View>
      </Marker>

      {/* LABEL */}
      {showLabel && (
        <Marker
          coordinate={coordinate}
          anchor={{ x: 0.5, y: labelAnchorY }}
          tracksViewChanges={tracks}
          zIndex={999}
          tappable
          onPress={handlePress}
          draggable={!!canDrag}               // ✅ también draggable desde el label
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <View style={pinStyles.labelCanvas} collapsable={false} pointerEvents="none">
            {!hideLabel && (
              <View style={pinStyles.labelBox}>
                <Text style={pinStyles.labelText}>{cleanLabel}</Text>
              </View>
            )}
          </View>
        </Marker>
      )}
    </Fragment>
  );
});


const SedWithLabel = memo(function SedWithLabel({
  pin,
  pinKey,
  coordinate,
  label,
  canDrag,
  onDragStartPin,
  onDragFinishPin,
  onDragEndPin,
}) {
  const [tracks, setTracks] = useState(true);

  useEffect(() => {
    setTracks(true);
    const t = setTimeout(() => setTracks(false), 250);
    return () => clearTimeout(t);
  }, [pinKey, coordinate?.latitude, coordinate?.longitude, label, pin?.Inspeccionado]);

  const handleDragStart = () => {
    if (!canDrag) return;
    const ok = onDragStartPin?.(pinKey);
    if (ok === false) return;
  };

  const handleDragEnd = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    onDragEndPin?.(pinKey, { latitude, longitude });
    onDragFinishPin?.(pinKey);
  };

  return (
    <Fragment>
      {/* ICONO */}
      <Marker
        coordinate={coordinate}
        anchor={{ x: 0.5, y: 1.5 }}
        tracksViewChanges={tracks}     // ✅ ahora sí se “captura” el icono y luego no parpadea
        zIndex={2000}
        draggable={!!canDrag}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
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
          centerOffset={{ x: 0, y: 30 }}
          tracksViewChanges={tracks}   // ✅ mismo truco para el label
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
});



const MapScreen = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const mapRef = useRef(null);
  const lastRegionSentRef = useRef(null);
  const lastRegionTickRef = useRef(0);


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
    isAutoSyncOnline,
    setIsAutoSyncOnline,
    showHiddenThirdParty,
    setShowHiddenThirdParty,
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
  const { fetchVanoById } = useGap();
  const { fetchAndSelectSed } = useSed();

  const [loadingPins, setLoadingPins] = useState(false);
  const [loadingGaps, setLoadingGaps] = useState(false);

  const [loadingLocation, setLoadingLocation] = useState(false);

  const [showGapSelector, setShowGapSelector] = useState(false);
  const [overlappedGaps, setOverlappedGaps] = useState([]);

  // búsqueda
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSearchResult, setSelectedSearchResult] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  // ✅ Auditoría (cache por SED)
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [audit, setAudit] = useState({
    sedId: null,
    analyzed: false,
    loading: false,
    list: [],
    selectedKey: null,
  });


  const [movedPins, setMovedPins] = useState({});
  const [movedGaps, setMovedGaps] = useState({});

  const [sedsAll, setSedsAll] = useState([]); // ✅ SED visibles SIEMPRE (no dependen del zoom)


  const [isDraggingGap, setIsDraggingGap] = useState(false);
  const gapDragRef = useRef(null);
  // gapDragRef.current = { gapKey, startTouch:{lat,lng}, startGap:{...coords} }

  const [movingGapKey, setMovingGapKey] = useState(null); // solo para "highlight" opcional



  const isMapUiLocked = showSearchModal || showAuditModal || showGapSelector;

  const uiLocked = isMapUiLocked; // ✅ bloquea con Search/Audit/GapSelector

  const GAP_HOLD_MS = 350;      // Tiempo para detectar movel elemento
  const GAP_CANCEL_PX = 10;      // ✅ tolerancia de movimiento en pixeles

  const gapHoldTimerRef = useRef(null);
  const gapHoldActiveRef = useRef(false);
  const gapHoldStartPtRef = useRef(null); // {x,y}
  const gapHoldLastPtRef = useRef(null);  // {x,y}

  const shouldShowPins = region?.latitudeDelta < ZOOM_THRESHOLD;

  // refresh sin mover cámara
  const regionRef = useRef(region);
  useEffect(() => {
    regionRef.current = region;
  }, [region]);


  const buildRegionFromPins = (pinsArr) => {
    const pts = (Array.isArray(pinsArr) ? pinsArr : [])
      .map((p) => ({ lat: Number(p?.Latitude), lng: Number(p?.Longitude) }))
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

    if (!pts.length) return null;

    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    for (const p of pts) {
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
    }

    const latitude = (minLat + maxLat) / 2;
    const longitude = (minLng + maxLng) / 2;

    // padding + mínimos para que no quede ultra-zoom
    const latitudeDelta = Math.max((maxLat - minLat) * 1.6, 0.01);
    const longitudeDelta = Math.max((maxLng - minLng) * 1.6, 0.01);

    return { latitude, longitude, latitudeDelta, longitudeDelta };
  };
  const recenterToCurrentPins = () => {
    const newReg = buildRegionFromPins(pinsRef.current);
    if (!newReg) return false;

    mapRef.current?.animateToRegion(newReg, 600);
    setRegion(newReg);
    return true;
  };

  const handleSelectSed = (sed) => {
    const prevId = selectedSed?.SedInterno ?? null;
    const nextId = sed?.SedInterno ?? null;

    // ✅ si vuelves a elegir el mismo SED: recentra sí o sí
    if (prevId != null && nextId != null && prevId === nextId) {
      endDragGap?.(); // por si estabas en drag de vano
      setSelectedSed({ ...sed }); // fuerza render aunque sea “el mismo”
      if (!recenterToCurrentPins()) {
        loadMapData({ recenter: true, keepView: false });
      }
      return;
    }

    // ✅ si es otro SED: tu useEffect ya lo recentra
    setSelectedSed(sed);
  };


  const loadMapData = async ({ recenter = false, keepView = false } = {}) => {
    if (user?.proyecto === 1 && !selectedFeeder) {
      pinsRef.current = [];
      setPins([]);
      setGaps([]);
      setSedsAll([]); // ✅
      return;
    }



    if (user?.proyecto === 0 && !selectedSed) {
      pinsRef.current = [];
      setPins([]);
      setGaps([]);
      setSedsAll([]); // ✅
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

      // ✅ SED SIEMPRE disponibles aunque pins visibles se recorten por zoom/región
      setSedsAll(
        (Array.isArray(pinsLoaded) ? pinsLoaded : [])
          .filter((p) => isSedType(p?.Type) && p?.Latitude != null && p?.Longitude != null)
          .map((p) => ({ ...p, Latitude: Number(p.Latitude), Longitude: Number(p.Longitude) }))
          .filter((p) => Number.isFinite(p.Latitude) && Number.isFinite(p.Longitude))
      );


      pinsRef.current = pinsLoaded;

      // ✅ SIEMPRE solo visibles (tu criterio original)
      const visible = getPinsVisibleInRegion(pinsLoaded, regionRef.current);
      setPins(visible);












      if (recenter && pinsLoaded.length > 0) {
        const newReg = buildRegionFromPins(pinsLoaded);
        if (newReg) {
          mapRef.current?.animateToRegion(newReg, 600);
          setRegion(newReg); // ✅ sigues actualizando tu state para filtros/zoom
        }
      }













    } catch (error) {
      console.error("❌ Error al cargar/refresh datos del mapa:", error);
    } finally {
      setLoadingPins(false);
      setLoadingGaps(false);
    }
  };

  const handleRefreshMap = async () => {
    //console.log("[REFRESH] tap");

    endDragGap();


    // ✅ reset de moves visuales
    setMovedPins({});
    setMovedGaps({});
    setMovingGapKey(null);

    // ✅ recarga desde SQLite (actualiza colores)
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

  useEffect(() => {
    if (user?.proyecto === 1 && !selectedFeeder) return;
    if (user?.proyecto === 0 && !selectedSed) return;

    loadMapData({ recenter: false, keepView: true });
  }, [showHiddenThirdParty]);


  // GPS (solo permisos 1 vez; NO watcher)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoadingLocation(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!mounted) return;
        if (status !== "granted") return;
      } catch (err) {
        console.warn("Error GPS permission:", err);
      } finally {
        if (mounted) setLoadingLocation(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const sedId = user?.proyecto === 0 ? selectedSed?.SedInterno ?? null : null;

    setAudit({
      sedId,
      analyzed: false,
      loading: false,
      list: [],
      selectedKey: null,
    });
  }, [user?.proyecto, selectedSed?.SedInterno]);

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

  const pinsSed = useMemo(() => sedsAll, [sedsAll]);


  const pinsPost = useMemo(() => {
    if (!shouldShowPins) return [];



    return memoPins.filter((p) => isPostType(p.Type));
  }, [memoPins, shouldShowPins]);

  const memoGaps = useMemo(() => (Array.isArray(gaps) ? gaps : []), [gaps]);

  const getPinKey = (p) => {
    const base =
      p?.IdOriginal ??
      p?.Id ??
      p?.ElementCode ??
      `${p?.Latitude}-${p?.Longitude}`;

    // ✅ incluye Type SIEMPRE para evitar colisiones entre tablas (POST vs SED)
    return String(`${p?.Type ?? "X"}-${base}`);
  };


  const getGapKey = (g) =>
    String(
      g?.VanoInterno ??
      g?.VanoCodigo ??
      `${g?.VanoLatitudIni}-${g?.VanoLongitudIni}-${g?.VanoLatitudFin}-${g?.VanoLongitudFin}`
    );

  const getPinCoord = (pin) => {
    const key = getPinKey(pin);
    const moved = movedPins[key];
    return moved
      ? moved
      : { latitude: pin.Latitude, longitude: pin.Longitude };
  };

  const renderGaps = useMemo(() => {
    return memoGaps.map((g) => {
      const key = getGapKey(g);
      const ov = movedGaps[key];
      return ov ? { ...g, ...ov } : g;
    });
  }, [memoGaps, movedGaps]);

  const handlePinMoveEnd = (pinKey, coord) => {
    setMovedPins((prev) => ({ ...prev, [pinKey]: coord }));
  };


  const handleGapHandleDragEnd = (gapKey, gap, e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;

    const midLat = (gap.VanoLatitudIni + gap.VanoLatitudFin) / 2;
    const midLng = (gap.VanoLongitudIni + gap.VanoLongitudFin) / 2;

    const dLat = latitude - midLat;
    const dLng = longitude - midLng;

    setMovedGaps((prev) => ({
      ...prev,
      [gapKey]: {
        VanoLatitudIni: gap.VanoLatitudIni + dLat,
        VanoLongitudIni: gap.VanoLongitudIni + dLng,
        VanoLatitudFin: gap.VanoLatitudFin + dLat,
        VanoLongitudFin: gap.VanoLongitudFin + dLng,
      },
    }));

    setMovingGapKey(null);
  };

  // ------------------------------
  // Elegir el vano más cercano a un punto (tap/hold sobre el mapa)
  // ------------------------------
  const distPointToSegmentSq = (p, a, b) => {
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const wx = p.x - a.x;
    const wy = p.y - a.y;

    const c1 = vx * wx + vy * wy;
    if (c1 <= 0) {
      const dx = p.x - a.x;
      const dy = p.y - a.y;
      return dx * dx + dy * dy;
    }

    const c2 = vx * vx + vy * vy;
    if (c2 <= c1) {
      const dx = p.x - b.x;
      const dy = p.y - b.y;
      return dx * dx + dy * dy;
    }

    const t = c1 / c2;
    const projx = a.x + t * vx;
    const projy = a.y + t * vy;

    const dx = p.x - projx;
    const dy = p.y - projy;
    return dx * dx + dy * dy;
  };

  const findNearestGapAtCoordinate = (coord) => {
    if (!renderGaps?.length) return null;

    const p = { x: coord.longitude, y: coord.latitude };

    let bestGap = null;
    let bestKey = null;
    let bestD = Infinity;

    for (const g of renderGaps) {
      const key = getGapKey(g);
      const a = { x: g.VanoLongitudIni, y: g.VanoLatitudIni };
      const b = { x: g.VanoLongitudFin, y: g.VanoLatitudFin };

      const d = distPointToSegmentSq(p, a, b);
      if (d < bestD) {
        bestD = d;
        bestGap = g;
        bestKey = key;
      }
    }

    // tolerancia según zoom
    const latDelta = regionRef.current?.latitudeDelta ?? 0.01;
    const tol = latDelta * 0.015;
    if (bestKey && bestD <= tol * tol) return { gapKey: bestKey, gap: bestGap };

    return null;
  };

  const startDragGapAtCoordinate = (coord) => {
    const hit = findNearestGapAtCoordinate(coord);
    if (!hit?.gapKey || !hit?.gap) return;

    // usa tu mismo mecanismo de arranque de drag
    startDragGapFromHandle(hit.gapKey, hit.gap, coord);
  };




  // ------------------------------
  // DRAG VANOS (long-press + drag) usando handles invisibles (Markers draggable)
  // ------------------------------
  const startDragGapFromHandle = (gapKey, gap, startCoord) => {
    // gap ya viene de renderGaps (incluye movedGaps si ya se movió)
    gapDragRef.current = {
      gapKey,
      startTouch: {
        latitude: startCoord.latitude,
        longitude: startCoord.longitude,
      },
      startGap: {
        VanoLatitudIni: gap.VanoLatitudIni,
        VanoLongitudIni: gap.VanoLongitudIni,
        VanoLatitudFin: gap.VanoLatitudFin,
        VanoLongitudFin: gap.VanoLongitudFin,
      },
    };

    setIsDraggingGap(true);
    setMovingGapKey(gapKey);

    // (opcional) aseguras entry inicial
    setMovedGaps((prev) => ({
      ...prev,
      [gapKey]: {
        VanoLatitudIni: gap.VanoLatitudIni,
        VanoLongitudIni: gap.VanoLongitudIni,
        VanoLatitudFin: gap.VanoLatitudFin,
        VanoLongitudFin: gap.VanoLongitudFin,
      },
    }));
  };

  const updateDragGap = (coord) => {
    const st = gapDragRef.current;
    if (!st) return;

    const dLat = coord.latitude - st.startTouch.latitude;
    const dLng = coord.longitude - st.startTouch.longitude;

    setMovedGaps((prev) => ({
      ...prev,
      [st.gapKey]: {
        VanoLatitudIni: st.startGap.VanoLatitudIni + dLat,
        VanoLongitudIni: st.startGap.VanoLongitudIni + dLng,
        VanoLatitudFin: st.startGap.VanoLatitudFin + dLat,
        VanoLongitudFin: st.startGap.VanoLongitudFin + dLng,
      },
    }));
  };

  const endDragGap = () => {
    setIsDraggingGap(false);
    gapDragRef.current = null;
    setMovingGapKey(null);
  };

  // ------------------------------
  // ✅ LOCK: solo 1 elemento se mueve a la vez (PIN o VANO)
  // ------------------------------
  const activeDragPinRef = useRef(null); // guarda pinKey activo

  const canDragPin = (pinKey) =>
    !activeDragPinRef.current || activeDragPinRef.current === pinKey;

  const beginPinDrag = (pinKey) => {
    if (activeDragPinRef.current && activeDragPinRef.current !== pinKey) return false;

    activeDragPinRef.current = pinKey;

    // cancela intento de mover vano si estaba en hold/drag
    gapHoldActiveRef.current = false;
    if (gapHoldTimerRef.current) {
      clearTimeout(gapHoldTimerRef.current);
      gapHoldTimerRef.current = null;
    }
    if (gapDragRef.current) endDragGap();

    return true;
  };

  const endPinDrag = (pinKey) => {
    if (activeDragPinRef.current === pinKey) activeDragPinRef.current = null;
  };


  // ✅ mover vano con 1 dedo usando onTouchMove (x,y -> lat/lng)
  const gapDragMovePtRef = useRef(null);
  const gapDragMoveRafRef = useRef(false);

  const updateDragGapFromPoint = (pt) => {
    gapDragMovePtRef.current = pt;
    if (gapDragMoveRafRef.current) return;

    gapDragMoveRafRef.current = true;

    requestAnimationFrame(async () => {
      gapDragMoveRafRef.current = false;

      // si ya no hay drag activo, no hagas nada
      if (!gapDragRef.current) return;

      const p = gapDragMovePtRef.current;
      if (!p) return;

      try {
        const coord = await mapRef.current?.coordinateForPoint({ x: p.x, y: p.y });
        if (!coord) return;

        updateDragGap(coord);
      } catch (_) { }
    });
  };

  const clearGapHoldTimer = () => {
    if (gapHoldTimerRef.current) {
      clearTimeout(gapHoldTimerRef.current);
      gapHoldTimerRef.current = null;
    }
  };

  const startGapHold = (e) => {
    if (activeDragPinRef.current) return; // ✅ si estás moviendo un PIN, no intentes mover vano
    if (gapDragRef.current) return;


    const x = e?.nativeEvent?.locationX;
    const y = e?.nativeEvent?.locationY;
    if (typeof x !== "number" || typeof y !== "number") return;

    gapHoldActiveRef.current = true;
    gapHoldStartPtRef.current = { x, y };
    gapHoldLastPtRef.current = { x, y };

    clearGapHoldTimer();

    gapHoldTimerRef.current = setTimeout(async () => {
      if (!gapHoldActiveRef.current) return;

      const pt = gapHoldLastPtRef.current || gapHoldStartPtRef.current;

      try {
        const coord = await mapRef.current?.coordinateForPoint({ x: pt.x, y: pt.y });
        if (!coord) return;
        if (!gapHoldActiveRef.current) return;

        // ✅ recién aquí se activa el movimiento del vano
        startDragGapAtCoordinate(coord);
      } catch (_) { }
    }, GAP_HOLD_MS);
  };


  const moveGapHold = (e) => {
    if (activeDragPinRef.current) return; // ✅ si estás moviendo un PIN, ignora touch del mapa
    const x = e?.nativeEvent?.locationX;

    const y = e?.nativeEvent?.locationY;
    if (typeof x !== "number" || typeof y !== "number") return;

    // ✅ si ya estás moviendo un vano, aquí lo mueves con 1 dedo
    if (gapDragRef.current) {
      updateDragGapFromPoint({ x, y });
      return;
    }

    // --- modo "esperando hold" ---
    if (!gapHoldActiveRef.current) return;

    gapHoldLastPtRef.current = { x, y };

    // si se movió antes del hold => cancela (para que sea pan normal)
    const st = gapHoldStartPtRef.current;
    if (!st) return;

    const dx = x - st.x;
    const dy = y - st.y;

    if (dx * dx + dy * dy > GAP_CANCEL_PX * GAP_CANCEL_PX) {
      gapHoldActiveRef.current = false;
      clearGapHoldTimer();
    }
  };

  const endGapHold = () => {
    gapHoldActiveRef.current = false;
    clearGapHoldTimer();

    // ✅ si había drag activo, lo terminas al soltar
    if (gapDragRef.current) endDragGap();
  };



  const handleGapDrag = (e) => {
    if (!gapDragRef.current) return;
    updateDragGap(e.nativeEvent.coordinate);
  };

  const handleGapDragEnd = (e) => {
    if (!gapDragRef.current) return;
    updateDragGap(e.nativeEvent.coordinate); // última actualización
    endDragGap();
  };















  const onMarkerPress = async (item) => {
    try {
      let tipoElemento = "";
      let codigoElemento = "";
      let datoElemento = null;
      let codigoEtiqueta = null;

      const isPinPost = item?.Type === 5;
      const isGap = !item?.Type && item?.VanoCodigo;

      const pinKey = isPinPost ? getPinKey(item) : null;
      const gapKey = isGap ? getGapKey(item) : null;

      if (isPinPost) {
        const data = await getPostData(item.IdOriginal);
        datoElemento = data;
        tipoElemento = "Poste";
        codigoElemento = datoElemento?.PostCodigoNodo ?? "";
        codigoEtiqueta = datoElemento?.PostEtiqueta ?? "";
      } else if (isGap) {
        tipoElemento = "Vano";
        codigoElemento = item.VanoCodigo;
        codigoEtiqueta = item.VanoEtiqueta;
        datoElemento = item;
      } else {
        tipoElemento = "Desconocido";
        datoElemento = item;
      }

      Alert.alert(
        "Elemento seleccionado",
        `Tipo: ${tipoElemento}\nCódigo: ${codigoElemento}\nEtiqueta: ${codigoEtiqueta ?? ""}`,
        [
          { text: "Cancelar", style: "cancel" },



          {
            text: "Inspeccionar",
            onPress: () => {
              setSelectedItem(datoElemento);
              router.push("inspection");
            },
          },
        ]
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
        {user?.proyecto === 0 && <DropDownSed onSelectSed={handleSelectSed} />}

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


  const uniqNums = (arr) => Array.from(new Set((arr ?? []).map(Number).filter(Number.isFinite)));

  const chunk = (arr, size = 800) => {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  };

  const getStoredMap = async (table, idCol, storedCol, ids) => {
    const map = new Map();
    const u = uniqNums(ids);
    if (!u.length) return map;

    for (const part of chunk(u)) {
      const placeholders = part.map(() => "?").join(",");
      const rows = await runQuery(
        `SELECT ${idCol} AS id, ${storedCol} AS stored
       FROM ${table}
       WHERE ${idCol} IN (${placeholders})`,
        part
      );

      for (const r of rows ?? []) {
        const id = Number(r?.id);
        if (Number.isFinite(id)) map.set(id, Number(r?.stored) ? 1 : 0);
      }
    }

    return map;
  };

  const getDefAggMap = async (tipo, ids) => {
    const map = new Map();
    const u = uniqNums(ids);
    if (!u.length) return map;

    for (const part of chunk(u)) {
      const placeholders = part.map(() => "?").join(",");
      const rows = await runQuery(
        `SELECT DefiIdElemento AS id,
              COUNT(*) AS total,
              SUM(CASE WHEN DefiInspeccionado = 1 THEN 1 ELSE 0 END) AS done
       FROM Deficiencias
       WHERE DefiActivo = 1
         AND DefiTipoElemento = ?
         AND DefiIdElemento IN (${placeholders})
       GROUP BY DefiIdElemento`,
        [tipo, ...part]
      );

      for (const r of rows ?? []) {
        const id = Number(r?.id);
        if (!Number.isFinite(id)) continue;
        const total = Number(r?.total ?? 0);
        const done = Number(r?.done ?? 0);
        map.set(id, { total, done });
      }
    }

    return map;
  };

  const buildAuditList = async () => {
    if (user?.proyecto !== 0 || !selectedSed?.SedInterno) {
      Alert.alert("No aplica", "Este análisis es solo para modo SED.");
      return;
    }

    setAudit((prev) => ({ ...prev, loading: true }));

    try {
      // IDs desde lo que ya cargaste por SED
      const postPinsAll = (Array.isArray(pinsRef.current) ? pinsRef.current : [])
        .filter((p) => Number(p?.Type) === 5);

      const postIds = uniqNums(postPinsAll.map((p) => p?.IdOriginal ?? p?.Id));
      const vanoIds = uniqNums((Array.isArray(memoGaps) ? memoGaps : []).map((g) => g?.VanoInterno));

      // Maps desde SQLite (solo lectura)
      const [postStored, vanoStored, postAgg, vanoAgg] = await Promise.all([
        getStoredMap("Postes", "PostInterno", "PostInspeccionado", postIds),
        getStoredMap("Vanos", "VanoInterno", "VanoInspeccionado", vanoIds),
        getDefAggMap("POST", postIds),
        getDefAggMap("VANO", vanoIds),
      ]);

      const list = [];

      // POSTES
      for (const id of postIds) {
        const stored = Number(postStored.get(id) ?? 0) ? 1 : 0;
        const agg = postAgg.get(id) ?? { total: 0, done: 0 };
        const expected = agg.total > 0 && agg.done === agg.total ? 1 : 0;

        if (stored !== expected) {
          const pin = postPinsAll.find((p) => Number(p?.IdOriginal ?? p?.Id) === id);
          const code = pin?.ElementCode ?? id;
          const label = pin?.Label ?? "";

          list.push({
            key: `POST-${id}`,
            kind: "POSTE",
            id,
            code,
            label,
            stored,
            expected,
            total: agg.total,
            done: agg.done,
          });
        }
      }

      // VANOS
      for (const id of vanoIds) {
        const stored = Number(vanoStored.get(id) ?? 0) ? 1 : 0;
        const agg = vanoAgg.get(id) ?? { total: 0, done: 0 };
        const expected = agg.total > 0 && agg.done === agg.total ? 1 : 0;

        if (stored !== expected) {
          const g = (Array.isArray(memoGaps) ? memoGaps : []).find((x) => Number(x?.VanoInterno) === id);
          const code = g?.VanoCodigo ?? id;
          const label = g?.VanoEtiqueta ?? "";

          list.push({
            key: `VANO-${id}`,
            kind: "VANO",
            id,
            code,
            label,
            stored,
            expected,
            total: agg.total,
            done: agg.done,
          });
        }
      }

      // orden: primero postes luego vanos, y por código
      list.sort((a, b) => {
        const ka = a.key.startsWith("POST") ? 0 : 1;
        const kb = b.key.startsWith("POST") ? 0 : 1;
        if (ka !== kb) return ka - kb;
        return String(a.code).localeCompare(String(b.code));
      });

      setAudit((prev) => ({
        ...prev,
        sedId: selectedSed?.SedInterno ?? prev.sedId,
        analyzed: true,
        loading: false,
        list,
        selectedKey: list?.[0]?.key ?? null,
      }));
    } catch (e) {
      console.error("❌ buildAuditList:", e);
      Alert.alert("Error", e?.message ?? "No se pudo analizar.");
      setAudit((prev) => ({ ...prev, loading: false }));
    }
  };

  const getAuditSelected = () => {
    const key = audit.selectedKey;
    if (!key) return null;
    return (audit.list ?? []).find((x) => x.key === key) ?? null;
  };

  const centerAuditItem = (sel) => {
    if (!sel) return false;

    if (sel.key.startsWith("POST-")) {
      const id = Number(sel.id);
      const pin = (Array.isArray(pinsRef.current) ? pinsRef.current : [])
        .find((p) => Number(p?.Type) === 5 && Number(p?.IdOriginal ?? p?.Id) === id);

      if (!pin) return false;

      const coord = getPinCoord(pin);
      centerMap(mapRef, coord.latitude, coord.longitude);
      return true;
    }

    if (sel.key.startsWith("VANO-")) {
      const id = Number(sel.id);
      const g = (Array.isArray(renderGaps) ? renderGaps : [])
        .find((x) => Number(x?.VanoInterno) === id);

      if (!g) return false;

      const midLat = (Number(g.VanoLatitudIni) + Number(g.VanoLatitudFin)) / 2;
      const midLng = (Number(g.VanoLongitudIni) + Number(g.VanoLongitudFin)) / 2;
      centerMap(mapRef, midLat, midLng);
      return true;
    }

    return false;
  };

  const handleAuditLocate = () => {
    const sel = getAuditSelected();
    centerAuditItem(sel);
  };

  const handleAuditSelect = async () => {
    const sel = getAuditSelected();
    if (!sel) return;

    // ✅ centrar primero
    centerAuditItem(sel);

    try {
      if (sel.key.startsWith("POST-")) {
        const data = await getPostData(Number(sel.id));
        if (!data) {
          Alert.alert("Error", "No se pudo cargar el poste desde SQLite.");
          return;
        }

        setSelectedItem(data);
        setShowAuditModal(false);
        router.push("inspection");
        return;
      }

      if (sel.key.startsWith("VANO-")) {
        const data = await fetchVanoById(Number(sel.id));
        if (!data) {
          Alert.alert("Error", "No se pudo cargar el vano desde SQLite.");
          return;
        }

        setSelectedItem(data);
        setShowAuditModal(false);
        router.push("inspection");
      }
    } catch (e) {
      console.warn("⚠ handleAuditSelect:", e);
      Alert.alert("Error", "No se pudo abrir inspección.");
    }
  };





  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#111" }}>
            Mapa
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 12 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: isAutoSyncOnline ? "#16A34A" : "#DC2626",
                marginRight: 6,
              }}
            >
              {isAutoSyncOnline ? "ONLINE" : "OFFLINE"}
            </Text>

            <Switch
              value={isAutoSyncOnline}
              onValueChange={setIsAutoSyncOnline}
            />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 12 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: showHiddenThirdParty ? "#2563EB" : "#6B7280",
                marginRight: 6,
              }}
            >
              {showHiddenThirdParty ? "OCULTOS ON" : "OCULTOS OFF"}
            </Text>

            <Switch
              value={showHiddenThirdParty}
              onValueChange={setShowHiddenThirdParty}
            />
          </View>
        </View>
      ),
    });
  }, [
    navigation,
    isAutoSyncOnline,
    setIsAutoSyncOnline,
    showHiddenThirdParty,
    setShowHiddenThirdParty,
  ]);





  // render
  return (
    <View style={{ flex: 1 }}>


      {(loadingPins || loadingGaps || loadingLocation) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      )}

      <MapView
        ref={mapRef}
        style={mapStyles.mapContainer}
        initialRegion={region}
        mapType="satellite"
        showsUserLocation={true}
        followsUserLocation={false}
        showsMyLocationButton={false}

        moveOnMarkerPress={false}

        scrollEnabled={!isDraggingGap && !uiLocked}
        zoomEnabled={!isDraggingGap && !uiLocked}
        rotateEnabled={!isDraggingGap && !uiLocked}
        pitchEnabled={!isDraggingGap && !uiLocked}

        onTouchStart={uiLocked ? undefined : startGapHold}
        onTouchMove={uiLocked ? undefined : moveGapHold}
        onTouchEnd={uiLocked ? undefined : endGapHold}
        onTouchCancel={uiLocked ? undefined : endGapHold}




        onPress={() => {
          // toque normal cancela drag si está activo
          if (isDraggingGap) endDragGap();
        }}




        onRegionChangeComplete={(reg) => {
          if (isDraggingGap) return;

          const now = Date.now();
          if (now - lastRegionTickRef.current < 160) return;
          lastRegionTickRef.current = now;

          const prev = lastRegionSentRef.current;
          if (prev) {
            const same =
              Math.abs(prev.latitude - reg.latitude) < 1e-6 &&
              Math.abs(prev.longitude - reg.longitude) < 1e-6 &&
              Math.abs(prev.latitudeDelta - reg.latitudeDelta) < 1e-7 &&
              Math.abs(prev.longitudeDelta - reg.longitudeDelta) < 1e-7;

            if (same) return;
          }

          lastRegionSentRef.current = reg;
          setRegion(reg);
          getPinsByRegion(reg);
        }}
      >

        {/* GAPS */}
        {renderGaps.map((gap, i) => {
          const gapKey = getGapKey(gap);

          const mid = {
            latitude: (gap.VanoLatitudIni + gap.VanoLatitudFin) / 2,
            longitude: (gap.VanoLongitudIni + gap.VanoLongitudFin) / 2,
          };

          return (
            <Fragment key={`gap-${gapKey}`}>
              <Polyline
                coordinates={[
                  { latitude: gap.VanoLatitudIni, longitude: gap.VanoLongitudIni },
                  { latitude: gap.VanoLatitudFin, longitude: gap.VanoLongitudFin },
                ]}
                strokeWidth={movingGapKey === gapKey ? 6 : 3}
                strokeColor={getGapColorByInspected(gap)}
                tappable
                onPress={() => {
                  if (isDraggingGap) return;
                  const overlapped = findOverlappedGaps(gap, renderGaps);

                  if (overlapped.length === 1) {
                    onMarkerPress(overlapped[0]);
                  } else if (overlapped.length > 1) {
                    setOverlappedGaps(overlapped);
                    setShowGapSelector(true);
                  }
                }}
              />








            </Fragment>
          );
        })}


        {/* POSTES: ICONO + LABEL */}
        {pinsPost.map((pin) => {
          const iconSize = getIconSizeByType(pin.Type);

          const pinKey = getPinKey(pin);        // ✅ define aquí
          const coordinate = getPinCoord(pin);  // ✅ aplica el override si fue movido

          return (
            <PostWithLabel
              key={`pin-post-${pinKey}`}
              pin={pin}
              pinKey={pinKey}
              iconSize={iconSize}
              coordinate={coordinate}
              onMarkerPress={onMarkerPress}
              hideIcon={HIDE_POST_ICON}
              hideLabel={HIDE_POST_LABEL}
              onDragEndPin={handlePinMoveEnd}
              canDrag={canDragPin(pinKey)}
              onDragStartPin={beginPinDrag}
              onDragFinishPin={endPinDrag}
            />

          );
        })}








        {/* SED: ICONO + LABEL */}
        {pinsSed.map((pin) => {
          const pinKey = getPinKey(pin);
          const coordinate = getPinCoord(pin);
          const label = getCleanLabel(pin);

          return (
            <SedWithLabel
              key={`pin-sed-${pinKey}`}
              pin={pin}
              pinKey={pinKey}
              coordinate={coordinate}
              label={label}
              canDrag={canDragPin(pinKey)}
              onDragStartPin={beginPinDrag}
              onDragFinishPin={endPinDrag}
              onDragEndPin={handlePinMoveEnd}
            />
          );
        })}

      </MapView>










      {/* TOP LEFT: selector alineado al compass */}
      <View
        pointerEvents="box-none" // ✅ NO bloquea el compás (solo los hijos capturan touch)
        style={{
          position: "absolute",
          top: 11,
          left: 15,
          height: 44,
          zIndex: 6000,
          elevation: 10,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        {/* reserva el espacio del compás (taps pasan al compás) */}
        <View style={{ width: 44, height: 44 }} pointerEvents="none" />

        {/* selector (este sí captura touch) */}
        <View
          pointerEvents={uiLocked ? "none" : "auto"}
          style={{
            width: 150,
            height: 44,
            justifyContent: "center",
            opacity: uiLocked ? 0.5 : 1,
          }}
        >
          {user?.proyecto === 0 ? (
            <DropDownSed onSelectSed={handleSelectSed} />
          ) : (
            <DropDown onSelectFeeder={setSelectedFeeder} />
          )}
        </View>
      </View>

      <GapSelectorModal
        visible={showGapSelector}
        overlappedGaps={overlappedGaps}
        onPick={(gap) => {
          setShowGapSelector(false);
          onMarkerPress(gap);
        }}
        onCancel={() => setShowGapSelector(false)}
      />

      <TouchableOpacity
        style={[styles.floatBtn, uiLocked && { opacity: 0.5 }]}
        onPress={goToUserLocation}
        disabled={uiLocked}
      >
        <Image source={require("../../assets/GPS.png")} style={styles.btnImg} />
      </TouchableOpacity>






      {/* BOTONES TOP RIGHT */}
      <View style={styles.topRightButtons} pointerEvents={uiLocked ? "none" : "auto"}>
        <TouchableOpacity
          onPress={() => {
            if (uiLocked) return;
            setShowSearchModal(true);
            clearSearch();
          }}
          disabled={uiLocked || loadingPins || loadingGaps || loadingLocation}
          style={[
            styles.circleBtn,
            (uiLocked || loadingPins || loadingGaps || loadingLocation) && { opacity: 0.6 },
          ]}
        >
          <Ionicons name="search" size={24} color="#333" />
        </TouchableOpacity>




        <TouchableOpacity
          onPress={() => {
            if (uiLocked) return;
            handleRefreshMap();
          }}
          disabled={uiLocked || loadingPins || loadingGaps || loadingLocation}
          style={[
            styles.circleBtn,
            { marginTop: 10 },
            (uiLocked || loadingPins || loadingGaps || loadingLocation) && { opacity: 0.6 },
          ]}
        >
          <Ionicons name="refresh" size={24} color="#333" />
        </TouchableOpacity>



        <TouchableOpacity
          onPress={() => {
            if (uiLocked) return;
            setShowAuditModal(true);
          }}
          disabled={uiLocked || loadingPins || loadingGaps || loadingLocation}
          style={[
            styles.circleBtn,
            { marginTop: 10 },
            (uiLocked || loadingPins || loadingGaps || loadingLocation) && { opacity: 0.6 },
          ]}
        >
          <Ionicons name="alert-circle" size={24} color="#333" />
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

      <AuditInspeccionadoModal
        visible={showAuditModal}
        loading={audit.loading}
        analyzed={audit.analyzed}
        title="Analizar inconsistencias"
        subtitle={
          user?.proyecto === 0
            ? `Inconsistencias: ${(audit.list ?? []).length}`
            : "Solo disponible en modo SED"
        }
        items={audit.list}
        selectedKey={audit.selectedKey}
        onSelectKey={(k) => setAudit((prev) => ({ ...prev, selectedKey: k }))}
        onAnalyze={buildAuditList}
        onReAnalyze={buildAuditList}
        onClose={() => setShowAuditModal(false)}

        onLocate={() => {
          handleAuditLocate();
          setShowAuditModal(false); // ✅ Ubicar cierra modal
        }}
        onInspect={handleAuditSelect} // ✅ Seleccionar: centra y luego abre inspection
      />


    </View>
  );
};

export default MapScreen;
