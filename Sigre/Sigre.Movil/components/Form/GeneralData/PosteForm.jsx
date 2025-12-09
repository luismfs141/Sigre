import { FontAwesome5 } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { usePost } from "../../../hooks/usePost";

const PosteForm = forwardRef(({ data }, ref) => {
  const {
    getArmadoMaterialsPost,
    getMaterialsPost,
    getTipoRetenidasPost,
    getMaterialsRetenidasPost,
    savePost
  } = usePost();

  const [form, setForm] = useState({
    PostInterno: data.PostInterno ?? "",
    EstadoOffLine: data.EstadoOffLine ?? "",
    PostEtiqueta: data.PostEtiqueta ?? "",
    PostLatitud: data.PostLatitud ?? "",
    PostLongitud: data.PostLongitud ?? "",
    PostCodigoNodo: data.PostCodigoNodo ?? "",
    PostTerceros: data.PostTerceros ?? "",
    PostMaterial: data.PostMaterial ?? "",
    PostInspeccionado: data.PostInspeccionado ?? "",
    PostRetenidaTipo: data.PostRetenidaTipo ?? "",
    PostRetenidaMaterial: data.PostRetenidaMaterial ?? "",
    PostArmadoTipo: data.PostArmadoTipo ?? "",
    PostArmadoMaterial: data.PostArmadoMaterial ?? "",
  });

  const update = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  // 🔹 Exponer método save al ref del modal
  useImperativeHandle(ref, () => ({
    save: async () => {
      try {
        const id = await savePost(form);
        return { ...form, PostInterno: id };
      } catch (e) {
        console.warn("⚠ Error al guardar el poste:", e);
        return form; // fallback seguro
      }
    }
  }));

  const lockedFields = [
    "PostInterno",
    "PostLatitud",
    "PostLongitud",
    "EstadoOffLine",
    "PostCodigoNodo",
  ];

  const orderedFields = [
    "PostCodigoNodo",
    "PostEtiqueta",
    "PostMaterial",
    "PostArmadoMaterial",
    "PostRetenidaTipo",
    "PostRetenidaMaterial",
    "PostTerceros",
    "PostLatitud",
    "PostLongitud",
    "PostInterno",
  ];

  const [postMaterials, setPostMaterials] = useState([]);
  const [armadoMaterials, setArmadoMaterials] = useState([]);
  const [retenidaTipos, setRetenidaTipos] = useState([]);
  const [retenidaMaterials, setRetenidaMaterials] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        setPostMaterials((await getMaterialsPost()) ?? []);
        setArmadoMaterials((await getArmadoMaterialsPost()) ?? []);
        setRetenidaTipos((await getTipoRetenidasPost()) ?? []);
        setRetenidaMaterials((await getMaterialsRetenidasPost()) ?? []);
      } catch (e) {
        console.log("ERROR CARGANDO PICKERS:", e);
      }
    })();
  }, []);

  const renderPicker = (items, key, labelKey, valueKey, placeholder, isLocked) => (
    <View style={styles.pickerWrapper}>
      <Picker
        enabled={!isLocked}
        selectedValue={form[key] ?? ""}
        onValueChange={(v) => update(key, v)}
      >
        <Picker.Item label={placeholder} value="" />
        {(items ?? []).map((item) => (
          <Picker.Item
            key={item?.[valueKey] ?? Math.random().toString()}
            label={item?.[labelKey] ?? ""}
            value={item?.[valueKey] ?? ""}
          />
        ))}
      </Picker>
    </View>
  );

  const renderField = (key, isLocked) => {
    switch (key) {
      case "PostMaterial":
        return renderPicker(postMaterials, key, "PosmtNombre", "PosmtInterno", "Seleccione material", isLocked);
      case "PostArmadoMaterial":
        return renderPicker(armadoMaterials, key, "ArmmtNombre", "ArmmtInterno", "Seleccione material armado", isLocked);
      case "PostRetenidaTipo":
        return renderPicker(retenidaTipos, key, "RtntpNombre", "RtntpInterno", "Seleccione tipo de retenida", isLocked);
      case "PostRetenidaMaterial":
        return renderPicker(retenidaMaterials, key, "RtnmtNombre", "RtnmtInterno", "Seleccione material de retenida", isLocked);
      default:
        return (
          <TextInput
            style={[styles.input, isLocked && styles.lockedInput]}
            editable={!isLocked}
            value={form[key] ? String(form[key]) : ""}
            onChangeText={(v) => update(key, v)}
          />
        );
    }
  };

  return (
    <View style={{ padding: 10 }}>
      {orderedFields.map((key) => {
        const isLocked = lockedFields.includes(key);
        return (
          <View key={key} style={styles.row}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>{key}</Text>
              {isLocked && <FontAwesome5 name="lock" size={14} color="#777" style={{ marginLeft: 6 }} />}
            </View>
            {renderField(key, isLocked)}
          </View>
        );
      })}
    </View>
  );
});

export default PosteForm;

const styles = StyleSheet.create({
  row: { marginBottom: 12 },
  label: { fontWeight: "600" },
  labelRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  input: { borderWidth: 1, borderColor: "#ddd", padding: 8, borderRadius: 6, backgroundColor: "#f7f7f7" },
  lockedInput: { backgroundColor: "#ececec", color: "#777" },
  pickerWrapper: { borderWidth: 1, borderColor: "#ddd", borderRadius: 6, backgroundColor: "#fff", marginTop: 4 },
});
