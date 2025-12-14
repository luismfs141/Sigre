// Inspection.jsx
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { BackHandler } from "react-native";

import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";

import {
  Button,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import DeficiencyModal from "../../components/Form/Defiencies/DeficiencyModal";
import DataGeneralModal from "../../components/Form/GeneralData/DataGeneralModal";
import ListaDefModal from "../../components/Modal/ListaDefModal";

import { useDatos } from "../../context/DatosContext";
import { useTypification } from "../../hooks/useTypification";

export default function Inspection() {
  const { selectedItem } = useDatos();
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;
  const router = useRouter();

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

  // Estados auxiliares para "Sin Deficiencia"
  const [hasNoDeficiencySelected, setHasNoDeficiencySelected] = useState(false);
  const [hasAnyDeficiencySelected, setHasAnyDeficiencySelected] = useState(false);

  useEffect(() => {
    if (!selectedItem) {
      setItems([]);
      setUsedTypificationIds([]);
      return;
    }

    const elementId =
      selectedItem.PostInterno ?? selectedItem.VanoInterno ?? selectedItem.SedInterno;

    const typeElement =
      selectedItem.PostInterno
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

        // Tipificaciones YA USADAS desde backend
        const usedFromBackend = defsByElement.map(d => d.TypificationId ?? d.id);
        setUsedTypificationIds(usedFromBackend);

        // Verificar si hay "Sin Deficiencia"
        const hasNone = defsByElement.some(d => d.Code === "none");
        setHasNoDeficiencySelected(hasNone);
        setHasAnyDeficiencySelected(defsByElement.length > 0 && !hasNone);

        // Deficiencias existentes
        const existingDefs = defsByElement.map(def => ({
          id: def.TypificationId,
          type: "def",
          defId: def.TypificationId,
          name: def.Code,
          data: {
            detail: def.Typification,
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
        setAvailableDefs(defsByType);
      } catch (err) {
        console.error("Error cargando tipificaciones:", err);
      }
    };

    loadDefs();
  }, [selectedItem]);


  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace("/(drawer)/map"); // 👈 vuelve SIEMPRE al mapa
        return true;
      };


      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => {
        subscription.remove(); // ✅ forma moderna
      };
    }, [])
  );


  // IDs ya usados (para filtrar ListaDefModal)
  const usedDefIds = items.filter(i => i.type === "def").map(i => i.defId);
  // Agregar nueva deficiencia
  const addNewDeficiency = def => {
  const elementId =
    selectedItem.PostInterno ?? selectedItem.VanoInterno ?? selectedItem.SedInterno;

  const typeElement = selectedItem.PostInterno
    ? "POST"
    : selectedItem.VanoInterno
    ? "VANO"
    : "SED";

  const typificationId = def.TypificationId ?? def.id;

  // 🔹 Validar reglas de "Sin Deficiencia"
  const SIN_DEF_ID = "SIN_DEF";
  const hasNoDef = usedTypificationIds.includes(SIN_DEF_ID);
  const hasOtherDefs = usedTypificationIds.filter(id => id !== SIN_DEF_ID).length > 0;

  if (def.id === SIN_DEF_ID && hasOtherDefs) {
    alert("No puedes seleccionar 'Sin Deficiencia' mientras existan otras deficiencias.");
    return;
  }

  if (def.id !== SIN_DEF_ID && hasNoDef) {
    alert("No puedes añadir más deficiencias mientras 'Sin Deficiencia' esté seleccionada.");
    return;
  }

  const newDef = {
    id: typificationId,
    type: "def",
    defId: typificationId,
    name: def.code,
    data: {
      detail: def.detail ?? "",
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

  // Marcar como usada
  setUsedTypificationIds(prev => [...prev, def.id]);

  setNewDefModalVisible(false);
};


  // Abrir modal de formulario
  const openFormModal = item => {
    setCurrentItem(item);

    if (item.type === "general") {
      setModalGeneralVisible(true);
      return;
    }

    setCurrentDeficiency({
      DefiCodigoElemento: item.data.typificationCode,
      ...item.data
    });

    setModalDeficiencyVisible(true);
  };

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
            <FontAwesome5 name="camera" size={32} color="#28a745" />
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => openFormModal(item)}>
          <MaterialIcons name="assignment" size={32} color="#007bff" />
        </TouchableOpacity>
      </View>

      {item.type === "def" && (
        <Text style={{ marginTop: 4 }}>{item.data.detail}</Text>
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
        onClose={() => setModalDeficiencyVisible(false)}
      />

      <ListaDefModal
        visible={newDefModalVisible}
        defs={availableDefs}
        usedIds={usedTypificationIds}
        hasNoDeficiencySelected={hasNoDeficiencySelected}
        hasAnyDeficiencySelected={hasAnyDeficiencySelected}
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
