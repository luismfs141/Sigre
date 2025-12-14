import { Text, TextInput, TouchableOpacity, View } from "react-native";

export default function DeficiencyField({ field, value, onChange, onPress }) {
  const displayValue = field.valueMap && value in field.valueMap ? field.valueMap[value] : value ?? "";

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
        {field.label}
        {field.required && " *"}
      </Text>

      {onPress ? (
        <TouchableOpacity onPress={onPress} style={{
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 4,
          padding: 8,
          backgroundColor: "#fff"
        }}>
          <Text>{displayValue || "Seleccione..."}</Text>
        </TouchableOpacity>
      ) : (
        <TextInput
          value={String(displayValue)}
          onChangeText={onChange}
          editable={!field.readonly}
          keyboardType={field.type === "number" ? "numeric" : "default"}
          multiline={field.type === "textarea"}
          numberOfLines={field.type === "textarea" ? 4 : 1}
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 4,
            padding: 8,
            minHeight: field.type === "textarea" ? 80 : 40,
            backgroundColor: field.readonly ? "#eee" : "#fff"
          }}
        />
      )}
    </View>
  );
}
