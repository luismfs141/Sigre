// DataGeneralModal.jsx
import { Button, Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import PosteForm from "./PosteForm";
import SedForm from "./SedForm";
import VanoForm from "./VanoForm";

export default function DataGeneralModal({ visible, item, onClose, onSave }) {
  if (!item?.data) return null;
  const data = item.data;

  const isPoste = Object.prototype.hasOwnProperty.call(data, "PostInterno");
  const isVano = Object.prototype.hasOwnProperty.call(data, "VanoInterno");
  const isSed = Object.prototype.hasOwnProperty.call(data, "SedInterno");

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView>
            <Text style={styles.title}>Datos Generales</Text>

            {isPoste && <PosteForm data={data} onSave={onSave} />}
            {isVano && <VanoForm data={data} onSave={onSave} />}
            {isSed && <SedForm data={data} onSave={onSave} />}
          </ScrollView>

          <Button title="Cerrar" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 16
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    maxHeight: "88%"
  },
  title: {
    fontWeight: "bold",
    fontSize: 20,
    marginBottom: 12
  }
});
