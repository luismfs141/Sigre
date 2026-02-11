import { Text, TextInput, TouchableOpacity, View } from "react-native";

export default function DeficiencyField({
  field,
  value,
  onChange,
  onPress,
  editable, // ✅ override opcional
}) {
  const rawValue = value ?? "";

  const displayValue =
    field.valueMap && rawValue in field.valueMap
      ? field.valueMap[rawValue]
      : rawValue;

  const isTextarea = field.type === "textarea";
  const isNumberField = field.type === "number";

  // ✅ Hard limit (recorta / maxLength real)
  const hardMaxLength = field.maxLengthHard ?? undefined;

  // ✅ Soft limit (solo pinta rojo + alerta)
  const maxChars = field.maxChars ?? undefined;
  const showMaxError = field.showMaxError ?? true;

  const noSpaces = !!field.noSpaces;
  const onlyDigits = !!field.onlyDigits;

  const keyboardType =
    field.keyboardType ?? (isNumberField ? "numeric" : "default");

  const currentLen = String(rawValue ?? "").length;
  const exceeded = typeof maxChars === "number" && currentLen > maxChars;

  const handleChangeText = (txt) => {
    let v = txt ?? "";

    // ✅ hard maxLength (si aplica)
    if (typeof hardMaxLength === "number") v = v.slice(0, hardMaxLength);

    // ✅ filtros opcionales
    if (noSpaces) v = v.replace(/\s+/g, "");
    if (onlyDigits) v = v.replace(/[^\d]/g, "");

    onChange?.(v);
  };

  const isEditable = editable ?? !field.readonly;

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
        {field.label}
        {field.required && " *"}
      </Text>

      {onPress ? (
        <TouchableOpacity
          onPress={onPress}
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 4,
            padding: 8,
            backgroundColor: "#fff",
          }}
        >
          <Text>{String(displayValue || "Seleccione...")}</Text>
        </TouchableOpacity>
      ) : (
        <>
          <TextInput
            value={String(displayValue)}
            onChangeText={handleChangeText}
            editable={isEditable}
            keyboardType={keyboardType}
            multiline={isTextarea}
            numberOfLines={isTextarea ? 4 : 1}
            maxLength={hardMaxLength}
            placeholder={field.placeholder}
            placeholderTextColor="#9CA3AF"
            style={{
              borderWidth: 1,
              borderColor: exceeded ? "#DC2626" : "#ccc",
              borderRadius: 4,
              padding: 8,
              minHeight: isTextarea ? 80 : 40,
              backgroundColor: !isEditable
                ? "#eee"
                : exceeded
                  ? "rgba(220,38,38,0.06)"
                  : "#fff",
              textAlign: "left",
              textAlignVertical: isTextarea ? "top" : "center",
              paddingTop: isTextarea ? 10 : 8,
            }}
          />

          {showMaxError && exceeded && (
            <Text style={{ marginTop: 4, color: "#DC2626" }}>
              Máximo {maxChars} caracteres.
            </Text>
          )}

          {field.showCounter && typeof maxChars === "number" && (
            <Text
              style={{
                alignSelf: "flex-end",
                marginTop: 4,
                color: exceeded ? "#DC2626" : "#666",
              }}
            >
              {currentLen}/{maxChars}
            </Text>
          )}
        </>
      )}
    </View>
  );
}
