import { useEffect, useState } from "react";
import { Button, Dimensions, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useTypification } from "../../hooks/useTypification";
import { styles } from "./modalStyles";

export default function ListaTipificaciones({ visible, selectedItem, onSelect, onClose }) {
  const screenHeight = Dimensions.get("window").height;
  const { fetchTypificationsByTypeElement } = useTypification();
  const [typifications, setTypifications] = useState([]);

  useEffect(() => {
    if (!selectedItem) return;

    const tableId = selectedItem.PostInterno ? 8 : 9;

    const loadTypifications = async () => {
      try {
        // Trae todas las tipificaciones de la base según tableId
        const allTypifications = await fetchTypificationsByTypeElement(tableId);

        // Siempre añadimos "Sin Deficiencia" al inicio
        const finalList = [
          {
            id: 0,
            code: "0000",
            short: "Sin Deficiencia",
            detail: "No se seleccionará ninguna deficiencia",
            deficiency: "Sin Deficiencia"
          },
          ...allTypifications.map(t => ({
            id: t.TypificationId ?? t.id,
            code: t.Code ?? t.code,
            short: t.Component ?? t.short,
            detail: t.Typification ?? t.detail,
            deficiency: t.Deficiency,
            tableId: t.TableId
          }))
        ];

        setTypifications(finalList);
      } catch (err) {
        console.error("❌ Error cargando tipificaciones:", err);
      }
    };

    loadTypifications();
  }, [selectedItem]);

  const handleSelect = def => {
    onSelect(def);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: screenHeight * 0.8 }]}>
          <ScrollView style={{ flexGrow: 1, marginBottom: 10 }}>
            {typifications.length === 0 ? (
              <Text style={{ padding: 12, fontSize: 16, color: "gray" }}>
                No hay tipificaciones disponibles.
              </Text>
            ) : (
              typifications.map(def => (
                <TouchableOpacity key={def.id} onPress={() => handleSelect(def)}>
                  <View style={styles.modalItem}>
                    <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                      {def.code} → {def.deficiency ?? def.short}
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
