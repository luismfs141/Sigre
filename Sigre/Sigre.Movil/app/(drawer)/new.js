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
import { usePost } from "../../hooks/usePost";

const MAP_ROUTE = "map"; // ✅ tu MapScreen normalmente está en app/(drawer)/maps.js

export default function NewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [tipo, setTipo] = useState(null);

  const posteRef = useRef(null);

  const { savePost, loading } = usePost();

  const handleGuardar = async () => {
    if (!tipo) {
      Alert.alert("Aviso", "Seleccione el tipo de elemento.");
      return;
    }

    // ==========================
    // POSTE
    // ==========================
    if (tipo === "poste") {
      const data = posteRef.current?.getData?.();

      if (!data) {
        Alert.alert("Error", "No se pudo leer el formulario.");
        return;
      }

      if (!String(data.PostCodigoNodo ?? "").trim()) {
        Alert.alert("Validación", "El Código (PostCodigoNodo) es obligatorio.");
        return;
      }

      if (!String(data.PostEtiqueta ?? "").trim()) {
        Alert.alert("Validación", "La Etiqueta (PostEtiqueta) es obligatoria.");
        return;
      }

      if (!Number.isFinite(Number(data.AlimInterno))) {
        Alert.alert("Validación", "No hay alimentador seleccionado (AlimInterno).");
        return;
      }

      const lat = Number(data.PostLatitud);
      const lng = Number(data.PostLongitud);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        Alert.alert("Validación", "Latitud y Longitud deben ser numéricas.");
        return;
      }

      if (lat < -90 || lat > 90) {
        Alert.alert("Validación", "Latitud fuera de rango (-90..90).");
        return;
      }

      if (lng < -180 || lng > 180) {
        Alert.alert("Validación", "Longitud fuera de rango (-180..180).");
        return;
      }

      const id = await savePost(data);

      if (!id) {
        Alert.alert("Error", "No se pudo guardar el poste.");
        return;
      }

      // ✅ reset después de guardar
      posteRef.current?.reset?.();

      Alert.alert("Éxito", `Poste guardado (ID: ${id}).`);
      return;
    }

    // ==========================
    // VANO (por ahora vacío)
    // ==========================
    Alert.alert("Aviso", "Nuevo Vano aún no está implementado.");
  };

  const handleCancelar = () => {
    // ✅ resetea todo y vuelve al mapa
    posteRef.current?.reset?.();
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

            {tipo === "vano" && (
              <View style={styles.todoBox}>
                <Text style={styles.todoText}>Nuevo Vano: (pendiente)</Text>
              </View>
            )}

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