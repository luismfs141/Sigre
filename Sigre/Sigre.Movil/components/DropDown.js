import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import styles from '../assets/styles/DropDown.js';

import { useDatos } from '../context/DatosContext.js';
import { useFeeder } from '../hooks/useFeeder.js';

export function DropDown() {

  const { feeders, setFeeders, setSelectedFeeder } = useDatos();
  const { fetchLocalFeeders } = useFeeder();

  const [value, setValue] = useState(null);
  const [isFocus, setIsFocus] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await fetchLocalFeeders();
      setFeeders(data ?? []);
    })();
  }, []);

  const renderLabel = () => {
    if (value || isFocus) {
      return (
        <Text style={[styles.label, { color: 'blue' }]}>
          {value}
        </Text>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {renderLabel()}

      <Dropdown
        style={[styles.dropdown, { borderColor: 'blue' }]}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        inputSearchStyle={styles.inputSearchStyle}
        
        data={feeders}

        search
        maxHeight={300}
        labelField="AlimEtiqueta"  // exactamente como está en la DB
        valueField="AlimInterno"   // exactamente como está en la DB
        placeholder="Alimentadores"
        searchPlaceholder="Buscar..."
        value={value}

        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}

        onChange={(item) => {
          setValue(item.AlimInterno); // exactamente como está en la DB
          setIsFocus(false);
          setSelectedFeeder(item);    // guarda todo el objeto tal cual
        }}
      />
    </View>
  );
}

export default DropDown;