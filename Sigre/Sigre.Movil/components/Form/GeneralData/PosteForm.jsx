import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { usePost } from "../../../hooks/usePost";
import SelectModal from "../../SelectModal";

const PosteForm = forwardRef(({ data }, ref) => {
  const { getArmadoMaterialsPost, getMaterialsPost, getTipoRetenidasPost, getMaterialsRetenidasPost, savePost } = usePost();

  // =========================
  // STATE FORM
  // =========================
  const [form, setForm] = useState({
    PostInterno: data?.PostInterno ?? "",
    EstadoOffLine: data?.EstadoOffLine ?? "",
    PostEtiqueta: data?.PostEtiqueta ?? "",
    PostLatitud: data?.PostLatitud ?? "",
    PostLongitud: data?.PostLongitud ?? "",
    PostCodigoNodo: data?.PostCodigoNodo ?? "",
    PostTerceros: data?.PostTerceros ?? "",
    PostMaterial: data?.PostMaterial ?? "",
    PostRetenidaTipo: data?.PostRetenidaTipo ?? "",
    PostRetenidaMaterial: data?.PostRetenidaMaterial ?? "",
    PostArmadoMaterial: data?.PostArmadoMaterial ?? ""
  });

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  // =========================
  // EXPOSE SAVE
  // =========================
  useImperativeHandle(ref, () => ({
    save: async () => {
      const id = await savePost(form);
      return { ...form, PostInterno: id };
    }
  }));

  // =========================
  // DATA
  // =========================
  const [postMaterials, setPostMaterials] = useState([]);
  const [armadoMaterials, setArmadoMaterials] = useState([]);
  const [retenidaTipos, setRetenidaTipos] = useState([]);
  const [retenidaMaterials, setRetenidaMaterials] = useState([]);
  const [selectConfig, setSelectConfig] = useState(null);

  useEffect(() => {
    (async () => {
      setPostMaterials(await getMaterialsPost() ?? []);
      setArmadoMaterials(await getArmadoMaterialsPost() ?? []);
      setRetenidaTipos(await getTipoRetenidasPost() ?? []);
      setRetenidaMaterials(await getMaterialsRetenidasPost() ?? []);
    })();
  }, []);

  // =========================
  // CONFIG
  // =========================
  const lockedFields = [
    "PostInterno",
    "PostLatitud",
    "PostLongitud",
    "EstadoOffLine",
    "PostCodigoNodo"
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
    "PostInterno"
  ];

  const labels = {
    PostCodigoNodo: "Código del nodo",
    PostEtiqueta: "Etiqueta",
    PostMaterial: "Material del poste",
    PostArmadoMaterial: "Material armado",
    PostRetenidaTipo: "Tipo de retenida",
    PostRetenidaMaterial: "Material de retenida",
    PostTerceros: "Terceros",
    PostLatitud: "Latitud",
    PostLongitud: "Longitud",
    PostInterno: "ID interno"
  };

  // =========================
  // COMPONENTS
  // =========================
  const SelectInput = ({ label, value, placeholder, locked, onPress }) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.select, locked && styles.locked]}
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

    if (key === "PostMaterial") {
      return (
        <SelectInput
          key={key}
          label={labels[key]}
          value={postMaterials.find(i => String(i.PosmtInterno) === String(form.PostMaterial))?.PosmtNombre}
          placeholder="Seleccione material"
          locked={locked}
          onPress={() =>
            setSelectConfig({
              field: key,
              title: labels[key],
              items: postMaterials,
              labelKey: "PosmtNombre",
              valueKey: "PosmtInterno"
            })
          }
        />
      );
    }

    if (key === "PostArmadoMaterial") {
      return (
        <SelectInput
          key={key}
          label={labels[key]}
          value={armadoMaterials.find(i => String(i.ArmmtInterno) === String(form.PostArmadoMaterial))?.ArmmtNombre}
          placeholder="Seleccione armado"
          locked={locked}
          onPress={() =>
            setSelectConfig({
              field: key,
              title: labels[key],
              items: armadoMaterials,
              labelKey: "ArmmtNombre",
              valueKey: "ArmmtInterno"
            })
          }
        />
      );
    }

    if (key === "PostRetenidaTipo") {
      return (
        <SelectInput
          key={key}
          label={labels[key]}
          value={retenidaTipos.find(i => String(i.RtntpInterno) === String(form.PostRetenidaTipo))?.RtntpNombre}
          placeholder="Seleccione tipo"
          locked={locked}
          onPress={() =>
            setSelectConfig({
              field: key,
              title: labels[key],
              items: retenidaTipos,
              labelKey: "RtntpNombre",
              valueKey: "RtntpInterno"
            })
          }
        />
      );
    }

    if (key === "PostRetenidaMaterial") {
      return (
        <SelectInput
          key={key}
          label={labels[key]}
          value={retenidaMaterials.find(i => String(i.RtnmtInterno) === String(form.PostRetenidaMaterial))?.RtnmtNombre}
          placeholder="Seleccione material"
          locked={locked}
          onPress={() =>
            setSelectConfig({
              field: key,
              title: labels[key],
              items: retenidaMaterials,
              labelKey: "RtnmtNombre",
              valueKey: "RtnmtInterno"
            })
          }
        />
      );
    }

    return (
      <View key={key} style={styles.row}>
        <Text style={styles.label}>{labels[key]}</Text>
        <TextInput
          style={[styles.input, locked && styles.locked]}
          editable={!locked}
          value={form[key] ? String(form[key]) : ""}
          onChangeText={(v) => update(key, v)}
        />
      </View>
    );
  };

  // =========================
  // RENDER
  // =========================
  return (
    <View style={{ padding: 10 }}>
      {orderedFields.map(key => renderField(key))}

      <SelectModal
        visible={!!selectConfig}
        title={selectConfig?.title}
        items={selectConfig?.items}
        labelKey={selectConfig?.labelKey}
        valueKey={selectConfig?.valueKey}
        selectedValue={form?.[selectConfig?.field]}
        onSelect={(v) => update(selectConfig.field, v)}
        onClose={() => setSelectConfig(null)}
      />
    </View>
  );
});

export default PosteForm;

// =========================
const styles = StyleSheet.create({
  row: { marginBottom: 14 },
  label: { fontWeight: "600", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 6,
    backgroundColor: "#f7f7f7"
  },
  select: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 6,
    backgroundColor: "#fff"
  },
  locked: {
    backgroundColor: "#ececec",
    color: "#777"
  }
});
