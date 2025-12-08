// DataGeneral/VanoForm.jsx
import { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";

export default function VanoForm({ data, onSave }) {
  const [form, setForm] = useState({
    VanoInterno: data.VanoInterno ?? "",
    EstadoOffLine: data.EstadoOffLine ?? "",
    VanoCodigo: data.VanoCodigo ?? "",
    VanoLatitudIni: data.VanoLatitudIni ?? "",
    VanoLongitudIni: data.VanoLongitudIni ?? "",
    VanoLatitudFin: data.VanoLatitudFin ?? "",
    VanoLongitudFin: data.VanoLongitudFin ?? "",
    AlimInterno: data.AlimInterno ?? "",
    VanoEtiqueta: data.VanoEtiqueta ?? "",
    VanoTerceros: data.VanoTerceros ?? "",
    VanoMaterial: data.VanoMaterial ?? "",
    VanoNodoInicial: data.VanoNodoInicial ?? "",
    VanoNodoFinal: data.VanoNodoFinal ?? "",
    VanoInspeccionado: data.VanoInspeccionado ?? "",
    VanoSubestacion: data.VanoSubestacion ?? "",
    VanoEsMt: data.VanoEsMt ?? "",
    VanoEsBt: data.VanoEsBt ?? "",
    AlimInternoNavigationAlimInterno: data.AlimInternoNavigationAlimInterno ?? ""
  });

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <View>
      <Text style={styles.sectionTitle}>Vano</Text>

      {Object.keys(form).map((key) => (
        <View key={key} style={styles.row}>
          <Text style={styles.label}>{key}</Text>
          <TextInput
            style={styles.input}
            value={form[key] !== null && form[key] !== undefined ? String(form[key]) : ""}
            onChangeText={(v) => update(key, v)}
          />
        </View>
      ))}

      <Button title="Guardar Vano (temporal)" onPress={() => onSave?.(form)} />
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
  }
});
