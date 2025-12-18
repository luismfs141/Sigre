import { StyleSheet } from "react-native";

const mapStyles = StyleSheet.create({
  mapContainer: {
    width: "100%",
    height: "92.9%"
  }
});

const pinStyles = StyleSheet.create({
  // Wrapper (define el bounding box real del marker del icono)
  // Wrapper del icono (tamaño real del icono)
  iconWrapper: {
    //width: 25,
    //height: 25,
    alignItems: "center",
    justifyContent: "center",
  },


  // 🟢 Bounding box REAL del icono (Android)
  iconCanvas: {
    width: 32,                 // 👈 prueba subir/bajar
    height: 32,                // 👈 prueba subir/bajar
    //backgroundColor: "rgba(0,255,0,0.3)", // 🟢 VERDE visible
    alignItems: "center",
    justifyContent: "center",
  },

  // ICONO
  pinIcon: {
    width: 25,
    height: 25,
    resizeMode: "contain",
    alignItems: "center",
    justifyContent: "flex-start",
  },


  markerCanvas: {
    position: "relative",
    backgroundColor: "rgba(255,0,0,0.25)", // 🔴 debug: canvas completo
  },


  // Globo real (contenido)
  labelBox: {
    position: "absolute",
    top: 0,                 // lo pegas arriba del canvas
    left: 0,
    right: 0,
    alignSelf: "center",
    justifyContent: "center",
    paddingVertical: 2,
    //paddingHorizontal: 6,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 4,
  },


  // 🔴 Bounding box REAL del marker (Android)
  labelCanvas: {
    width: 32,               // 👈 prueba subir/bajar
    //height: 80,              // 👈 prueba subir/bajar
    //backgroundColor: "rgba(255,0,0,0.3)", // 🔴 ROJO visible
    alignItems: "center",
    justifyContent: "center",
  },



  labelWrapperBox: {
    //width: 60,       // 👈 este es el “canvas” del Marker (sube a 420 si quieres)
    //height: 50,       // 👈 sube si el globo se corta por abajo
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
  }

});

export { mapStyles, pinStyles };

