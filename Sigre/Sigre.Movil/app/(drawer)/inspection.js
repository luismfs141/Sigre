import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  Button,
  FlatList,
  Platform,
  StyleSheet,
  ToastAndroid,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import * as FileSystem from "expo-file-system/legacy";

import DeficiencyModal from "../../components/Form/Defiencies/DeficiencyModal";
import DataGeneralModal from "../../components/Form/GeneralData/DataGeneralModal";
import GeneralDataItem from "../../components/GeneralDataItem";
import ListaTipificaciones from "../../components/Modal/ListaTipificaciones";
import SelectedDeficiencyItem from "../../components/SelectedDeficiencyItem";

import { AuthContext } from "../../context/AuthContext";
import { useDatos } from "../../context/DatosContext";
import { useDeficiency } from "../../hooks/useDeficiency";

const APP_MEDIA_DIR = FileSystem.documentDirectory + "SigreMedios/";

export default function Inspection() {
  const { selectedItem, setSelectedDeficiency } = useDatos();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const { deleteDeficiency, deficienciesForFlatList } = useDeficiency();

  const [items, setItems] = useState([]);
  const [modalGeneralVisible, setModalGeneralVisible] = useState(false);
  const [modalDeficiencyVisible, setModalDeficiencyVisible] = useState(false);
  const [newDefModalVisible, setNewDefModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [currentDeficiency, setCurrentDeficiency] = useState(null);

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

    // ✅ Importante: guardar el DefiInterno real
    const defId = item.defId; // = DefiInterno

    setSelectedDeficiency({ ...item.data, id: defId, name: item.name });

    setCurrentDeficiency({
      ...item.data,
      DefiInterno: defId,     // ✅ clave
      id: defId,
      nonce: Date.now()       // opcional, pero ayuda a refrescar UI
    });

    setModalDeficiencyVisible(true);
  };


  /* =======================
      LIMPIEZA FÍSICA
     ======================= */
  const cleanPhysicalFiles = async (defId) => {
    if (!defId) return;

    try {
      const dirInfo = await FileSystem.readDirectoryAsync(APP_MEDIA_DIR);
      const targetString = `_DEF_${defId}`;
      const filesToDelete = dirInfo.filter(filename => filename.includes(targetString));

      await Promise.all(
        filesToDelete.map(file =>
          FileSystem.deleteAsync(APP_MEDIA_DIR + file, { idempotent: true })
        )
      );
    } catch (error) {
      console.warn("⚠️ Error menor limpiando archivos físicos:", error);
    }
  };

  /* =======================
      ELIMINAR DEFICIENCIA
     ======================= */
  const handleLocalDelete = async (itemToDelete) => {
    if (!itemToDelete) return;

    Alert.alert(
      "Eliminar tipificación",
      "⚠️ Está a punto de eliminar esta tipificación y todos los archivos asociados. ¿Desea continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await cleanPhysicalFiles(itemToDelete.defId);
              await deleteDeficiency(itemToDelete.defId);
              setModalDeficiencyVisible(false);
              refreshList();

              if (Platform.OS === 'android') {
                ToastAndroid.show("Deficiencia eliminada correctamente", ToastAndroid.SHORT);
              }
            } catch (err) {
              console.error("❌ Error eliminando deficiencia:", err);
              Alert.alert("Error", "No se pudo eliminar la deficiencia.");
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
        />
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
