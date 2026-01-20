import { Dimensions, StyleSheet } from "react-native";

const { height, width } = Dimensions.get("window");

export const modalStyles = StyleSheet.create({
    modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,  
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '85%',
    height: 'auto', // espacio suficiente
    padding: 20,
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  saveButton: { backgroundColor: "#4CAF50", padding: 10, borderRadius: 8 },
  saveButtonText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  cancelButton: { marginTop: 8, padding: 8, borderRadius: 8, backgroundColor: "#f44336" },
  cancelButtonText: { color: "#fff", textAlign: "center" },
});