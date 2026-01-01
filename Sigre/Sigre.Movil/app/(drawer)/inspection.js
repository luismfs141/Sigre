import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useState } from "react";
import {
  Alert, BackHandler,
  Button,
  Dimensions,
  FlatList,
  StyleSheet,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import DeficiencyModal from "../../components/Form/Defiencies/DeficiencyModal";
import DataGeneralModal from "../../components/Form/GeneralData/DataGeneralModal";
import GeneralDataItem from "../../components/GeneralDataItem";
import ListaDefModal from "../../components/Modal/ListaDefModal";
import SelectedTypificationItem from "../../components/SelectedTypificationItem";
"../../components/GeneralDataItem";

import { AuthContext } from "../../context/AuthContext";
import { useDatos } from "../../context/DatosContext";
import { useDeficiency } from "../../hooks/useDeficiency";
import { useFiles } from "../../hooks/useFiles";
import { useTypification } from "../../hooks/useTypification";

export default function Inspection() {
  const { selectedItem, setSelectedTypification } = useDatos();
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const {
    fetchUsedTypificationsByElement,
    fetchAvailableTypificationsForElement
  } = useTypification();
  const { fetchFilesByElementAndTypi, deletedFile } = useFiles();
  const { fetchDeficienciesByElementAndTypi, deleteDeficiency } = useDeficiency();

  const [items, setItems] = useState([]);
  const [availableDefs, setAvailableDefs] = useState([]);
  const [usedTypificationIds, setUsedTypificationIds] = useState([]);

  const [modalGeneralVisible, setModalGeneralVisible] = useState(false);
  const [modalDeficiencyVisible, setModalDeficiencyVisible] = useState(false);
  const [newDefModalVisible, setNewDefModalVisible] = useState(false);

  const [currentItem, setCurrentItem] = useState(null);
  const [currentDeficiency, setCurrentDeficiency] = useState(null);

  const [hasNoDeficiencySelected, setHasNoDeficiencySelected] = useState(false);

  const SIN_DEF_ID = 0;

  /* =======================
     CARGA INICIAL
     ======================= */
  useEffect(() => {
    if (!selectedItem) {
      setItems([]);
      setUsedTypificationIds([]);
      setHasNoDeficiencySelected(false);
      return;
    }

    const elementId =
      selectedItem.PostInterno ??
      selectedItem.VanoInterno ??
      selectedItem.SedInterno;

    const typeElement = selectedItem.PostInterno
      ? "POST"
      : selectedItem.VanoInterno
        ? "VANO"
        : "SED";

    const isPost = selectedItem.PostCodigoNodo?.startsWith?.("PTO");
    const tableId = isPost ? 8 : 9;

    const loadDefs = async () => {
      try {
        const usedTypifications =
          await fetchUsedTypificationsByElement(elementId, typeElement);
        console.log("✅ usedTypifications:", usedTypifications);

        const availableTypifications =
          await fetchAvailableTypificationsForElement(
            tableId,
            elementId,
            typeElement
          );

        const usedIds = usedTypifications.map(
          t => t.TypificationId ?? t.id
        );

        setUsedTypificationIds(usedIds);
        setHasNoDeficiencySelected(usedIds.includes(SIN_DEF_ID));

        const existingDefs = usedTypifications.map(def => ({
          id: def.TypificationId,
          type: "def",
          defId: def.TypificationId,
          name: `${def.Code}→${def.Component}`,
          data: {
            detail: def.Typification,
            deficiency: def.Deficiency,
            elementId,
            typeElement,
            typificationId: def.TypificationId,
            typificationCode: def.Code,


            tableId
          },
          photos: [],
          audio: null
        }));



        const generalItem = {
          id: "general",
          type: "general",
          name: "Datos Generales",
          data: selectedItem
        };

        setItems([generalItem, ...existingDefs]);
        setAvailableDefs(
          availableTypifications.map(d => ({
            ...d,
            id: d.TypificationId ?? d.id
          }))
        );
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
      const sub = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
      return () => sub.remove();
    }, [])
  );

  /* =======================
     AGREGAR DEFICIENCIA
     ======================= */
  const addNewDeficiency = def => {
    const elementId =
      selectedItem.PostInterno ??
      selectedItem.VanoInterno ??
      selectedItem.SedInterno;

    const typeElement = selectedItem.PostInterno
      ? "POST"
      : selectedItem.VanoInterno
        ? "VANO"
        : "SED";

    const typificationId = def.id;

    const hasOtherDefs =
      usedTypificationIds.filter(id => id !== SIN_DEF_ID).length > 0;

    if (typificationId === SIN_DEF_ID && hasOtherDefs) {
      alert(
        "No puedes seleccionar 'Sin Deficiencia' mientras existan otras deficiencias."
      );
      return;
    }

    if (typificationId !== SIN_DEF_ID && hasNoDeficiencySelected) {
      alert(
        "No puedes añadir más deficiencias mientras 'Sin Deficiencia' esté seleccionada."
      );
      return;
    }

    const newDef = {
      id: typificationId,
      type: "def",
      defId: typificationId,
      name: `${def.code}→${def.short}`,
      data: {
        detail: def.detail ?? "",
        deficiency: def.deficiency,
        elementId,
        typeElement,
        typificationId,
        typificationCode: def.code,
        tableId: def.tableId
      },
      photos: [],
      audio: null
    };

    setItems(prev => [...prev, newDef]);
    setUsedTypificationIds(prev => [...prev, typificationId]);

    if (typificationId === SIN_DEF_ID) {
      setHasNoDeficiencySelected(true);
    }

    setNewDefModalVisible(false);
  };

  /* =======================
     ELIMINAR DEFICIENCIA
     ======================= */
  const handleDeficiencyDeleted = typificationId => {
    if (typificationId == null) return;

    console.log(selectedItem);

    setItems(prev =>
      prev.filter(item => item.defId !== typificationId)
    );

    setUsedTypificationIds(prev =>
      prev.filter(id => id !== typificationId)
    );

    if (typificationId === SIN_DEF_ID) {
      setHasNoDeficiencySelected(false);
    }

    setModalDeficiencyVisible(false);
  };

  /* =======================
     ABRIR MODAL
     ======================= */
  const openFormModal = item => {
    setCurrentItem(item);

    if (item.type === "general") {
      setModalGeneralVisible(true);
      return;
    }

    setSelectedTypification({
      ...item.data,
      id: item.id,
      name: item.name
    });

    setCurrentDeficiency({
      ...item.data
    });

    setModalDeficiencyVisible(true);
  };

  const handleLocalDelete = async (selectedItem) => {
    if (!selectedItem) return;

    const elementId = selectedItem.data.elementId;
    const typeElement = selectedItem.data.typeElement;
    const typificationId = selectedItem.data.typificationId;

    if (!elementId || !typeElement || !typificationId) return;

    // 🔹 Mensaje de advertencia
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
              // -------------------- Eliminar archivos asociados --------------------
              const archivos = await fetchFilesByElementAndTypi(elementId, typeElement, typificationId);
              if (archivos.length) {
                for (const archivo of archivos) {
                  await deletedFile(archivo.ArchInterno);
                  console.log(`🗑 Archivo ${archivo.ArchInterno} eliminado correctamente`);
                }
              }

              // -------------------- Obtener y eliminar la deficiencia --------------------
              const deficiencias = await fetchDeficienciesByElementAndTypi(
                elementId,
                typeElement,
                typificationId
              );

              if (deficiencias.length) {
                const def = deficiencias[0]; // asumimos la primera si hay varias
                const defiInterno = def.DefiInterno;

                const deleted = await deleteDeficiency(defiInterno);
                if (!deleted) {
                  console.error(`❌ No se pudo eliminar la deficiencia con DefiInterno ${defiInterno}`);
                }
              } else {
                console.warn(`⚠ No se encontró deficiencia para elementId ${elementId} y typificationId ${typificationId}`);
              }

              // -------------------- Actualizar estado local --------------------
              setItems(prev => prev.filter(i => i.defId !== typificationId));
              setUsedTypificationIds(prev => prev.filter(id => id !== typificationId));

              if (typificationId === SIN_DEF_ID) {
                setHasNoDeficiencySelected(false);
              }

              setModalDeficiencyVisible(false);

              console.log(`✅ Tipificación ${typificationId} y archivos asociados eliminados correctamente`);
            } catch (err) {
              console.error("❌ Error en handleLocalDelete:", err);
            }
          }
        }
      ],
      { cancelable: true }
    );
  };


  /* =======================
     RENDER ITEM
     ======================= */
  const renderItem = ({ item }) => {
    // 🔹 DATOS GENERALES (igual que antes)
    if (item.type === "general") {
      return (
        <GeneralDataItem
          item={selectedItem}
          onEdit={(it) => openFormModal({ ...item, data: it })}
        />
      );
    }

      // 🔹 TIPIFICACIÓN SELECCIONADA (NUEVO COMPONENTE)
      return (
        <SelectedTypificationItem
          item={item}
          onDelete={handleLocalDelete}
          onPhotos={(it) => {
            setSelectedTypification({
              ...it.data,
              id: it.id,
              name: it.name
            });
            //router.push("/(drawer)/registerDef");
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
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
      />

      <View style={{ padding: 8 }}>
        <Button
          title="Nueva Deficiencia"
          onPress={() => setNewDefModalVisible(true)}
          disabled={hasNoDeficiencySelected}
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
        onDelete={handleDeficiencyDeleted}
        onClose={() => setModalDeficiencyVisible(false)}
      />

      <ListaDefModal
        visible={newDefModalVisible}
        defs={availableDefs}
        usedIds={usedTypificationIds}
        onSelect={addNewDeficiency}
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
