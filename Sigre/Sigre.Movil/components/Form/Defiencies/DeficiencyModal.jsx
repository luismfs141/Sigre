import * as Location from "expo-location";
import {
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

export default function DeficiencyModal({
  visible,
  deficiency,
  onClose,
  onDelete, // 👈 callback al padre (Inspection)
  userId,
  selectedItem,
}) {
  const [localDef, setLocalDef] = useState(null);
  const [selectConfig, setSelectConfig] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [activeLocationField, setActiveLocationField] = useState(null);
  // En DeficiencyModal.js
  const [isSaving, setIsSaving] = useState(false);
  const isEmpty = v =>
    v === null || v === undefined || v === "";

  const {
    fetchDeficiencyByTypificationElement,
    saveDeficiency,
    deleteDeficiency
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
    }
  }, [visible]);



  // --------------------------------------------------
  // CARGA / INICIALIZACIÓN
  // --------------------------------------------------
  useEffect(() => {
    if (!localDef) return;

    const latEmpty = isEmpty(localDef.DefiLatitud);
    const lngEmpty = isEmpty(localDef.DefiLongitud);

    // 🚫 Si ya existen ambos, no hacer nada
    if (!latEmpty && !lngEmpty) return;

    (async () => {
      try {
        const { status } =
          await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") return;

        const loc = await Location.getCurrentPositionAsync({});

        setLocalDef(prev => ({
          ...prev,
          DefiLatitud: latEmpty
            ? loc.coords.latitude
            : prev.DefiLatitud,
          DefiLongitud: lngEmpty
            ? loc.coords.longitude
            : prev.DefiLongitud
        }));
      } catch (e) {
        console.log("Error obteniendo ubicación", e);
      }
    })();
  }, [localDef]);



  useEffect(() => {
    if (!deficiency) return;

    // const load = async () => {
    //   const {
    //     elementId,
    //     typeElement,
    //     typificationId,
    //     typificationCode,
    //     tableId
    //   } = deficiency;

    //   const result = await fetchDeficiencyByTypificationElement(
    //     elementId,
    //     typeElement,
    //     typificationId
    //   );

    //   if (result && result.length > 0) {
    //     setLocalDef({ ...result[0], typificationId, typificationCode });
    //   } else {
    //     setLocalDef(
    //       createEmptyDeficiency({
    //         typificationId,
    //         typificationCode,
    //         tableId,
    //         elementId,
    //         typeElement,
    //         userId,
    //         selectedItem
    //       })
    //     );
    //   }
    // };
    const load = async () => {
      const {
        elementId,
        typeElement,
        typificationId,
        typificationCode,
        tableId,
        forceNew
      } = deficiency;

      // ✅ SI VIENE forceNew => SIEMPRE nuevo registro (NO cargar el existente)
      if (forceNew) {
        setLocalDef(
          createEmptyDeficiency({
            typificationId,
            typificationCode,
            tableId,
            elementId,
            typeElement,
            userId,
            selectedItem
          })
        );
        return;
      }

      // 🟢 Caso normal (únicas): cargar si existe, sino crear
      const result = await fetchDeficiencyByTypificationElement(
        elementId,
        typeElement,
        typificationId
      );

      if (result && result.length > 0) {
        setLocalDef({ ...result[0], typificationId, typificationCode });
      } else {
        setLocalDef(
          createEmptyDeficiency({
            typificationId,
            typificationCode,
            tableId,
            elementId,
            typeElement,
            userId,
            selectedItem
          })
        );
      }
    };


    load();
  }, [deficiency]);

  if (!visible || !localDef) return null;

  const code = String(localDef.typificationCode);
  const fields = getDeficiencyFields(code);
  const title = getDeficiencyLabel(code);
  //const formKey = `${code}-${localDef.DefiTipoElemento}-${localDef.DefiIdElemento}-${localDef.DefiInterno ?? 0}`;
  const formKey = `${code}-${localDef.DefiTipoElemento}-${localDef.DefiIdElemento}-${deficiency?.nonce ?? 0}-${localDef.DefiInterno ?? 0}`;


  // --------------------------------------------------
  // 💾 GUARDAR
  // --------------------------------------------------
  // const handleSave = async () => {
  //   const missing = fields.filter(f => f.required && !localDef[f.key]);
  //   if (missing.length) {
  //     alert(
  //       `Campos obligatorios: ${missing.map(f => f.label).join(", ")}`
  //     );
  //     return;
  //   }

  //   const invalid = fields
  //     .filter(f => f.validation && localDef[f.key] != null)
  //     .filter(
  //       f =>
  //         localDef[f.key] < f.validation.min ||
  //         localDef[f.key] > f.validation.max
  //     );

  //   if (invalid.length) {
  //     alert(invalid.map(f => f.validation.message).join("\n"));
  //     return;
  //   }

  //   await saveDeficiency(localDef, userId);
  //   onClose();
  // };

  const isEmptyValue = (field, value) => {
    if (value === null || value === undefined) return true;

    const s = String(value).trim();
    if (s === "") return true;

    // ✅ Si es select y el valor es "0":
    // solo considerarlo "vacío" si "0" NO existe en su valueMap
    if (field.selectable || field.valueMap) {
      if (s === "0") {
        const hasZeroOption =
          field.valueMap && Object.prototype.hasOwnProperty.call(field.valueMap, "0");

        // Si NO hay opción 0 => entonces sí es "no seleccionado"
        if (!hasZeroOption) return true;
      }
    }

    return false;
  };


  const toNumber = (v) => {
    if (v === null || v === undefined) return NaN;
    const s = String(v).trim().replace(",", "."); // por si escriben 5,5
    return s === "" ? NaN : parseFloat(s);
  };

  const handleSave = async () => {
    // 🛑 BLOQUEO INICIAL: Si ya se está guardando, ignorar nuevos clics
    if (isSaving) return;
    // ✅ 1) REQUERIDOS (mejorado)
    const missing = fields.filter(f => f.required && isEmptyValue(f, localDef[f.key]));
    if (missing.length) {
      alert(`Campos obligatorios: ${missing.map(f => f.label).join(", ")}`);
      return;
    }
    // 🔒 ACTIVAR BLOQUEO
    setIsSaving(true)
    try {
      // ✅ 2) VALIDACIONES (min/max + custom)
      const errors = [];

      for (const f of fields) {
        const raw = localDef[f.key];

        // si está vacío, no validar rangos (required ya filtró arriba)
        if (isEmptyValue(f, raw)) continue;

        // ✅ 2A) custom (AQUÍ se ejecuta tu lógica condicional y verás el console.log)
        if (f.validation?.custom) {
          const msg = f.validation.custom(raw, localDef);
          if (msg) errors.push(msg);
          continue; // si quieres que custom sea la autoridad, no seguir con min/max
        }

        // ✅ 2B) min/max (solo si existen)
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
        return;
      }

      await saveDeficiency(localDef, userId);
      onClose();
    } catch (error) {
      console.error(error);
      alert("Error al guardar");

      // 3. DESBLOQUEAR SOLO SI HUBO ERROR (Para intentar de nuevo)
      setIsSaving(false); // <--- NUEVO
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
                <TouchableOpacity onPress={onClose}>
                  <Text style={styles.close}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* FORM */}
              <ScrollView>
                <View key={formKey}>
                  {fields.map(field => {
                    if (field.hidden) return null;//--- para que respete el Hidden de deficiencyFieldMap

                    const value = localDef[field.key];

                    // 📍 LAT / LNG
                    if (
                      field.key === "DefiLatitud" ||
                      field.key === "DefiLongitud"
                    ) {
                      return (
                        <View key={field.key} style={{ marginBottom: 15 }}>
                          <TouchableOpacity
                            onPress={() => {
                              setActiveLocationField(field.key);
                              setShowLocationModal(true);
                            }}
                            style={styles.locationLabel}
                          >
                            <Text style={{ fontWeight: "700" }}>
                              {field.label}
                            </Text>
                          </TouchableOpacity>

                          <DeficiencyField
                            field={field}
                            value={value}
                            editable={false}
                          />
                        </View>
                      );
                    }

                    // 🔽 SELECT
                    if (field.valueMap) {
                      const items = Object.entries(field.valueMap).map(
                        ([val, label]) => ({ value: val, label })
                      );

                      return (
                        <DeficiencyField
                          // key={field.key}
                          key={`${formKey}-${field.key}`}
                          field={field}
                          value={
                            items.find(
                              i => String(i.value) === String(value)
                            )?.label ?? ""
                          }
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
                        // key={field.key}
                        key={`${formKey}-${field.key}`}
                        field={field}
                        value={value}
                        onChange={val =>
                          setLocalDef(prev => ({
                            ...prev,
                            [field.key]: val
                          }))
                        }
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
                    // 🎨 CAMBIO VISUAL: Bajamos la opacidad si está guardando
                    isSaving && { opacity: 0.5, backgroundColor: '#888' }
                  ]}
                  onPress={handleSave}
                  disabled={isSaving} // 🚫 DESHABILITADO FÍSICO
                >
                  <Text style={styles.btnText}>
                    {isSaving ? "Guardando..." : "Guardar"} {/* 📝 TEXTO DINÁMICO */}
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
                selectedValue={
                  selectConfig ? localDef?.[selectConfig.field] : null
                }
                onSelect={val =>
                  setLocalDef(prev => ({
                    ...prev,
                    [selectConfig.field]: val
                  }))
                }
                onClose={() => setSelectConfig(null)}
              />

              {/* LOCATION MODAL */}
              <LocationModal
                visible={showLocationModal}
                onClose={() => setShowLocationModal(false)}
                onConfirm={coords => {
                  if (activeLocationField) {
                    setLocalDef(prev => ({
                      ...prev,
                      [activeLocationField]:
                        coords[
                        activeLocationField === "DefiLatitud"
                          ? "latitude"
                          : "longitude"
                        ]
                    }));
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
    justifyContent: "space-between",
    marginTop: 12
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "center", // <-- centra horizontalmente
    marginTop: 12
  },
  btnSave: {
    backgroundColor: "#27ae60",
    padding: 12,
    borderRadius: 8,
    width: "60%", // opcional, se puede ajustar según se vea mejor
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
