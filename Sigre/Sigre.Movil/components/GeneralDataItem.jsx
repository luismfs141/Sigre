import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function GeneralDataItem({ item, onEdit }) {
  if (!item) return null;

  const tipoElemento = item.PostInterno
    ? "POSTE"
    : item.VanoInterno
    ? "VANO"
    : item.SedInterno
    ? "SED"
    : "ELEMENTO";

  const codigo = item.PostCodigoNodo || item.VanoCodigo || item.SedCodigo || "-";
  const etiqueta = item.PostEtiqueta || item.VanoEtiqueta || item.SedEtiqueta || "-";

  return (
    <View style={styles.card}>
        {/* 🔹 Fila de título */}
        <View style={styles.titleRow}>
            <Text style={styles.title}>{tipoElemento}</Text>

            {/* 🔹 Botón editar */}
            <Pressable onPress={() => onEdit(item)} style={styles.editButton}>
              <MaterialIcons name="edit" size={24} color="#007bff" />
            </Pressable>
        </View>

        {/* 🔹 Subtítulo en línea siguiente */}
        <Text style={styles.subtitle}>
            Código: {codigo}   Etiqueta: {etiqueta}
        </Text>
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  title: {
    fontWeight: "600",
    fontSize: 15,
    flex: 1,
    textAlign: "center"
  },
  editButton: {
    marginRight: 20
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "center"
  }
});
