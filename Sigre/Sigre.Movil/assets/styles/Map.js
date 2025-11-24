import { StyleSheet } from "react-native";

const mapStyles = StyleSheet.create({
    mapContainer: {
        width: '100%',
        height: '92.9%',
        }
});

// const pinStyles = StyleSheet.create({
//     label: {
//         color: "#55FFFF",
//         textShadowColor: 'black', 
//         textShadowRadius: 2, 
//         textShadowOffset: { 
//             width: 3,
//             height: 3
//         }
//     }
// });

const pinStyles = StyleSheet.create({
  labelBox: {
    marginTop: 0,
    paddingVertical: 2,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 4,
    maxWidth: 140,
  },
  labelText: {
    color: "#00FFFF",
    fontSize: 8,
    textAlign: "center",
    fontWeight: "bold",
  },
});

export { mapStyles, pinStyles };

