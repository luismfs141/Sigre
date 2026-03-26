
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
const CODOP_INTERNO_FIELD = "CodopInterno";

const buildComentarioEstandarField = () => ({
  key: TIPI_COMENTARIO_ESTANDAR,
  label: "Comentario estándar",
  type: "text",
  readonly: true,
  required: false,
  placeholder: "",
});

const buildCodigosOpcionesField = () => ({
  key: CODOP_INTERNO_FIELD,
  label: "Opción",
  type: "text",
  readonly: true,
  required: false,
  placeholder: "",
});

const pickComentarioEstandarFromProp = (deficiencyProp) => {
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

  const fromProp = pickComentarioEstandarFromProp(deficiencyProp);
  if (fromProp) {
    return { ...base, [TIPI_COMENTARIO_ESTANDAR]: fromProp };
  }

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

  if (fields.some(f => f?.key === TIPI_COMENTARIO_ESTANDAR)) return fields;

  const comentarioStdField = buildComentarioEstandarField();

  const idx = fields.findIndex(f => {
    const k = String(f?.key ?? "").toUpperCase();
    const l = String(f?.label ?? "").toUpperCase();

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

const injectCodigosOpcionesAfterComentarioEstandar = (baseFields) => {
  const fields = Array.isArray(baseFields) ? baseFields : [];

  if (fields.some(f => f?.key === CODOP_INTERNO_FIELD)) return fields;

  const codopField = buildCodigosOpcionesField();

  const idxStd = fields.findIndex(f => f?.key === TIPI_COMENTARIO_ESTANDAR);
  if (idxStd !== -1) {
    return [
      ...fields.slice(0, idxStd + 1),
      codopField,
      ...fields.slice(idxStd + 1),
    ];
  }

  const idxComment = fields.findIndex(f => {
    const k = String(f?.key ?? "").toUpperCase();
    const l = String(f?.label ?? "").toUpperCase();
    return (
      k === "DEFICOMENTARIO" ||
      (l.includes("COMENT") && !l.includes("ESTANDAR") && !l.includes("ESTÁNDAR"))
    );
  });

  if (idxComment === -1) return [...fields, codopField];

  return [
    ...fields.slice(0, idxComment),
    codopField,
    ...fields.slice(idxComment),
  ];
};

const sanitizeDefForSave = (def) => {
  if (!def || typeof def !== "object") return def;
  const copy = { ...def };

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
  const current = def ?? {};

  const code = String(
    current?.typificationCode ??
    current?.Code ??
    current?.data?.typificationCode ??
    ""
  ).trim();

  if (code === "0000") {
    return { ...current, [RESPONSABILIDAD]: null };
  }

  const v = current?.[RESPONSABILIDAD];
  const empty = v === null || v === undefined || String(v).trim() === "";
  return empty ? { ...current, [RESPONSABILIDAD]: "SEAL" } : current;
};

const isSinDeficienciaCode = (code) => String(code ?? "").trim() === "0000";

const injectResponsabilidadAfterCriticidad = (baseFields) => {
  const fields = Array.isArray(baseFields) ? baseFields : [];

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
  onSaved,
  userId,
  selectedItem,
}) {
  const [localDef, setLocalDef] = useState(null);
  const [selectConfig, setSelectConfig] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [activeLocationField, setActiveLocationField] = useState(null);
  const [codigosOpcionesItems, setCodigosOpcionesItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const isEmpty = v => v === null || v === undefined || v === "";

  const {
    fetchDeficiencyByIdLocal,
    fetchDeficiencyByTypificationElement,
    fetchComentarioEstandarTipiLocal,
    fetchCodigosOpcionesTipiLocal,
    saveDeficiency
  } = useDeficiency();

  useEffect(() => {
    if (!visible) {
      setLocalDef(null);
      setSelectConfig(null);
      setShowLocationModal(false);
      setActiveLocationField(null);
      setCodigosOpcionesItems([]);
      setIsSaving(false);
      setIsDirty(false);
    }
  }, [visible]);

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

  useEffect(() => {
    if (!deficiency) return;

    const load = async () => {
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

      if (deficiency.forceNew) {
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
        return;
      }

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

  useEffect(() => {
    if (!visible || !localDef) return;

    let cancelled = false;

    const loadCodigosOpciones = async () => {
      const code =
        localDef?.typificationCode ??
        deficiency?.typificationCode ??
        "";

      if (isSinDeficienciaCode(code)) {
        if (!cancelled) {
          setCodigosOpcionesItems([]);

          setLocalDef(prev => {
            if (!prev) return prev;
            if (prev[CODOP_INTERNO_FIELD] == null) return prev;
            return { ...prev, [CODOP_INTERNO_FIELD]: null };
          });
        }
        return;
      }

      const typiId =
        localDef?.TipiInterno ??
        localDef?.typificationId ??
        deficiency?.typificationId ??
        null;

      if (!typiId) {
        if (!cancelled) {
          setCodigosOpcionesItems(prev =>
            Array.isArray(prev) && prev.length === 0 ? prev : []
          );

          setLocalDef(prev => {
            if (!prev) return prev;
            if (prev[CODOP_INTERNO_FIELD] == null) return prev;
            return { ...prev, [CODOP_INTERNO_FIELD]: null };
          });
        }
        return;
      }

      const items = await fetchCodigosOpcionesTipiLocal(typiId);
      if (cancelled) return;

      const safeItems = Array.isArray(items) ? items : [];

      setCodigosOpcionesItems(prev => {
        const prevJson = JSON.stringify(prev ?? []);
        const nextJson = JSON.stringify(safeItems);
        return prevJson === nextJson ? prev : safeItems;
      });

      if (safeItems.length === 0) {
        setLocalDef(prev => {
          if (!prev) return prev;
          if (prev[CODOP_INTERNO_FIELD] == null) return prev;
          return { ...prev, [CODOP_INTERNO_FIELD]: null };
        });
      }
    };

    loadCodigosOpciones();

    return () => {
      cancelled = true;
    };
  }, [
    visible,
    localDef?.TipiInterno,
    localDef?.typificationId,
    deficiency?.typificationId
  ]);

  const setFieldValue = (key, val) => {
    setLocalDef(prev => {
      const prevVal = prev?.[key];
      const nextVal = val;

      const changed = String(prevVal ?? "") !== String(nextVal ?? "");
      if (changed) setIsDirty(true);

      return { ...prev, [key]: nextVal };
    });
  };

  if (!visible || !localDef) return null;

  const code = String(localDef.typificationCode ?? "").trim();
  const isSinDeficiencia = isSinDeficienciaCode(code);

  const baseFields = getDeficiencyFields(code);

  const fields = (
    isSinDeficiencia
      ? baseFields
      : injectCodigosOpcionesAfterComentarioEstandar(
        injectComentarioEstandarBeforeComentarios(
          injectResponsabilidadAfterCriticidad(baseFields)
        )
      )
  ).filter(field => {
    if (!isSinDeficiencia) return true;

    return ![
      RESPONSABILIDAD,
      TIPI_COMENTARIO_ESTANDAR,
      CODOP_INTERNO_FIELD,
    ].includes(field?.key);
  });

  const title = getDeficiencyLabel(code);

  const formKey = `${code}-${localDef.DefiTipoElemento}-${localDef.DefiIdElemento}-${deficiency?.nonce ?? 0}-${localDef.DefiInterno ?? 0}`;

  const isEmptyValue = (field, value) => {
    if (value === null || value === undefined) return true;

    const s = String(value).trim();
    if (s === "") return true;

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

    const existedBeforeSave = !!(
      localDef?.DefiInterno ??
      deficiency?.defiInterno
    );

    const missing = fields.filter(f => f.required && isEmptyValue(f, localDef[f.key]));
    if (missing.length) {
      alert(`Campos obligatorios: ${missing.map(f => f.label).join(", ")}`);
      return;
    }

    setIsSaving(true);

    try {
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

      const payloadBase = {
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
      };

      const payload = sanitizeDefForSave(
        isSinDeficienciaCode(code)
          ? {
            ...payloadBase,
            DefiCol2: null,
            CodopInterno: null,
            DefiComentario: String(payloadBase?.DefiComentario ?? ""),
          }
          : ensureResponsabilidadDefault(payloadBase)
      );

      const res = await saveDeficiency(payload, userId);

      if (!res?.ok) {
        Alert.alert("Error", "No se pudo guardar la deficiencia. Intente nuevamente.");
        setIsSaving(false);
        return;
      }

      const savedDefId =
        res?.defId ??
        res?.DefiInterno ??
        res?.defiInterno ??
        payload?.DefiInterno ??
        localDef?.DefiInterno ??
        deficiency?.defiInterno ??
        null;

      const uiData = {
        ...localDef,
        ...payload,
        DefiInterno: savedDefId ?? localDef?.DefiInterno,
        defiInterno: savedDefId ?? localDef?.DefiInterno,
      };

      onSaved?.({
        defId: savedDefId,
        data: uiData,
        isNew: !existedBeforeSave,
        pinMsg: res?.pinMsg ?? null,
      });

      if (res?.pinMsg) {
        Alert.alert("📌 Estado del PIN actualizado", res.pinMsg, [
          {
            text: "OK",
            onPress: () => {
              setIsSaving(false);
              setIsDirty(false);
              onClose?.();
            },
          },
        ]);
        return;
      }

      setIsSaving(false);
      setIsDirty(false);
      onClose?.();
    } catch (error) {
      console.error(error);
      alert("Error al guardar");
      setIsSaving(false);
    }
  };

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
              keyboardShouldPersistTaps="always"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <TouchableOpacity onPress={onClose} disabled={isSaving}>
                  <Text style={styles.close}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView keyboardShouldPersistTaps="always">
                <View key={formKey}>
                  {fields.map(field => {
                    if (field.hidden) return null;

                    const value = localDef[field.key];

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

                    if (field.key === CODOP_INTERNO_FIELD) {
                      const hasOptions = Array.isArray(codigosOpcionesItems) && codigosOpcionesItems.length > 0;
                      const selectedOption = hasOptions
                        ? codigosOpcionesItems.find(opt => Number(opt.value) === Number(localDef?.[CODOP_INTERNO_FIELD]))
                        : null;

                      const displayValue = hasOptions
                        ? (selectedOption?.label ?? "Seleccione...")
                        : "No hay opciones";

                      return (
                        <DeficiencyField
                          key={`${formKey}-${field.key}`}
                          field={field}
                          value={displayValue}
                          onPress={
                            hasOptions
                              ? () =>
                                setSelectConfig({
                                  field: field.key,
                                  title: field.label,
                                  items: codigosOpcionesItems,
                                  labelKey: "label",
                                  valueKey: "value"
                                })
                              : null
                          }
                        />
                      );
                    }

                    if (field.valueMap) {
                      const items = Object.entries(field.valueMap).map(
                        ([val, label]) => ({ value: val, label })
                      );

                      return (
                        <DeficiencyField
                          key={`${formKey}-${field.key}`}
                          field={field}
                          value={value}
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

              <SelectModal
                visible={!!selectConfig}
                title={selectConfig?.title}
                items={selectConfig?.items ?? []}
                labelKey={selectConfig?.labelKey}
                valueKey={selectConfig?.valueKey}
                selectedValue={selectConfig ? localDef?.[selectConfig.field] : null}
                onSelect={(val) => {
                  if (!selectConfig) return;

                  if (selectConfig.field === CODOP_INTERNO_FIELD) {
                    const parsed =
                      val === null || val === undefined || val === ""
                        ? null
                        : Number(val);

                    setFieldValue(
                      CODOP_INTERNO_FIELD,
                      Number.isFinite(parsed) ? parsed : null
                    );
                  } else {
                    setFieldValue(selectConfig.field, val);
                  }
                }}
                onClose={() => setSelectConfig(null)}
              />

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