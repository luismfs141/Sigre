import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import NewPoste from "../../components/Form/Nuevo/NewPosteForm";
import NewVano from "../../components/Form/Nuevo/NewVanoForm";
import { useGap } from "../../hooks/useGap";
import { usePost } from "../../hooks/usePost";

const MAP_ROUTE = "map"; // ✅ tu MapScreen normalmente está en app/(drawer)/maps.js

export default function NewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [tipo, setTipo] = useState(null);

  const posteRef = useRef(null);
  const vanoRef = useRef(null);

  const { savePost, loading: loadingPost } = usePost();
  const { saveVano, loading: loadingVano } = useGap();

  const loading = loadingPost || loadingVano;

  const handleGuardar = async () => {
    if (!tipo) {
      Alert.alert("Aviso", "Seleccione el tipo de elemento.");
      return;
    }

    // =========================
    // NUEVO POSTE (igual)
    // =========================
    if (tipo === "poste") {
      const data = posteRef.current?.getData?.();
      if (!data) {
        Alert.alert("Error", "No se pudo leer el formulario.");
        return;
      }

      const codigo = String(data.PostCodigoNodo ?? "").trim();
      const etiqueta = String(data.PostEtiqueta ?? "").trim();

      if (!codigo) return Alert.alert("Validación", "El Código es obligatorio.");
      if (/\s/.test(codigo)) return Alert.alert("Validación", "El Código no debe tener espacios.");
      if (!etiqueta) return Alert.alert("Validación", "La Etiqueta es obligatoria.");

      if (!Number.isFinite(Number(data.PostMaterial))) return Alert.alert("Validación", "Material es obligatorio.");
      if (!Number.isFinite(Number(data.PostRetenidaTipo))) return Alert.alert("Validación", "Tipo de retenida es obligatorio.");
      if (!Number.isFinite(Number(data.PostSubestacion))) return Alert.alert("Validación", "Subestación es obligatoria.");
      if (!Number.isFinite(Number(data.AlimInterno))) return Alert.alert("Validación", "No hay alimentador seleccionado.");

      const lat = Number(data.PostLatitud);
      const lng = Number(data.PostLongitud);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return Alert.alert("Validación", "Latitud y Longitud son obligatorias.");
      if (lat < -90 || lat > 90) return Alert.alert("Validación", "Latitud fuera de rango (-90..90).");
      if (lng < -180 || lng > 180) return Alert.alert("Validación", "Longitud fuera de rango (-180..180).");

      if (data.PostAltura != null && data.PostAltura !== "") {
        const h = Number(data.PostAltura);
        if (!Number.isFinite(h)) return Alert.alert("Validación", "Altura debe ser numérica (o dejar en blanco).");
      }

      data.PostCodigoNodo = codigo;
      data.PostEtiqueta = etiqueta;

      const id = await savePost(data);

      if (!id) return Alert.alert("Error", "No se pudo guardar el poste.");

      posteRef.current?.reset?.();
      Alert.alert("Éxito", `Poste guardado (ID: ${id}).`);
      return;
    }

    // =========================
    // NUEVO VANO
    // =========================
    if (tipo === "vano") {
      const data = vanoRef.current?.getData?.();
      if (!data) {
        Alert.alert("Error", "No se pudo leer el formulario.");
        return;
      }

      const codigo = String(data.VanoCodigo ?? "").trim();
      if (!codigo) return Alert.alert("Validación", "El Código es obligatorio.");
      if (/\s/.test(codigo)) return Alert.alert("Validación", "El Código no debe tener espacios.");

      if (!Number.isFinite(Number(data.AlimInterno))) return Alert.alert("Validación", "No hay alimentador seleccionado.");
      if (!Number.isFinite(Number(data.VanoSubestacion))) return Alert.alert("Validación", "Subestación es obligatoria.");

      const nodoIni = String(data.VanoNodoInicial ?? "").trim();
      const nodoFin = String(data.VanoNodoFinal ?? "").trim();

      if (!nodoIni) return Alert.alert("Validación", "Nodo inicial es obligatorio.");
      if (!nodoFin) return Alert.alert("Validación", "Nodo final es obligatorio.");

      if (nodoIni === nodoFin) return Alert.alert("Validación", "Nodo inicial y final no pueden ser iguales.");

      const latIni = Number(data.VanoLatitudIni);
      const lngIni = Number(data.VanoLongitudIni);
      const latFin = Number(data.VanoLatitudFin);
      const lngFin = Number(data.VanoLongitudFin);

      if (!Number.isFinite(latIni) || !Number.isFinite(lngIni)) return Alert.alert("Validación", "Lat/Long inicial obligatorias.");
      if (!Number.isFinite(latFin) || !Number.isFinite(lngFin)) return Alert.alert("Validación", "Lat/Long final obligatorias.");

      if (latIni < -90 || latIni > 90 || latFin < -90 || latFin > 90) return Alert.alert("Validación", "Latitud fuera de rango (-90..90).");
      if (lngIni < -180 || lngIni > 180 || lngFin < -180 || lngFin > 180) return Alert.alert("Validación", "Longitud fuera de rango (-180..180).");

      // normaliza
      data.VanoCodigo = codigo;
      data.VanoNodoInicial = nodoIni;
      data.VanoNodoFinal = nodoFin;

      const id = await saveVano(data);

      if (!id) return Alert.alert("Error", "No se pudo guardar el vano.");

      vanoRef.current?.reset?.();
      Alert.alert("Éxito", `Vano guardado (ID: ${id}).`);
      return;
    }

    Alert.alert("Aviso", "Tipo no soportado.");
  };

  const handleCancelar = () => {
    posteRef.current?.reset?.();
    vanoRef.current?.reset?.();
    setTipo(null);
    router.replace(MAP_ROUTE);
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          {/* Selector tipo */}
          <View style={styles.segment}>
            <TouchableOpacity
              style={[styles.segmentBtn, tipo === "poste" && styles.segmentBtnActive]}
              onPress={() => setTipo("poste")}
            >
              <Text style={[styles.segmentText, tipo === "poste" && styles.segmentTextActive]}>
                Nuevo Poste
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, tipo === "vano" && styles.segmentBtnActive]}
              onPress={() => setTipo("vano")}
            >
              <Text style={[styles.segmentText, tipo === "vano" && styles.segmentTextActive]}>
                Nuevo Vano
              </Text>
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: tipo ? 170 : 24 }}
          >
            {tipo === "poste" && <NewPoste ref={posteRef} />}

            {tipo === "vano" && <NewVano ref={vanoRef} />}

            {!tipo && (
              <View style={styles.todoBox}>
                <Text style={styles.todoText}>Seleccione “Nuevo Poste” o “Nuevo Vano”.</Text>
              </View>
            )}
          </ScrollView>

          {/* Acciones abajo */}
          {!!tipo && (
            <View style={[styles.fixedActions, { paddingBottom: insets.bottom + 10 }]}>
              <TouchableOpacity
                style={[styles.saveButton, loading && { opacity: 0.6 }]}
                onPress={handleGuardar}
                disabled={loading}
              >
                <Text style={styles.actionText}>Guardar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelar}
              >
                <Text style={styles.actionText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 14 },

  segment: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 12,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#f3f3f3",
  },
  segmentBtnActive: { backgroundColor: "#007bff" },
  segmentText: { fontWeight: "700", color: "#333" },
  segmentTextActive: { color: "#fff" },

  todoBox: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#f6f6f6",
    borderWidth: 1,
    borderColor: "#eee",
  },
  todoText: { color: "#444" },

  fixedActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
  },

  saveButton: {
    backgroundColor: "#28a745",
    padding: 14,
    borderRadius: 10,
    width: "48%",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#dc3545",
    padding: 14,
    borderRadius: 10,
    width: "48%",
    alignItems: "center",
  },
  actionText: { color: "#fff", fontWeight: "800" },
});