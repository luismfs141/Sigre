import { StyleSheet } from "react-native";

const mapStyles = StyleSheet.create({
  mapContainer: {
    width: '100%',
    height: '92.9%',
  }
});




// //-----------------------------------------------------------------------
// const pinStyles = StyleSheet.create({
//   labelBox: {
//     marginTop: 0,
//     paddingVertical: 2,
//     backgroundColor: "rgba(0,0,0,0.65)",
//     borderRadius: 4,
//     maxWidth: 200,
//   },
//   labelText: {
//     color: "#00FFFF",
//     fontSize: 8,
//     textAlign: "center",
//     fontWeight: "bold",
//   },
// });



const pinStyles = StyleSheet.create({
  pinWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 30,       // ← ESTA ES LA CLAVE
    //height: 80,       // ← define área vertical para icono + globo
    overflow: "visible",      // 👈 CLAVE PARA QUE EL LABEL NO SE CORTE
  },


  //AGREGAR IF PARA ESTACIONES
  pinIcon: {
    width: 22,
    height: 22,
    resizeMode: "contain",
  },

  labelBox: {
    position: "absolute",
    //top: 26,                  // 👈 asegura que el label quede debajo del icono
    top: 25,

    //paddingVertical: 2,
    paddingVertical: 2,

    //paddingHorizontal: 4,
    paddingHorizontal: 1,

    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 4,
    //maxWidth: 140,

    //maxWidth: 180,
    maxWidth: 300,

    overflow: "visible",
    zIndex: 9999,
  },





  labelText: {
    color: "#00FFFF",
    //fontSize: 8,
    fontSize: 8,
    textAlign: "center",
    fontWeight: "bold",
  },
});




//-----------------------------------------------------------------------

export { mapStyles, pinStyles };

