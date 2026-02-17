// components/Map/MapModals.js
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

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
  if (!visible) return null;

  return (
    <View style={modalStyles.modalOverlay}>
      <View style={modalStyles.modalContainer}>
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
          />

          {searchText.length > 0 && (
            <TouchableOpacity onPress={onClear} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[modalStyles.saveButton, { marginTop: 6 }]}
          onPress={onSearch}
        >
          <Text style={modalStyles.saveButtonText}>Buscar</Text>
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
            style={[modalStyles.cancelButton, { flex: 1, marginRight: 8 }]}
            onPress={onCancel}
          >
            <Text style={modalStyles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              modalStyles.saveButton,
              { flex: 1, marginHorizontal: 8 },
              !selectedSearchResult && { opacity: 0.5 },
            ]}
            disabled={!selectedSearchResult}
            onPress={onLocate}
          >
            <Text style={modalStyles.saveButtonText}>Ubicar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              modalStyles.saveButton,
              { flex: 1, marginLeft: 8 },
              !selectedSearchResult && { opacity: 0.5 },
            ]}
            disabled={!selectedSearchResult}
            onPress={onSelect}
          >
            <Text style={modalStyles.saveButtonText}>Seleccionar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
