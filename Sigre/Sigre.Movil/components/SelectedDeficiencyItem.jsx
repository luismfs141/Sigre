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
      <Text style={styles.title}>{item.name}</Text>

      {item.data && (
        <Text style={styles.subtitle}>{item.data.detail}</Text>
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
    marginBottom: 8
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
  }
});
