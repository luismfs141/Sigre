import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function AudioCard({ title, duration, onDelete }) {
  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <MaterialIcons name="mic" size={22} color="#2e7d32" />
        <Text style={styles.title}>{title}</Text>
      </View>

      <Pressable onPress={onDelete}>
        <MaterialIcons name="delete" size={20} color="#d32f2f" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  info: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
  },
});
