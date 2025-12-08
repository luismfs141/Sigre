// forms/DeficiencyForms.js
import { Text, TextInput, View } from "react-native";

export const Form6002 = ({ data, onChange }) => (
  <View style={styles.container}>
    <Text>POSTE que ha reducido su resistencia mecánica</Text>
    <TextInput
      style={styles.input}
      placeholder="Detalle de inspección"
      value={data.detail}
      onChangeText={(text) => onChange("detail", text)}
    />
  </View>
);

export const Form6004 = ({ data, onChange }) => (
  <View style={styles.container}>
    <Text>POSTE con inclinación mayor a 5° o deficiencias en la cimentación</Text>
    <TextInput
      style={styles.input}
      placeholder="Observaciones"
      value={data.detail}
      onChangeText={(text) => onChange("detail", text)}
    />
  </View>
);

// Agregar más formularios según cada Code

// Mapa de formularios
export const DeficiencyFormMap = {
  6002: Form6002,
  6004: Form6004,
  6006: Form6006,
  6008: Form6008,
  6024: Form6024,
  6026: Form6026,
  6028: Form6028,
  7002: Form7002,
  7004: Form7004,
  7006: Form7006,
  7008: Form7008,
};
