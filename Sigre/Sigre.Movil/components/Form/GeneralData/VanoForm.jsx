// Form/GeneralData/VanoForm.jsx
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useGap } from "../../../hooks/useGap";
import SelectModal from "../../SelectModal";

const VanoForm = forwardRef(({ data, visible, onClose, onDirtyChange }, ref) => {
  const { saveVano, fetchVanoById } = useGap();

  // =========================
  // HELPERS
  // =========================
  const pickCodigo = (src) =>
    src?.VanoCodigo ?? src?.Vano_Codigo ?? src?.VANO_Codigo ?? "";

  const ensureEtiqueta = (src) => {
    const etiqueta = (src?.VanoEtiqueta ?? src?.VANO_Etiqueta ?? "").toString().trim();
    if (etiqueta) return etiqueta;

    const codigo = String(pickCodigo(src) ?? "").trim();
    if (codigo) return codigo; // ✅ fallback seguro

    return "SIN ETIQUETA"; // ✅ último fallback
  };

  // =========================
  // SHAPE CONSISTENTE
  // =========================
  const toFormShape = (src) => ({
    VanoInterno: src?.VanoInterno ?? "",
    EstadoOffLine: src?.EstadoOffLine ?? "",

    VanoCodigo: pickCodigo(src),

    // ✅ OJO: NOT NULL en BD
    VanoEtiqueta: ensureEtiqueta(src),

    VanoNodoInicial: src?.VanoNodoInicial ?? "",
    VanoNodoFinal: src?.VanoNodoFinal ?? "",

    // UI: "0"/"1"
    VanoTerceros:
      src?.VanoTerceros == null ? "" : String(Number(src.VanoTerceros)),
  });

  const [form, setForm] = useState(toFormShape(data ?? {}));
  const update = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  // =========================
  // DIRTY TRACKING
  // =========================
  const baseRef = useRef(null);
  const lastDirtyRef = useRef(false);

  const normalize = (obj) => ({
    VanoNodoInicial: obj?.VanoNodoInicial ?? "",
    VanoNodoFinal: obj?.VanoNodoFinal ?? "",
    VanoTerceros: obj?.VanoTerceros ?? "",
  });

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

      const initial = toFormShape(merged);
      setForm(initial);

      baseRef.current = normalize(initial);
      lastDirtyRef.current = false;
      onDirtyChange?.(false);
    };

    if (visible) loadVano();

    return () => {
      alive = false;
    };
  }, [data, visible]);

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
  // SELECT CONFIG (Terceros)
  // =========================
  const [selectConfig, setSelectConfig] = useState(null);

  const tercerosOptions = [
    { label: "Sí", value: 0 },
    { label: "No", value: 1 },
  ];

  const handleSelectValue = (field, value) => {
    if (field === "VanoTerceros" && Number(value) === 1 && Number(form.VanoTerceros) !== 1) {
      Alert.alert(
        "Aviso",
        "Si marcas Red existente = No, este vano desaparecerá del mapa y solo el ADMINISTRADOR podrá volverlo a habilitar.\n\n¿Deseas continuar?",
        [
          { text: "Cancelar", style: "cancel", onPress: () => setSelectConfig(null) },
          {
            text: "Continuar",
            style: "destructive",
            onPress: () => {
              update(field, String(value));
              setSelectConfig(null);
            },
          },
        ]
      );

      return;
    }

    update(field, String(value));
    setSelectConfig(null);
  };

  // =========================
  // EXPOSE SAVE
  // =========================
  useImperativeHandle(ref, () => ({
    save: async () => {
      try {
        // ✅ SIEMPRE etiqueta válida (NOT NULL)
        const etiquetaFinal = ensureEtiqueta({
          ...form,
          VanoCodigo: form.VanoCodigo,
          VanoEtiqueta: form.VanoEtiqueta,
        });

        const payload = {
          ...form,
          VanoEtiqueta: etiquetaFinal, // ✅ nunca null
          VanoTerceros: form.VanoTerceros === "" ? null : Number(form.VanoTerceros),
        };

        const id = await saveVano(payload);

        if (!id) {
          Alert.alert("Error", "No se pudo guardar el vano.");
          return null;
        }

        const fresh = await fetchVanoById(id);
        const updated = toFormShape(fresh ?? { ...payload, VanoInterno: id });

        setForm(updated);

        baseRef.current = normalize(updated);
        lastDirtyRef.current = false;
        onDirtyChange?.(false);

        Alert.alert("Guardado exitoso", "El vano se guardó correctamente.", [
          { text: "OK", onPress: () => onClose?.() },
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
    "VanoTerceros",
    // Si quieres mostrar etiqueta, descomenta:
    // "VanoEtiqueta",
  ];

  const LABELS = {
    VanoCodigo: "Código",
    VanoEtiqueta: "Etiqueta",
    VanoNodoInicial: "Nodo Inicial",
    VanoNodoFinal: "Nodo Final",
    VanoInterno: "Interno",
    VanoTerceros: "Red existente",
  };

  const dimmedFields = ["VanoTerceros"];

  const SelectInput = ({ label, value, placeholder, locked, dimmed, onPress }) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.select,
          locked && styles.lockedInput,
          dimmed && styles.dimmed,
        ]}
        disabled={locked}
        onPress={onPress}
      >
        <Text style={{ color: value ? "#000" : "#999" }}>
          {value || placeholder}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderField = (key) => {
    const locked = lockedFields.includes(key);

    if (key === "VanoTerceros") {
      return (
        <SelectInput
          key={key}
          label={LABELS[key] ?? key}
          dimmed={dimmedFields.includes(key)}
          value={tercerosOptions.find((i) => String(i.value) === String(form.VanoTerceros))?.label}
          placeholder="Seleccione opción"
          locked={locked}
          onPress={() =>
            setSelectConfig({
              field: key,
              title: LABELS[key] ?? key,
              items: tercerosOptions,
              labelKey: "label",
              valueKey: "value",
            })
          }
        />
      );
    }

    return (
      <View key={key} style={styles.row}>
        <Text style={styles.label}>{LABELS[key] ?? key}</Text>
        <TextInput
          style={[styles.input, locked && styles.lockedInput]}
          value={form?.[key] != null ? String(form[key]) : ""}
          onChangeText={(v) => update(key, v)}
          editable={!locked}
        />
      </View>
    );
  };

  return (
    <View>
      <Text style={styles.sectionTitle}>Vano</Text>

      {orderedFields.map((key) => renderField(key))}

      <SelectModal
        visible={!!selectConfig}
        title={selectConfig?.title}
        items={selectConfig?.items}
        labelKey={selectConfig?.labelKey}
        valueKey={selectConfig?.valueKey}
        selectedValue={form?.[selectConfig?.field]}
        onSelect={(v) => handleSelectValue(selectConfig.field, v)}
        onClose={() => setSelectConfig(null)}
      />
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

  select: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 6,
    marginTop: 4,
    backgroundColor: "#fff",
  },

  dimmed: { backgroundColor: "#ececec" },

  lockedInput: {
    backgroundColor: "#e0e0e0",
    opacity: 0.6,
    color: "#777",
  },
});
