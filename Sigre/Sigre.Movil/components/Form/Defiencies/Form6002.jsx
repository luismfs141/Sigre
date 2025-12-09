import { FontAwesome5 } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import * as Location from "expo-location";
import { forwardRef, useContext, useEffect, useImperativeHandle, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AuthContext } from "../../../context/AuthContext";
import { useDatos } from "../../../context/DatosContext";
import { useDeficiency } from "../../../hooks/useDeficiency";

const observationOptions = [
  "POSTE ROTO",
  "POSTE APOLILLADO",
  "POSTE CORROIDO",
  "AISLADORES COMPROMETIDOS",
  "COMPONENTES OXIDADOS",
  "FIERROS EXPUESTOS"
];

const estadoLabels = {
  N: "DEFICIENCIA NUEVA",
  O: "SIN DEFICIENCIA",
  S: "DEFICIENCIA SEAL"
};

const criticidadLabels = {
  1: "LEVE",
  2: "MODERADA",
  3: "CRÍTICA"
};

const Form6002 = forwardRef(({ data }, ref) => {
  const { user } = useContext(AuthContext);
  const { selectedItem } = useDatos();
  const { fetchDeficiencyByTypificationElement } = useDeficiency();

  /** 🔵 ESTADO CENTRAL DE DEFICIENCIA */
  const [deficiencia, setDeficiencia] = useState({
    DefiInterno: 0,
    DefiEstado: "N",
    TablInterno: data.tableId ?? null,
    DefiCodigoElemento: selectedItem.PostCodigoNodo ?? "",
    TipiInterno: data.typificationId ?? null,
    DefiNumSuministro: "",
    DefiFechaDenuncia: "",
    DefiFechaInspeccion: "",
    DefiObservacion: "",
    DefiEstadoSubsanacion: "",
    DefiLatitud: "",
    DefiLongitud: "",
    DefiTipoElemento: data.elementType ?? "",
    DefiDistHorizontal: "",
    DefiDistVertical: "",
    DefiDistTransversal: "",
    DefiIdElemento: data.elementId ?? 0,
    DefiFecRegistro: "",
    DefiCodAmt: selectedItem.AlimInterno ?? "",
    DefiFecModificacion: "",
    DefiFechaCreacion: "",
    DefiPozoTierra: null,
    DefiResponsable: null,
    DefiComentario: "",
    DefiPozoTierra2: null,
    DefiUsuarioInic: null,
    DefiUsuarioMod: null,
    DefiActivo: 1,
    DefiEstadoCriticidad: 1,
    DefiInspeccionado: 1,
    DefiCol1: selectedItem.PostSubestacion ?? "",
    EstadoOffLine: 0
  });

  const [filteredObservations, setFilteredObservations] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  /** 🔧 ACTUALIZADOR */
  const update = (key, value) =>
    setDeficiencia(prev => ({ ...prev, [key]: value }));

  /** 🔄 CARGA AL INICIAR */
  useEffect(() => {
    console.log(data);
    const load = async () => {
      try {
        const result = await fetchDeficiencyByTypificationElement(
          data.elementId,
          'POST',
          data.typificationId
        );

        // 👉 Si hay deficiencia guardada en la BD, usarla
        if (result && result.length > 0) {
          setDeficiencia(result[0]);
          return;
        }

        // 👉 Si NO hay datos en la BD, mantener el estado inicial (NO tocar nada)
        console.log("No existen deficiencias guardadas, usando valores iniciales.");

      } catch (err) {
        console.error("Error cargando deficiencia:", err);
      }
    };

    load();
  }, [data.elementId, data.elementType, data.typificationId]);

  /** 🔄 SUGERENCIAS OBSERVACIÓN */
  const handleObservationChange = (text) => {
    update("DefiObservacion", text);

    if (text.length > 0) {
      const filtered = observationOptions.filter(opt =>
        opt.toUpperCase().includes(text.toUpperCase())
      );
      setFilteredObservations(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  /** 🔄 UBICACIÓN GPS */
  const obtenerUbicacionActual = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("❌ Permiso de ubicación denegado");
        return { lat: null, lng: null };
      }

      const loc = await Location.getCurrentPositionAsync({});
      return {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      };
    } catch (error) {
      console.error("❌ Error obteniendo ubicación:", error);
      return { lat: null, lng: null };
    }
  };

  // -----------------------------------------------------
  // 🔹 NUEVA DEFICIENCIA
  // -----------------------------------------------------
  const prepararNuevaDeficiencia = async () => {
    let lat = deficiencia.DefiLatitud;
    let lng = deficiencia.DefiLongitud;

    if (!lat || !lng) {
      const gps = await obtenerUbicacionActual();
      lat = gps.lat;
      lng = gps.lng;
    }

    const next = {
      ...deficiencia,
      DefiInterno: 0,
      DefiEstado: "N",
      DefiUsuarioInic: user.id,
      DefiUsuarioMod: user.id,
      DefiFechaCreacion: deficiencia.DefiFechaCreacion || new Date().toISOString(),
      DefiLatitud: lat,
      DefiLongitud: lng
    };

    setDeficiencia(next);
    return next;
  };

  // -----------------------------------------------------
  // 🔹 MODIFICAR DEFICIENCIA
  // -----------------------------------------------------
  const prepararModDeficiencia = () => {
    const next = {
      ...deficiencia,
      DefiUsuarioMod: user.id,
      DefiFecModificacion: new Date().toISOString()
    };

    setDeficiencia(next);
    return next;
  };

  // -----------------------------------------------------
  // 🔹 GUARDAR (async + await)
  // -----------------------------------------------------
  const onGuardar = async () => {
    if (!deficiencia.DefiInterno || deficiencia.DefiInterno === 0) {
      return await prepararNuevaDeficiencia();
    } else {
      return prepararModDeficiencia();
    }
  };

  /** 🔄 Ref del Form */
  useImperativeHandle(ref, () => ({
    save: async () => {
      const prepared = await onGuardar();
      return prepared;
    },
    setField: (key, value) => update(key, value)
  }));

  /** CAMPOS VISIBLES */
  const visibleFields = [
    "DefiInterno",
    "DefiEstado",
    "DefiObservacion",
    "DefiComentario",
    "DefiEstadoCriticidad"
  ];

  const lockedFields = ["DefiInterno", "DefiEstado"];

  return (
    <ScrollView style={{ padding: 10 }}>
      {visibleFields.map(key => {
        const isLocked = lockedFields.includes(key);

        if (key === "DefiObservacion") {
          return (
            <View key={key} style={styles.row}>
              <Text style={styles.label}>Observación</Text>
              <TextInput
                style={styles.input}
                value={deficiencia.DefiObservacion}
                onChangeText={handleObservationChange}
                placeholder="Ingrese observación..."
              />

              {showSuggestions && filteredObservations.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {filteredObservations.map(opt => (
                    <TouchableOpacity key={opt} onPress={() => update("DefiObservacion", opt)}>
                      <Text style={styles.suggestion}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        }

        if (key === "DefiEstado") {
          return (
            <View key={key} style={styles.row}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Estado</Text>
                <FontAwesome5 name="lock" size={14} color="#777" style={{ marginLeft: 6 }} />
              </View>
              <TextInput
                style={[styles.input, styles.lockedInput]}
                value={estadoLabels[deficiencia.DefiEstado] ?? ""}
                editable={false}
              />
            </View>
          );
        }

        if (key === "DefiEstadoCriticidad") {
          return (
            <View key={key} style={styles.row}>
              <Text style={styles.label}>Criticidad</Text>
              <View style={[styles.input, { padding: 0 }]}>
                <Picker
                  selectedValue={deficiencia.DefiEstadoCriticidad}
                  onValueChange={(value) => update("DefiEstadoCriticidad", value)}
                >
                  <Picker.Item label="LEVE" value={1} />
                  <Picker.Item label="MODERADA" value={2} />
                  <Picker.Item label="CRÍTICA" value={3} />
                </Picker>
              </View>
            </View>
          );
        }

        return (
          <View key={key} style={styles.row}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>{key}</Text>
              {isLocked && <FontAwesome5 name="lock" size={14} color="#777" style={{ marginLeft: 6 }} />}
            </View>

            <TextInput
              style={[styles.input, isLocked && styles.lockedInput]}
              value={deficiencia[key] ? String(deficiencia[key]) : ""}
              editable={!isLocked}
              multiline={key === "DefiComentario"}
              onChangeText={(v) => update(key, v)}
            />
          </View>
        );
      })}
    </ScrollView>
  );
});

export default Form6002;

const styles = StyleSheet.create({
  row: { marginBottom: 10 },
  labelRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  label: { fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 8,
    backgroundColor: "#fafafa"
  },
  lockedInput: { backgroundColor: "#ececec", color: "#777" },
  suggestionsContainer: {
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 6,
    backgroundColor: "#fff",
    marginTop: 4
  },
  suggestion: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee"
  }
});
