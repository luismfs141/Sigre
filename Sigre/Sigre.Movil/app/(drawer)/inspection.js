import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  Button,
  FlatList,
  StyleSheet,
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
import { useFiles } from "../../hooks/useFiles";

export default function Inspection() {
  const { selectedItem, setSelectedTypification, selectedDeficiency, setSelectedDeficiency } = useDatos();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const { fetchFilesByElementAndTypi, deletedFile } = useFiles();
  const { deleteDeficiency, deficienciesForFlatList } = useDeficiency();

  const [items, setItems] = useState([]);
  const [modalGeneralVisible, setModalGeneralVisible] = useState(false);
  const [modalDeficiencyVisible, setModalDeficiencyVisible] = useState(false);
  const [newDefModalVisible, setNewDefModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [currentDeficiency, setCurrentDeficiency] = useState(null);

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
          const existingDefs = await deficienciesForFlatList(
            elementId,
            typeElement
          );

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
     ELIMINAR DEFICIENCIA
     ======================= */
  const handleDeficiencyDeleted = typificationId => {
    if (typificationId == null) return;

    setItems(prev => prev.filter(item => item.defId !== typificationId));
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

    setSelectedDeficiency({ ...item.data, id: item.id, name: item.name });

    setCurrentDeficiency({ ...item.data });
    setModalDeficiencyVisible(true);
  };

  const handleLocalDelete = async (selectedItem) => {
    if (!selectedItem) return;

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
              await deleteDeficiency(selectedItem.defId);
              setModalDeficiencyVisible(false);
              refreshList();
            } catch (err) {
              console.error("❌ Error en handleLocalDelete:", err);
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  const handleSelectTypification = (def) => {
    if (!selectedItem) return;

    const elementId =
      selectedItem.PostInterno ?? selectedItem.VanoInterno ?? selectedItem.SedInterno;

    const typeElement = selectedItem.PostInterno
      ? "POST"
      : selectedItem.VanoInterno
        ? "VANO"
        : "SED";

    const currentDef = {
      detail: def.detail ?? "",
      deficiency: def.deficiency,
      elementId,
      typeElement,
      typificationId: def.id,
      typificationCode: def.code,
      tableId: def.tableId
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
        onDelete={handleLocalDelete}
        onPhotos={(it) => {
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
          onPress={() => setNewDefModalVisible(true)}
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
