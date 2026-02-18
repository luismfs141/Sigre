import { useFocusEffect, useRouter } from "expo-router";
import Loading from "../../components/LoadingOverlay";
import { recalcElementoInspeccionadoLocal } from "../../database/offlineDB/deficiencies";
import { useGap } from "../../hooks/useGap";
import { usePost } from "../../hooks/usePost";

import { useCallback, useContext, useEffect, useState } from "react";
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
  View
} from "react-native";

import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";


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

  const insets = useSafeAreaInsets();
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

const syncElementoInspeccionadoToServer = useCallback(
  async ({ elementId, typeElement, inspected, showUI }) => {
    const eid = Number(elementId);
    const te = String(typeElement || "").trim().toUpperCase();

    try {
      if (te === "POST") {
        const post = await getPostData(eid);
        if (!post) return { ok: false, reason: "No se encontró el poste en SQLite" };

        // ✅ nos aseguramos que el campo esté set (igual ya lo actualizaste en SQLite)
        const payload = {
          ...post,
          PostInspeccionado: Number(inspected) ? 1 : 0,

          // ✅ normalizaciones que tu savePost normalmente espera
          PostTerceros:
            post?.PostTerceros == null || post?.PostTerceros === ""
              ? null
              : Number(post.PostTerceros),

          PostAltura:
            post?.PostAltura == null || post?.PostAltura === ""
              ? null
              : Number(post.PostAltura),
        };

        await savePost(payload);
        return { ok: true };
      }

      if (te === "VANO") {
        const vano = await fetchVanoById(eid);
        if (!vano) return { ok: false, reason: "No se encontró el vano en SQLite" };

        const payload = {
          ...vano,

          // ✅ algunos vienen como Vano_Codigo, acá lo aseguramos
          VanoCodigo: pickVanoCodigo(vano),

          // ✅ NOT NULL en tu BD (según tu form)
          VanoEtiqueta: ensureVanoEtiqueta(vano),

          VanoInspeccionado: Number(inspected) ? 1 : 0,

          VanoTerceros:
            vano?.VanoTerceros == null || vano?.VanoTerceros === ""
              ? null
              : Number(vano.VanoTerceros),
        };

        await saveVano(payload);
        return { ok: true };
      }

      return { ok: false, reason: "typeElement no soportado" };
    } catch (e) {
      console.error("❌ syncElementoInspeccionadoToServer:", e);
      return { ok: false, reason: e?.message ?? String(e) };
    }
  },
  [getPostData, savePost, fetchVanoById, saveVano]
);


  const recalcularInspeccionadoElemento = useCallback(
  async ({ showUI = true } = {}) => {
    const { elementId, typeElement } = getElementoTarget();

    if (!elementId || !typeElement) {
      if (showUI) Alert.alert("No aplica", "Solo aplica para Poste o Vano.");
      return { ok: false };
    }

    if (showUI) setBusy({ active: true, msg: "Actualizando inspección..." });

    try {
      // 1) ✅ recalcula y escribe en SQLITE
      const res = await recalcElementoInspeccionadoLocal(elementId, typeElement);

      if (!res?.ok) {
        if (showUI) Alert.alert("Error", `No se pudo recalcular.\n${res?.reason ?? ""}`);
        return res;
      }

      // 2) ✅ manda al SERVIDOR usando savePost/saveVano (mismo flujo de forms)
      if (showUI) setBusy({ active: true, msg: "Sincronizando con servidor..." });

      const syncRes = await syncElementoInspeccionadoToServer({
        elementId,
        typeElement,
        inspected: res.inspected,
        showUI,
      });

      // 3) UI
      if (showUI) {
        if (syncRes?.ok) {
          if (Platform.OS === "android") {
            ToastAndroid.show("✅ Actualizado y sincronizado", ToastAndroid.SHORT);
          } else {
            Alert.alert("✅ OK", "Actualizado y sincronizado.");
          }
        } else {
          // OJO: si falló server, igual SQLite ya quedó correcto.
          Alert.alert(
            "⚠️ SQLite OK / Server NO",
            `Se actualizó en el equipo pero falló el servidor.\n\n${syncRes?.reason ?? ""}`
          );
        }
      }

      return { ...res, syncOk: !!syncRes?.ok };
    } catch (e) {
      if (showUI) Alert.alert("Error", e?.message ?? "Falló el proceso.");
      return { ok: false };
    } finally {
      if (showUI) setBusy({ active: false, msg: "" });
    }
  },
  [getElementoTarget, syncElementoInspeccionadoToServer]
);





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
      CARGA INICIAL
     ======================= */
  useEffect(() => {
    if (!selectedItem) {
      setItems([]);
      return;
    }

    const elementId =
      selectedItem.PostInterno ?? selectedItem.VanoInterno ?? selectedItem.SedInterno;

    const typeElement = selectedItem.PostInterno
      ? "POST"
      : selectedItem.VanoInterno
        ? "VANO"
        : "SED";

    const loadDefs = async () => {
      try {
        const existingDefs = await deficienciesForFlatList(elementId, typeElement);

        const generalItem = {
          id: "general",
          type: "general",
          name: "Datos Generales",
          data: selectedItem
        };

        setItems([generalItem, ...existingDefs]);
      } catch (err) {
        console.error("❌ Error cargando inspección:", err);
      }
    };

    loadDefs();
  }, [selectedItem]);

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
  useFocusEffect(
    useCallback(() => {
      // al salir de la pantalla (blur/unmount)
      return () => {
        // ⚠️ sin UI ni setState (para no reventar por unmount)
        recalcularInspeccionadoElemento({ showUI: false });
      };
    }, [recalcularInspeccionadoElemento])
  );



  const refreshList = async () => {
    if (!selectedItem) return;

    const elementId =
      selectedItem.PostInterno ?? selectedItem.VanoInterno ?? selectedItem.SedInterno;

    const typeElement = selectedItem.PostInterno
      ? "POST"
      : selectedItem.VanoInterno
        ? "VANO"
        : "SED";

    const existingDefs = await deficienciesForFlatList(elementId, typeElement);

    const generalItem = {
      id: "general",
      type: "general",
      name: "Datos Generales",
      data: selectedItem
    };

    setItems([generalItem, ...existingDefs]);
  };

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
      return (
        <GeneralDataItem
          item={selectedItem}
          onEdit={(it) => openFormModal({ ...item, data: it })}
        />
      );
    }

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
      />
    );

  };

  return (
    <SafeAreaView style={{ flex: 1, paddingBottom: insets.bottom }}>
      <FlatList
        data={items}
        keyExtractor={item =>
          item.type === "def" ? item.defId.toString() : item.id.toString()
        }
        renderItem={renderItem}
      />

      <View style={{ padding: 8, flexDirection: "row" }}>
        <View style={{ flex: 1, marginRight: 8 }}>
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

        <View style={{ width: 120 }}>
          <Button
            title="Actualizar"
            onPress={() => recalcularInspeccionadoElemento({ showUI: true })}
            disabled={busy.active || !selectedItem || !(selectedItem.PostInterno || selectedItem.VanoInterno)}
          />
        </View>
      </View>


      <DataGeneralModal
        visible={modalGeneralVisible}
        item={currentItem}
        onClose={() => setModalGeneralVisible(false)}
      />

      <DeficiencyModal
        visible={modalDeficiencyVisible}
        deficiency={currentDeficiency}
        userId={user.id}
        selectedItem={selectedItem}
        onClose={() => {
          setModalDeficiencyVisible(false);
          refreshList();
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
  itemCard: {
    padding: 12,
    backgroundColor: "#f8f8f8",
    borderBottomWidth: 1,
    borderColor: "#ddd"
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "bold"
  }
});
