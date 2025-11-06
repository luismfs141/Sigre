import { Polyline } from 'react-native-maps';
import { getGapColorByInspected } from '../../utils/utils';

const GapPolyline = ({ gap, onPress, selectionMode }) => {
  const color = selectionMode
    ? (gap.vanoSelected ? '#FCF400' : '#55AAFF')
    : getGapColorByInspected(gap);

  return (
    <Polyline
      coordinates={[
        { latitude: gap.vanoLatitudIni, longitude: gap.vanoLongitudIni },
        { latitude: gap.vanoLatitudFin, longitude: gap.vanoLongitudFin }
      ]}
      strokeWidth={3}
      strokeColor={color}
      tappable
      onPress={() => onPress(gap)}
    />
  );
};

export default GapPolyline;