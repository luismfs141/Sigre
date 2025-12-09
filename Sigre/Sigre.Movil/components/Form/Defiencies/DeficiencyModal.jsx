import { useRef } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useDeficiency } from "../../../hooks/useDeficiency";
import Form6002 from "./Form6002";
import Form6004 from "./Form6004";
import Form6024 from "./Form6024";
import Form7002 from "./Form7002";

const codeForms = {
  "6002": Form6002,
  "6004": Form6004,
  "6024": Form6024,
  "7002": Form7002,
};

export default function DeficiencyModal({ visible, onClose, onSave, deficiency }) {
  const formRef = useRef(null);
  const { saveDeficiency } = useDeficiency();

  const Code = deficiency?.DefiCodigoElemento ?? null;
  const FormComponent = Code ? codeForms[Code] : null;

  /**
   * 🚀 GUARDA → Llama al save() del formulario → Luego guarda en BD offline
   */
  const handleSave = async () => {
    try {
      let dataForSave = deficiency;

      // 📌 si el formulario implementa save(), lo usamos
      if (formRef.current?.save) {
        dataForSave = await formRef.current.save();
      }

      // 📌 Guardar en BD offline
      const savedId = await saveDeficiency(dataForSave);

      if (savedId) {
        const finalData = { ...dataForSave, DefiInterno: savedId };

        // 📌 Notificamos a la pantalla superior
        onSave?.(finalData);
      } else {
        console.warn("⚠ No se pudo guardar la deficiencia");
      }
    } catch (error) {
      console.error("❌ Error en handleSave:", error);
    }
  };

  if (!visible || !FormComponent) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView>
            <Text style={styles.title}>Deficiencia {Code}</Text>
            <FormComponent ref={formRef} data={deficiency} />
          </ScrollView>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
              <Text style={styles.btnText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnSave} onPress={handleSave}>
              <Text style={styles.btnText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "#0008", justifyContent: "center", padding: 12 },
  container: { backgroundColor: "#fff", borderRadius: 12, padding: 12, maxHeight: "90%" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 10 },
  buttons: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  btnCancel: { backgroundColor: "#c0392b", padding: 12, borderRadius: 8, width: "48%", alignItems: "center" },
  btnSave: { backgroundColor: "#27ae60", padding: 12, borderRadius: 8, width: "48%", alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "600" }
});
