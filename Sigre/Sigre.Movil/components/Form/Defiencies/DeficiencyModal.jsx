// DeficiencyModal.jsx
import { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function DeficiencyModal({
  visible,
  onClose,
  onSave,
  deficiency, // objeto cargado desde DB (puede ser null si es nuevo)
  item // item de la lista (mayor contexto)
}) {
  // Inicializar con TODOS los campos
  const empty = {
    DefiInterno: "",
    DefiEstado: "",
    InspInterno: "",
    TablInterno: "",
    DefiCodigoElemento: "",
    TipiInterno: "",
    DefiNumSuministro: "",
    DefiFechaDenuncia: "",
    DefiFechaInspeccion: "",
    DefiFechaSubsanacion: "",
    DefiObservacion: "",
    DefiEstadoSubsanacion: "",
    DefiLatitud: "",
    DefiLongitud: "",
    DefiTipoElemento: "",
    DefiDistHorizontal: "",
    DefiDistVertical: "",
    DefiDistTransversal: "",
    DefiIdElemento: "",
    DefiFecRegistro: "",
    DefiCodDef: "",
    DefiCodRes: "",
    DefiCodDen: "",
    DefiRefer1: "",
    DefiRefer2: "",
    DefiCoordX: "",
    DefiCoordY: "",
    DefiCodAmt: "",
    DefiNroOrden: "",
    DefiPointX: "",
    DefiPointY: "",
    DefiUsuCre: "",
    DefiUsuNpc: "",
    DefiFecModificacion: "",
    DefiFechaCreacion: "",
    DefiTipoMaterial: "",
    DefiNodoInicial: "",
    DefiNodoFinal: "",
    DefiTipoRetenida: "",
    DefiRetenidaMaterial: "",
    DefiTipoArmado: "",
    DefiArmadoMaterial: "",
    DefiNumPostes: "",
    DefiPozoTierra: "",
    DefiResponsable: "",
    DefiComentario: "",
    DefiPozoTierra2: "",
    DefiUsuarioInic: "",
    DefiUsuarioMod: "",
    DefiActivo: "",
    DefiEstadoCriticidad: "",
    DefiInspeccionado: "",
    DefiKeyWords: "",
    DefiCol1: "",
    DefiCol2: "",
    DefiCol3: "",
    InspInternoNavigationInspInterno: "",
    EstadoOffLine: ""
  };

  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (deficiency) {
      // Mapear todos los campos del objeto loaded
      setForm(prev => ({ ...prev, ...deficiency }));
    } else {
      // Si no hay deficiencia cargada, iniciar con datos básicos sacados del item
      const base = {
        DefiTipoElemento: item?.type === "general" ? determineTypeFromItem(item?.data) : item?.data?.DefiTipoElemento,
        DefiIdElemento: item?.data?.elementId ?? item?.data?.id ?? item?.data?.PostInterno ?? item?.data?.VanoInterno ?? item?.data?.SedInterno ?? "",
        DefiLatitud: item?.data?.PostLatitud ?? item?.data?.VanoLatitudIni ?? item?.data?.SedLatitud ?? "",
        DefiLongitud: item?.data?.PostLongitud ?? item?.data?.VanoLongitudIni ?? item?.data?.SedLongitud ?? "",
        DefiFechaInspeccion: new Date().toISOString(),
        DefiInspeccionado: 1,
        DefiActivo: 1
      };
      setForm(prev => ({ ...prev, ...base }));
    }
  }, [deficiency, item]);

  function determineTypeFromItem(data) {
    if (!data) return "";
    if (Object.prototype.hasOwnProperty.call(data, "PostInterno")) return "poste";
    if (Object.prototype.hasOwnProperty.call(data, "VanoInterno")) return "vano";
    if (Object.prototype.hasOwnProperty.call(data, "SedInterno")) return "sed";
    return "";
  }

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const save = () => {
    // Aquí puedes transformar tipos si quieres antes de guardar
    onSave?.(form);
  };

  // Helper: render input for each field
  const renderField = (label, key, opts = {}) => (
    <View key={key} style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={form[key] !== null && form[key] !== undefined ? String(form[key]) : ""}
        onChangeText={(v) => update(key, v)}
        keyboardType={opts.keyboardType || "default"}
        multiline={opts.multiline || false}
      />
    </View>
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView>
            <Text style={styles.title}>Deficiencia</Text>

            {/* Renderizamos todos los campos que enviaste */}
            {renderField("DefiInterno", "DefiInterno")}
            {renderField("DefiEstado", "DefiEstado")}
            {renderField("InspInterno", "InspInterno")}
            {renderField("TablInterno", "TablInterno")}
            {renderField("DefiCodigoElemento", "DefiCodigoElemento")}
            {renderField("TipiInterno", "TipiInterno")}
            {renderField("DefiNumSuministro", "DefiNumSuministro")}
            {renderField("DefiFechaDenuncia", "DefiFechaDenuncia")}
            {renderField("DefiFechaInspeccion", "DefiFechaInspeccion")}
            {renderField("DefiFechaSubsanacion", "DefiFechaSubsanacion")}
            {renderField("DefiObservacion", "DefiObservacion", { multiline: true })}
            {renderField("DefiEstadoSubsanacion", "DefiEstadoSubsanacion")}
            {renderField("DefiLatitud", "DefiLatitud", { keyboardType: "numeric" })}
            {renderField("DefiLongitud", "DefiLongitud", { keyboardType: "numeric" })}
            {renderField("DefiTipoElemento", "DefiTipoElemento")}
            {renderField("DefiDistHorizontal", "DefiDistHorizontal")}
            {renderField("DefiDistVertical", "DefiDistVertical")}
            {renderField("DefiDistTransversal", "DefiDistTransversal")}
            {renderField("DefiIdElemento", "DefiIdElemento")}
            {renderField("DefiFecRegistro", "DefiFecRegistro")}
            {renderField("DefiCodDef", "DefiCodDef")}
            {renderField("DefiCodRes", "DefiCodRes")}
            {renderField("DefiCodDen", "DefiCodDen")}
            {renderField("DefiRefer1", "DefiRefer1")}
            {renderField("DefiRefer2", "DefiRefer2")}
            {renderField("DefiCoordX", "DefiCoordX", { keyboardType: "numeric" })}
            {renderField("DefiCoordY", "DefiCoordY", { keyboardType: "numeric" })}
            {renderField("DefiCodAmt", "DefiCodAmt")}
            {renderField("DefiNroOrden", "DefiNroOrden")}
            {renderField("DefiPointX", "DefiPointX", { keyboardType: "numeric" })}
            {renderField("DefiPointY", "DefiPointY", { keyboardType: "numeric" })}
            {renderField("DefiUsuCre", "DefiUsuCre")}
            {renderField("DefiUsuNpc", "DefiUsuNpc")}
            {renderField("DefiFecModificacion", "DefiFecModificacion")}
            {renderField("DefiFechaCreacion", "DefiFechaCreacion")}
            {renderField("DefiTipoMaterial", "DefiTipoMaterial")}
            {renderField("DefiNodoInicial", "DefiNodoInicial")}
            {renderField("DefiNodoFinal", "DefiNodoFinal")}
            {renderField("DefiTipoRetenida", "DefiTipoRetenida")}
            {renderField("DefiRetenidaMaterial", "DefiRetenidaMaterial")}
            {renderField("DefiTipoArmado", "DefiTipoArmado")}
            {renderField("DefiArmadoMaterial", "DefiArmadoMaterial")}
            {renderField("DefiNumPostes", "DefiNumPostes")}
            {renderField("DefiPozoTierra", "DefiPozoTierra")}
            {renderField("DefiResponsable", "DefiResponsable")}
            {renderField("DefiComentario", "DefiComentario", { multiline: true })}
            {renderField("DefiPozoTierra2", "DefiPozoTierra2")}
            {renderField("DefiUsuarioInic", "DefiUsuarioInic")}
            {renderField("DefiUsuarioMod", "DefiUsuarioMod")}
            {renderField("DefiActivo", "DefiActivo")}
            {renderField("DefiEstadoCriticidad", "DefiEstadoCriticidad")}
            {renderField("DefiInspeccionado", "DefiInspeccionado")}
            {renderField("DefiKeyWords", "DefiKeyWords")}
            {renderField("DefiCol1", "DefiCol1")}
            {renderField("DefiCol2", "DefiCol2")}
            {renderField("DefiCol3", "DefiCol3")}
            {renderField("InspInternoNavigationInspInterno", "InspInternoNavigationInspInterno")}
            {renderField("EstadoOffLine", "EstadoOffLine")}

          </ScrollView>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
              <Text style={styles.btnText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnSave} onPress={save}>
              <Text style={styles.btnText}>Guardar</Text>
            </TouchableOpacity>
          </View>
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
    maxHeight: "92%"
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8
  },
  row: { marginBottom: 10 },
  label: { fontWeight: "600", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 8,
    backgroundColor: "#fafafa"
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10
  },
  btnCancel: { backgroundColor: "#c0392b", padding: 12, borderRadius: 8, width: "48%", alignItems: "center" },
  btnSave: { backgroundColor: "#27ae60", padding: 12, borderRadius: 8, width: "48%", alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "600" }
});
