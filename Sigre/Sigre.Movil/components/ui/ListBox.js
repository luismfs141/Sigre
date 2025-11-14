import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Dropdown } from "react-native-element-dropdown";

export default function ListBox({
  label,
  items = [],
  value,
  onChange,
  placeholder = "Seleccione una opción...",
  disabled = false,
}) {
  const options = useMemo(
    () =>
      items.map((i) => ({
        label: i.name ?? i.label ?? String(i.id ?? i.value ?? ""),
        value: i.id ?? i.value,
      })),
    [items]
  );

  return (
    <View style={styles.container}>
      <Dropdown
        style={styles.dropdown}
        data={options}
        labelField="label"
        valueField="value"
        placeholder={placeholder}
        value={value}
        onChange={(item) => onChange?.(item.value)}
        disable={disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 180,
  },
  dropdown: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: "white",
  },
});
