import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Button, Dimensions, FlatList, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDatos } from "../../context/DatosContext";

export default function Inspection() {
  const { selectedItem } = useDatos();
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;

  if (!selectedItem) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>No hay elemento seleccionado</Text>
      </SafeAreaView>
    );
  }

  const [items, setItems] = useState([
    {
      id: 0,
      type: "general",
      name: "Datos Generales",
      data: { elementCode: selectedItem.ElementCode },
      photos: [],
      audio: null
    },
    { id: 1, type: "def", name: "Deficiencia 1", data: { severity: "Alta" }, photos: [], audio: null },
    { id: 2, type: "def", name: "Deficiencia 2", data: { severity: "Media" }, photos: [], audio: null },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [photoOverlayVisible, setPhotoOverlayVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [newDefModalVisible, setNewDefModalVisible] = useState(false);

  const availableDefs = [
    { id: 1, name: "Deficiencia A" },
    { id: 2, name: "Deficiencia B" },
    { id: 3, name: "Deficiencia C" },
  ];

  const addNewDeficiency = (def) => {
    const newDef = {
      id: Date.now(),
      type: "def",
      name: def?.name || "Sin Deficiencia",
      data: {},
      photos: [],
      audio: null,
    };
    setItems((prev) => [...prev, newDef]);
    setNewDefModalVisible(false);
  };

  const renderItem = ({ item }) => (
    <View style={[styles.itemCard, { width: screenWidth }]}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.name}</Text>
        <View style={styles.itemButtons}>
          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={() => {
              setCurrentItem(item);
              setModalVisible(true);
            }}
          >
            <MaterialIcons name="assignment" size={36} color="#007bff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={() => {
              setCurrentItem(item);
              setPhotoOverlayVisible(true);
            }}
          >
            <FontAwesome5 name="camera" size={36} color="#28a745" />
          </TouchableOpacity>
        </View>
      </View>

      {item.type === "general" && item.data?.elementCode && (
        <Text style={{ marginTop: 4 }}>Código: {item.data.elementCode}</Text>
      )}

      {item.type === "def" && item.data?.severity && (
        <Text style={{ marginTop: 4 }}>Severidad: {item.data.severity}</Text>
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

      <View style={{ padding: 8, backgroundColor: "#fff" }}>
        <Button title="Nueva Deficiencia" onPress={() => setNewDefModalVisible(true)} />
      </View>

      {/* Modales */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>Registrar Datos - {currentItem?.name}</Text>
            <Text>Formulario de ejemplo...</Text>
            <Button title="Cerrar" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>

      <Modal visible={photoOverlayVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>Multimedia - {currentItem?.name}</Text>
            <Text>Tomar hasta 4 fotos y grabar audio</Text>
            <Button title="Cerrar" onPress={() => setPhotoOverlayVisible(false)} />
          </View>
        </View>
      </Modal>

      <Modal visible={newDefModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <TouchableOpacity onPress={() => addNewDeficiency(null)}>
              <Text style={styles.modalItem}>Sin Deficiencia</Text>
            </TouchableOpacity>
            {availableDefs.map((def) => (
              <TouchableOpacity key={def.id} onPress={() => addNewDeficiency(def)}>
                <Text style={styles.modalItem}>{def.name}</Text>
              </TouchableOpacity>
            ))}
            <Button title="Cerrar" onPress={() => setNewDefModalVisible(false)} />
          </ScrollView>
        </View>
      </Modal>
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
    alignItems: "center", // centrado vertical
  },
  itemTitle: {
    fontWeight: "bold",
    fontSize: 16,
  },
  itemButtons: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center", // centrado vertical
    top: "15%"
  },
  buttonWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    margin: 20,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
  },
  modalItem: {
    padding: 12,
    fontSize: 16,
    borderBottomWidth: 0.5,
    borderColor: "#ccc",
  },
});
