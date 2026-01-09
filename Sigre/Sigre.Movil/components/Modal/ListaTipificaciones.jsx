import { useEffect, useState } from "react";
import { Button, Dimensions, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useTypification } from "../../hooks/useTypification";
import { styles } from "./modalStyles";

export default function ListaTipificaciones({ visible, selectedItem, onSelect, onClose }) {
  const screenHeight = Dimensions.get("window").height;
  const { fetchTypificationsByTypeElement, fetchUsedTypificationsByElement } = useTypification();
  const [typifications, setTypifications] = useState([]);

  const CODES_NO_RETIRAR = ["7004"];

  useEffect(() => {
    if (!selectedItem || !visible) return;

    const tableId = selectedItem.PostInterno ? 8 : 9;
    const typeElement = selectedItem.PostInterno ? "POST" : "VANO";

    const loadTypifications = async () => {
      try {
        // 1. Todas las tipificaciones
        const allTypifications = await fetchTypificationsByTypeElement(tableId);

        // 2. Tipificaciones ya usadas por el elemento
        const used = await fetchUsedTypificationsByElement(
          selectedItem.PostInterno,
          typeElement
        );

        // 3. Obtener IDs usados (normalizados)
        const usedIds = used.map(u =>
          String(u.TypificationId ?? u.IdTypification ?? u.id)
        );

        // 4. Filtrar aplicando la lista manual
        const available = allTypifications.filter(t => {
          const id = String(t.TypificationId ?? t.IdTypification ?? t.id);
          const code = String(t.Code ?? t.code);

          const estaUsada = usedIds.includes(id);
          const noDebeRetirarse = CODES_NO_RETIRAR.includes(code);

          // Regla:
          // - Si está usada → se quita
          // - EXCEPTO si su código está en CODES_NO_RETIRAR
          if (estaUsada && !noDebeRetirarse) {
            return false;
          }

          return true;
        });

        // 5. Armar lista final
        const finalList = [
          {
            id: 0,
            code: "0000",
            short: "Sin Deficiencia",
            detail: "No se seleccionará ninguna deficiencia",
            deficiency: "Sin Deficiencia"
          },
          ...available.map(t => ({
            id: t.TypificationId ?? t.IdTypification ?? t.id,
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
  }, [selectedItem, visible]); // 🔥 CLAVE: ahora se recarga cada vez que se abre el modal

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
