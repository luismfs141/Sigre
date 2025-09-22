import { StyleSheet } from "react-native";

const mapStyles = StyleSheet.create({
    mapContainer: {
        width: '100%',
        height: '92.9%',
        }
});

const pinStyles = StyleSheet.create({
    label: {
        color: "#55FFFF",
        textShadowColor: 'black', 
        textShadowRadius: 1, 
        textShadowOffset: { 
            width: 1,
            height: 1
        }
    }
});

export { mapStyles, pinStyles }