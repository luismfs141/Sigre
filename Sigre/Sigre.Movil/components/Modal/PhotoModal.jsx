// // components/modals/PhotoModal.jsx
// import { Button, Modal, Text, View } from "react-native";
// import { styles } from "./modalStyles";

// export default function PhotoModal({ visible, item, onClose }) {
//   return (
//     <Modal visible={visible} transparent animationType="slide">
//       <View style={styles.modalOverlay}>
//         <View style={styles.modalContent}>
//           <Text style={{ fontSize: 16, fontWeight: "bold" }}>
//             Multimedia - {item?.name}
//           </Text>

//           <Text>Tomar hasta 4 fotos y grabar audio</Text>

//           <Button title="Cerrar" onPress={onClose} />
//         </View>
//       </View>
//     </Modal>
//   );
// }


// components/Modal/PhotoModal.jsx
import { Alert, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function PhotoModal({
  visible,
  uri,
  title = "Foto",
  onClose,
  onReplace,
  onDelete
}) {
  const confirmDelete = () => {
    Alert.alert(
      "Eliminar foto",
      "¿Seguro que deseas eliminar esta foto?",
      [
        // ✅ NO usamos "Cancelar", usamos "Volver"
        { text: "Volver", style: "cancel" },

        // ✅ Eliminar
        { text: "Sí, eliminar", style: "destructive", onPress: onDelete }
      ],
      { cancelable: true } // ✅ Android: tocar fuera / back cierra el alert
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose} // ✅ Back Android = cerrar (igual que Cerrar)
    >
      <View style={s.overlay}>
        {/* 🗑 Eliminar arriba a la derecha (con fondo para evitar misclick) */}
        <TouchableOpacity style={s.deleteBtn} onPress={confirmDelete} activeOpacity={0.8}>
          <Text style={s.deleteTxt}>🗑</Text>
        </TouchableOpacity>

        {/* Imagen */}
        <Image source={{ uri }} style={s.image} />

        {/* Acciones abajo: Reemplazar / Cerrar (más separados) */}
        <View style={s.bottomBar}>
          <Text style={s.title}>{title}</Text>

          <View style={s.actionsRow}>
            <TouchableOpacity style={s.actionBtn} onPress={onReplace} activeOpacity={0.85}>
              <Text style={s.actionTxt}>Reemplazar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.actionBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={s.actionTxt}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center"
  },

  // ✅ Botón eliminar bien “arriba a la derecha” y con fondo
  deleteBtn: {
    position: "absolute",
    top: 44,
    right: 16,
    zIndex: 50,
    padding: 12,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)"
  },
  deleteTxt: {
    color: "white",
    fontSize: 20,
    fontWeight: "900"
  },

  image: {
    width: "100%",
    height: "78%",
    resizeMode: "contain"
  },

  bottomBar: {
    width: "100%",
    paddingHorizontal: 16,
    paddingBottom: 22,
    paddingTop: 10
  },
  title: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16
  },

  // ✅ Más separación entre botones
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 28
  },
  actionBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center"
  },
  actionTxt: {
    fontWeight: "800"
  }
});
