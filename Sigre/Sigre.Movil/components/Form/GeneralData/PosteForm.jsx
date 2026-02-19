import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { usePost } from "../../../hooks/usePost";
import SelectModal from "../../SelectModal";

const PosteForm = forwardRef(({ data, visible, onClose, onDirtyChange }, ref) => {


  const { getPostData, getArmadoMaterialsPost, getMaterialsPost, getTipoRetenidasPost, getMaterialsRetenidasPost, savePost } = usePost();




  // =========================
  // ACTUALIZAR LO QUE VENGA DE SQLITE
  // =========================
  const toFormShape = (src) => ({
    PostInterno: src?.PostInterno ?? "",
    EstadoOffLine: src?.EstadoOffLine ?? "",
    PostEtiqueta: src?.PostEtiqueta ?? "",
    PostLatitud: src?.PostLatitud ?? "",
    PostLongitud: src?.PostLongitud ?? "",
    PostCodigoNodo: src?.PostCodigoNodo ?? "",

    // 👇 IMPORTANTES para el UI
    PostTerceros: src?.PostTerceros == null ? "" : String(Number(src.PostTerceros)), // "0" / "1"
    PostMaterial: src?.PostMaterial ?? "",
    PostRetenidaTipo: src?.PostRetenidaTipo ?? "",
    PostRetenidaMaterial: src?.PostRetenidaMaterial ?? "",
    PostArmadoMaterial: src?.PostArmadoMaterial ?? "",
    PostAltura: src?.PostAltura == null ? "" : String(src.PostAltura), // siempre string
  });






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
    PostArmadoMaterial: data?.PostArmadoMaterial ?? "",
    PostAltura: data?.PostAltura ?? ""

  });

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));




  const sanitizeDecimal = (txt) => {
    // 1) convierte coma a punto
    let s = String(txt ?? "").replace(/,/g, ".");

    // 2) deja solo dígitos y punto
    s = s.replace(/[^\d.]/g, "");

    if (!s) return "";

    // 3) deja solo 1 punto decimal
    const parts = s.split(".");
    if (parts.length === 1) return parts[0];

    return parts[0] + "." + parts.slice(1).join("");
  };




  // =========================
  // EXPOSE SAVE
  // =========================

  useImperativeHandle(ref, () => ({
    save: async () => {

      const id = await savePost({
        ...form,
        PostTerceros: Number(form.PostTerceros),
        PostAltura: form.PostAltura === "" ? null : Number(form.PostAltura),

      });

      if (id) {
        // ✅ leer lo REAL guardado en SQLite (fresh)
        const fresh = await getPostData(id);

        const updatedForm = toFormShape(fresh ?? { ...form, PostInterno: id });
        setForm(updatedForm);

        baseRef.current = normalize(updatedForm);
        lastDirtyRef.current = false;



        baseRef.current = normalize(updatedForm);
        lastDirtyRef.current = false;

        Alert.alert(
          "Guardado exitoso",
          "El poste se guardó correctamente.",
          [{
            text: "OK",
            onPress: () => {
              onDirtyChange?.(false);
              onClose?.();
            }
          }]
        );

        return updatedForm; // ✅ esto sube al padre actualizado
      }
      else {
        Alert.alert(
          "Error",
          "No se pudo guardar el poste."
        );
        return null;
      }
    }
  }));

  // =========================
  // DIRTY TRACKING
  // =========================
  const baseRef = useRef(null);
  const lastDirtyRef = useRef(false);

  const normalize = (obj) => ({
    PostEtiqueta: obj?.PostEtiqueta ?? "",
    PostMaterial: obj?.PostMaterial ?? "",
    PostRetenidaTipo: obj?.PostRetenidaTipo ?? "",
    PostRetenidaMaterial: obj?.PostRetenidaMaterial ?? "",
    PostArmadoMaterial: obj?.PostArmadoMaterial ?? "",
    PostAltura: obj?.PostAltura ?? "",
    PostTerceros: obj?.PostTerceros ?? "",

    // si quieres incluir más campos editables, agrégalos aquí
  });

  // =========================
  // DATA
  // =========================
  const [postMaterials, setPostMaterials] = useState([]);
  const [armadoMaterials, setArmadoMaterials] = useState([]);
  const [retenidaTipos, setRetenidaTipos] = useState([]);
  const [retenidaMaterials, setRetenidaMaterials] = useState([]);
  const [selectConfig, setSelectConfig] = useState(null);

  // PosteForm.jsx
  useEffect(() => {
    let alive = true;

    (async () => {
      if (!visible) return;

      const postId = data?.PostInterno;
      if (!postId) return;

      // ✅ 1) trae lo último de SQLite
      const fresh = await getPostData(postId);

      // ✅ 2) si por algo falla, cae a props data
      const source = fresh ?? data;

      if (!alive) return;

      const initial = toFormShape(source);

      setForm(initial);

      baseRef.current = normalize(initial);
      lastDirtyRef.current = false;
      onDirtyChange?.(false);
    })();

    return () => { alive = false; };
  }, [visible, data?.PostInterno]);


  useEffect(() => {
    if (!baseRef.current) return;

    const now = normalize(form);
    const isDirty = JSON.stringify(now) !== JSON.stringify(baseRef.current);

    if (isDirty !== lastDirtyRef.current) {
      lastDirtyRef.current = isDirty;
      onDirtyChange?.(isDirty);
    }
  }, [form]);


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

  const tercerosOptions = [
    { label: "Sí", value: 0 },
    { label: "No", value: 1 }
  ];

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
    //"PostArmadoMaterial",
    "PostRetenidaTipo",
    //"PostRetenidaMaterial",
    //"PostLatitud",
    //"PostLongitud",
    //"PostInterno",
    "PostAltura",
    "PostTerceros"
  ];

  const labels = {
    PostCodigoNodo: "Código del nodo",
    PostEtiqueta: "Etiqueta",
    PostMaterial: "Material del poste",
    PostArmadoMaterial: "Material armado",
    PostRetenidaTipo: "Tipo de retenida",
    PostRetenidaMaterial: "Material de retenida",
    PostTerceros: "Poste existente", //Antes TERCEROS
    // PostTerceros: "Cod. poste", 
    PostLatitud: "Latitud",
    PostLongitud: "Longitud",
    PostInterno: "ID interno",
    PostAltura: "Altura"
  };

  const dimmedFields = ["PostTerceros"]; // ✅ gris, pero editable


  // =========================
  // COMPONENTS
  // =========================
  const SelectInput = ({ label, value, placeholder, locked, dimmed, onPress }) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.select,
          locked && styles.locked,     // ✅ solo bloqueado real
          dimmed && styles.dimmed      // ✅ gris editable (terceros)
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
    if (key === "PostTerceros") {
      return (
        <SelectInput
          key={key}
          label={labels[key]}
          dimmed={dimmedFields.includes(key)} // ✅
          value={tercerosOptions.find(i => String(i.value) === String(form.PostTerceros))?.label}
          placeholder="Seleccione opción"
          locked={locked}
          onPress={() =>
            setSelectConfig({
              field: key,
              title: labels[key],
              items: tercerosOptions,
              labelKey: "label",
              valueKey: "value"
            })
          }
        />
      );
    }


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

          // ✅ teclado numérico real
          keyboardType={
            key === "PostAltura"
              ? (Platform.OS === "ios" ? "decimal-pad" : "numeric")
              : "default"
          }
          inputMode={key === "PostAltura" ? "decimal" : "text"}


          // ✅ solo dígitos en Altura
          onChangeText={(v) => {
            if (key === "PostAltura") {
              update(key, sanitizeDecimal(v));
              return;
            }
            update(key, v);
          }}


        />


      </View>
    );
  };


  // =========================
  // CONFIRMACIÓN
  // =========================
  const handleSelectValue = (field, value) => {
    // Aviso solo cuando cambian a "Sí" (1)
    if (field === "PostTerceros" && Number(value) === 1 && Number(form.PostTerceros) !== 1) {
      Alert.alert(
        "Aviso",
        "Si marcas Poste existente = No, este poste desaparecerá del mapa y solo el ADMINISTRADOR podrá volverlo a habilitar.\n\n¿Deseas continuar?",
        [
          { text: "Cancelar", style: "cancel", onPress: () => setSelectConfig(null) },
          {
            text: "Continuar",
            style: "destructive",
            onPress: () => {
              update(field, value);
              setSelectConfig(null);
            }
          }
        ]
      );

      return;
    }

    update(field, value);
    setSelectConfig(null);
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
        onSelect={(v) => handleSelectValue(selectConfig.field, v)} // ✅
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
    backgroundColor: "#fff"   // ✅ antes #f7f7f7
  },
  select: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 6,
    backgroundColor: "#fff"
  },
  dimmed: {
    backgroundColor: "#ececec"
  },
  locked: {
    backgroundColor: "#e0e0e0",
    opacity: 0.6
  }
});
