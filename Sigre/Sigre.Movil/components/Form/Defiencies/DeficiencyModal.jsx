import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
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
  const isEmpty = v =>
  v === null || v === undefined || v === "";

  const {
    fetchDeficiencyByTypificationElement,
    saveDeficiency,
    deleteDeficiency
  } = useDeficiency();

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

    const load = async () => {
      const {
        elementId,
        typeElement,
        typificationId,
        typificationCode,
        tableId
      } = deficiency;

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

  // --------------------------------------------------
  // 💾 GUARDAR
  // --------------------------------------------------
  const handleSave = async () => {
    const missing = fields.filter(f => f.required && !localDef[f.key]);
    if (missing.length) {
      alert(
        `Campos obligatorios: ${missing.map(f => f.label).join(", ")}`
      );
      return;
    }

    const invalid = fields
      .filter(f => f.validation && localDef[f.key] != null)
      .filter(
        f =>
          localDef[f.key] < f.validation.min ||
          localDef[f.key] > f.validation.max
      );

    if (invalid.length) {
      alert(invalid.map(f => f.validation.message).join("\n"));
      return;
    }

    await saveDeficiency(localDef, userId);
    onClose();
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* FORM */}
          <ScrollView>
            {fields.map(field => {
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
                    key={field.key}
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
                  key={field.key}
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
          </ScrollView>

          {/* BOTONES */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.btnSave}
              onPress={handleSave}
            >
              <Text style={styles.btnText}>Guardar</Text>
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
        </View>
      </View>
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
