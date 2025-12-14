import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function SelectModal({
  visible,
  title = "Seleccionar",
  items = [],
  labelKey,
  valueKey,
  selectedValue,
  onSelect,
  onClose
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>

          <FlatList
            data={items}
            keyExtractor={(item) => String(item[valueKey])}
            renderItem={({ item }) => {
              const value = String(item[valueKey]);
              const selected = value === String(selectedValue);

              return (
                <TouchableOpacity
                  style={[
                    styles.option,
                    selected && styles.selected
                  ]}
                  onPress={() => {
                    onSelect(value);
                    onClose();
                  }}
                >
                  <Text style={styles.optionText}>
                    {item[labelKey]}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
            <Text style={styles.btnText}>Cancelar</Text>
          </TouchableOpacity>
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
    padding: 20
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    maxHeight: "80%"
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10
  },
  option: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee"
  },
  selected: {
    backgroundColor: "#e8f4ff"
  },
  optionText: {
    fontSize: 16
  },
  btnCancel: {
    marginTop: 10,
    backgroundColor: "#c0392b",
    padding: 12,
    borderRadius: 8,
    alignItems: "center"
  },
  btnText: {
    color: "#fff",
    fontWeight: "600"
  }
});
