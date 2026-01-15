import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dimensions,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useTypification } from "../../hooks/useTypification";
import { styles } from "./modalStyles";

export default function ListaTipificaciones({ visible, selectedItem, onSelect, onClose }) {
  const screenHeight = Dimensions.get("window").height;
  const { fetchTypificationsByTypeElement, fetchUsedTypificationsByElement } = useTypification();
  const [typifications, setTypifications] = useState([]);

  const CODES_NO_RETIRAR = ["7004"];
  const [hasSinDeficiencia, setHasSinDeficiencia] = useState(false);
  const [hasOtrasDeficiencias, setHasOtrasDeficiencias] = useState(false);

  useEffect(() => {
    if (!selectedItem || !visible) return;

    const isPoste = !!selectedItem.PostInterno;
    const isVano  = !!selectedItem.VanoInterno;

    const tableId = isPoste ? 8 : 9;
    const typeElement = isPoste ? "POST" : "VANO";
    const elementId = selectedItem.PostInterno ?? selectedItem.VanoInterno;

    const loadTypifications = async () => {
      const baseList = [
        {
          id: 0,
          code: "0000",
          short: "Sin Deficiencia",
          detail: "No se seleccionará ninguna deficiencia",
          deficiency: "Sin Deficiencia"
        }
      ];

      try {
        const allTypifications = (await fetchTypificationsByTypeElement(tableId)) ?? [];

        let used = [];
        try {
          const res = await fetchUsedTypificationsByElement(elementId, typeElement);
          used = Array.isArray(res) ? res : [];
        } catch {
          used = [];
        }

        const _hasSinDef = used.some(u => String(u.Code ?? u.code).trim() === "0000");
        const _hasOtrasDef = used.some(u => String(u.Code ?? u.code).trim() !== "0000");

        setHasSinDeficiencia(_hasSinDef);
        setHasOtrasDeficiencias(_hasOtrasDef);

        const usedIds = used
          .map(u => String(u.TypificationId ?? u.IdTypification ?? u.id))
          .filter(Boolean);

        const available = allTypifications.filter(t => {
          const id = String(t.TypificationId ?? t.IdTypification ?? t.id);
          const code = String(t.Code ?? t.code).trim();
          const estaUsada = usedIds.includes(id);
          const esRepetible = CODES_NO_RETIRAR.includes(code);

          if (code === "0000" && _hasOtrasDef) return false;
          if (code !== "0000" && _hasSinDef) return false;
          if (estaUsada && !esRepetible) return false;

          return true;
        });

        const finalList = [
          ...baseList,
          ...available.map(t => ({
            id: t.TypificationId ?? t.IdTypification ?? t.id,
            code: t.Code ?? t.code,
            short: t.Component ?? "Sin descripción",
            detail: t.Typification ?? "",
            deficiency: t.Deficiency ?? t.Component ?? "Sin descripción",
            tableId: t.TableId
          }))
        ];

        setTypifications(finalList);
      } catch {
        setTypifications(baseList);
      }
    };

    loadTypifications();
  }, [selectedItem, visible]);

  const handleSelect = (def) => {
    const code = String(def.code).trim();

    if (code === "0000" && hasOtrasDeficiencias) {
      Alert.alert(
        "No permitido",
        "Debe eliminar primero las deficiencias existentes para registrar 'Sin Deficiencia'."
      );
      return;
    }

    if (code !== "0000" && hasSinDeficiencia) {
      Alert.alert(
        "No permitido",
        "Debe eliminar primero 'Sin Deficiencia' para registrar una nueva deficiencia."
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
            {typifications.map(def => (
              <TouchableOpacity key={def.id} onPress={() => handleSelect(def)}>
                <View style={styles.modalItem}>
                  <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                    {def.code} → {def.deficiency || def.short || "Sin descripción"}
                  </Text>
                  {!!def.detail && (
                    <Text style={{ fontSize: 14, color: "#555", marginTop: 4 }}>
                      {def.detail}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Button title="Cerrar" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
