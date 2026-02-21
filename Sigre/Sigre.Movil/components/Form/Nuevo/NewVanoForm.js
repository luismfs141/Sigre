import { Ionicons } from "@expo/vector-icons";
import { forwardRef, useContext, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthContext } from "../../../context/AuthContext";
import { useDatos } from "../../../context/DatosContext";
import { useMap } from "../../../hooks/useMap";

import { DropDown } from "../../../components/DropDown";
import { DropDownSed } from "../../../components/DropDownSed";

import { getSingleFeederLocal } from "../../../database/offlineDB/feeders";
import { getPostByIdLocal } from "../../../database/offlineDB/posts";
import { getAllSedsLocal, getSedById } from "../../../database/offlineDB/seds";

import {
    ZOOM_THRESHOLD,
    getCleanLabel,
    getIconSizeByType,
    getPinsVisibleInRegion,
    isPostType,
    isSedType,
} from "../../../utils/map/mapUtils";

import { pinStyles } from "../../../styles/mapStyles";
import { getSourceImageFromType2 } from "../../../utils/utils";

const safeTrim = (v) => String(v ?? "").trim();
const toNumberOrNull = (v) => {
    const s = safeTrim(v);
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
};

/**
 * SelectModal (interno): lista simple {value,label}
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
                        style={{ maxHeight: 420 }}
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

function PostWithLabel({ pin, pinKey, iconSize, coordinate, onPressPin, canDrag, onDragEndPin }) {
    const [tracks, setTracks] = useState(true);

    const cleanLabel = useMemo(() => {
        const raw = pin?.Label ?? getCleanLabel(pin) ?? "";
        return String(raw ?? "").split("\n")[0].trim();
    }, [pin]);

    useEffect(() => {
        setTracks(true);
        const t = setTimeout(() => setTracks(false), 250);
        return () => clearTimeout(t);
    }, [pinKey, iconSize, pin?.Label]);

    return (
        <>
            <Marker
                coordinate={coordinate}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={tracks}
                onPress={() => onPressPin?.(pin)}
                zIndex={10}
                draggable={!!canDrag}
                onDragEnd={(e) => {
                    const { latitude, longitude } = e.nativeEvent.coordinate;
                    onDragEndPin?.(pinKey, { latitude, longitude });
                }}
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

            {!!cleanLabel && (
                <Marker
                    coordinate={coordinate}
                    anchor={{ x: 0.5, y: -0.15 }}
                    tracksViewChanges={tracks}
                    zIndex={999}
                    tappable
                    onPress={() => onPressPin?.(pin)}
                >
                    <View style={pinStyles.labelCanvas} collapsable={false} pointerEvents="none">
                        <View style={pinStyles.labelBox}>
                            <Text style={pinStyles.labelText}>{cleanLabel}</Text>
                        </View>
                    </View>
                </Marker>
            )}
        </>
    );
}

function SedWithLabel({ pin, pinKey, coordinate, label, canDrag, onDragEndPin, onPressPin }) {
    const [tracks, setTracks] = useState(true);

    useEffect(() => {
        setTracks(true);
        const t = setTimeout(() => setTracks(false), 250);
        return () => clearTimeout(t);
    }, [pinKey, coordinate?.latitude, coordinate?.longitude, label]);

    return (
        <>
            <Marker
                coordinate={coordinate}
                anchor={{ x: 0.5, y: 1.5 }}
                tracksViewChanges={tracks}
                zIndex={2000}
                draggable={!!canDrag}
                onPress={() => onPressPin?.(pin)}
                onDragEnd={(e) => {
                    const { latitude, longitude } = e.nativeEvent.coordinate;
                    onDragEndPin?.(pinKey, { latitude, longitude });
                }}
            >
                <View collapsable={false}>
                    <Image source={getSourceImageFromType2(pin)} style={{ width: 35, height: 35, resizeMode: "contain" }} />
                </View>
            </Marker>

            {!!label && (
                <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 1.9 }} tracksViewChanges={tracks} zIndex={2001}>
                    <View style={pinStyles.labelCanvas} collapsable={false} pointerEvents="none">
                        <View style={pinStyles.labelBox}>
                            <Text style={pinStyles.labelText}>{label}</Text>
                        </View>
                    </View>
                </Marker>
            )}
        </>
    );
}

/**
 * Modal para escoger nodo (POST o SED)
 * Devuelve { kind: "POST"|"SED", id, label }
 */
function NodePickerModal({ visible, title, onClose, onConfirm }) {
    const insets = useSafeAreaInsets();
    const mapRef = useRef(null);

    const { user } = useContext(AuthContext);
    const {
        selectedFeeder,
        setSelectedFeeder,
        selectedSed,
        region: ctxRegion,
    } = useDatos();

    const { getPinsByFeeder, getPinsBySed, getGapsByFeeder, getGapsBySed } = useMap();

    const [region, setRegion] = useState(ctxRegion);
    const regionRef = useRef(ctxRegion);

    const [pinsAll, setPinsAll] = useState([]);
    const [gapsAll, setGapsAll] = useState([]);

    const [loading, setLoading] = useState(false);

    const [movedPins, setMovedPins] = useState({});
    const [candidate, setCandidate] = useState(null);

    useEffect(() => {
        if (!visible) return;
        setRegion(ctxRegion);
        regionRef.current = ctxRegion;
        setMovedPins({});
        setCandidate(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    const getPinKey = (p) => {
        const base = p?.IdOriginal ?? p?.Id ?? p?.ElementCode ?? `${p?.Latitude}-${p?.Longitude}`;
        return String(`${p?.Type ?? "X"}-${base}`);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            let pinsLoaded = [];
            let gapsLoaded = [];

            if (user?.proyecto === 1) {
                const feederId = selectedFeeder?.AlimInterno ?? null;
                if (!feederId) {
                    setPinsAll([]);
                    setGapsAll([]);
                    return;
                }

                const [p, g] = await Promise.all([
                    getPinsByFeeder(feederId),
                    getGapsByFeeder(feederId),
                ]);
                pinsLoaded = Array.isArray(p) ? p : [];
                gapsLoaded = Array.isArray(g) ? g : [];
            } else {
                const sedId = selectedSed?.SedInterno ?? null;
                if (!sedId) {
                    setPinsAll([]);
                    setGapsAll([]);
                    return;
                }

                const [p, g] = await Promise.all([
                    getPinsBySed(sedId),
                    getGapsBySed(sedId),
                ]);
                pinsLoaded = Array.isArray(p) ? p : [];
                gapsLoaded = Array.isArray(g) ? g : [];
            }

            setPinsAll(pinsLoaded);
            setGapsAll(gapsLoaded);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!visible) return;
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, user?.proyecto, selectedFeeder?.AlimInterno, selectedSed?.SedInterno]);

    const recenterToPins = () => {
        const pts = (Array.isArray(pinsAll) ? pinsAll : [])
            .map((p) => ({ lat: Number(p?.Latitude), lng: Number(p?.Longitude) }))
            .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

        if (!pts.length) return;

        let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
        for (const p of pts) {
            if (p.lat < minLat) minLat = p.lat;
            if (p.lat > maxLat) maxLat = p.lat;
            if (p.lng < minLng) minLng = p.lng;
            if (p.lng > maxLng) maxLng = p.lng;
        }

        const latitude = (minLat + maxLat) / 2;
        const longitude = (minLng + maxLng) / 2;

        const latitudeDelta = Math.max((maxLat - minLat) * 1.6, 0.01);
        const longitudeDelta = Math.max((maxLng - minLng) * 1.6, 0.01);

        const reg = { latitude, longitude, latitudeDelta, longitudeDelta };
        setRegion(reg);
        regionRef.current = reg;
        mapRef.current?.animateToRegion(reg, 600);
    };

    const handleRefresh = async () => {
        setMovedPins({});
        setCandidate(null);
        await loadData();
        recenterToPins();
    };

    const shouldShowPosts = (region?.latitudeDelta ?? 1) < ZOOM_THRESHOLD;

    const sedsPins = useMemo(() => {
        return (Array.isArray(pinsAll) ? pinsAll : []).filter((p) => isSedType(p?.Type));
    }, [pinsAll]);

    const postsPinsVisible = useMemo(() => {
        if (!shouldShowPosts) return [];
        const posts = (Array.isArray(pinsAll) ? pinsAll : []).filter((p) => isPostType(p?.Type));
        return getPinsVisibleInRegion(posts, regionRef.current);
    }, [pinsAll, shouldShowPosts, region?.latitude, region?.longitude, region?.latitudeDelta, region?.longitudeDelta]);

    const getPinCoord = (pin) => {
        const key = getPinKey(pin);
        const moved = movedPins[key];
        return moved ? moved : { latitude: Number(pin.Latitude), longitude: Number(pin.Longitude) };
    };

    const onPressPin = (pin) => {
        const t = Number(pin?.Type);
        if (!(isPostType(t) || isSedType(t))) return;

        const id = pin?.IdOriginal ?? pin?.Id ?? null;
        const label = getCleanLabel(pin) || pin?.Label || pin?.ElementCode || "";

        if (id == null) return;

        setCandidate({
            kind: isPostType(t) ? "POST" : "SED",
            id: Number(id),
            label: String(label ?? "").trim(),
        });
    };

    const confirm = () => {
        if (!candidate?.id || !candidate?.kind) {
            Alert.alert("Aviso", "Seleccione un POST o una SED.");
            return;
        }
        onConfirm?.(candidate);
    };

    // placeholder (sin selección base)
    if (visible && ((user?.proyecto === 1 && !selectedFeeder) || (user?.proyecto === 0 && !selectedSed))) {
        return (
            <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
                <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
                    <View style={{ flex: 1, padding: 16 }}>
                        <Text style={{ fontWeight: "900", fontSize: 16, marginBottom: 12 }}>{title}</Text>
                        <Text style={{ color: "#555", marginBottom: 10 }}>
                            {user?.proyecto === 1 ? "Seleccione un alimentador" : "Seleccione una SED"}
                        </Text>

                        {user?.proyecto === 1 ? (
                            <DropDown onSelectFeeder={setSelectedFeeder} />
                        ) : (
                            <DropDownSed onSelectSed={() => { }} />
                        )}

                        <TouchableOpacity style={[styles.btnDanger, { marginTop: 18 }]} onPress={onClose}>
                            <Text style={styles.btnText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
                <View style={{ flex: 1 }}>
                    {/* Header */}
                    <View style={[styles.pickerHeader, { paddingTop: insets.top + 10 }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.pickerTitle}>{title}</Text>
                            <Text numberOfLines={1} style={styles.pickerSub}>
                                Seleccionado: {candidate?.label ? candidate.label : "(nada)"}
                            </Text>
                        </View>

                        <TouchableOpacity style={styles.headerBtn} onPress={handleRefresh}>
                            <Ionicons name="refresh" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Map */}
                    <View style={{ flex: 1 }}>
                        {/* Overlay SED selector para centrar (no cambia dataset) */}
                        <View style={styles.sedSelectorOverlay}>
                            <DropDownSed
                                onSelectSed={(sed) => {
                                    const lat = Number(sed?.SedLatitud);
                                    const lng = Number(sed?.SedLongitud);
                                    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

                                    const reg = {
                                        latitude: lat,
                                        longitude: lng,
                                        latitudeDelta: 0.01,
                                        longitudeDelta: 0.01,
                                    };
                                    setRegion(reg);
                                    regionRef.current = reg;
                                    mapRef.current?.animateToRegion(reg, 600);
                                }}
                            />
                        </View>

                        <MapView
                            ref={mapRef}
                            style={{ flex: 1 }}
                            initialRegion={region}
                            mapType="satellite"
                            showsUserLocation
                            showsMyLocationButton={false}
                            moveOnMarkerPress={false}
                            onRegionChangeComplete={(reg) => {
                                setRegion(reg);
                                regionRef.current = reg;
                            }}
                        >
                            {/* VANOS (solo vista) */}
                            {(Array.isArray(gapsAll) ? gapsAll : []).map((g) => {
                                const k = String(g?.VanoInterno ?? g?.VanoCodigo ?? Math.random());
                                const a = { latitude: Number(g?.VanoLatitudIni), longitude: Number(g?.VanoLongitudIni) };
                                const b = { latitude: Number(g?.VanoLatitudFin), longitude: Number(g?.VanoLongitudFin) };
                                if (!Number.isFinite(a.latitude) || !Number.isFinite(a.longitude) || !Number.isFinite(b.latitude) || !Number.isFinite(b.longitude)) return null;

                                return (
                                    <Polyline
                                        key={`gap-${k}`}
                                        coordinates={[a, b]}
                                        strokeWidth={3}
                                        strokeColor="rgba(0,255,255,0.85)"
                                    />
                                );
                            })}

                            {/* POSTES (seleccionables) */}
                            {postsPinsVisible.map((pin) => {
                                const key = getPinKey(pin);
                                const coord = getPinCoord(pin);
                                const iconSize = getIconSizeByType(pin.Type);

                                return (
                                    <PostWithLabel
                                        key={`post-${key}`}
                                        pin={pin}
                                        pinKey={key}
                                        iconSize={iconSize}
                                        coordinate={coord}
                                        onPressPin={onPressPin}
                                        canDrag
                                        onDragEndPin={(pinKey, c) => setMovedPins((p) => ({ ...p, [pinKey]: c }))}
                                    />
                                );
                            })}

                            {/* SED (seleccionables) */}
                            {sedsPins.map((pin) => {
                                const key = getPinKey(pin);
                                const coord = getPinCoord(pin);
                                const label = getCleanLabel(pin);

                                return (
                                    <SedWithLabel
                                        key={`sed-${key}`}
                                        pin={pin}
                                        pinKey={key}
                                        coordinate={coord}
                                        label={label}
                                        canDrag
                                        onDragEndPin={(pinKey, c) => setMovedPins((p) => ({ ...p, [pinKey]: c }))}
                                        onPressPin={onPressPin}
                                    />
                                );
                            })}
                        </MapView>
                    </View>

                    {/* Footer */}
                    <View style={[styles.pickerFooter, { paddingBottom: insets.bottom + 10 }]}>
                        <TouchableOpacity style={styles.btnOk} onPress={confirm}>
                            <Text style={styles.btnText}>Confirmar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.btnDanger} onPress={onClose}>
                            <Text style={styles.btnText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

export default forwardRef(function NewVano(_, ref) {
    const { selectedFeeder, alimEtiquetaLocal, dbReady, dbEpoch } = useDatos();

    const [loadingLists, setLoadingLists] = useState(false);

    // feeder (bloqueado)
    const [alimInterno, setAlimInterno] = useState(null);
    const [alimEtiqueta, setAlimEtiqueta] = useState("");

    // campos
    const [VanoCodigo, setVanoCodigo] = useState("");
    const [VanoSubestacion, setVanoSubestacion] = useState(null);

    const [VanoNodoInicial, setVanoNodoInicial] = useState("");
    const [VanoLatitudIni, setVanoLatitudIni] = useState("");
    const [VanoLongitudIni, setVanoLongitudIni] = useState("");

    const [VanoNodoFinal, setVanoNodoFinal] = useState("");
    const [VanoLatitudFin, setVanoLatitudFin] = useState("");
    const [VanoLongitudFin, setVanoLongitudFin] = useState("");

    // seds list
    const [seds, setSeds] = useState([]);

    // modal selector subestación
    const [selectModal, setSelectModal] = useState({
        visible: false,
        title: "",
        items: [],
        onPick: null,
    });

    // modal picker nodos
    const [picker, setPicker] = useState({ visible: false, target: "INI" });

    const listsLoadedRef = useRef(false);
    const lastDbEpochRef = useRef(dbEpoch);

    useEffect(() => {
        // ✅ solo si realmente cambió la DB
        if (lastDbEpochRef.current === dbEpoch) return;
        lastDbEpochRef.current = dbEpoch;

        // ✅ cierra modales abiertos
        setSelectModal({ visible: false, title: "", items: [], onPick: null });
        setPicker({ visible: false, target: "INI" });

        // ✅ fuerza recarga de listas en la nueva DB
        listsLoadedRef.current = false;

        // ✅ resetea campos del formulario
        reset();
    }, [dbEpoch]);

    // ===============================
    // DB ERROR GUARD (SQLite nativo)
    // ===============================
    const dbErrorShownRef = useRef(false);

    const isFatalSqliteNativeError = (err) => {
        const msg = String(err?.message ?? err ?? "");
        return (
            msg.includes("NativeDatabase.prepareAsync") ||
            msg.includes("NativeStatement.finalizeAsync") ||
            msg.includes("NullPointerException") ||
            msg.includes("shared object that was already released") ||
            msg.includes("Cannot use shared object")
        );
    };

    const resetDueToDbError = (err) => {
        if (!isFatalSqliteNativeError(err)) return;
        if (dbErrorShownRef.current) return;

        dbErrorShownRef.current = true;

        Alert.alert(
            "Aviso",
            "Se detectó un problema con la base local (SQLite). Puede haber cambiado desde la última vez.\n\nEs necesario reiniciar el formulario para evitar errores.",
            [
                {
                    text: "Aceptar",
                    onPress: () => {
                        // ✅ cierra modales
                        setSelectModal({ visible: false, title: "", items: [], onPick: null });
                        setPicker({ visible: false, target: "INI" });

                        // ✅ permite reintentar carga
                        listsLoadedRef.current = false;

                        // ✅ resetea campos
                        reset();

                        dbErrorShownRef.current = false;
                    },
                },
            ],
            { cancelable: false }
        );
    };

    const reset = () => {
        setVanoCodigo("");
        setVanoSubestacion(null);

        setVanoNodoInicial("");
        setVanoLatitudIni("");
        setVanoLongitudIni("");

        setVanoNodoFinal("");
        setVanoLatitudFin("");
        setVanoLongitudFin("");
    };

    const getData = () => {
        const latIni = toNumberOrNull(VanoLatitudIni);
        const lngIni = toNumberOrNull(VanoLongitudIni);
        const latFin = toNumberOrNull(VanoLatitudFin);
        const lngFin = toNumberOrNull(VanoLongitudFin);

        const alim = alimInterno == null ? null : Number(alimInterno);

        return {
            VanoCodigo: safeTrim(VanoCodigo),

            AlimInterno: alim,
            // ✅ NOT NULL en tu schema
            AlimInternoNavigationAlimInterno: alim,

            VanoSubestacion: VanoSubestacion == null ? null : Number(VanoSubestacion),

            VanoNodoInicial: safeTrim(VanoNodoInicial),
            VanoLatitudIni: latIni,
            VanoLongitudIni: lngIni,

            VanoNodoFinal: safeTrim(VanoNodoFinal),
            VanoLatitudFin: latFin,
            VanoLongitudFin: lngFin,

            // defaults
            EstadoOffLine: null,
            VanoEtiqueta: ".",
            VanoTerceros: 0,
            VanoMaterial: null,
            VanoInspeccionado: 0,
            VanoEsMt: 0,
            VanoEsBt: 1,
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

            try {
                const feeder = await getSingleFeederLocal();
                if (feeder?.AlimInterno != null) {
                    setAlimInterno(Number(feeder.AlimInterno));
                    setAlimEtiqueta(String(feeder.AlimEtiqueta ?? ""));
                }
            } catch (e) {
                resetDueToDbError(e);
            }

        })();
    }, [selectedFeeder?.AlimInterno, selectedFeeder?.id, alimEtiquetaLocal]);

    // cargar lista seds
    useEffect(() => {
        let mounted = true;

        if (!dbReady) return;
        if (listsLoadedRef.current) return;

        listsLoadedRef.current = true;

        (async () => {
            setLoadingLists(true);
            try {
                const rows = await getAllSedsLocal();
                if (!mounted) return;

                const items = (rows ?? [])
                    .map((x) => ({
                        value: Number(x?.SedInterno),
                        label: String(x?.SedCodigo ?? "").trim(),
                    }))
                    .filter((x) => Number.isFinite(x.value) && x.label);

                // orden por SedCodigo
                items.sort((a, b) => String(a.label).localeCompare(String(b.label)));

                setSeds(items);
            } catch (e) {
                resetDueToDbError(e);
                listsLoadedRef.current = false;
                console.log("❌ Error cargando SEDs NewVano:", e?.message ?? e);
            } finally {
                if (mounted) setLoadingLists(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [dbReady]);

    const openSelect = (title, items, onPick) => {
        setSelectModal({ visible: true, title, items, onPick });
    };
    const closeSelect = () => setSelectModal((p) => ({ ...p, visible: false }));

    const displaySed = useMemo(() => {
        const it = seds.find((x) => Number(x.value) === Number(VanoSubestacion));
        return it?.label ?? "";
    }, [seds, VanoSubestacion]);

    const applyPickedNode = async (target, cand) => {
        try {
            const kind = cand?.kind;
            const id = Number(cand?.id);

            if (!kind || !Number.isFinite(id)) return;

            if (kind === "POST") {
                const post = await getPostByIdLocal(id);
                if (!post) {
                    Alert.alert("Error", "No se pudo leer el POST desde SQLite.");
                    return;
                }

                const label = String(
                    post?.PostEtiqueta ?? post?.PostCodigoNodo ?? cand?.label ?? ""
                ).trim();

                const lat = Number(post?.PostLatitud);
                const lng = Number(post?.PostLongitud);

                if (!label) {
                    Alert.alert("Error", "El POST no tiene etiqueta/código válido.");
                    return;
                }
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                    Alert.alert("Error", "El POST no tiene coordenadas válidas.");
                    return;
                }

                if (target === "INI") {
                    setVanoNodoInicial(label);
                    setVanoLatitudIni(lat.toFixed(12));
                    setVanoLongitudIni(lng.toFixed(12));
                } else {
                    setVanoNodoFinal(label);
                    setVanoLatitudFin(lat.toFixed(12));
                    setVanoLongitudFin(lng.toFixed(12));
                }

                return;
            }

            // =====================
            // SED
            // =====================
            const rows = await getSedById(id);
            const sed = Array.isArray(rows) ? rows?.[0] : rows;

            if (!sed) {
                Alert.alert("Error", "No se pudo leer la SED desde SQLite.");
                return;
            }

            const label = String(sed?.SedCodigo ?? cand?.label ?? "").trim();
            const lat = Number(sed?.SedLatitud);
            const lng = Number(sed?.SedLongitud);

            if (!label) {
                Alert.alert("Error", "La SED no tiene código válido.");
                return;
            }
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                Alert.alert("Error", "La SED no tiene coordenadas válidas.");
                return;
            }

            if (target === "INI") {
                setVanoNodoInicial(label);
                setVanoLatitudIni(lat.toFixed(12));
                setVanoLongitudIni(lng.toFixed(12));
            } else {
                setVanoNodoFinal(label);
                setVanoLatitudFin(lat.toFixed(12));
                setVanoLongitudFin(lng.toFixed(12));
            }
        } catch (e) {
            resetDueToDbError(e); // ✅ aquí cae si revienta SQLite nativo
        }
    };
    return (
        <View style={styles.card}>
            <Text style={styles.title}>Nuevo Vano</Text>

            {loadingLists && (
                <View style={styles.loadingRow}>
                    <ActivityIndicator />
                    <Text style={styles.loadingText}>Cargando listas...</Text>
                </View>
            )}

            {/* Alimentador (bloqueado) */}
            <Text style={styles.label}>Alimentador</Text>
            <TextInput
                value={alimInterno == null ? "" : `${alimEtiqueta || ""} (ID: ${alimInterno})`}
                editable={false}
                style={[styles.input, styles.inputDisabled]}
                placeholder="Sin alimentador"
            />

            {/* Código */}
            <Text style={styles.label}>Código</Text>
            <TextInput
                value={VanoCodigo}
                onChangeText={setVanoCodigo}
                style={styles.input}
                placeholder="Ej: VBT000123456"
            />

            {/* Subestación */}
            <Text style={styles.label}>Subestación</Text>
            <TouchableOpacity
                style={styles.select}
                onPress={() =>
                    openSelect("Seleccione subestación", seds, (it) => {
                        setVanoSubestacion(it.value);
                        closeSelect();
                    })
                }
            >
                <Text style={styles.selectText}>{displaySed || "Seleccionar..."}</Text>
                <Ionicons name="chevron-down" size={18} color="#444" />
            </TouchableOpacity>

            {/* Nodo inicial */}
            <Text style={styles.label}>Nodo inicial</Text>
            <View style={styles.rowPick}>
                <TextInput
                    value={VanoNodoInicial}
                    editable={false}
                    style={[styles.input, styles.inputDisabled, { flex: 1 }]}
                    placeholder="Seleccione..."
                />
                <TouchableOpacity
                    style={styles.pickBtn}
                    onPress={() => setPicker({ visible: true, target: "INI" })}
                >
                    <Text style={styles.pickBtnText}>Seleccionar</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.labelSmall}>Latitud inicial</Text>
                    <TextInput value={VanoLatitudIni} editable={false} style={[styles.input, styles.inputDisabled]} />
                </View>
                <View style={{ width: 10 }} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.labelSmall}>Longitud inicial</Text>
                    <TextInput value={VanoLongitudIni} editable={false} style={[styles.input, styles.inputDisabled]} />
                </View>
            </View>

            {/* Nodo final */}
            <Text style={styles.label}>Nodo final</Text>
            <View style={styles.rowPick}>
                <TextInput
                    value={VanoNodoFinal}
                    editable={false}
                    style={[styles.input, styles.inputDisabled, { flex: 1 }]}
                    placeholder="Seleccione..."
                />
                <TouchableOpacity
                    style={styles.pickBtn}
                    onPress={() => setPicker({ visible: true, target: "FIN" })}
                >
                    <Text style={styles.pickBtnText}>Seleccionar</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.labelSmall}>Latitud final</Text>
                    <TextInput value={VanoLatitudFin} editable={false} style={[styles.input, styles.inputDisabled]} />
                </View>
                <View style={{ width: 10 }} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.labelSmall}>Longitud final</Text>
                    <TextInput value={VanoLongitudFin} editable={false} style={[styles.input, styles.inputDisabled]} />
                </View>
            </View>

            {/* Modales */}
            <SelectModal
                visible={selectModal.visible}
                title={selectModal.title}
                items={selectModal.items}
                onPick={(it) => selectModal.onPick?.(it)}
                onClose={closeSelect}
            />

            <NodePickerModal
                visible={picker.visible}
                title={picker.target === "INI" ? "Seleccionar nodo inicial" : "Seleccionar nodo final"}
                onClose={() => setPicker({ visible: false, target: "INI" })}
                onConfirm={async (cand) => {
                    await applyPickedNode(picker.target, cand);
                    setPicker({ visible: false, target: "INI" });
                }}
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
    labelSmall: { fontSize: 11, fontWeight: "800", color: "#555", marginTop: 10, marginBottom: 6 },

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

    rowPick: { flexDirection: "row", alignItems: "center", gap: 10 },

    pickBtn: {
        backgroundColor: "#007bff",
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 10,
    },
    pickBtnText: { color: "#fff", fontWeight: "900" },

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

    pickerHeader: {
        paddingHorizontal: 14,
        paddingBottom: 10,
        backgroundColor: "rgba(0,0,0,0.7)",
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    pickerTitle: { color: "#fff", fontWeight: "900", fontSize: 16 },
    pickerSub: { color: "#ddd", marginTop: 2, fontWeight: "700" },

    headerBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.18)",
        alignItems: "center",
        justifyContent: "center",
    },

    pickerFooter: {
        paddingHorizontal: 14,
        paddingTop: 10,
        backgroundColor: "rgba(0,0,0,0.75)",
        flexDirection: "row",
        gap: 10,
    },
    btnOk: {
        flex: 1,
        backgroundColor: "#28a745",
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
    },
    btnDanger: {
        flex: 1,
        backgroundColor: "#dc3545",
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
    },
    btnText: { color: "#fff", fontWeight: "900" },

    sedSelectorOverlay: {
        position: "absolute",
        top: 70,
        left: 12,
        width: 160,
        height: 44,
        justifyContent: "center",
        zIndex: 2000,
        elevation: 10,
    },
});