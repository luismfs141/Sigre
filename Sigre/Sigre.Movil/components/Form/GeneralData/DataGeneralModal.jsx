// DataGeneralModal.jsx
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import PosteForm from "./PosteForm";
import SedForm from "./SedForm";
import VanoForm from "./VanoForm";

export default function DataGeneralModal({ visible, item, onClose, onSave }) {
  if (!item?.data) return null;

  const data = item.data;

  const isPoste = Object.prototype.hasOwnProperty.call(data, "PostInterno");
  const isVano  = Object.prototype.hasOwnProperty.call(data, "VanoInterno");
  const isSed   = Object.prototype.hasOwnProperty.call(data, "SedInterno");

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>

          <ScrollView style={{ flexGrow: 0 }}>
            <Text style={styles.title}>Datos Generales</Text>

            {isPoste && <PosteForm data={data} onSave={onSave} />}
            {isVano && <VanoForm data={data} onSave={onSave} />}
            {isSed && <SedForm data={data} onSave={onSave} />}
          </ScrollView>

          {/* 🔥 Botones estilo profesional */}
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
              <Text style={styles.btnText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnSave} onPress={onSave}>
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
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10
  },

  // 🔥 Botones del estilo que quieres
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12
  },
  btnCancel: {
    backgroundColor: "#c0392b",
    padding: 12,
    borderRadius: 8,
    width: "48%",
    alignItems: "center"
  },
  btnSave: {
    backgroundColor: "#27ae60",
    padding: 12,
    borderRadius: 8,
    width: "48%",
    alignItems: "center"
  },
  btnText: {
    color: "#fff",
    fontWeight: "600"
  }
});
