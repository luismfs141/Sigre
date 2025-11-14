import { Dimensions, StyleSheet } from "react-native";

const { height, width } = Dimensions.get("window");

export const modalStyles = StyleSheet.create({
    modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '85%',
    height: '80%', // espacio suficiente
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
});