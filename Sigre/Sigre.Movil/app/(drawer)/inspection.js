import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Button,
  Dimensions,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DataModal from "../../components/Modal/DataModal";
import ListaDefModal from "../../components/Modal/ListaDefModal";
import PhotoModal from "../../components/Modal/PhotoModal";
import { useDatos } from "../../context/DatosContext";
import { useTypification } from "../../hooks/useTypification";

export default function Inspection() {
  const { selectedItem, selectedProject } = useDatos();
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;
  const router = useRouter();

  const { fetchTypificationsByElement } = useTypification();

  const [items, setItems] = useState([
    {
      id: 0,
      type: "general",
      name: "Datos Generales",
      data: { elementCode: selectedItem?.PostCodigoNodo },
      photos: [],
      audio: null
    }
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [photoOverlayVisible, setPhotoOverlayVisible] = useState(false);
  const [newDefModalVisible, setNewDefModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [availableDefs, setAvailableDefs] = useState([]);
  const [tableId, setTableId] = useState(null);

  // -------------------- Cargar tipificaciones por elemento --------------------
  useEffect(() => {
    if (!selectedItem) return;

    // Determinar tableId según tipo de elemento
    const isPost = selectedItem.PostCodigoNodo?.startsWith("PTO");
    const tid = isPost ? 8 : 9; // 8=Poste, 9=Vano
    setTableId(tid);

    const loadDefs = async () => {
      const defs = await fetchTypificationsByElement(tid);
      setAvailableDefs(defs);

      // Limpiar deficiencias previas del estado items
      setItems(prev => prev.filter(i => i.type !== "def"));
    };

    loadDefs();
  }, [selectedItem]);

  // -------------------- IDs ya usados --------------------
  const usedDefIds = items.filter(i => i.type === "def").map(i => i.defId);

  // -------------------- Agregar nueva deficiencia --------------------
  const addNewDeficiency = (def) => {
    console.log(def);
    const newDef = {
      id: def.id,
      type: "def",
      defId: def.TypificationId ?? def.id,
      name: def.code,
      data: { 
        severity: "",
        detail: def.detail
      },
      photos: [],
      audio: null
    };

    setItems(prev => [...prev, newDef]);
    setNewDefModalVisible(false);
  };
  // -------------------- Render item --------------------
  const renderItem = ({ item }) => (
    <View style={[styles.itemCard, { width: screenWidth }]}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.name}</Text>
        <View style={styles.itemButtons}>
          {/* Botón formulario */}
          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={() => {
              setCurrentItem(item);
              setModalVisible(true);
            }}
          >
            <MaterialIcons name="assignment" size={36} color="#007bff" />
          </TouchableOpacity>

          {/* Botón multimedia */}
          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={() => {
              router.push({
                pathname: "/(drawer)/registerDef",
                params: {
                  id: item.id,
                  name: item.name,
                  severity: item.data?.severity ?? ""
                }
              });
            }}
          >
            <FontAwesome5 name="camera" size={36} color="#28a745" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Datos adicionales */}
      {item.type === "general" && item.data?.elementCode && (
        <Text style={{ marginTop: 4 }}>Código: {item.data.elementCode}</Text>
      )}

      {item.type === "def" && (
        <Text style={{ marginTop: 4 }}>{item.data.detail}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, paddingBottom: insets.bottom }}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Botón nueva deficiencia */}
      <View style={{ padding: 8, backgroundColor: "#fff" }}>
        <Button title="Nueva Deficiencia" onPress={() => setNewDefModalVisible(true)} />
      </View>

      {/* -------------------- MODALS -------------------- */}
      <DataModal
        visible={modalVisible}
        item={currentItem}
        onClose={() => setModalVisible(false)}
      />

      <PhotoModal
        visible={photoOverlayVisible}
        item={currentItem}
        onClose={() => setPhotoOverlayVisible(false)}
      />

      <ListaDefModal
        visible={newDefModalVisible}
        defs={availableDefs.filter(d => !usedDefIds.includes(d.TypificationId ?? d.id))}
        usedIds={usedDefIds}
        onSelect={addNewDeficiency}
        onClose={() => setNewDefModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  itemCard: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: "#f0f0f0",
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  itemTitle: {
    fontWeight: "bold",
    fontSize: 16,
  },
  itemButtons: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    top: "15%"
  },
  buttonWrapper: {
    justifyContent: "center",
    alignItems: "center",
  }
});
