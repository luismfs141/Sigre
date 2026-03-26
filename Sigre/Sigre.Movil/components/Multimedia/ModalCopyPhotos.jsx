import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function ModalCopyPhotos({
  visible,
  defs = [],
  expandedDefId = null,
  loadingDefId = null,
  photosByDefId = {},
  onToggleDef,
  onClose,
  onConfirm,
}) {
  const [selectedBySlot, setSelectedBySlot] = useState({});

  useEffect(() => {
    setSelectedBySlot({});
  }, [visible]);

  const togglePhoto = (photo) => {
    const slotKey = String(photo.slotIndex);

    setSelectedBySlot((prev) => {
      const current = prev[slotKey];

      if (current?.key === photo.key) {
        const next = { ...prev };
        delete next[slotKey];
        return next;
      }

      return {
        ...prev,
        [slotKey]: photo,
      };
    });
  };

  const selectAllFromDef = (defId) => {
    const photos = photosByDefId[String(defId)] ?? [];

    setSelectedBySlot((prev) => {
      const next = { ...prev };

      for (const photo of photos) {
        next[String(photo.slotIndex)] = photo;
      }

      return next;
    });
  };

  const clearAll = () => setSelectedBySlot({});

  const selectedList = useMemo(() => {
    return Object.values(selectedBySlot).sort((a, b) => a.slotIndex - b.slotIndex);
  }, [selectedBySlot]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <View style={s.card}>
          <Text style={s.title}>Copiar fotos</Text>
          <Text style={s.subtitle}>
            Primero selecciona una deficiencia. Al expandirla se cargarán sus fotos.
          </Text>

          <ScrollView
            style={s.scroll}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {defs.map((def) => {
              const defId = Number(def.defId);
              const isExpanded = Number(expandedDefId) === defId;
              const isLoading = Number(loadingDefId) === defId;
              const photos = photosByDefId[String(defId)] ?? [];

              return (
                <View key={`def-${defId}`} style={s.group}>
                  <TouchableOpacity
                    style={s.groupHeader}
                    onPress={() => onToggleDef?.(def)}
                    activeOpacity={0.85}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={s.groupTitle}>{def.title}</Text>
                      {!!def.subtitle && (
                        <Text style={s.groupSubtitle}>{def.subtitle}</Text>
                      )}
                    </View>

                    <MaterialIcons
                      name={isExpanded ? "expand-less" : "expand-more"}
                      size={24}
                      color="#374151"
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={s.expandBody}>
                      {isLoading ? (
                        <View style={s.loadingBox}>
                          <ActivityIndicator size="small" color="#2563EB" />
                          <Text style={s.loadingText}>Cargando fotos...</Text>
                        </View>
                      ) : photos.length === 0 ? (
                        <Text style={s.emptyText}>
                          Esta deficiencia no tiene fotos físicas disponibles para copiar.
                        </Text>
                      ) : (
                        <>
                          <View style={s.expandActions}>
                            <TouchableOpacity
                              style={s.allBtn}
                              onPress={() => selectAllFromDef(defId)}
                            >
                              <Text style={s.allBtnTxt}>Todas</Text>
                            </TouchableOpacity>
                          </View>

                          <View style={s.grid}>
                            {photos.map((photo) => {
                              const selected =
                                selectedBySlot[String(photo.slotIndex)]?.key === photo.key;

                              return (
                                <Pressable
                                  key={photo.key}
                                  style={[s.photoCard, selected && s.photoCardSelected]}
                                  onPress={() => togglePhoto(photo)}
                                >
                                  <Image source={{ uri: photo.uri }} style={s.photo} />

                                  <View style={s.photoFooter}>
                                    <Text style={s.slotText} numberOfLines={1}>
                                      {photo.slotTitle}
                                    </Text>

                                    <MaterialIcons
                                      name={
                                        selected
                                          ? "check-circle"
                                          : "radio-button-unchecked"
                                      }
                                      size={18}
                                      color={selected ? "#16A34A" : "#6B7280"}
                                    />
                                  </View>
                                </Pressable>
                              );
                            })}
                          </View>
                        </>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          <View style={s.bottomInfo}>
            <Text style={s.countText}>Seleccionadas: {selectedList.length}</Text>

            <TouchableOpacity onPress={clearAll}>
              <Text style={s.clearText}>Limpiar</Text>
            </TouchableOpacity>
          </View>

          <View style={s.actions}>
            <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
              <Text style={s.cancelTxt}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.copyBtn, !selectedList.length && s.copyBtnDisabled]}
              disabled={!selectedList.length}
              onPress={() => onConfirm?.(selectedList)}
            >
              <Text style={s.copyTxt}>Copiar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    maxHeight: "88%",
    padding: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "#4B5563",
    marginBottom: 12,
  },
  scroll: {
    maxHeight: 520,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  group: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    overflow: "hidden",
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  groupSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#6B7280",
  },
  expandBody: {
    padding: 10,
    backgroundColor: "#fff",
  },
  expandActions: {
    alignItems: "flex-end",
    marginBottom: 10,
  },
  loadingBox: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: "#4B5563",
  },
  emptyText: {
    fontSize: 13,
    color: "#6B7280",
    fontStyle: "italic",
  },
  allBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  allBtnTxt: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  photoCard: {
    width: "48%",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    marginBottom: 10,
  },
  photoCardSelected: {
    borderColor: "#16A34A",
  },
  photo: {
    width: "100%",
    height: 110,
  },
  photoFooter: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  slotText: {
    flex: 1,
    marginRight: 6,
    fontSize: 12,
    fontWeight: "600",
  },
  bottomInfo: {
    marginTop: 6,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  countText: {
    fontSize: 13,
    fontWeight: "700",
  },
  clearText: {
    color: "#DC2626",
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  cancelTxt: {
    color: "#fff",
    fontWeight: "700",
  },
  copyBtn: {
    flex: 1,
    backgroundColor: "#16A34A",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  copyBtnDisabled: {
    backgroundColor: "#9CA3AF",
  },
  copyTxt: {
    color: "#fff",
    fontWeight: "700",
  },
});