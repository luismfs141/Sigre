import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { useGap } from "../../../hooks/useGap";

const VanoForm = forwardRef(({ data }, ref) => {
  const { saveVano, fetchVanoById } = useGap();
  const [form, setForm] = useState({ ...data });

  // 🔹 Cargar datos desde DB si existe
  useEffect(() => {
    const loadVano = async () => {
      if (data?.VanoInterno) {
        const vanoDB = await fetchVanoById(data.VanoInterno);
        if (vanoDB) setForm({ ...data, ...vanoDB });
      }
    };
    loadVano();
  }, [data?.VanoInterno]);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  // =========================
  // EXPOSE SAVE (igual que Poste)
  // =========================
  useImperativeHandle(ref, () => ({
    save: async () => {
      try {
        const id = await saveVano(form);

        if (id) {
          Alert.alert(
            "Guardado exitoso",
            "El vano se guardó correctamente."
          );

          return { ...form, VanoInterno: id };
        } else {
          Alert.alert(
            "Error",
            "No se pudo guardar el vano."
          );
          return null;
        }
      } catch (e) {
        Alert.alert(
          "Error",
          "Ocurrió un error al guardar el vano."
        );
        return null;
      }
    }
  }));

  const lockedFields = [
    "VanoInterno",
    "VanoCodigo",
    "VanoInspeccionado",
    "EstadoOffLine"
  ];

  const orderedFields = [
    "VanoCodigo",
    "VanoEtiqueta",
    "VanoNodoInicial",
    "VanoNodoFinal",
    "VanoInterno"
  ];

  return (
    <View>
      <Text style={styles.sectionTitle}>Vano</Text>

      {orderedFields.map(key => {
        const isLocked = lockedFields.includes(key);

        return (
          <View key={key} style={styles.row}>
            <Text style={styles.label}>{key}</Text>
            <TextInput
              style={[styles.input, isLocked && styles.lockedInput]}
              value={form[key] != null ? String(form[key]) : ""}
              onChangeText={v => update(key, v)}
              editable={!isLocked}
            />
          </View>
        );
      })}
    </View>
  );
});

export default VanoForm;

const styles = StyleSheet.create({
  sectionTitle: { fontWeight: "700", fontSize: 18, marginBottom: 8 },
  row: { marginBottom: 10 },
  label: { fontWeight: "600" },
  input: { borderWidth: 1, borderColor: "#ddd", padding: 8, borderRadius: 6, marginTop: 4, backgroundColor: "#f7f7f7" },
  lockedInput: { backgroundColor: "#ececec", color: "#777" },
});
