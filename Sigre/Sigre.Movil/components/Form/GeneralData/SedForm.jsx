// DataGeneral/SedForm.jsx
import { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";

export default function SedForm({ data, onSave }) {
  const [form, setForm] = useState({
    SedInterno: data.SedInterno ?? "",
    EstadoOffLine: data.EstadoOffLine ?? "",
    SedEtiqueta: data.SedEtiqueta ?? "",
    SedLatitud: data.SedLatitud ?? "",
    SedLongitud: data.SedLongitud ?? "",
    SedTipo: data.SedTipo ?? "",
    AlimInterno: data.AlimInterno ?? "",
    SedCodigo: data.SedCodigo ?? "",
    SedSimbolo: data.SedSimbolo ?? "",
    SedTerceros: data.SedTerceros ?? "",
    SedMaterial: data.SedMaterial ?? "",
    SedInspeccionado: data.SedInspeccionado ?? "",
    SedNumPostes: data.SedNumPostes ?? "",
    SedArmadoTipo: data.SedArmadoTipo ?? "",
    SedArmadoMaterial: data.SedArmadoMaterial ?? "",
    SedRetenidaTipo: data.SedRetenidaTipo ?? "",
    SedRetenidaMaterial: data.SedRetenidaMaterial ?? "",
    SedArmadoMaterialNavigationArmmtInterno: data.SedArmadoMaterialNavigationArmmtInterno ?? "",
    SedArmadoTipoNavigationArmtpInterno: data.SedArmadoTipoNavigationArmtpInterno ?? "",
    SedMaterialNavigationSedInterno: data.SedMaterialNavigationSedInterno ?? "",
    SedRetenidaMaterialNavigationRtnmtInterno: data.SedRetenidaMaterialNavigationRtnmtInterno ?? "",
    SedRetenidaTipoNavigationRtntpInterno: data.SedRetenidaTipoNavigationRtntpInterno ?? ""
  });

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <View>
      <Text style={styles.sectionTitle}>Subestación (SED)</Text>

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

      <Button title="Guardar SED (temporal)" onPress={() => onSave?.(form)} />
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
