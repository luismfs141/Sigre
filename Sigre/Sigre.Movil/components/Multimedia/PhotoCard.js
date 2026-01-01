import { MaterialIcons } from "@expo/vector-icons";
import {
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function PhotoCard({ title, uri, onDelete, onPress }) {
  return (
    <View style={styles.card}>
      <Pressable onPress={onPress}>
        <Image source={{ uri }} style={styles.image} />
      </Pressable>

      <View style={styles.footer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        <Pressable onPress={onDelete}>
          <MaterialIcons name="delete" size={20} color="#d32f2f" />
        </Pressable>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 110,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
    marginRight: 6,
  },
});
