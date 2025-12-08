// DataGeneral/PosteForm.jsx
import { useState } from "react";
import { Button, StyleSheet, Text, TextInput, View } from "react-native";

export default function PosteForm({ data, onSave }) {
  // Inicializar con todos los campos de tu tabla POSTE
  const [form, setForm] = useState({
    PostInterno: data.PostInterno ?? "",
    EstadoOffLine: data.EstadoOffLine ?? "",
    PostEtiqueta: data.PostEtiqueta ?? "",
    PostLatitud: data.PostLatitud ?? "",
    PostLongitud: data.PostLongitud ?? "",
    AlimInterno: data.AlimInterno ?? "",
    PostCodigoNodo: data.PostCodigoNodo ?? "",
    PostTerceros: data.PostTerceros ?? "",
    PostMaterial: data.PostMaterial ?? "",
    PostInspeccionado: data.PostInspeccionado ?? "",
    PostRetenidaTipo: data.PostRetenidaTipo ?? "",
    PostRetenidaMaterial: data.PostRetenidaMaterial ?? "",
    PostArmadoTipo: data.PostArmadoTipo ?? "",
    PostArmadoMaterial: data.PostArmadoMaterial ?? "",
    PostSubestacion: data.PostSubestacion ?? "",
    PostEsMt: data.PostEsMt ?? "",
    PostEsBt: data.PostEsBt ?? "",
    PostArmadoMaterialNavigationArmmtInterno: data.PostArmadoMaterialNavigationArmmtInterno ?? "",
    PostArmadoTipoNavigationArmtpInterno: data.PostArmadoTipoNavigationArmtpInterno ?? "",
    PostMaterialNavigationPosmtInterno: data.PostMaterialNavigationPosmtInterno ?? "",
    PostRetenidaMaterialNavigationRtnmtInterno: data.PostRetenidaMaterialNavigationRtnmtInterno ?? "",
    PostRetenidaTipoNavigationRtntpInterno: data.PostRetenidaTipoNavigationRtntpInterno ?? ""
  });

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <View>
      <Text style={styles.sectionTitle}>Poste</Text>

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

      <Button title="Guardar Poste (temporal)" onPress={() => onSave?.(form)} />
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
