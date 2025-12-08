// components/modals/DataModal.jsx
import { Button, Modal, Text, View } from "react-native";
import { styles } from "./modalStyles";

export default function DataModal({ visible, item, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={{ fontSize: 16, fontWeight: "bold" }}>
            Registrar Datos - {item?.name}
          </Text>
          <Text>Formulario de ejemplo...</Text>

          <Button title="Cerrar" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}