import { useNavigation } from '@react-navigation/native';
import { Text, View } from 'react-native';
import { Callout } from 'react-native-maps';
import { calloutStyles } from '../assets/styles/PinCallout';
import { themeStyles } from '../assets/styles/Theme';
import { getElementNameFromType, mustRegisterDeficiency } from '../utils/utils';

export const PinCallout = ({ pin }) => {
  if (pin.Type < 8) {
    const navigation = useNavigation();

    const onCalloutPressed = () => {
      if (mustRegisterDeficiency(pin.Type)) {
        navigation.navigate("Deficiencias");
      }
    };

    return (
      <Callout tooltip onPress={onCalloutPressed}>
        <View style={calloutStyles.container}>
          <Text style={themeStyles.title}>
            {getElementNameFromType(pin.Type)}
          </Text>

          <Text style={themeStyles.subTitle}>
            {pin.label}
          </Text>

          {mustRegisterDeficiency(pin.Type) && (
            <Text style={{ textAlign: "center" }}>
              Presione para registrar deficiencia
            </Text>
          )}
        </View>
      </Callout>
    );
  }

  return null;
};

