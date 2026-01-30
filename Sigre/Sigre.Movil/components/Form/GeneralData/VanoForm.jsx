// Form/GeneralData/VanoForm.jsx
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { useGap } from "../../../hooks/useGap";

const VanoForm = forwardRef(({ data, visible, onClose, onDirtyChange }, ref) => {
  const { saveVano, fetchVanoById } = useGap();

  const [form, setForm] = useState(data ? { ...data } : {});

  // =========================
  // DIRTY TRACKING
  // =========================
  const baseRef = useRef(null);
  const lastDirtyRef = useRef(false);

  // OJO: aquí defines qué campos cuentan como "editables"
  const normalize = (obj) => ({
    VanoNodoInicial: obj?.VanoNodoInicial ?? "",
    VanoNodoFinal: obj?.VanoNodoFinal ?? "",
    // Si habilitas más campos editables, agrégalos aquí:
    // VanoEtiqueta: obj?.VanoEtiqueta ?? "",
    // VanoTerceros: obj?.VanoTerceros ?? "",
  });

  const update = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  // =========================
  // CARGA FRESH DESDE SQLITE
  // =========================
  useEffect(() => {
    let alive = true;

    const loadVano = async () => {
      if (!data) return;

      let merged = { ...data };

      if (data?.VanoInterno) {
        const vanoDB = await fetchVanoById(data.VanoInterno);
        if (vanoDB) merged = { ...data, ...vanoDB };
      }

      if (!alive) return;

      setForm(merged);

      // ✅ base para comparar cambios
      baseRef.current = normalize(merged);
      lastDirtyRef.current = false;
      onDirtyChange?.(false);
    };

    if (visible) loadVano();

    return () => {
      alive = false;
    };
  }, [data, visible]);

  // ✅ detecta cambios y avisa al modal
  useEffect(() => {
    if (!baseRef.current) return;

    const now = normalize(form);
    const isDirty = JSON.stringify(now) !== JSON.stringify(baseRef.current);

    if (isDirty !== lastDirtyRef.current) {
      lastDirtyRef.current = isDirty;
      onDirtyChange?.(isDirty);
    }
  }, [form]);

  // =========================
  // EXPOSE SAVE
  // =========================
  useImperativeHandle(ref, () => ({
    save: async () => {
      try {
        const id = await saveVano(form);
        if (!id) {
          Alert.alert("Error", "No se pudo guardar el vano.");
          return null;
        }

        // ✅ opcional: recargar fresh
        const fresh = await fetchVanoById(id);
        const updated = fresh ? { ...form, ...fresh, VanoInterno: id } : { ...form, VanoInterno: id };

        setForm(updated);

        // ✅ resetea dirty
        baseRef.current = normalize(updated);
        lastDirtyRef.current = false;
        onDirtyChange?.(false);

        Alert.alert("Guardado exitoso", "El vano se guardó correctamente.", [
          {
            text: "OK",
            onPress: () => {
              // si quieres cerrar igual que Poste:
              onClose?.();
            },
          },
        ]);

        return updated;
      } catch (e) {
        Alert.alert("Error", "Ocurrió un error al guardar el vano.");
        return null;
      }
    },
  }));

  // =========================
  // CAMPOS
  // =========================
  const lockedFields = ["VanoInterno", "VanoCodigo", "VanoInspeccionado", "EstadoOffLine"];

  const orderedFields = [
    "VanoCodigo",
    "VanoNodoInicial",
    "VanoNodoFinal",
    // Si quieres mostrar más, descomenta:
    // "VanoEtiqueta",
    // "VanoTerceros",
  ];

  const LABELS = {
    VanoCodigo: "Código",
    VanoEtiqueta: "Etiqueta",
    VanoNodoInicial: "Nodo Inicial",
    VanoNodoFinal: "Nodo Final",
    VanoInterno: "Interno",
  };

  return (
    <View>
      <Text style={styles.sectionTitle}>Vano</Text>

      {orderedFields.map((key) => {
        const isLocked = lockedFields.includes(key);

        return (
          <View key={key} style={styles.row}>
            <Text style={styles.label}>{LABELS[key] ?? key}</Text>
            <TextInput
              style={[styles.input, isLocked && styles.lockedInput]}
              value={form?.[key] != null ? String(form[key]) : ""}
              onChangeText={(v) => update(key, v)}
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
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
    backgroundColor: "#fff",
  },
  lockedInput: { backgroundColor: "#ececec", color: "#777" },
});
