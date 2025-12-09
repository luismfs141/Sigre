// Inspection.jsx
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
import DeficiencyModal from "../../components/Form/Defiencies/DeficiencyModal";
import DataGeneralModal from "../../components/Form/GeneralData/DataGeneralModal";
import ListaDefModal from "../../components/Modal/ListaDefModal";
import PhotoModal from "../../components/Modal/PhotoModal";
import { useDatos } from "../../context/DatosContext";
import { useDeficiency } from "../../hooks/useDeficiency";
import { useTypification } from "../../hooks/useTypification";

export default function Inspection() {
  const { selectedItem } = useDatos();
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;
  const router = useRouter();

  const { fetchTypificationsByTypeElement, fetchTypificationsByElement } = useTypification();
  const { fetchDeficiencyByTypificationElement } = useDeficiency();

  const [items, setItems] = useState([]);
  const [availableDefs, setAvailableDefs] = useState([]);
  const [tableId, setTableId] = useState(null);

  const [modalGeneralVisible, setModalGeneralVisible] = useState(false);
  const [modalDeficiencyVisible, setModalDeficiencyVisible] = useState(false);
  const [photoOverlayVisible, setPhotoOverlayVisible] = useState(false);
  const [newDefModalVisible, setNewDefModalVisible] = useState(false);

  const [currentItem, setCurrentItem] = useState(null);
  const [currentDeficiency, setCurrentDeficiency] = useState(null);

  // Cargar inicial: el primer item siempre datos generales
  useEffect(() => {
    if (!selectedItem) {
      setItems([]);
      return;
    }

    // Detectar ID REAL del elemento
    const elementId =
      selectedItem.PostInterno ??
      selectedItem.VanoInterno ??
      selectedItem.SedInterno ??
      null;

    if (!elementId) {
      console.warn("⚠ No se encontró el ID del elemento");
      setItems([]);
      return;
    }

    const isPost = selectedItem.PostCodigoNodo?.startsWith?.("PTO");
    const tid = isPost ? 8 : 9;
    setTableId(tid);

    const loadDefs = async () => {
      try {
        const defsByType = await fetchTypificationsByTypeElement(tid);
        const defsByElement = await fetchTypificationsByElement(elementId, tid);

        const existingDefs = defsByElement.map(def => ({
          id: def.TypificationId ?? def.id,
          type: "def",
          defId: def.TypificationId ?? def.id,
          name: def.code ?? def.name ?? `Def ${def.TypificationId ?? def.id}`,
          data: {
            detail: def.detail ?? def.description ?? "",
            elementId,
            elementType: tid,
            typificationId: def.TypificationId ?? def.id
          },
          photos: [],
          audio: null
        }));

        const generalItem = {
          id: "general",
          type: "general",
          name: "Datos Generales",
          data: selectedItem,
          photos: [],
          audio: null
        };

        setItems([generalItem, ...existingDefs]);
        setAvailableDefs(defsByType);
      } catch (error) {
        console.error("Error cargando tipificaciones:", error);
      }
    };

    loadDefs();
  }, [selectedItem]);


  // IDs ya usados (para filtrar ListaDefModal)
  const usedDefIds = items.filter(i => i.type === "def").map(i => i.defId);

  // Abrir modal apropiado según tipo del item
  const openFormModal = async (item) => {
    setCurrentItem(item);

    if (item.type === "general") {
      setModalGeneralVisible(true);
      return;
    }

    if (item.type === "def") {
      // Intentar cargar deficiencia asociada a este elemento y tipificación
      try {
        const elementId = item.data.elementId ?? item.data.elementId ?? currentItem?.data?.id ?? null;
        const elementType = item.data.elementType ?? item.data.elementType ?? tableId;
        const typificationId = item.data.typificationId ?? item.defId ?? item.data?.defId;

        const defs = await fetchDeficiencyByTypificationElement(elementId, elementType, typificationId);
        const defToOpen = defs?.[0] ?? null;

        setCurrentDeficiency(defToOpen);
      } catch (err) {
        console.warn("No se pudo cargar la deficiencia:", err);
        setCurrentDeficiency(null);
      }
      setModalDeficiencyVisible(true);
    }
  };

  // Añadir deficiencia desde lista modal (ListaDefModal)
  const addNewDeficiency = (def) => {
    const newDef = {
      id: def.id ?? def.TypificationId,
      type: "def",
      defId: def.TypificationId ?? def.id,
      name: def.code ?? def.name,
      data: {
        detail: def.detail ?? "",
        elementId: selectedItem?.id,
        elementType: tableId,
        typificationId: def.TypificationId ?? def.id
      },
      photos: [],
      audio: null
    };

    setItems(prev => [...prev, newDef]);
    setNewDefModalVisible(false);
  };

  const renderItem = ({ item }) => (
    <View style={[styles.itemCard, { width: screenWidth }]}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.name}</Text>
        <View style={styles.itemButtons}>
          {/* Botón formulario */}
          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={() => openFormModal(item)}
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
      {item.type === "general" && item.data?.PostCodigoNodo && (
        <Text style={{ marginTop: 4 }}>Código: {item.data.PostCodigoNodo}</Text>
      )}
      {item.type === "general" && item.data?.VanoCodigo && (
        <Text style={{ marginTop: 4 }}>Código: {item.data.VanoCodigo}</Text>
      )}
      {item.type === "general" && item.data?.SedCodigo && (
        <Text style={{ marginTop: 4 }}>Código: {item.data.SedCodigo}</Text>
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

      {/* Modales */}
      <DataGeneralModal
        visible={modalGeneralVisible}
        item={currentItem}
        onClose={() => {
          setModalGeneralVisible(false);
          setCurrentItem(null);
        }}
        onSave={(updated) => {
          // Reemplaza item general en la lista si necesitas(sin persistir aquí)
          setItems(prev => prev.map(it => it.type === "general" ? { ...it, data: updated } : it));
          setModalGeneralVisible(false);
        }}
      />

      <DeficiencyModal
        visible={modalDeficiencyVisible}
        onClose={() => {
          setModalDeficiencyVisible(false);
          setCurrentDeficiency(null);
          setCurrentItem(null);
        }}
        deficiency={currentDeficiency}
        item={currentItem}
        onSave={(saved) => {
          // actualizar lista de deficiencias en memoria si quieres
          setItems(prev => {
            const exists = prev.find(p => p.type === "def" && (p.defId === (saved.DefiCodDef ?? saved.DefiInterno)));
            if (exists) {
              return prev.map(p => p === exists ? ({ ...p, data: saved }) : p);
            }
            // si es nueva
            const newEntry = {
              id: saved.DefiInterno ?? Date.now(),
              type: "def",
              defId: saved.DefiCodDef ?? saved.DefiInterno,
              name: saved.DefiCodDef ?? `Def ${saved.DefiInterno}`,
              data: { detail: saved.DefiObservacion ?? "", ...saved },
              photos: [],
              audio: null
            };
            return [...prev, newEntry];
          });
          setModalDeficiencyVisible(false);
        }}
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
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#f8f8f8",
    borderBottomWidth: 1,
    borderColor: "#ddd",
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
  },
  buttonWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8
  }
});
