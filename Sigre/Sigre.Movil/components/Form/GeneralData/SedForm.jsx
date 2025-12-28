import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { useSed } from "../../../hooks/useSed";

const SedForm = forwardRef(({ data, visible }, ref) => {
  const { saveSed } = useSed();

  const [form, setForm] = useState({ ...data });

  // 🔹 Resetear datos al abrir el modal
  useEffect(() => {
    if (!data) return;
    setForm({ ...data });
  }, [data, visible]);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  useImperativeHandle(ref, () => ({
    save: async () => {
      try {
        const id = await saveSed(form);

        if (id) {
          Alert.alert("Guardado exitoso", "La subestación (SED) se guardó correctamente.");
          return { ...form, SedInterno: id };
        } else {
          Alert.alert("Error", "No se pudo guardar la subestación.");
          return null;
        }
      } catch (error) {
        Alert.alert("Error", "Ocurrió un error al guardar la subestación.");
        return null;
      }
    }
  }));

  const lockedFields = ["SedInterno", "EstadoOffLine", "SedLatitud", "SedLongitud", "SedCodigo"];

  const orderedFields = [
    "SedCodigo",
    "SedEtiqueta",
    "SedTipo",
    "SedMaterial",
    "SedArmadoTipo",
    "SedArmadoMaterial",
    "SedRetenidaTipo",
    "SedRetenidaMaterial",
    "SedNumPostes",
    "SedTerceros",
    "SedLatitud",
    "SedLongitud",
    "SedInterno"
  ];

  const labels = {
    SedCodigo: "Código SED",
    SedEtiqueta: "Etiqueta",
    SedTipo: "Tipo",
    SedMaterial: "Material",
    SedArmadoTipo: "Tipo de armado",
    SedArmadoMaterial: "Material de armado",
    SedRetenidaTipo: "Tipo de retenida",
    SedRetenidaMaterial: "Material de retenida",
    SedNumPostes: "N° de postes",
    SedTerceros: "Terceros",
    SedLatitud: "Latitud",
    SedLongitud: "Longitud",
    SedInterno: "ID interno"
  };

  return (
    <View style={{ padding: 10 }}>
      <Text style={styles.sectionTitle}>Subestación (SED)</Text>

      {orderedFields.map(key => {
        const locked = lockedFields.includes(key);
        return (
          <View key={key} style={styles.row}>
            <Text style={styles.label}>{labels[key]}</Text>
            <TextInput
              style={[styles.input, locked && styles.locked]}
              editable={!locked}
              value={form[key] != null ? String(form[key]) : ""}
              onChangeText={v => update(key, v)}
            />
          </View>
        );
      })}
    </View>
  );
});

export default SedForm;

const styles = StyleSheet.create({
  sectionTitle: { fontWeight: "700", fontSize: 18, marginBottom: 8 },
  row: { marginBottom: 10 },
  label: { fontWeight: "600" },
  input: { borderWidth: 1, borderColor: "#ddd", padding: 8, borderRadius: 6, marginTop: 4, backgroundColor: "#f7f7f7" },
  locked: { backgroundColor: "#ececec", color: "#777" }
});
