import { useFocusEffect, useRouter } from "expo-router";
import Loading from "../../components/LoadingOverlay";
import { recalcElementoInspeccionadoFromDefsLocal } from "../../database/offlineDB/inspectionDB";
import { useGap } from "../../hooks/useGap";
import { usePost } from "../../hooks/usePost";

import { useCallback, useContext, useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Button,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";



import DeficiencyModal from "../../components/Form/Defiencies/DeficiencyModal";
import DataGeneralModal from "../../components/Form/GeneralData/DataGeneralModal";
import GeneralDataItem from "../../components/GeneralDataItem";
import ListaTipificaciones from "../../components/Modal/ListaTipificaciones";
import SelectedDeficiencyItem from "../../components/SelectedDeficiencyItem";

import { AuthContext } from "../../context/AuthContext";
import { useDatos } from "../../context/DatosContext";
import { useDeficiency } from "../../hooks/useDeficiency";

//const APP_MEDIA_DIR = FileSystem.documentDirectory + "SigreMedios/";

export default function Inspection() {
  const { selectedItem, setSelectedDeficiency, isAdmin, isSupervisor, isInspector, currentUserId } = useDatos();

  const router = useRouter();
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState({ active: false, msg: "" });


  const { deleteDeficiency, deficienciesForFlatList } = useDeficiency();
  const { getPostData, savePost } = usePost();
  const { fetchVanoById, saveVano } = useGap();


  const [items, setItems] = useState([]);
  const [modalGeneralVisible, setModalGeneralVisible] = useState(false);
  const [modalDeficiencyVisible, setModalDeficiencyVisible] = useState(false);
  const [newDefModalVisible, setNewDefModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [currentDeficiency, setCurrentDeficiency] = useState(null);

  const [busy, setBusy] = useState({ active: false, msg: "" });

  const lastLoadKeyRef = useRef(null);


  const getElementoTarget = useCallback(() => {
    if (!selectedItem) return { elementId: null, typeElement: null };

    const elementId =
      selectedItem.PostInterno ?? selectedItem.VanoInterno ?? null;

    const typeElement = selectedItem.PostInterno
      ? "POST"
      : selectedItem.VanoInterno
        ? "VANO"
        : null;

    return { elementId, typeElement };
  }, [selectedItem]);

  const pickVanoCodigo = (src) =>
    src?.VanoCodigo ?? src?.Vano_Codigo ?? src?.VANO_Codigo ?? "";

  const ensureVanoEtiqueta = (src) => {
    const et = (src?.VanoEtiqueta ?? src?.VANO_Etiqueta ?? "").toString().trim();
    if (et) return et;

    const cod = String(pickVanoCodigo(src) ?? "").trim();
    if (cod) return cod;

    return "SIN ETIQUETA";
  };







  /* =======================
      HELPERS DE VALIDACIÓN
     ======================= */
  const existeSinDeficiencia = () =>
    items.some(
      it =>
        it.type === "def" &&
        String(it.data?.typificationCode).trim() === "0000"
    );

  const existenOtrasDeficiencias = () =>
    items.some(
      it =>
        it.type === "def" &&
        String(it.data?.typificationCode).trim() !== "0000"
    );


  /* =======================
        HELPERS PARA PERMISO
       ======================= */

  const canDeleteItem = (it) => {
    if (isAdmin || isSupervisor) return true;

    if (!isInspector) return false;

    const owner = it?.data?.ownerUserId ?? null;
    if (owner == null || currentUserId == null) return false;

    return String(owner).trim() === String(currentUserId).trim();
  };


  /* =======================
    ESTADO (FINALIZADO / PENDIENTE)
   ======================= */

  const parseBool01 = (v) => {
    if (v === true) return true;
    if (v === false) return false;
    if (v === null || v === undefined) return null;

    const s = String(v).trim().toLowerCase();
    if (s === "1" || s === "true") return true;
    if (s === "0" || s === "false") return false;

    return null;
  };

  const getEstadoElemento = (data) => {
    const raw =
      data?.PostInspeccionado ??
      data?.POST_Inspeccionado ??
      data?.postInspeccionado ??
      data?.VanoInspeccionado ??
      data?.VANO_Inspeccionado ??
      data?.vanoInspeccionado ??
      null;

    const b = parseBool01(raw);
    if (b === null) return null;

    return b ? "FINALIZADO" : "PENDIENTE";
  };


  const getDefFinalizada = (defItem) => {
    return Number(defItem?.data?.defiInspeccionado) === 1;
  };


  const handleActualizarEstadoPress = async () => {
    const { elementId, typeElement } = getElementoTarget();

    if (!elementId || !typeElement) {
      Alert.alert("No aplica", "Solo aplica para Poste o Vano.");
      return;
    }

    setBusy({ active: true, msg: "Actualizando estado..." });

    try {
      // ✅ 1) Recalcula y actualiza EN SQLITE (PostInspeccionado/VanoInspeccionado)
      const res = await recalcElementoInspeccionadoFromDefsLocal(elementId, typeElement);

      if (!res?.ok) {
        Alert.alert("Error", res?.reason ?? "No se pudo recalcular el estado.");
        return;
      }

      const new01 = Number(res.inspected) === 1 ? 1 : 0;

      // ✅ 2) Solo si cambió => sincroniza con servidor
      if (res.changed) {
        try {
          if (typeElement === "POST") {
            const p = await getPostData(elementId);
            if (p) await savePost({ ...p, PostInspeccionado: new01 });
          } else if (typeElement === "VANO") {
            const v = await fetchVanoById(elementId);
            if (v) await saveVano({ ...v, VanoInspeccionado: new01 });
          }
        } catch (syncErr) {
          console.warn("⚠ sync estado inspeccionado falló:", syncErr);
          // SQLite ya quedó bien, no rompas la UI por sync.
        }
      }

      // ✅ 3) Refresca deficiencias (para que cambien los colores)
      await refreshList();

      // ✅ 4) Parcha el GENERAL al final (por si refreshList pisa el valor)
      setItems((prev) =>
        prev.map((x) => {
          if (x?.type !== "general") return x;

          const data = { ...(x.data ?? {}) };
          if (typeElement === "POST") data.PostInspeccionado = new01;
          if (typeElement === "VANO") data.VanoInspeccionado = new01;

          return { ...x, data };
        })
      );

      const estadoTxt = new01 === 1 ? "FINALIZADO" : "PENDIENTE";
      const msg = res.changed
        ? `Estado actualizado: ${estadoTxt}`
        : `Estado ya estaba: ${estadoTxt}`;

      if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
      else Alert.alert("OK", msg);
    } catch (e) {
      console.error("❌ handleActualizarEstadoPress:", e);
      Alert.alert("Error", e?.message ?? "No se pudo actualizar el estado.");
    } finally {
      setBusy({ active: false, msg: "" });
    }
  };



  /* =======================
        LEER DATOS DE ELEMENTO
       ======================= */


  const leerElementoDesdeSqlite = useCallback(async () => {
    console.log("📦 Lectura de datos al sqlite");
    if (!selectedItem) return null;

    const typeElement = selectedItem.PostInterno
      ? "POST"
      : selectedItem.VanoInterno
        ? "VANO"
        : "SED";

    // SED no se lee de sqlite (según tu lógica actual)
    if (typeElement === "SED") {
      setItems((prev) => {
        const idx = prev.findIndex((x) => x?.type === "general");

        const generalItem = {
          id: "general",
          type: "general",
          name: "Datos Generales",
          data: selectedItem,
        };

        if (idx === -1) return [generalItem, ...prev];

        const next = [...prev];
        next[idx] = generalItem;
        return next;
      });

      return selectedItem;
    }

    let elementData = selectedItem;

    try {
      if (typeElement === "POST" && selectedItem.PostInterno != null) {
        const id = selectedItem.PostInterno;

        const p = await getPostData(id);
        if (p) elementData = p;

        // ✅ Al entrar: recalcula estado en SQLite (SIN SYNC)
        const r = await recalcElementoInspeccionadoFromDefsLocal(id, "POST");
        if (r?.ok) {
          elementData = {
            ...(elementData ?? {}),
            PostInspeccionado: Number(r.inspected) === 1 ? 1 : 0,
          };
        }
      } else if (typeElement === "VANO" && selectedItem.VanoInterno != null) {
        const id = selectedItem.VanoInterno;

        const v = await fetchVanoById(id);
        if (v) elementData = v;

        // ✅ Al entrar: recalcula estado en SQLite (SIN SYNC)
        const r = await recalcElementoInspeccionadoFromDefsLocal(id, "VANO");
        if (r?.ok) {
          elementData = {
            ...(elementData ?? {}),
            VanoInspeccionado: Number(r.inspected) === 1 ? 1 : 0,
          };
        }
      }
    } catch (e) {
      console.warn("⚠ leerElementoDesdeSqlite:", e?.message ?? e);
    }


    // ✅ actualiza SOLO el item "general"
    setItems((prev) => {
      const idx = prev.findIndex((x) => x?.type === "general");

      const generalItem = {
        id: "general",
        type: "general",
        name: "Datos Generales",
        data: elementData,
      };

      if (idx === -1) return [generalItem, ...prev];

      const next = [...prev];
      next[idx] = generalItem;
      return next;
    });

    return elementData;
  }, [selectedItem, getPostData, fetchVanoById]);


  /* =======================
      CARGA INICIAL
     ======================= */
  useEffect(() => {
    if (!selectedItem) {
      setItems([]);
      lastLoadKeyRef.current = null;
      return;
    }

    const key =
      selectedItem.PostInterno != null
        ? `POST-${selectedItem.PostInterno}`
        : selectedItem.VanoInterno != null
          ? `VANO-${selectedItem.VanoInterno}`
          : `SED-${selectedItem.SedInterno ?? "X"}`;

    // ✅ evita loops aunque cambien callbacks
    if (lastLoadKeyRef.current === key) return;
    lastLoadKeyRef.current = key;

    (async () => {
      await refreshList();              // ✅ lista de deficiencias
      await leerElementoDesdeSqlite();  // ✅ datos del elemento (sqlite)
    })();
  }, [selectedItem, refreshList, leerElementoDesdeSqlite]);



  /* =======================
      BACK HANDLER
     ======================= */
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace("/(drawer)/map");
        return true;
      };
      const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => sub.remove();
    }, [])
  );



  const refreshList = useCallback(async () => {
    console.log("📦 Refresh tipificaciones existentes");
    if (!selectedItem) return;

    const elementId =
      selectedItem.PostInterno ??
      selectedItem.VanoInterno ??
      selectedItem.SedInterno;

    const typeElement = selectedItem.PostInterno
      ? "POST"
      : selectedItem.VanoInterno
        ? "VANO"
        : "SED";

    const existingDefs = await deficienciesForFlatList(elementId, typeElement);

    // ✅ NO lee elemento: preserva el "general" actual
    setItems((prev) => {
      const prevGeneral = prev.find((x) => x?.type === "general");

      const generalItem = prevGeneral ?? {
        id: "general",
        type: "general",
        name: "Datos Generales",
        data: selectedItem,
      };

      return [generalItem, ...existingDefs];
    });
  }, [selectedItem, deficienciesForFlatList]);



  /* =======================
      ABRIR MODAL
     ======================= */
  // const openFormModal = item => {
  //   setCurrentItem(item);

  //   if (item.type === "general") {
  //     setModalGeneralVisible(true);
  //     return;
  //   }

  //   setSelectedDeficiency({ ...item.data, id: item.id, name: item.name });
  //   setCurrentDeficiency({ ...item.data });
  //   setModalDeficiencyVisible(true);
  // };

  const openFormModal = (item) => {
    setCurrentItem(item);

    if (item.type === "general") {
      setModalGeneralVisible(true);
      return;
    }

    setCurrentDeficiency({
      ...item.data,
      defiInterno: item.defId, // 🔥 asegurado
      nonce: Date.now()
    });

    setModalDeficiencyVisible(true);
  };

  /* =======================
      ELIMINAR DEFICIENCIA
     ======================= */
  const handleLocalDelete = async (itemToDelete) => {
    if (!itemToDelete) return;

    // ✅ Evitar doble click / re-entradas
    if (loading.active) return;

    // ✅ PERMISOS
    if (!canDeleteItem(itemToDelete)) {
      Alert.alert(
        "No permitido",
        "Como inspector solo puedes eliminar tus propias deficiencias."
      );
      return;
    }

    Alert.alert(
      "Eliminar tipificación",
      "⚠️ Está a punto de eliminar esta tipificación y todos los archivos asociados. ¿Desea continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setLoading({ active: true, msg: "Eliminando deficiencia..." });

            try {
              const delRes = await deleteDeficiency(itemToDelete.defId);

              if (delRes?.pinMsg) {
                Alert.alert("Estado del pin actualizado", delRes.pinMsg);
              }

              setModalDeficiencyVisible(false);

              // ✅ IMPORTANTE: espera el refresh antes de soltar el loading
              await refreshList();

              if (Platform.OS === "android") {
                ToastAndroid.show(
                  "Deficiencia eliminada correctamente",
                  ToastAndroid.SHORT
                );
              }
            } catch (err) {
              console.error("❌ Error eliminando deficiencia:", err);
              Alert.alert("Error", "No se pudo eliminar la deficiencia.");
            } finally {
              setLoading({ active: false, msg: "" });
            }
          }
        }
      ]
    );
  };


  /* =======================
      SELECCIONAR TIPIFICACIÓN
     ======================= */
  const handleSelectTypification = (def) => {
    if (!selectedItem) return;

    const code = String(def.code).trim();

    // ❌ Si existe "Sin Deficiencia", no permitir nada más
    if (code !== "0000" && existeSinDeficiencia()) {
      Alert.alert(
        "No permitido",
        "Debe eliminar primero 'Sin Deficiencia' para registrar una nueva deficiencia."
      );
      return;
    }

    // ❌ No permitir crear otro 0000
    if (code === "0000" && existeSinDeficiencia()) {
      Alert.alert(
        "No permitido",
        "Ya existe un registro de 'Sin Deficiencia' para este elemento."
      );
      return;
    }

    // ❌ No permitir 0000 si ya hay otras deficiencias
    if (code === "0000" && existenOtrasDeficiencias()) {
      Alert.alert(
        "No permitido",
        "Debe eliminar primero las deficiencias existentes para registrar 'Sin Deficiencia'."
      );
      return;
    }

    const elementId =
      selectedItem.PostInterno ?? selectedItem.VanoInterno ?? selectedItem.SedInterno;

    const typeElement = selectedItem.PostInterno
      ? "POST"
      : selectedItem.VanoInterno
        ? "VANO"
        : "SED";

    const currentDef = {
      detail: def.detail ?? "",
      deficiency: def.deficiency ?? "Sin Deficiencia",
      elementId,
      typeElement,
      typificationId: def.id,
      typificationCode: def.code,
      tableId: def.tableId,
      forceNew: String(def.code) === "7004",
      nonce: Date.now()
    };

    setCurrentDeficiency(currentDef);
    setModalDeficiencyVisible(true);
    setNewDefModalVisible(false);
  };

  /* =======================
      RENDER ITEM
     ======================= */
  const renderItem = ({ item }) => {
    if (item.type === "general") {
      const estado = getEstadoElemento(item?.data) ?? "PENDIENTE";
      const isFinalizado = estado === "FINALIZADO";

      return (
        <View>
          <View style={styles.estadoRow}>
            <View style={styles.estadoLeft}>
              <Text style={styles.estadoLabel}>ESTADO:</Text>
              <Text
                style={[
                  styles.estadoValue,
                  isFinalizado ? styles.estadoFinalizado : styles.estadoPendiente,
                ]}
              >
                {estado}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.estadoBtn}
              onPress={handleActualizarEstadoPress} // ✅ por ahora relee sqlite
              activeOpacity={0.8}
            >
              <Text style={styles.estadoBtnText}>Actualizar</Text>
            </TouchableOpacity>
          </View>

          {/* ✅ Esto controla el “vacío” debajo del ESTADO (compensa margen interno del card) */}
          <View style={styles.generalCardWrap}>
            <GeneralDataItem
              item={item.data}
              onEdit={(it) => openFormModal({ ...item, data: it })}
            />
          </View>

          {/* ✅ Esto separa el card del elemento de la primera deficiencia */}
          <View style={styles.afterGeneralSpacer} />
        </View>
      );
    }

    const defFinalizada = getDefFinalizada(item);

    return (
      <SelectedDeficiencyItem
        item={item}
        canDelete={canDeleteItem(item)}
        onDelete={() => handleLocalDelete(item)}
        onPhotos={() => {
          setSelectedDeficiency({ ...item.data, id: item.id, name: item.name });
          router.push("/(drawer)/multimedia");
        }}
        onDeficiency={openFormModal}
        containerStyle={[
          styles.defCardTint,
          defFinalizada ? styles.defCardFinalizada : styles.defCardPendiente,
        ]}
      />
    );

  };




  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.screen}>

      <FlatList
        data={items}
        keyExtractor={(item) =>
          item.type === "def" ? item.defId.toString() : item.id.toString()
        }
        renderItem={renderItem}
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingTop: 0,
          paddingBottom: 24,
        }}

        ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
        showsVerticalScrollIndicator={false}
      />

      <View style={{ padding: 8 }}>
        <Button
          title="Nueva Deficiencia"
          onPress={() => {
            if (existeSinDeficiencia()) {
              Alert.alert(
                "No permitido",
                "Este elemento ya tiene 'Sin Deficiencia'. Debe eliminarla antes de registrar otra."
              );
              return;
            }
            setNewDefModalVisible(true);
          }}
          disabled={busy.active}
        />
      </View>



      <DataGeneralModal
        visible={modalGeneralVisible}
        item={currentItem}
        onClose={async () => {
          setModalGeneralVisible(false);
          await leerElementoDesdeSqlite(); // ✅ SOLO actualiza datos generales
        }}


      />

      <DeficiencyModal
        visible={modalDeficiencyVisible}
        deficiency={currentDeficiency}
        userId={user.id}
        selectedItem={selectedItem}
        onSaved={async ({ defId, data, isNew }) => {
          // ✅ si fue NUEVA, ahí sí cambia la lista => refresh
          if (isNew) {
            await refreshList();
            return;
          }

          // ✅ si fue EDICIÓN, patch sin refresh
          if (!defId) return;

          setItems((prev) =>
            prev.map((x) => {
              if (x?.type !== "def") return x;
              if (String(x?.defId) !== String(defId)) return x;

              return {
                ...x,
                data: { ...(x.data ?? {}), ...(data ?? {}) },
              };
            })
          );
        }}
        onClose={() => {
          setModalDeficiencyVisible(false);
          // ✅ NO refresh aquí
        }}
      />


      <ListaTipificaciones
        visible={newDefModalVisible}
        selectedItem={selectedItem}
        onSelect={handleSelectTypification}
        onClose={() => setNewDefModalVisible(false)}
      />

      <Loading visible={loading.active} text={loading.msg} />


      <Modal visible={busy.active} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.20)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              padding: 18,
              borderRadius: 12,
              minWidth: 240,
              alignItems: "center",
            }}
          >
            <ActivityIndicator size="large" color="black" />
            <Text style={{ marginTop: 10, color: "#000", textAlign: "center" }}>
              {busy.msg || "Procesando..."}
            </Text>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },

  // ======================
  // ESTADO (header compacto)
  // ======================
  estadoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: 2,

    paddingVertical: 0,

    marginTop: 10,
    marginBottom: 2,
  },

  estadoLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  estadoLabel: {
    fontSize: 15,
    fontWeight: "700",
    marginRight: 6,
  },

  estadoValue: {
    fontSize: 15,
    fontWeight: "800",
  },

  estadoFinalizado: { color: "#1B8F3A" },
  estadoPendiente: { color: "#D32F2F" },

  estadoBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "#E6E6E6",
  },

  estadoBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#222",
  },

  // ======================
  // Ajustes de separación
  // ======================

  // 🔧 ESTE es el que te elimina el “vacío grande” debajo del estado
  // Si todavía ves mucho espacio, baja a -6 o -8.
  generalCardWrap: {
    marginTop: -6,
  },

  // 🔧 Separación bonita entre card del elemento y primera deficiencia
  afterGeneralSpacer: {
    height: 10,
  },
  defCardTint: {
    borderWidth: 1,
  },

  defCardFinalizada: {
    backgroundColor: "#E8F5E9", // verde suave
    borderColor: "#A5D6A7",
  },

  defCardPendiente: {
    backgroundColor: "#FFEBEE", // rojo suave
    borderColor: "#EF9A9A",
  },

});

