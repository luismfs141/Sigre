import { Alert, Button, Dimensions, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { styles } from "./modalStyles";

export default function ListaDefModal({ visible, defs, usedIds, onSelect, onClose }) {
  const screenHeight = Dimensions.get("window").height;

  // Mapear defs para tener estructura uniforme
  const mappedDefs = defs.map(d => ({
    id: d.TypificationId ?? d.id,
    code: d.Code ?? d.code,
    short: d.Component ?? d.short,
    detail: d.Typification ?? d.detail,
    tableId: d.TableId
  }));

  // Filtrar defs ya usadas
  const available = mappedDefs.filter(d => !usedIds.includes(d.id));

  // Añadir "Sin Deficiencia" solo si no está seleccionada
  const SIN_DEF_ID = 0;
  const hasNoDef = usedIds.includes(SIN_DEF_ID);

  const finalList = hasNoDef
    ? available
    : [{ id: SIN_DEF_ID, code: "0000", short: "Sin Deficiencia", detail: "No se seleccionará ninguna deficiencia" }, ...available];

  const handleSelect = def => {
    console.log("Tipificación seleccionada:", def); // <-- LOG AQUÍ
    if (def.id === SIN_DEF_ID && usedIds.length > 0) {
      Alert.alert(
        "Atención",
        "No puedes seleccionar 'Sin Deficiencia' mientras existan otras deficiencias."
      );
      return;
    }

    if (def.id !== SIN_DEF_ID && hasNoDef) {
      Alert.alert(
        "Atención",
        "No puedes añadir más deficiencias mientras 'Sin Deficiencia' esté seleccionada."
      );
      return;
    }

    onSelect(def);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: screenHeight * 0.8 }]}>
          <ScrollView style={{ flexGrow: 1, marginBottom: 10 }}>
            {finalList.length === 0 ? (
              <Text style={{ padding: 12, fontSize: 16, color: "gray" }}>
                No hay deficiencias disponibles.
              </Text>
            ) : (
              finalList.map(def => (
                <TouchableOpacity key={def.id} onPress={() => handleSelect(def)}>
                  <View style={styles.modalItem}>
                    <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                      {def.code} → {def.short}
                    </Text>
                    <Text style={{ fontSize: 14, color: "#555", marginTop: 4 }}>
                      {def.detail}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          <Button title="Cerrar" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
