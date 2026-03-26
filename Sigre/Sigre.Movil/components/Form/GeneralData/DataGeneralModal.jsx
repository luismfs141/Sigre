

// Form/GeneralData/DataGeneralModal.jsx
import { useEffect, useRef, useState } from "react";
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

import PosteForm from "./PosteForm";
import SedForm from "./SedForm";
import VanoForm from "./VanoForm";

export default function DataGeneralModal({ visible, item, onClose, onSave }) {
  // ✅ HOOKS SIEMPRE ARRIBA
  const formRef = useRef(null);
  const [dirty, setDirty] = useState(false);

  const data = item?.data ?? null;

  // ✅ cada vez que abres o cambias de item → no hay cambios
  useEffect(() => {
    if (visible) setDirty(false);
  }, [visible, data]); // (si quieres más fino: data?.PostInterno / VanoInterno / SedInterno)

  // ✅ RECIÉN AQUÍ puedes cortar render
  if (!visible || !data) return null;

  const handleSave = async () => {
    if (!dirty) return;

    if (formRef.current?.save) {
      try {
        const savedData = await formRef.current.save();
        onSave?.(savedData ?? data);
      } catch (err) {
        console.warn("⚠ Error guardando datos del formulario:", err);
        onSave?.(data);
      }
    } else {
      onSave?.(data);
    }
  };

  const isPoste = Object.prototype.hasOwnProperty.call(data, "PostInterno");
  const isVano = Object.prototype.hasOwnProperty.call(data, "VanoInterno");
  const isSed = Object.prototype.hasOwnProperty.call(data, "SedInterno");

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
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
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* HEADER */}
              <View style={styles.header}>
                <Text style={styles.title}>Datos Generales</Text>
              </View>

              {/* FORM */}
              {isPoste && (
                <PosteForm
                  data={data}
                  visible={visible}
                  ref={formRef}
                  onClose={onClose}
                  onDirtyChange={setDirty}
                />
              )}

              {isVano && (
                <VanoForm
                  data={data}
                  visible={visible}
                  ref={formRef}
                  onClose={onClose}
                  onDirtyChange={setDirty}
                />

              )}

              {isSed && (
                <SedForm
                  data={data}
                  visible={visible}
                  ref={formRef}
                  onClose={onClose}
                  onDirtyChange={setDirty}
                />
              )}

              {/* FOOTER BOTONES */}
              <View style={styles.footerRow}>
                <TouchableOpacity style={styles.btnClose} onPress={onClose}>
                  <Text style={styles.btnText}>Cerrar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnSave, !dirty && styles.btnDisabled]}
                  onPress={handleSave}
                  disabled={!dirty}
                >
                  <Text style={styles.btnText}>Guardar</Text>
                </TouchableOpacity>
              </View>
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
    marginBottom: 10
  },
  title: { fontSize: 20, fontWeight: "700" },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    gap: 10
  },

  btnClose: {
    flex: 1,
    backgroundColor: "#e74c3c",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center"
  },

  btnSave: {
    flex: 1,
    backgroundColor: "#27ae60",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center"
  },

  btnDisabled: {
    backgroundColor: "#9e9e9e"
  },

  btnText: {
    color: "#fff",
    fontWeight: "800"
  }
});
