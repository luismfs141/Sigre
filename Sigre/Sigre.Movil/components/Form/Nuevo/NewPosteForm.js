import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { DropDownSed } from "../../../components/DropDownSed";

import { Ionicons } from "@expo/vector-icons";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";

import { useDatos } from "../../../context/DatosContext";
import { runQuery } from "../../../database/offlineDB/db";
import { getSingleFeederLocal } from "../../../database/offlineDB/feeders";
import { usePost } from "../../../hooks/usePost";

const safeTrim = (v) => String(v ?? "").trim();

const toNumberOrNull = (v) => {
  const s = safeTrim(v);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

/**
 * SelectModal (interno):
 * - abre un modal con lista
 * - al elegir, devuelve {value, label}
 */
function SelectModal({ visible, title, items, onPick, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>

          <FlatList
            data={items}
            keyExtractor={(it) => String(it.value)}
            style={{ maxHeight: 380 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalItem} onPress={() => onPick(item)}>
                <Text style={styles.modalItemText}>{item.label}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.modalSep} />}
          />

          <TouchableOpacity style={styles.modalClose} onPress={onClose}>
            <Text style={styles.modalCloseText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default forwardRef(function NewPoste(_, ref) {
  const mapRef = useRef(null);

  const fullMapRef = useRef(null);

  // ✅ zoom persistente (se actualiza cuando haces zoom/pan)
  const zoomRef = useRef({ latitudeDelta: 0.01, longitudeDelta: 0.01 });

  // ✅ región persistente (para abrir/cerrar fullscreen con mismo zoom + coord)
  const lastRegionRef = useRef(null);

  const [isFullMap, setIsFullMap] = useState(false);





  const { selectedFeeder, alimEtiquetaLocal, region, dbReady } = useDatos();
  const { getMaterialsPost, getTipoRetenidasPost } = usePost();

  const [loadingLists, setLoadingLists] = useState(false);

  // feeder (bloqueado)
  const [alimInterno, setAlimInterno] = useState(null);
  const [alimEtiqueta, setAlimEtiqueta] = useState("");

  // campos
  const [PostCodigoNodo, setPostCodigoNodo] = useState("");
  const [PostEtiqueta, setPostEtiqueta] = useState("");
  const [PostAltura, setPostAltura] = useState(""); // se guarda solo si existe columna

  const [PostLatitud, setPostLatitud] = useState("");
  const [PostLongitud, setPostLongitud] = useState("");

  // selects
  const [materials, setMaterials] = useState([]);
  const [retenidaTipos, setRetenidaTipos] = useState([]);
  const [seds, setSeds] = useState([]);

  const [PostMaterial, setPostMaterial] = useState(null);       // PosmtInterno
  const [PostRetenidaTipo, setPostRetenidaTipo] = useState(null); // RtntpInterno
  const [PostSubestacion, setPostSubestacion] = useState(null); // SedInterno

  // modal selector genérico
  const [selectModal, setSelectModal] = useState({
    visible: false,
    title: "",
    items: [],
    onPick: null,
  });

  const [gpsLoading, setGpsLoading] = useState(false);

  const [placeQuery, setPlaceQuery] = useState("");
  const [placeSearching, setPlaceSearching] = useState(false);
  const [placeResults, setPlaceResults] = useState([]); // [{latitude, longitude, label}]

  // mapa marker
  const defaultCenter = useMemo(() => {
    const lat = Number(region?.latitude);
    const lng = Number(region?.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { latitude: lat, longitude: lng };
    return { latitude: -12.0464, longitude: -77.0428 };
  }, [region?.latitude, region?.longitude]);

  const [markerCoord, setMarkerCoord] = useState(defaultCenter);



  const listsLoadedRef = useRef(false);





  const reset = () => {
    setPostCodigoNodo("");
    setPostEtiqueta("");
    setPostAltura("");

    setPostLatitud("");
    setPostLongitud("");

    setPostMaterial(null);
    setPostRetenidaTipo(null);
    setPostSubestacion(null);

    setMarkerCoord(defaultCenter);
  };

  const getData = () => {
    const lat = toNumberOrNull(PostLatitud);
    const lng = toNumberOrNull(PostLongitud);

    const altura = toNumberOrNull(PostAltura);

    return {
      // campos principales
      PostCodigoNodo: safeTrim(PostCodigoNodo),
      PostEtiqueta: safeTrim(PostEtiqueta),

      AlimInterno: Number(alimInterno),

      PostMaterial: PostMaterial == null ? null : Number(PostMaterial),
      PostRetenidaTipo: PostRetenidaTipo == null ? null : Number(PostRetenidaTipo),
      PostSubestacion: PostSubestacion == null ? null : Number(PostSubestacion),

      PostAltura: altura, // ⚠ se guardará solo si existe la columna en SQLite

      PostLatitud: lat,
      PostLongitud: lng,

      // defaults pedidos
      EstadoOffLine: null,
      PostTerceros: 0,
      PostInspeccionado: 0,
      PostRetenidaMaterial: null,
      PostArmadoTipo: null,
      PostArmadoMaterial: null,
      PostEsMt: 0,
      PostEsBt: 1,
      PostTramo: null, // si tu DB no tiene esta columna, se ignora en DAL

      PostArmadoMaterialNavigationArmmtInterno: null,
      PostArmadoTipoNavigationArmtpInterno: null,
      PostMaterialNavigationPosmtInterno: null,
      PostRetenidaMaterialNavigationRtnmtInterno: null,
      PostRetenidaTipoNavigationRtntpInterno: null,
      PostRetenidaMaterialNavigationRtnmtInterno: null,
      PostRetenidaTipoNavigationRtntpInterno: null,
      PostRetenidaMaterialNavigationRtnmtInterno: null,
    };
  };

  useImperativeHandle(ref, () => ({ reset, getData }));

  // cargar feeder actual (bloqueado)
  useEffect(() => {
    (async () => {
      const id =
        selectedFeeder?.AlimInterno ??
        selectedFeeder?.alimInterno ??
        selectedFeeder?.id ??
        null;

      const label =
        selectedFeeder?.AlimEtiqueta ??
        selectedFeeder?.alimEtiqueta ??
        selectedFeeder?.name ??
        alimEtiquetaLocal ??
        "";

      if (id != null) {
        setAlimInterno(Number(id));
        setAlimEtiqueta(String(label ?? ""));
        return;
      }

      // fallback: SQLite suele tener 1 alimentador
      const feeder = await getSingleFeederLocal();
      if (feeder?.AlimInterno != null) {
        setAlimInterno(Number(feeder.AlimInterno));
        setAlimEtiqueta(String(feeder.AlimEtiqueta ?? ""));
      }
    })();
  }, [selectedFeeder?.AlimInterno, selectedFeeder?.id, alimEtiquetaLocal]);

  // cargar listas (materiales, retenidas, seds)
  useEffect(() => {
    let mounted = true;

    if (!dbReady) return;
    if (listsLoadedRef.current) return;

    listsLoadedRef.current = true;

    (async () => {
      setLoadingLists(true);

      try {
        const [mats, rtps, sedsRows] = await Promise.all([
          getMaterialsPost(),
          getTipoRetenidasPost(),
          runQuery(`SELECT SedInterno, SedCodigo FROM Seds ORDER BY SedCodigo ASC;`)
        ]);

        if (!mounted) return;

        const matsItems = (mats ?? [])
          .map((x) => ({
            value: Number(x?.PosmtInterno),
            label: String(x?.PosmtNombre ?? "").trim(),
            active: x?.PostActivo,
          }))
          .filter((x) => Number.isFinite(x.value) && x.label);

        const rtpItems = (rtps ?? [])
          .map((x) => ({
            value: Number(x?.RtntpInterno),
            label: String(x?.RtntpNombre ?? "").trim(),
            active: x?.RtntpActivo,
          }))
          .filter((x) => Number.isFinite(x.value) && x.label);

        const sedItems = (sedsRows ?? [])
          .map((x) => ({
            value: Number(x?.SedInterno),
            label: String(x?.SedCodigo ?? "").trim(),
          }))
          .filter((x) => Number.isFinite(x.value) && x.label);

        setMaterials(matsItems);
        setRetenidaTipos(rtpItems);
        setSeds(sedItems);
      } catch (e) {
        // si falló, permite reintentar
        listsLoadedRef.current = false;
        console.log("❌ Error cargando listas NewPoste:", e?.message ?? e);
      } finally {
        if (mounted) setLoadingLists(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [dbReady]);

  // flecha abajo: aplica coords manuales al marker
  const handleApplyManualCoordsToMap = () => {
    const lat = toNumberOrNull(PostLatitud);
    const lng = toNumberOrNull(PostLongitud);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      Alert.alert("Validación", "Latitud/Longitud deben ser numéricas.");
      return;
    }
    if (lat < -90 || lat > 90) {
      Alert.alert("Validación", "Latitud fuera de rango (-90..90).");
      return;
    }
    if (lng < -180 || lng > 180) {
      Alert.alert("Validación", "Longitud fuera de rango (-180..180).");
      return;
    }

    const coord = { latitude: lat, longitude: lng };
    centerMiniMapTo(lat, lng, 0.004);
  };

  // flecha arriba: copia coords del marker a inputs
  const handleCopyMapToInputs = () => {
    const lat = Number(markerCoord?.latitude);
    const lng = Number(markerCoord?.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      Alert.alert("Error", "Marker inválido.");
      return;
    }

    setPostLatitud(lat.toFixed(7));
    setPostLongitud(lng.toFixed(7));
  };


  const ensureGpsPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === "granted";
    } catch {
      return false;
    }
  };

  const centerMiniMapTo = (lat, lng, delta = null) => {
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    // ✅ actualiza selección
    const coord = { latitude, longitude };
    setMarkerCoord(coord);

    // ✅ si te pasan delta, actualiza zoomRef
    if (delta != null) {
      const d = Number(delta);
      if (Number.isFinite(d) && d > 0) {
        zoomRef.current = { latitudeDelta: d, longitudeDelta: d };
      }
    }

    const z = zoomRef.current || { latitudeDelta: 0.01, longitudeDelta: 0.01 };
    const reg = {
      latitude,
      longitude,
      latitudeDelta: z.latitudeDelta,
      longitudeDelta: z.longitudeDelta,
    };

    lastRegionRef.current = reg;

    mapRef.current?.animateToRegion(reg, 450);
    fullMapRef.current?.animateToRegion(reg, 450);
  };

  const handleCenterGps = async () => {
    setGpsLoading(true);
    try {
      const ok = await ensureGpsPermission();
      if (!ok) {
        Alert.alert("GPS", "Permiso de ubicación denegado.");
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const lat = pos?.coords?.latitude;
      const lng = pos?.coords?.longitude;

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        Alert.alert("GPS", "No se pudo obtener la ubicación.");
        return;
      }

      centerMiniMapTo(lat, lng, 0.003);
    } catch (e) {
      Alert.alert("GPS", e?.message ?? "Error obteniendo ubicación.");
    } finally {
      setGpsLoading(false);
    }
  };

  const formatReverse = (rev) => {
    if (!rev) return "";
    const parts = [
      rev?.street,
      rev?.name,
      rev?.district,
      rev?.city,
      rev?.region,
      rev?.country,
    ]
      .map((x) => String(x ?? "").trim())
      .filter(Boolean);

    return parts.join(", ");
  };

  const handlePlaceSearch = async () => {
    const q = String(placeQuery ?? "").trim();
    if (q.length < 3) {
      Alert.alert("Buscar", "Escriba al menos 3 caracteres.");
      return;
    }

    setPlaceSearching(true);
    setPlaceResults([]);

    try {
      // ⚠ requiere internet en la mayoría de equipos
      const geo = await Location.geocodeAsync(q);
      const top = (geo ?? []).slice(0, 5);

      if (!top.length) {
        Alert.alert("Buscar", "No se encontraron resultados.");
        return;
      }

      // Intentar armar labels bonitos con reverse (si falla, igual mostramos coords)
      const enriched = [];
      for (const g of top) {
        const latitude = Number(g?.latitude);
        const longitude = Number(g?.longitude);
        let label = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

        try {
          const rev = await Location.reverseGeocodeAsync({ latitude, longitude });
          const pretty = formatReverse(rev?.[0]);
          if (pretty) label = pretty;
        } catch {
          // ok: queda label por coords
        }

        enriched.push({ latitude, longitude, label });
      }

      setPlaceResults(enriched);

      // centra al primero
      centerMiniMapTo(enriched[0].latitude, enriched[0].longitude, 0.01);
    } catch (e) {
      Alert.alert("Buscar", e?.message ?? "Error buscando lugar.");
    } finally {
      setPlaceSearching(false);
    }
  };

  const pickPlaceResult = (item) => {
    if (!item) return;
    centerMiniMapTo(item.latitude, item.longitude, 0.01);
    setPlaceResults([]);
  };


  const handlePickSedFromMapSelector = async (sed) => {
    const id = sed?.SedInterno ?? sed?.id ?? null;
    if (id == null) return;

    setPostSubestacion(Number(id));

    // Intento 1: coords vienen en el objeto
    let lat =
      Number(sed?.SedLatitud ?? sed?.SED_Latitud ?? sed?.Latitude ?? sed?.latitude);
    let lng =
      Number(sed?.SedLongitud ?? sed?.SED_Longitud ?? sed?.Longitude ?? sed?.longitude);

    // Intento 2: si no vienen, las leo de SQLite
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      try {
        const rows = await runQuery(
          `SELECT SedLatitud, SedLongitud
         FROM Seds
         WHERE SedInterno = ?
         LIMIT 1;`,
          [Number(id)]
        );
        lat = Number(rows?.[0]?.SedLatitud);
        lng = Number(rows?.[0]?.SedLongitud);
      } catch { }
    }

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      centerMiniMapTo(lat, lng, 0.01);
    }
  };

  //---------------------------------------------------------

  const openSelect = (title, items, onPick) => {
    setSelectModal({ visible: true, title, items, onPick });
  };

  const closeSelect = () => {
    setSelectModal((p) => ({ ...p, visible: false }));
  };

  const displayMaterial = useMemo(() => {
    const it = materials.find((x) => Number(x.value) === Number(PostMaterial));
    return it?.label ?? "";
  }, [materials, PostMaterial]);

  const displayRetenida = useMemo(() => {
    const it = retenidaTipos.find((x) => Number(x.value) === Number(PostRetenidaTipo));
    return it?.label ?? "";
  }, [retenidaTipos, PostRetenidaTipo]);

  const displaySed = useMemo(() => {
    const it = seds.find((x) => Number(x.value) === Number(PostSubestacion));
    return it?.label ?? "";
  }, [seds, PostSubestacion]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Nuevo Poste</Text>

      {loadingLists && (
        <View style={styles.loadingRow}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Cargando listas...</Text>
        </View>
      )}

      {/* Alimentador (bloqueado) */}
      <Text style={styles.label}>Alimentador (bloqueado)</Text>
      <TextInput
        value={alimInterno == null ? "" : `${alimEtiqueta || ""} (ID: ${alimInterno})`}
        editable={false}
        style={[styles.input, styles.inputDisabled]}
        placeholder="Sin alimentador"
      />

      <Text style={styles.label}>Código (PostCodigoNodo)</Text>
      <TextInput
        value={PostCodigoNodo}
        onChangeText={setPostCodigoNodo}
        style={styles.input}
        placeholder="Ej: PTO000123456"
      />

      <Text style={styles.label}>Etiqueta (PostEtiqueta)</Text>
      <TextInput
        value={PostEtiqueta}
        onChangeText={setPostEtiqueta}
        style={styles.input}
        placeholder="Ej: 327215"
      />

      {/* Material */}
      <Text style={styles.label}>Material (PostMaterial)</Text>
      <TouchableOpacity
        style={styles.select}
        onPress={() =>
          openSelect("Seleccione material", materials, (it) => {
            setPostMaterial(it.value);
            closeSelect();
          })
        }
      >
        <Text style={styles.selectText}>
          {displayMaterial || "Seleccionar..."}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#444" />
      </TouchableOpacity>

      {/* Retenida Tipo */}
      <Text style={styles.label}>Tipo de retenida (PostRetenidaTipo)</Text>
      <TouchableOpacity
        style={styles.select}
        onPress={() =>
          openSelect("Seleccione tipo de retenida", retenidaTipos, (it) => {
            setPostRetenidaTipo(it.value);
            closeSelect();
          })
        }
      >
        <Text style={styles.selectText}>
          {displayRetenida || "Seleccionar..."}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#444" />
      </TouchableOpacity>

      {/* Subestación */}
      <Text style={styles.label}>Subestación (PostSubestacion)</Text>
      <TouchableOpacity
        style={styles.select}
        onPress={() =>
          openSelect("Seleccione subestación", seds, (it) => {
            setPostSubestacion(it.value);
            closeSelect();
          })
        }
      >
        <Text style={styles.selectText}>
          {displaySed || "Seleccionar..."}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#444" />
      </TouchableOpacity>

      <Text style={styles.label}>Altura (PostAltura)</Text>
      <TextInput
        value={PostAltura}
        onChangeText={setPostAltura}
        style={styles.input}
        placeholder="Ej: 12"
        keyboardType="numeric"
      />

      {/* Lat/Lng + flechas */}
      <View style={styles.row2}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Latitud (PostLatitud)</Text>
          <TextInput
            value={PostLatitud}
            onChangeText={setPostLatitud}
            style={styles.input}
            placeholder="-17.050123"
            keyboardType="numeric"
          />
        </View>

        <View style={{ width: 10 }} />

        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Longitud (PostLongitud)</Text>
          <TextInput
            value={PostLongitud}
            onChangeText={setPostLongitud}
            style={styles.input}
            placeholder="-71.972456"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.arrowRow}>
        <TouchableOpacity style={styles.arrowBtn} onPress={handleCopyMapToInputs}>
          <Ionicons name="arrow-up" size={18} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.arrowBtn} onPress={handleApplyManualCoordsToMap}>
          <Ionicons name="arrow-down" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Mini mapa */}
      <View style={styles.mapBox}>
        {/* Buscador */}
        <View style={styles.placeBar}>
          <TextInput
            value={placeQuery}
            onChangeText={setPlaceQuery}
            placeholder="Buscar calle / distrito / ciudad..."
            style={styles.placeInput}
            autoCorrect={false}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.placeBtn, placeSearching && { opacity: 0.6 }]}
            onPress={handlePlaceSearch}
            disabled={placeSearching}
          >
            <Ionicons name="search" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Resultados */}
        {!!placeResults.length && (
          <View style={styles.placeResults}>
            {placeResults.map((it, idx) => (
              <TouchableOpacity
                key={`${idx}-${it.latitude}-${it.longitude}`}
                style={styles.placeItem}
                onPress={() => pickPlaceResult(it)}
              >
                <Text numberOfLines={2} style={styles.placeItemText}>
                  {it.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Mapa (MINIMIZADO): puedes mover mapa y mover el punto */}
        <View style={{ position: "relative" }}>
          <View style={styles.sedSelectorOverlay}>
            <DropDownSed onSelectSed={handlePickSedFromMapSelector} />
          </View>
          <MapView
            ref={mapRef}
            style={styles.map}
            mapType="satellite"
            showsUserLocation={true}
            showsMyLocationButton={false}
            initialRegion={
              lastRegionRef.current ?? {
                latitude: markerCoord.latitude,
                longitude: markerCoord.longitude,
                latitudeDelta: zoomRef.current.latitudeDelta,
                longitudeDelta: zoomRef.current.longitudeDelta,
              }
            }
            onRegionChangeComplete={(reg) => {
              // ✅ en minimizado SOLO guardamos zoom/region (NO movemos markerCoord)
              zoomRef.current = {
                latitudeDelta: reg.latitudeDelta,
                longitudeDelta: reg.longitudeDelta,
              };
              lastRegionRef.current = reg;
            }}
            onPress={(e) => {
              // ✅ tap mueve el punto
              const c = e?.nativeEvent?.coordinate;
              if (c?.latitude != null && c?.longitude != null) setMarkerCoord(c);
            }}
          >
            {/* ✅ el punto se puede mover */}
            <Marker
              coordinate={markerCoord}
              draggable
              onDragEnd={(e) => setMarkerCoord(e.nativeEvent.coordinate)}
              pinColor="red"
            />
          </MapView>

          {/* Botón GPS */}
          <TouchableOpacity
            style={[styles.gpsBtn, (gpsLoading || placeSearching) && { opacity: 0.7 }]}
            onPress={handleCenterGps}
            disabled={gpsLoading || placeSearching}
          >
            {gpsLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="locate" size={18} color="#fff" />
            )}
          </TouchableOpacity>

          {/* Expand */}
          <TouchableOpacity
            style={styles.expandBtn}
            onPress={() => {
              setIsFullMap(true);

              // ✅ al abrir fullscreen, centra en markerCoord con el MISMO zoom
              setTimeout(() => {
                const z = zoomRef.current || { latitudeDelta: 0.01, longitudeDelta: 0.01 };
                const reg = {
                  latitude: markerCoord.latitude,
                  longitude: markerCoord.longitude,
                  latitudeDelta: z.latitudeDelta,
                  longitudeDelta: z.longitudeDelta,
                };
                lastRegionRef.current = reg;
                fullMapRef.current?.animateToRegion(reg, 0);
              }, 60);
            }}
          >
            <Ionicons name="expand" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.mapHint}>
          Arrastra el punto. Usa “Mapa → Campos” (flecha ↑) para copiar coordenadas.
        </Text>


        <Modal
          visible={isFullMap}
          animationType="slide"
          onRequestClose={() => setIsFullMap(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
            <View style={{ flex: 1 }}>
              <MapView
                ref={fullMapRef}
                style={{ flex: 1 }}
                mapType="satellite"
                showsUserLocation={true}
                showsMyLocationButton={false}
                initialRegion={
                  lastRegionRef.current ?? {
                    latitude: markerCoord.latitude,
                    longitude: markerCoord.longitude,
                    latitudeDelta: zoomRef.current.latitudeDelta,
                    longitudeDelta: zoomRef.current.longitudeDelta,
                  }
                }
                onRegionChangeComplete={(reg) => {
                  // ✅ en fullscreen: el punto = CENTRO (fijo)
                  zoomRef.current = {
                    latitudeDelta: reg.latitudeDelta,
                    longitudeDelta: reg.longitudeDelta,
                  };
                  lastRegionRef.current = reg;

                  setMarkerCoord({ latitude: reg.latitude, longitude: reg.longitude });
                }}
              />

              {/* punto rojo fijo */}
              <View pointerEvents="none" style={styles.centerDotFull} />

              {/* minimizar */}
              <TouchableOpacity
                style={styles.minimizeBtn}
                onPress={() => {
                  setIsFullMap(false);

                  // ✅ al volver al mini, centra en markerCoord con el MISMO zoom
                  setTimeout(() => {
                    const z = zoomRef.current || { latitudeDelta: 0.01, longitudeDelta: 0.01 };
                    const reg = {
                      latitude: markerCoord.latitude,
                      longitude: markerCoord.longitude,
                      latitudeDelta: z.latitudeDelta,
                      longitudeDelta: z.longitudeDelta,
                    };
                    lastRegionRef.current = reg;
                    mapRef.current?.animateToRegion(reg, 0);
                  }, 60);
                }}
              >
                <Ionicons name="contract" size={18} color="#fff" />
              </TouchableOpacity>

              {/* GPS también en fullscreen (opcional pero útil) */}
              <TouchableOpacity
                style={styles.gpsBtnFull}
                onPress={handleCenterGps}
                disabled={gpsLoading}
              >
                {gpsLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Ionicons name="locate" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>


      </View>

      <SelectModal
        visible={selectModal.visible}
        title={selectModal.title}
        items={selectModal.items}
        onPick={(it) => selectModal.onPick?.(it)}
        onClose={closeSelect}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 14,
  },
  title: { fontSize: 16, fontWeight: "900", marginBottom: 10 },
  label: { fontSize: 12, fontWeight: "800", color: "#444", marginTop: 10, marginBottom: 6 },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  inputDisabled: {
    backgroundColor: "#f3f3f3",
    color: "#666",
  },

  select: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: { color: "#333", fontWeight: "700", paddingRight: 10 },

  row2: { flexDirection: "row", alignItems: "center" },

  arrowRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  arrowBtn: {
    width: "48%",
    backgroundColor: "#007bff",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  arrowText: { color: "#fff", fontWeight: "900" },

  mapBox: { marginTop: 12, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#eee" },
  map: { height: 220, width: "100%" },
  mapHint: { padding: 10, color: "#444", fontWeight: "600" },

  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  loadingText: { color: "#444", fontWeight: "700" },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },
  modalTitle: { fontWeight: "900", fontSize: 16, marginBottom: 10 },
  modalItem: { paddingVertical: 12 },
  modalItemText: { fontWeight: "700", color: "#333" },
  modalSep: { height: 1, backgroundColor: "#eee" },
  modalClose: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
  },
  modalCloseText: { fontWeight: "900", color: "#333" },
  placeBar: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  placeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  placeBtn: {
    width: 44,
    borderRadius: 10,
    backgroundColor: "#007bff",
    alignItems: "center",
    justifyContent: "center",
  },
  placeResults: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  placeItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  placeItemText: {
    fontWeight: "700",
    color: "#333",
  },
  gpsBtn: {
    position: "absolute",
    right: 10,
    top: 10,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#007bff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  centerDot: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: -7,
    marginTop: -7,
    backgroundColor: "red",
    borderWidth: 2,
    borderColor: "#fff",
  },

  expandBtn: {
    position: "absolute",
    right: 10,
    top: 10 + 44 + 10, // debajo del gps (44 de alto + 10 espacio)
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#007bff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },

  centerDotFull: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
    marginTop: -8,
    backgroundColor: "red",
    borderWidth: 2,
    borderColor: "#fff",
  },

  minimizeBtn: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },

  gpsBtnFull: {
    position: "absolute",
    right: 12,
    top: 12 + 44 + 10,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  sedSelectorOverlay: {
    position: "absolute",
    top: 55,           // ✅ lo baja para que no tape el compás
    left: 8,
    width: 160,
    height: 44,
    justifyContent: "center",
    zIndex: 2000,
    elevation: 10,
  },
});