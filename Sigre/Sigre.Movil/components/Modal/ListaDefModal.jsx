// components/modals/ListaDefModal.jsx
import { Button, Dimensions, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { styles } from "./modalStyles";

export default function ListaDefModal({ visible, defs, usedIds, onSelect, onClose }) {
  const screenHeight = Dimensions.get("window").height;

  // Mapear defs para tener estructura uniforme
  const mappedDefs = defs.map(d => ({
    id: d.TypificationId ?? d.id,
    code: d.Code ?? d.code,
    short: d.Component ?? d.short,
    detail: d.Typification ?? d.detail,
  }));

  const available = mappedDefs.filter(d => !usedIds.includes(d.id));

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: screenHeight * 0.8 }]}>
          <ScrollView style={{ flexGrow: 1, marginBottom: 10 }}>
            {available.length === 0 ? (
              <Text style={{ padding: 12, fontSize: 16, color: "gray" }}>
                Todas las deficiencias ya fueron seleccionadas.
              </Text>
            ) : (
              available.map(def => (
                <TouchableOpacity key={def.id} onPress={() => onSelect(def)}>
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
