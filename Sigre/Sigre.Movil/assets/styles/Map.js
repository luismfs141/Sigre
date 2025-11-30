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
    top: 26,                  // 👈 asegura que el label quede debajo del icono
    paddingVertical: 2,
    paddingHorizontal: 4,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 4,
    maxWidth: 140,
    overflow: "visible",
    zIndex: 9999,
  },

  labelText: {
    color: "#00FFFF",
    fontSize: 8,
    textAlign: "center",
    fontWeight: "bold",
  },
});




//-----------------------------------------------------------------------

export { mapStyles, pinStyles };

