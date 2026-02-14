import * as Location from "expo-location";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { useEffect, useState } from "react";

import LocationModal from "../../../components/Modal/LocationModal";
import { useDeficiency } from "../../../hooks/useDeficiency";
import { createEmptyDeficiency } from "../../../utils/Deficiencies/deficiencyFactory";
import {
  getDeficiencyFields,
  getDeficiencyLabel
} from "../../../utils/Deficiencies/deficiencyFormUtils";
import SelectModal from "../../SelectModal";
import DeficiencyField from "../Defiencies/DeficiencyField";


const RESPONSABILIDAD = "DefiCol2";
const TIPI_COMENTARIO_ESTANDAR = "TipiComentarioEstandar";

const buildComentarioEstandarField = () => ({
  key: TIPI_COMENTARIO_ESTANDAR,
  label: "Comentario estándar",
  type: "text",        // ✅ importante: NO textarea
  readonly: true,
  required: false,
  placeholder: "",
});


const pickComentarioEstandarFromProp = (deficiencyProp) => {
  // soporta: deficiency.data.comentarioEstandar (si pasas item.data),
  // o deficiency.comentarioEstandar (si pasas el objeto directo)
  const v =
    deficiencyProp?.comentarioEstandar ??
    deficiencyProp?.ComentarioEstandar ??
    deficiencyProp?.data?.comentarioEstandar ??
    deficiencyProp?.data?.ComentarioEstandar ??
    "";

  return String(v ?? "").trim();
};

const ensureComentarioEstandarAsync = async (def, deficiencyProp, fetchComentarioFn) => {
  const base = def ?? {};

  // 1) Si ya vino por props (raro en tu caso), úsalo
  const fromProp = pickComentarioEstandarFromProp(deficiencyProp);
  if (fromProp) {
    return { ...base, [TIPI_COMENTARIO_ESTANDAR]: fromProp };
  }

  // 2) Si no vino, buscar por TipiInterno / typificationId en SQLite
  const typiId =
    base?.TipiInterno ??
    base?.typificationId ??
    deficiencyProp?.typificationId ??
    deficiencyProp?.data?.typificationId ??
    null;

  if (!typiId) {
    return { ...base, [TIPI_COMENTARIO_ESTANDAR]: "" };
  }

  const comentario = await fetchComentarioFn?.(typiId);
  return { ...base, [TIPI_COMENTARIO_ESTANDAR]: String(comentario ?? "").trim() };
};


const injectComentarioEstandarBeforeComentarios = (baseFields) => {
  const fields = Array.isArray(baseFields) ? baseFields : [];

  // si ya existe, no duplicar
  if (fields.some(f => f?.key === TIPI_COMENTARIO_ESTANDAR)) return fields;

  const comentarioStdField = buildComentarioEstandarField();

  // insertar antes del campo Comentarios (DefiComentario)
  const idx = fields.findIndex(f => {
    const k = String(f?.key ?? "").toUpperCase();
    const l = String(f?.label ?? "").toUpperCase();

    // match por key exacta o label que contenga COMENT (pero no "ESTANDAR")
    return (
      k === "DEFICOMENTARIO" ||
      (l.includes("COMENT") && !l.includes("ESTANDAR") && !l.includes("ESTÁNDAR"))
    );
  });

  if (idx === -1) return [...fields, comentarioStdField];

  return [
    ...fields.slice(0, idx),
    comentarioStdField,
    ...fields.slice(idx),
  ];
};

const sanitizeDefForSave = (def) => {
  if (!def || typeof def !== "object") return def;
  const copy = { ...def };

  // ✅ NO se guarda ni se sincroniza al server
  delete copy[TIPI_COMENTARIO_ESTANDAR];

  return copy;
};




const buildResponsabilidadField = () => ({
  key: RESPONSABILIDAD,
  label: "Responsabilidad",
  required: true,
  selectable: true,
  valueMap: {
    SEAL: "SEAL",
    Terceros: "Terceros"
  }
});

const ensureResponsabilidadDefault = (def) => {
  const v = def?.[RESPONSABILIDAD];
  const empty = v === null || v === undefined || String(v).trim() === "";
  return empty ? { ...def, [RESPONSABILIDAD]: "SEAL" } : def;
};

const injectResponsabilidadAfterCriticidad = (baseFields) => {
  const fields = Array.isArray(baseFields) ? baseFields : [];

  // si ya existe en el config, no duplicar
  if (fields.some(f => f?.key === RESPONSABILIDAD)) return fields;

  const responsabilidadField = buildResponsabilidadField();

  const idx = fields.findIndex(f => {
    const k = String(f?.key ?? "").toUpperCase();
    const l = String(f?.label ?? "").toUpperCase();
    return k.includes("CRITIC") || l.includes("CRITIC");
  });

  if (idx === -1) return [...fields, responsabilidadField];

  return [
    ...fields.slice(0, idx + 1),
    responsabilidadField,
    ...fields.slice(idx + 1)
  ];
};

export default function DeficiencyModal({
  visible,
  deficiency,
  onClose,
  userId,
  selectedItem,
}) {
  const [localDef, setLocalDef] = useState(null);
  const [selectConfig, setSelectConfig] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [activeLocationField, setActiveLocationField] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);


  const isEmpty = v => v === null || v === undefined || v === "";

  
  const {
    fetchDeficiencyByIdLocal,
    fetchDeficiencyByTypificationElement,
    fetchComentarioEstandarTipiLocal, // ✅ NUEVO
    saveDeficiency
  } = useDeficiency();


  // --------------------------------------------------
  // LIMPIAR CAMPOS
  // --------------------------------------------------
  useEffect(() => {
    if (!visible) {
      setLocalDef(null);
      setSelectConfig(null);
      setShowLocationModal(false);
      setActiveLocationField(null);
      setIsSaving(false);
      setIsDirty(false);

    }
  }, [visible]);

  // --------------------------------------------------
  // CARGA / INICIALIZACIÓN (GPS si falta)
  // --------------------------------------------------
  useEffect(() => {
    if (!localDef) return;

    const latEmpty = isEmpty(localDef.DefiLatitud);
    const lngEmpty = isEmpty(localDef.DefiLongitud);

    if (!latEmpty && !lngEmpty) return;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        const loc = await Location.getCurrentPositionAsync({});

        setLocalDef(prev => ({
          ...prev,
          DefiLatitud: latEmpty ? loc.coords.latitude : prev.DefiLatitud,
          DefiLongitud: lngEmpty ? loc.coords.longitude : prev.DefiLongitud
        }));
      } catch (e) {
        console.log("Error obteniendo ubicación", e);
      }
    })();
  }, [localDef]);

  // --------------------------------------------------
  // CARGA DEFICIENCIA
  // --------------------------------------------------
  useEffect(() => {
    if (!deficiency) return;

    const load = async () => {
      // 🟢 CASO 1: viene DefiInterno → cargar EXACTO
      if (deficiency.defiInterno) {
        const def = await fetchDeficiencyByIdLocal(deficiency.defiInterno);
        if (def) {
          const baseDef = ensureResponsabilidadDefault({
            ...def,
            typificationCode: deficiency.typificationCode,
            typificationId: deficiency.typificationId,
          });

          const withStd = await ensureComentarioEstandarAsync(
            baseDef,
            deficiency,
            fetchComentarioEstandarTipiLocal
          );

          setLocalDef(withStd);
          setIsDirty(false);

          return;
        }
      }

      // 🟡 CASO 2: forceNew
      if (deficiency.forceNew) {
        const empty = createEmptyDeficiency({
          ...deficiency,
          userId,
          selectedItem
        });

        // por si createEmptyDeficiency no setea TipiInterno
        const baseDef = ensureResponsabilidadDefault({
          ...empty,
          TipiInterno: empty?.TipiInterno ?? deficiency?.typificationId ?? null,
          typificationCode: empty?.typificationCode ?? deficiency?.typificationCode,
          typificationId: empty?.typificationId ?? deficiency?.typificationId,
        });

        const withStd = await ensureComentarioEstandarAsync(
          baseDef,
          deficiency,
          fetchComentarioEstandarTipiLocal
        );

        setLocalDef(withStd);
        setIsDirty(false);

        return;
      }

      // 🔵 CASO 3: fallback por tipificación
      const result = await fetchDeficiencyByTypificationElement(
        deficiency.elementId,
        deficiency.typeElement,
        deficiency.typificationId
      );

      if (result?.length) {
        const baseDef = ensureResponsabilidadDefault({
          ...result[0],
          typificationCode: result[0]?.typificationCode ?? deficiency?.typificationCode,
          typificationId: result[0]?.typificationId ?? deficiency?.typificationId,
        });

        const withStd = await ensureComentarioEstandarAsync(
          baseDef,
          deficiency,
          fetchComentarioEstandarTipiLocal
        );

        setLocalDef(withStd);

        setIsDirty(false);

      } else {
        const empty = createEmptyDeficiency({
          ...deficiency,
          userId,
          selectedItem
        });

        const baseDef = ensureResponsabilidadDefault({
          ...empty,
          TipiInterno: empty?.TipiInterno ?? deficiency?.typificationId ?? null,
          typificationCode: empty?.typificationCode ?? deficiency?.typificationCode,
          typificationId: empty?.typificationId ?? deficiency?.typificationId,
        });

        const withStd = await ensureComentarioEstandarAsync(
          baseDef,
          deficiency,
          fetchComentarioEstandarTipiLocal
        );

        setLocalDef(withStd);
        setIsDirty(false);

      }
    };


    load();
  }, [deficiency]);


  const setFieldValue = (key, val) => {
    setLocalDef(prev => {
      const prevVal = prev?.[key];
      const nextVal = val;

      // marca dirty solo si cambia realmente
      const changed = String(prevVal ?? "") !== String(nextVal ?? "");
      if (changed) setIsDirty(true);

      return { ...prev, [key]: nextVal };
    });
  };

  if (!visible || !localDef) return null;

  const code = String(localDef.typificationCode);
  const baseFields = getDeficiencyFields(code);
  const fields = injectComentarioEstandarBeforeComentarios(
    injectResponsabilidadAfterCriticidad(baseFields)
  );




  const title = getDeficiencyLabel(code);

  const formKey = `${code}-${localDef.DefiTipoElemento}-${localDef.DefiIdElemento}-${deficiency?.nonce ?? 0}-${localDef.DefiInterno ?? 0}`;

  // --------------------------------------------------
  // 💾 GUARDAR
  // --------------------------------------------------
  const isEmptyValue = (field, value) => {
    if (value === null || value === undefined) return true;

    const s = String(value).trim();
    if (s === "") return true;

    // ✅ si es select y valor "0": solo vacío si "0" no existe en valueMap
    if (field.selectable || field.valueMap) {
      if (s === "0") {
        const hasZeroOption =
          field.valueMap && Object.prototype.hasOwnProperty.call(field.valueMap, "0");
        if (!hasZeroOption) return true;
      }
    }

    return false;
  };

  const toNumber = (v) => {
    if (v === null || v === undefined) return NaN;
    const s = String(v).trim().replace(",", ".");
    return s === "" ? NaN : parseFloat(s);
  };

  const handleSave = async () => {
    if (isSaving) return;

    // ✅ requeridos
    const missing = fields.filter(f => f.required && isEmptyValue(f, localDef[f.key]));
    if (missing.length) {
      alert(`Campos obligatorios: ${missing.map(f => f.label).join(", ")}`);
      return;
    }

    setIsSaving(true);

    try {
      // ✅ validaciones
      const errors = [];

      for (const f of fields) {
        const raw = localDef[f.key];
        if (isEmptyValue(f, raw)) continue;

        if (f.validation?.custom) {
          const msg = f.validation.custom(raw, localDef);
          if (msg) errors.push(msg);
          continue;
        }

        const hasMin = f.validation?.min !== undefined;
        const hasMax = f.validation?.max !== undefined;

        if ((hasMin || hasMax) && f.type === "number") {
          const n = toNumber(raw);

          if (!Number.isFinite(n)) {
            errors.push(`${f.label}: Ingrese un número válido.`);
            continue;
          }

          if (hasMin && n < f.validation.min) {
            errors.push(f.validation.message || `${f.label}: mínimo ${f.validation.min}`);
            continue;
          }

          if (hasMax && n > f.validation.max) {
            errors.push(f.validation.message || `${f.label}: máximo ${f.validation.max}`);
            continue;
          }
        }
      }

      if (errors.length) {
        alert(errors.join("\n"));
        setIsSaving(false);
        return;
      }

      const payload = sanitizeDefForSave(
        ensureResponsabilidadDefault({
          ...localDef,

          DefiIdElemento:
            localDef?.DefiIdElemento ??
            deficiency?.elementId ??
            localDef?.elementId,

          DefiTipoElemento:
            localDef?.DefiTipoElemento ??
            deficiency?.typeElement ??
            localDef?.typeElement,

          elementId: localDef?.elementId ?? deficiency?.elementId,
          typeElement: localDef?.typeElement ?? deficiency?.typeElement,
        })
      );





      const res = await saveDeficiency(payload, userId);

      console.log("🧾 SAVE RESULT =>", res);

      if (!res?.ok) {
        Alert.alert("Error", "No se pudo guardar la deficiencia. Intente nuevamente.");
        setIsSaving(false);
        return;
      }

      if (res?.pinMsg) {
        Alert.alert("📌 Estado del PIN actualizado", res.pinMsg, [
          {
            text: "OK",
            onPress: () => {
              setIsSaving(false);
              onClose();
            },
          },
        ]);
        return;
      }

      setIsSaving(false);
      onClose();
    } catch (error) {
      console.error(error);
      alert("Error al guardar");
      setIsSaving(false);
    }
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {/* HEADER */}
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <TouchableOpacity onPress={onClose} disabled={isSaving}>
                  <Text style={styles.close}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* FORM */}
              <ScrollView>
                <View key={formKey}>
                  {fields.map(field => {
                    if (field.hidden) return null;

                    const value = localDef[field.key];

                    // 📍 LAT / LNG
                    if (field.key === "DefiLatitud" || field.key === "DefiLongitud") {
                      return (
                        <View key={field.key} style={{ marginBottom: 15 }}>
                          <TouchableOpacity
                            onPress={() => {
                              setActiveLocationField(field.key);
                              setShowLocationModal(true);
                            }}
                            style={styles.locationLabel}
                          >
                            <Text style={{ fontWeight: "700" }}>{field.label}</Text>
                          </TouchableOpacity>

                          <DeficiencyField field={field} value={value} editable={false} />
                        </View>
                      );
                    }

                    // 🔽 SELECT (valueMap)
                    if (field.valueMap) {
                      const items = Object.entries(field.valueMap).map(
                        ([val, label]) => ({ value: val, label })
                      );

                      return (
                        <DeficiencyField
                          key={`${formKey}-${field.key}`}
                          field={field}
                          value={value} // ✅ CRUDO (DeficiencyField se encarga de mostrar label)
                          onPress={
                            field.selectable
                              ? () =>
                                setSelectConfig({
                                  field: field.key,
                                  title: field.label,
                                  items,
                                  labelKey: "label",
                                  valueKey: "value"
                                })
                              : null
                          }
                        />
                      );
                    }

                    // ✏️ INPUT
                    return (
                      <DeficiencyField
                        key={`${formKey}-${field.key}`}
                        field={field}
                        value={value}
                        onChange={(val) => setFieldValue(field.key, val)}

                      />
                    );
                  })}
                </View>
              </ScrollView>

              {/* BOTONES */}
              <View style={styles.buttons}>
                <TouchableOpacity
                  style={[
                    styles.btnSave,
                    (isSaving || !isDirty) && { opacity: 0.5, backgroundColor: "#888" }
                  ]}
                  onPress={handleSave}
                  disabled={isSaving || !isDirty}

                >
                  <Text style={styles.btnText}>
                    {isSaving ? "Guardando..." : "Guardar"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* SELECT MODAL */}
              <SelectModal
                visible={!!selectConfig}
                title={selectConfig?.title}
                items={selectConfig?.items ?? []}
                labelKey={selectConfig?.labelKey}
                valueKey={selectConfig?.valueKey}
                selectedValue={selectConfig ? localDef?.[selectConfig.field] : null}
                onSelect={(val) => setFieldValue(selectConfig.field, val)}

                onClose={() => setSelectConfig(null)}
              />

              {/* LOCATION MODAL */}
              <LocationModal
                visible={showLocationModal}
                onClose={() => setShowLocationModal(false)}
                onConfirm={coords => {
                  if (activeLocationField) {
                    const v = coords[activeLocationField === "DefiLatitud" ? "latitude" : "longitude"];
                    setFieldValue(activeLocationField, v);

                  }
                  setShowLocationModal(false);
                }}
              />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#0008",
    justifyContent: "center",
    padding: 12
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    maxHeight: "90%"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  title: { fontSize: 20, fontWeight: "700" },
  close: { fontSize: 22, fontWeight: "700", color: "#555" },

  // RN toma el último "buttons"
  buttons: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12
  },

  btnSave: {
    backgroundColor: "#27ae60",
    padding: 12,
    borderRadius: 8,
    width: "60%",
    alignItems: "center"
  },
  btnText: { color: "#fff", fontWeight: "600" },
  locationLabel: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "flex-start"
  }
});
