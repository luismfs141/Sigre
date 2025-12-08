// DataGeneral/VanoForm.jsx
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

export default function VanoForm({ data, onSave }) {
  const [form, setForm] = useState({
    VanoInterno: data.VanoInterno ?? "",
    EstadoOffLine: data.EstadoOffLine ?? "",
    VanoCodigo: data.VanoCodigo ?? "",
    VanoEtiqueta: data.VanoEtiqueta ?? "",
    VanoTerceros: data.VanoTerceros ?? "",
    VanoNodoInicial: data.VanoNodoInicial ?? "",
    VanoNodoFinal: data.VanoNodoFinal ?? "",
    VanoInspeccionado: data.VanoInspeccionado ?? "",
  });

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  // 🔒 Campos bloqueados
  const lockedFields = [
    "VanoInterno",
    "VanoCodigo",
    "VanoInspeccionado",
    "EstadoOffLine"
  ];

  // 📌 Orden de los campos visibles
  const orderedFields = [
    "VanoCodigo",
    "VanoEtiqueta",
    "VanoNodoInicial",
    "VanoNodoFinal",
    "VanoInterno",
  ];

  return (
    <View>
      <Text style={styles.sectionTitle}>Vano</Text>

      {/* Render dinámico */}
      {orderedFields.map((key) => {
        const isLocked = lockedFields.includes(key);

        return (
          <View key={key} style={styles.row}>
            <Text style={styles.label}>{key}</Text>

            <TextInput
              style={[styles.input, isLocked && styles.lockedInput]}
              value={form[key] !== null && form[key] !== undefined ? String(form[key]) : ""}
              onChangeText={(v) => update(key, v)}
              editable={!isLocked}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontWeight: "700", fontSize: 18, marginBottom: 8 },
  row: { marginBottom: 10 },
  label: { fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
    backgroundColor: "#f7f7f7"
  },
  lockedInput: {
    backgroundColor: "#ececec",
    color: "#777",
  },
});
