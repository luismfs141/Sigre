import { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import sedIcon from "../assets/feederMap.png";
import { useDatos } from "../context/DatosContext";
import { useSed } from "../hooks/useSed";

export const DropDownSed = ({ onSelectSed }) => {
  const { checkDatabase } = useDatos();
  const { fetchAllSedsLocal } = useSed(); // 👈 usar el hook, no la DB directa

  const [modalVisible, setModalVisible] = useState(false);
  const [seds, setSeds] = useState([]);
  const [loading, setLoading] = useState(false);

  const openModal = async () => {
    //console.log("🟡 DropDownSed -> openModal");

    // 🔹 Validar y asegurar DB abierta
    const dbOk = await checkDatabase();
    if (!dbOk) {
      Alert.alert("Atención", "Primero debes descargar y abrir el modelo offline.");
      return;
    }

    setModalVisible(true);
    setLoading(true);

    try {
      //console.log("📦 DropDownSed -> Cargando SEDs desde hook...");
      const localSeds = await fetchAllSedsLocal(); // 👈 desde el hook

      if (!localSeds || localSeds.length === 0) {
        //console.warn("⚠ DropDownSed -> No se encontraron SEDs");
        setSeds([]);
      } else {
        //console.log("✅ DropDownSed -> SEDs recibidas:", localSeds.length);
        setSeds(localSeds);
      }
    } catch (err) {
      //console.error("❌ DropDownSed -> Error cargando SEDs:", err);
      setSeds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (sed) => {
    //console.log("📌 DropDownSed -> SED seleccionada:", sed?.SedInterno);
    onSelectSed(sed);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity style={styles.floatBtn} onPress={openModal}>
        <Image source={sedIcon} style={styles.btnImg} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Selecciona una SED</Text>

            {loading ? (
              <Text style={styles.loadingText}>Cargando...</Text>
            ) : seds.length === 0 ? (
              <Text style={styles.emptyText}>No hay SEDs disponibles</Text>
            ) : (
              <FlatList
                data={seds}
                keyExtractor={(item, index) =>
                  item?.SedInterno
                    ? item.SedInterno.toString()
                    : `sed-${index}`
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.item}
                    onPress={() => handleSelect(item)}
                  >
                    <Text style={styles.itemText}>
                      {item?.SedCodigo || "Sin etiqueta"}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatBtn: {
    position: "absolute",
    top: "2%",
    right: "74%",
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: "#e77d29ff",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
    elevation: 5
  },
  btnImg: { width: 22, height: 22, resizeMode: "contain" },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  modalContainer: {
    width: "85%",
    maxHeight: "70%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15
  },
  modalTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center"
  },
  item: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee"
  },
  itemText: { fontSize: 16, color: "#333" },
  loadingText: { textAlign: "center", padding: 10, color: "#555" },
  emptyText: { textAlign: "center", padding: 10, color: "#999" },
  closeButton: {
    marginTop: 10,
    paddingVertical: 10,
    backgroundColor: "#ddd",
    borderRadius: 6,
    alignItems: "center"
  },
  closeText: { fontSize: 16, fontWeight: "bold", color: "#333" }
});
