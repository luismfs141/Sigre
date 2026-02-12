// Form/New/NewVanoForm.jsx

import { forwardRef, useImperativeHandle, useState } from "react";
import { Platform, StyleSheet, Text, TextInput, View } from "react-native";

const NewVanoForm = forwardRef((props, ref) => {

  const [form, setForm] = useState({
    VanoCodigo: "",
    VanoLatitudIni: "",
    VanoLongitudIni: "",
    VanoLatitudFin: "",
    VanoLongitudFin: "",
    VanoNodoInicial: "",
    VanoNodoFinal: "",
    VanoTerceros: "0"
  });

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const sanitizeDecimal = (txt) => {
    let s = String(txt ?? "").replace(/,/g, ".");
    s = s.replace(/[^\d.-]/g, "");
    const parts = s.split(".");
    if (parts.length <= 2) return s;
    return parts[0] + "." + parts.slice(1).join("");
  };

  useImperativeHandle(ref, () => ({
    getData: () => ({
      ...form,
      VanoLatitudIni: form.VanoLatitudIni ? Number(form.VanoLatitudIni) : null,
      VanoLongitudIni: form.VanoLongitudIni ? Number(form.VanoLongitudIni) : null,
      VanoLatitudFin: form.VanoLatitudFin ? Number(form.VanoLatitudFin) : null,
      VanoLongitudFin: form.VanoLongitudFin ? Number(form.VanoLongitudFin) : null,
      VanoTerceros: Number(form.VanoTerceros),
    }),
    reset: () => {
      setForm({
        VanoCodigo: "",
        VanoLatitudIni: "",
        VanoLongitudIni: "",
        VanoLatitudFin: "",
        VanoLongitudFin: "",
        VanoNodoInicial: "",
        VanoNodoFinal: "",
        VanoTerceros: "0"
      });
    }
  }));

  return (
    <View>

      <Text style={styles.label}>Código *</Text>
      <TextInput
        style={styles.input}
        value={form.VanoCodigo}
        onChangeText={v => update("VanoCodigo", v)}
      />

      <Text style={styles.label}>Nodo Inicial *</Text>
      <TextInput
        style={styles.input}
        value={form.VanoNodoInicial}
        onChangeText={v => update("VanoNodoInicial", v)}
      />

      <Text style={styles.label}>Nodo Final *</Text>
      <TextInput
        style={styles.input}
        value={form.VanoNodoFinal}
        onChangeText={v => update("VanoNodoFinal", v)}
      />

      <Text style={styles.label}>Latitud Inicial</Text>
      <TextInput
        style={styles.input}
        keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
        value={form.VanoLatitudIni}
        onChangeText={v => update("VanoLatitudIni", sanitizeDecimal(v))}
      />

      <Text style={styles.label}>Longitud Inicial</Text>
      <TextInput
        style={styles.input}
        keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
        value={form.VanoLongitudIni}
        onChangeText={v => update("VanoLongitudIni", sanitizeDecimal(v))}
      />

      <Text style={styles.label}>Latitud Final</Text>
      <TextInput
        style={styles.input}
        keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
        value={form.VanoLatitudFin}
        onChangeText={v => update("VanoLatitudFin", sanitizeDecimal(v))}
      />

      <Text style={styles.label}>Longitud Final</Text>
      <TextInput
        style={styles.input}
        keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
        value={form.VanoLongitudFin}
        onChangeText={v => update("VanoLongitudFin", sanitizeDecimal(v))}
      />

    </View>
  );
});

export default NewVanoForm;

const styles = StyleSheet.create({
  label: { fontWeight: "600", marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
    marginTop: 4
  }
});
