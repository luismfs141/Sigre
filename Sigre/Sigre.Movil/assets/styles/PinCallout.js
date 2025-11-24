import { StyleSheet, Text, View } from "react-native";

export default function PinCallout({ pin }) {
  if (!pin) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{pin.label}</Text>
      {pin.codigo && <Text style={styles.code}>Código: {pin.codigo}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderColor: "#333",
    borderWidth: 1,
    minWidth: 120,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
  },
  code: {
    fontSize: 12,
    color: "#333",
    marginTop: 3,
  },
});
