import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function SelectedDeficiencyItem({
  item,
  onDelete,
  onPhotos,
  onDeficiency
}) {
  return (
    <View style={styles.card}>
      {/* 🔹 Título */}
      <Text style={styles.title} numberOfLines={2}>
        {item.name}
      </Text>


      {item.data && (
        <View style={styles.infoBlock}>
          <Text style={styles.subtitle} numberOfLines={2}>
            <Text style={styles.labelInline}>Observación: </Text>
            {item.data.observacion?.trim() ? item.data.observacion : "-"}
          </Text>

          <Text style={styles.subtitle} numberOfLines={2}>
            <Text style={styles.labelInline}>Comentario: </Text>
            {item.data.comentario?.trim() ? item.data.comentario : "-"}
          </Text>

          <Text style={styles.subtitle}>
            <Text style={styles.labelInline}>Dist. vertical: </Text>
            {item.data.distVertical ?? 0}
            {"   "}
            <Text style={styles.labelInline}>Dist. horizontal: </Text>
            {item.data.distHorizontal ?? 0}
          </Text>
        </View>
      )}


      {/* 🔹 BOTONES */}
      <View style={styles.actions}>
        {/* 🗑 ELIMINAR */}
        <Pressable
          style={[styles.button, styles.delete]}
          onPress={() => onDelete(item)}
        >
          <MaterialIcons name="delete" size={18} color="#d32f2f" />
          <Text style={styles.deleteText}>Eliminar</Text>
        </Pressable>

        {/* 📷 FOTOS */}
        <Pressable
          style={styles.button}
          onPress={() => onPhotos(item)}
        >
          <MaterialIcons name="photo-camera" size={18} color="#1976d2" />
          <Text style={styles.actionText}>Fotos</Text>
        </Pressable>

        {/* ⚠ DEFICIENCIA */}
        <Pressable
          style={styles.button}
          onPress={() => onDeficiency(item)}
        >
          <MaterialIcons name="warning" size={18} color="#ed6c02" />
          <Text style={styles.actionText}>Def.</Text>
        </Pressable>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    elevation: 2
  },
  title: {
    fontWeight: "600",
    fontSize: 15
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2
  },

  actions: {
    flexDirection: "row",
    marginTop: 8
  },
  button: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 6
  },
  delete: {
    borderRightWidth: 1,
    borderColor: "#eee"
  },
  deleteText: {
    fontSize: 12,
    color: "#d32f2f",
    marginTop: 2
  },
  actionText: {
    fontSize: 12,
    marginTop: 2
  },
  infoBlock: {
    marginTop: 4,
    marginBottom: 8
  },
  labelInline: {
    fontWeight: "700",
    color: "#666"
  },

});
