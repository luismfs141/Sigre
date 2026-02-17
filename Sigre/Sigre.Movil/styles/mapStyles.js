// styles/mapStyles.js
import { StyleSheet } from "react-native";

// ==========================
// MAPVIEW (contenedor mapa)
// ==========================
export const mapStyles = StyleSheet.create({
  mapContainer: {
    width: "100%",
    height: "92.9%",
  },
});

// ==========================
// PINS / MARKERS
// ==========================
export const pinStyles = StyleSheet.create({
  // POSTE (centro real del Marker del ÍCONO) — punto rojo
  iconCenterDot: {
    position: "absolute",
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,0,0,0.9)",
  },



  // Wrapper del icono (tamaño real del icono)
  iconWrapper: {
    width: 25,
    height: 25,
    alignItems: "center",
    justifyContent: "center",
  },

  iconWrapperSE: {
    alignItems: "center",
    justifyContent: "center",
  },

  // POSTE (Marker del ÍCONO) — fondo verde debug ----------------------------------------------------
  iconCanvas: {
    width: 32, 
    height: 32,
    //backgroundColor: "rgba(0,255,0,0.25)", // 🟢 debug

    //borderWidth: 1,
    //borderColor: "rgba(0,255,0,0.85)",

    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },


  iconCanvasSE: {
    //backgroundColor: "rgba(0,255,0,0.3)", // 🟢 debug
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },

  // ICONO
  pinIcon: {
    resizeMode: "contain",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  pinIconSE: {
    width: 40,
    height: 40,
    resizeMode: "contain",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  markerCanvas: {
    position: "relative",
    backgroundColor: "rgba(255,0,0,0.25)", // 🔴 debug
  },

  // Globo real (contenido)
  labelBox: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignSelf: "center",
    justifyContent: "center",
    paddingVertical: 2,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 4,
  },

  // POSTE (Marker del LABEL/TEXTO) — fondo rojo debug
  labelCanvas: {
    width: 32,
    height: 32,
    //backgroundColor: "rgba(255,0,0,0.25)", // 🔴 debug
    //borderWidth: 1,
    //borderColor: "rgba(255,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },


  labelWrapperBox: {
    width: 60,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    backgroundColor: "transparent",
  },

  labelText: {
    color: "#00FFFF",
    fontSize: 8,
    textAlign: "center",
    fontWeight: "bold",
  },
});

// ==========================
// UI del screen (botones, modales, búsqueda)
// ==========================
const styles = StyleSheet.create({
  floatBtn: {
    position: "absolute",
    top: "2%",
    right: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
    elevation: 5,
  },
  btnImg: { width: 40, height: 40, resizeMode: "contain" },

  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: "#555",
    marginBottom: 20,
    textAlign: "center",
  },

  loadingOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    zIndex: 100,
  },

  map: { width: "100%", height: "100%" },

  // gap selector modal
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    elevation: 20,
  },
  modalBox: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalText: {
    fontSize: 14,
    color: "#333",
  },
  modalCancel: {
    marginTop: 10,
    alignItems: "center",
  },

  // search UI
  inputLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
    marginTop: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 10,
    marginBottom: 10,
    height: 50,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    height: "100%",
  },
  clearButton: {
    padding: 5,
    marginLeft: 5,
    justifyContent: "center",
    alignItems: "center",
  },

  circleBtn: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  topRightButtons: {
    position: "absolute",
    top: 70,
    right: 20,
    zIndex: 10,
    alignItems: "center",
  },

  resultsBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    maxHeight: 260,
    overflow: "hidden",
  },
  hintText: {
    color: "#666",
    fontSize: 13,
    paddingVertical: 10,
    textAlign: "center",
  },
  resultsScroll: { maxHeight: 260 },
  resultsContent: { padding: 8 },

  resultItem: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    borderRadius: 6,
  },
  resultItemSelected: {
    backgroundColor: "#eef6ff",
    borderColor: "#cfe6ff",
    borderWidth: 1,
  },
  resultTitle: {
    fontWeight: "700",
    color: "#222",
    fontSize: 14,
  },
  resultSubtitle: {
    marginTop: 3,
    color: "#555",
    fontSize: 13,
  },
});

export default styles;
