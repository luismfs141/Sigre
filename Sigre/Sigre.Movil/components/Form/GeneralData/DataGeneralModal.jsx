import { useRef } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import PosteForm from "./PosteForm";
import SedForm from "./SedForm";
import VanoForm from "./VanoForm";

export default function DataGeneralModal({ visible, item, onClose, onSave }) {
  if (!item?.data) return null;

  const data = item.data;
  const formRef = useRef(null);

  const handleSave = async () => {
    if (formRef.current?.save) {
      try {
        const savedData = await formRef.current.save();
        onSave?.(savedData);
      } catch (err) {
        console.warn("⚠ Error guardando datos del formulario:", err);
        onSave?.(data); // fallback seguro
      }
    } else {
      onSave?.(data); // fallback
    }
  };

  const isPoste = Object.prototype.hasOwnProperty.call(data, "PostInterno");
  const isVano  = Object.prototype.hasOwnProperty.call(data, "VanoInterno");
  const isSed   = Object.prototype.hasOwnProperty.call(data, "SedInterno");

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>Datos Generales</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flexGrow: 0 }}>
            {isPoste && <PosteForm data={data} visible={visible} ref={formRef} />}
            {isVano && <VanoForm data={data} visible={visible} ref={formRef} />}
            {isSed && <SedForm data={data} visible={visible} ref={formRef} />}
          </ScrollView>

          {/* BOTÓN GUARDAR */}
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.btnSaveCentered} onPress={handleSave}>
              <Text style={styles.btnText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#0008",
    justifyContent: "center",
    padding: 12
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    maxHeight: "90%"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  title: { fontSize: 20, fontWeight: "700" },
  close: { fontSize: 22, fontWeight: "700", color: "#555" },
  buttons: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12
  },
  btnSaveCentered: {
    backgroundColor: "#27ae60",
    padding: 12,
    borderRadius: 8,
    width: "60%", // ancho ajustable
    alignItems: "center"
  },
  btnText: {
    color: "#fff",
    fontWeight: "600"
  }
});
