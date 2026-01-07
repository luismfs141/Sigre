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
//-------------------------------------------------------------------------------------------------
  //   return (
  //     <View style={styles.container}>
  //       <Dropdown
  //         style={styles.dropdown}
  //         data={options}
  //         labelField="label"
  //         valueField="value"
  //         placeholder={placeholder}
  //         value={value}
  //         onChange={(item) => onChange?.(item.value)}
  //         disable={disabled}
  //       />
  //     </View>
  //   );
  // }


  return (
    <View style={styles.container}>
      <Dropdown
        style={styles.dropdown}
        data={options}
        labelField="label"
        valueField="value"
        value={value}
        disable={disabled}

        // ✅ CONTROL EXPLÍCITO DEL PLACEHOLDER
        renderPlaceholder={() => (
          <Text style={styles.placeholder}>
            {placeholder}
          </Text>
        )}

        // ✅ CONTROL DEL ITEM SELECCIONADO
        renderSelectedItem={(item) => (
          <Text style={styles.selectedText}>
            {item?.label}
          </Text>
        )}

        // ✅ CONTROL DE CADA ITEM
        renderItem={(item) => (
          <View style={styles.item}>
            <Text style={styles.itemText}>
              {item.label}
            </Text>
          </View>
        )}

        onChange={(item) => onChange?.(item.value)}
      />
    </View>
  );
}

//-------------------------------------------------------------------------------------------------
// const styles = StyleSheet.create({
//   container: {
//     width: 180,
//   },
//   dropdown: {
//     height: 40,
//     borderColor: "#ccc",
//     borderWidth: 1,
//     borderRadius: 8,
//     paddingHorizontal: 8,
//     backgroundColor: "white",
//   },
// });

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
  placeholder: {
    color: "#999",
    fontSize: 14,
  },
  selectedText: {
    color: "#000",
    fontSize: 14,
  },
  item: {
    padding: 10,
  },
  itemText: {
    fontSize: 16,
  },
});