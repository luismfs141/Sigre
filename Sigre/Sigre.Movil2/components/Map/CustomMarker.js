import { Text } from 'react-native';
import { Marker } from 'react-native-maps';
import { pinStyles } from '../../assets/styles/pinStyles';
import { getSourceImageFromType2 } from '../../utils/utils';
import PinCallout from './PinCallout';

const CustomMarker = ({ pin, onPress }) => (
  <Marker
    title={pin.label}
    tracksViewChanges={false}
    coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
    onPress={() => onPress(pin)}
    icon={getSourceImageFromType2(pin)}
  >
    <Text style={pinStyles.label}>{pin.label}</Text>
    <PinCallout pin={pin} />
  </Marker>
);

export default CustomMarker;