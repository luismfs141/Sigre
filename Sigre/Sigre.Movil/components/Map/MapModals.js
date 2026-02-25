// components/Map/MapModals.js
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Keyboard,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import styles from "../../styles/mapStyles";
import { modalStyles } from "../../styles/modalStyles.js";

export const GapSelectorModal = ({ visible, overlappedGaps, onPick, onCancel }) => {
  if (!visible) return null;

  const list = Array.isArray(overlappedGaps) ? overlappedGaps : [];

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalBox}>
        <Text style={styles.modalTitle}>Seleccione un Vano</Text>

        {list.map((gap, idx) => (
          <TouchableOpacity
            key={gap?.VanoInterno ?? gap?.VanoCodigo ?? idx}
            style={styles.modalItem}
            onPress={() => onPick?.(gap)}
          >
            <Text style={styles.modalText}>
              {gap?.VanoCodigo || "Vano sin código"} - {gap?.VanoEtiqueta || ""}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.modalCancel} onPress={onCancel}>
          <Text style={{ color: "red" }}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const SearchModal = ({
  visible,
  searchText,
  setSearchText,
  hasSearched,
  searchResults,
  selectedSearchResult,
  setSelectedSearchResult,
  onSearch,
  onClear,
  onCancel,
  onLocate,
  onSelect,
}) => {
  // ✅ HOOKS SIEMPRE ARRIBA (NUNCA return antes)
  const containerRef = useRef(null);
  const translateY = useRef(new Animated.Value(0)).current;

  const screenH = Dimensions.get("window").height;

  const TOP_MARGIN = 18;      // margen superior fijo
  const BOTTOM_MARGIN = 12;   // margen arriba del teclado

  const [kb, setKb] = useState({ height: 0, top: screenH });

  const runShift = (keyboardTop) => {
    const bottomLimit = keyboardTop - BOTTOM_MARGIN;

    requestAnimationFrame(() => {
      containerRef.current?.measureInWindow((x, y, w, h) => {
        const overlap = (y + h) - bottomLimit;
        let shift = overlap > 0 ? -overlap : 0;

        const maxUp = -(y - TOP_MARGIN);
        if (shift < maxUp) shift = maxUp;

        Animated.timing(translateY, {
          toValue: shift,
          duration: Platform.OS === "ios" ? 260 : 200,
          useNativeDriver: true,
        }).start();
      });
    });
  };

  useEffect(() => {
    // al abrir resetea
    Animated.timing(translateY, {
      toValue: 0,
      duration: 0,
      useNativeDriver: true,
    }).start();

    setKb({ height: 0, top: screenH });
  }, [visible, screenH, translateY]);

  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const subShow = Keyboard.addListener(showEvt, (e) => {
      const h = e?.endCoordinates?.height ?? 0;
      const top = e?.endCoordinates?.screenY ?? (screenH - h);

      setKb({ height: h, top });

      runShift(top);
      setTimeout(() => runShift(top), 60);
    });

    const subHide = Keyboard.addListener(hideEvt, () => {
      setKb({ height: 0, top: screenH });

      Animated.timing(translateY, {
        toValue: 0,
        duration: Platform.OS === "ios" ? 220 : 170,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, [screenH]);

  const maxH =
    kb.height > 0
      ? Math.max(240, kb.top - TOP_MARGIN - 10)
      : Math.floor(screenH * 0.85);

  const handleSearch = () => {
    Keyboard.dismiss();   // ✅ ocultar teclado al buscar
    onSearch?.();
  };

  // ✅ RECIÉN AQUÍ puedes cortar render
  if (!visible) return null;

  return (
    <View
      style={[
        modalStyles.modalOverlay,
        kb.height > 0 && { paddingBottom: kb.height },
      ]}
    >
      <Animated.View
        ref={containerRef}
        style={[
          modalStyles.modalContainer,
          {
            maxHeight: maxH,
            transform: [{ translateY }],
          },
        ]}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 12 }}
        >
          <Text style={modalStyles.modalTitle}>Buscar Elemento</Text>

          <Text style={styles.inputLabel}>Ingrese código o etiqueta:</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.inputField}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Ej: 035840 / VBT..."
              placeholderTextColor="#999"
              autoCapitalize="none"
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />

            {searchText.length > 0 && (
              <TouchableOpacity onPress={onClear} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[
              modalStyles.saveButton,
              { marginTop: 6, alignItems: "center", justifyContent: "center" },
            ]}
            onPress={handleSearch}
          >
            <Text style={[modalStyles.saveButtonText, { textAlign: "center" }]}>
              Buscar
            </Text>
          </TouchableOpacity>

          <View style={styles.resultsBox}>
            {!hasSearched ? (
              <Text style={styles.hintText}>Escribe algo y presiona “Buscar”.</Text>
            ) : searchResults.length === 0 ? (
              <Text style={styles.hintText}>Sin resultados.</Text>
            ) : (
              <ScrollView
                style={styles.resultsScroll}
                contentContainerStyle={styles.resultsContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
              >
                {searchResults.map((r) => {
                  const isSelected = selectedSearchResult?.key === r.key;

                  return (
                    <TouchableOpacity
                      key={r.key}
                      style={[styles.resultItem, isSelected && styles.resultItemSelected]}
                      onPress={() => setSelectedSearchResult(r)}
                    >
                      <Text style={styles.resultTitle}>
                        {r.subKind} — {String(r.code ?? "").trim() || "(sin código)"}
                      </Text>

                      {!!String(r.label ?? "").trim() && (
                        <Text style={styles.resultSubtitle} numberOfLines={2}>
                          {String(r.label).replace(/\r?\n|\r/g, " - ").trim()}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          <View style={modalStyles.footerButtons}>
            <TouchableOpacity
              style={[
                modalStyles.cancelButton,
                { flex: 1, marginRight: 8, alignItems: "center", justifyContent: "center" },
              ]}
              onPress={onCancel}
            >
              <Text style={[modalStyles.cancelButtonText, { textAlign: "center" }]}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                modalStyles.saveButton,
                { flex: 1, marginHorizontal: 8, alignItems: "center", justifyContent: "center" },
                !selectedSearchResult && { opacity: 0.5 },
              ]}
              disabled={!selectedSearchResult}
              onPress={onLocate}
            >
              <Text style={[modalStyles.saveButtonText, { textAlign: "center" }]}>
                Ubicar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                modalStyles.saveButton,
                { flex: 1, marginLeft: 8, alignItems: "center", justifyContent: "center" },
                !selectedSearchResult && { opacity: 0.5 },
              ]}
              disabled={!selectedSearchResult}
              onPress={onSelect}
            >
              <Text style={[modalStyles.saveButtonText, { textAlign: "center" }]}>
                Seleccionar
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

export const AuditInspeccionadoModal = ({
  visible,
  loading,
  analyzed,
  title = "Analizar inconsistencias",
  subtitle = "",
  items,
  selectedKey,
  onSelectKey,
  onAnalyze,
  onReAnalyze,
  onClose,
  onLocate,
  onInspect,
}) => {
  if (!visible) return null;

  const list = Array.isArray(items) ? items : [];
  const hasItems = list.length > 0;

  const showInfo = () => {
    Alert.alert(
      "Información",
      "Estas inconsistencias indican que el estado del elemento no coincide con lo que reflejan sus deficiencias.\n\n" +
      "Revisa las deficiencias (finalizar o actualizar su estado) y luego presiona “Volver a analizar” para confirmar que todo quedó corregido."
    );
  };

  return (
    <View style={modalStyles.modalOverlay}>
      <View style={modalStyles.modalContainer}>
        {/* HEADER: título + info */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={modalStyles.modalTitle}>{title}</Text>

          <TouchableOpacity onPress={showInfo} style={{ padding: 6 }}>
            <Ionicons name="information-circle-outline" size={22} color="#333" />
          </TouchableOpacity>
        </View>

        {!!subtitle && (
          <Text style={{ marginTop: 4, color: "#444", fontSize: 13 }}>
            {subtitle}
          </Text>
        )}

        {/* Acción principal */}
        <TouchableOpacity
          style={[
            modalStyles.saveButton,
            { marginTop: 10, alignItems: "center", justifyContent: "center" },
            loading && { opacity: 0.6 },
          ]}
          onPress={analyzed ? onReAnalyze : onAnalyze}
          disabled={loading}
        >
          {loading ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={[modalStyles.saveButtonText, { textAlign: "center" }]}>Analizando...</Text>
            </View>
          ) : (
            <Text style={[modalStyles.saveButtonText, { textAlign: "center" }]}>
              {analyzed ? "Volver a analizar" : "Analizar elementos"}
            </Text>
          )}
        </TouchableOpacity>

        {/* Lista */}
        <View style={[styles.resultsBox, { marginTop: 10, minHeight: 220 }]}>
          {!analyzed ? (
            <Text style={styles.hintText}>
              Presiona “Analizar elementos” para buscar inconsistencias en SQLite.
            </Text>
          ) : !hasItems ? (
            <Text style={styles.hintText}>
              ✅ No se encontraron inconsistencias.
            </Text>
          ) : (
            <ScrollView
              style={styles.resultsScroll}
              contentContainerStyle={styles.resultsContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              {list.map((r) => {
                const isSelected = selectedKey === r.key;
                const left = `${r.kind} — ${String(r.code ?? "").trim() || "(sin código)"}`;

                return (
                  <TouchableOpacity
                    key={r.key}
                    style={[
                      styles.resultItem,
                      isSelected && styles.resultItemSelected,
                    ]}
                    onPress={() => onSelectKey?.(r.key)}
                  >
                    <Text style={styles.resultTitle}>{left}</Text>

                    {!!String(r.label ?? "").trim() && (
                      <Text style={styles.resultSubtitle} numberOfLines={2}>
                        {String(r.label).replace(/\r?\n|\r/g, " - ").trim()}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Botones abajo */}
        <View style={modalStyles.footerButtons}>
          <TouchableOpacity
            style={[
              modalStyles.cancelButton,
              { flex: 1, marginRight: 8, alignItems: "center", justifyContent: "center" },
            ]}
            onPress={onClose}
          >
            <Text style={[modalStyles.cancelButtonText, { textAlign: "center" }]}>Cerrar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              modalStyles.saveButton,
              { flex: 1, marginHorizontal: 8, alignItems: "center", justifyContent: "center" },
              (!selectedKey || !analyzed || loading) && { opacity: 0.5 },
            ]}
            disabled={!selectedKey || !analyzed || loading}
            onPress={onLocate}
          >
            <Text style={[modalStyles.saveButtonText, { textAlign: "center" }]}>Ubicar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              modalStyles.saveButton,
              { flex: 1, marginLeft: 8, alignItems: "center", justifyContent: "center" },
              (!selectedKey || !analyzed || loading) && { opacity: 0.5 },
            ]}
            disabled={!selectedKey || !analyzed || loading}
            onPress={onInspect}
          >
            <Text style={[modalStyles.saveButtonText, { textAlign: "center" }]}>Seleccionar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
