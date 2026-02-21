import { ActivityIndicator, Modal, Text, View } from "react-native";

export default function LoadingOverlay({ visible, text }) {
  return (
    <Modal transparent visible={!!visible} animationType="fade">
      <View style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.15)",
      }}>
        <ActivityIndicator size="large" color="black" />
        {!!text && <Text style={{ marginTop: 10, color: "#000" }}>{text}</Text>}
      </View>
    </Modal>
  );
}
