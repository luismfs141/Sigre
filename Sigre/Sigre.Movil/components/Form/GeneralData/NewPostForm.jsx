import { forwardRef, useImperativeHandle, useState } from "react";
import { Platform, StyleSheet, Text, TextInput, View } from "react-native";

const NewPostForm = forwardRef((props, ref) => {

  const [form, setForm] = useState({
    PostEtiqueta: "",
    PostLatitud: "",
    PostLongitud: "",
    PostCodigoNodo: "",
    PostMaterial: "",
    PostAltura: "",
    PostTerceros: "0",
    PostEsMT: 1,
    PostEsBT: 0
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
      PostLatitud: form.PostLatitud ? Number(form.PostLatitud) : null,
      PostLongitud: form.PostLongitud ? Number(form.PostLongitud) : null,
      PostAltura: form.PostAltura ? Number(form.PostAltura) : null,
      PostTerceros: Number(form.PostTerceros),
    }),
    reset: () => {
      setForm({
        PostEtiqueta: "",
        PostLatitud: "",
        PostLongitud: "",
        PostCodigoNodo: "",
        PostMaterial: "",
        PostAltura: "",
        PostTerceros: "0",
        PostEsMT: 1,
        PostEsBT: 0
      });
    }
  }));

  return (
    <View>

      <Text style={styles.label}>Etiqueta *</Text>
      <TextInput
        style={styles.input}
        value={form.PostEtiqueta}
        onChangeText={v => update("PostEtiqueta", v)}
      />

      <Text style={styles.label}>Latitud *</Text>
      <TextInput
        style={styles.input}
        keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
        value={form.PostLatitud}
        onChangeText={v => update("PostLatitud", sanitizeDecimal(v))}
      />

      <Text style={styles.label}>Longitud *</Text>
      <TextInput
        style={styles.input}
        keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
        value={form.PostLongitud}
        onChangeText={v => update("PostLongitud", sanitizeDecimal(v))}
      />

      <Text style={styles.label}>Código Nodo</Text>
      <TextInput
        style={styles.input}
        value={form.PostCodigoNodo}
        onChangeText={v => update("PostCodigoNodo", v)}
      />

      <Text style={styles.label}>Material</Text>
      <TextInput
        style={styles.input}
        value={form.PostMaterial}
        onChangeText={v => update("PostMaterial", v)}
      />

      <Text style={styles.label}>Altura</Text>
      <TextInput
        style={styles.input}
        keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
        value={form.PostAltura}
        onChangeText={v => update("PostAltura", sanitizeDecimal(v))}
      />

    </View>
  );
});

export default NewPostForm;

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
