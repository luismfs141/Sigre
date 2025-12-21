import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useState } from "react";
import {
  BackHandler,
  Button,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";

import DeficiencyModal from "../../components/Form/Defiencies/DeficiencyModal";
import DataGeneralModal from "../../components/Form/GeneralData/DataGeneralModal";
import ListaDefModal from "../../components/Modal/ListaDefModal";

import { AuthContext } from "../../context/AuthContext";
import { useDatos } from "../../context/DatosContext";
import { useTypification } from "../../hooks/useTypification";

export default function Inspection() {
  const { selectedItem } = useDatos();
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const { fetchTypificationsByTypeElement, fetchTypificationsByElement } =
    useTypification();

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
        const defsByType = await fetchTypificationsByTypeElement(tableId);
        const defsByElement = await fetchTypificationsByElement(
          elementId,
          typeElement
        );

        const usedFromBackend = defsByElement.map(
          d => d.TypificationId ?? d.id
        );
        setUsedTypificationIds(usedFromBackend);

        const hasNone = usedFromBackend.includes(SIN_DEF_ID);
        setHasNoDeficiencySelected(hasNone);

        const existingDefs = defsByElement.map(def => ({
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
          defsByType.map(d => ({
            ...d,
            id: d.TypificationId ?? d.id
          }))
        );
      } catch (err) {
        console.error("Error cargando tipificaciones:", err);
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

    setCurrentDeficiency({
      ...item.data
    });

    setModalDeficiencyVisible(true);
  };

  /* =======================
     RENDER ITEM
     ======================= */
  const renderItem = ({ item }) => (
    <View style={[styles.itemCard, { width: screenWidth }]}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.name}</Text>

        {item.type === "def" && (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(drawer)/registerDef",
                params: {
                  id: item.id,
                  defCode: item.data.typificationCode
                }
              })
            }
          >
            <FontAwesome5 name="camera" size={28} color="#28a745" />
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => openFormModal(item)}>
          <MaterialIcons name="assignment" size={28} color="#007bff" />
        </TouchableOpacity>
      </View>

      {item.type === "def" && (
        <Text style={{ marginTop: 4 }}>{item.data.deficiency}</Text>
      )}
    </View>
  );

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
