// components/modals/PhotoModal.jsx
import { Button, Modal, Text, View } from "react-native";
import { styles } from "./modalStyles";

export default function PhotoModal({ visible, item, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={{ fontSize: 16, fontWeight: "bold" }}>
            Multimedia - {item?.name}
          </Text>

          <Text>Tomar hasta 4 fotos y grabar audio</Text>

          <Button title="Cerrar" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}