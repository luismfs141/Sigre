

import { Image } from "react-native";
import { Marker } from "react-native-maps";

export default function CustomMarker({ pin, onPress }) {
  return (
    <Marker
      coordinate={{
        latitude: pin.latitude,
        longitude: pin.longitude,
      }}
      onPress={() => onPress(pin)}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <Image
        source={require("../../assets/Elements/Uninspected/1.png")}
        style={{ width: 32, height: 32 }}
        resizeMode="contain"
      />
    </Marker>
  );
}
