import React, { useState, useEffect } from 'react';
import { Text, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { useFeeder } from '../hooks/useFeeder';
import styles from '../assets/styles/DropDown.js';
import { setSelectedFeeder, setSelectedPin} from '../context/actions/Actions';
import { useSelector, useDispatch } from 'react-redux';
import { useOffLine } from '../hooks/useOffLine';

   export function DropdownComponent () {

    const dispatch = useDispatch();
    const { idPhone, feeders, isOnline } = useSelector(state => state.AppReducer);
    const { getFeedersByIdPhone } = useFeeder();
    const { getFeedersByIdPhoneOffLine } = useOffLine();

    const [value, setValue] = useState(null);
    const [isFocus, setIsFocus] = useState(false);

    useEffect(() =>{
      if (isOnline) {
        getFeedersByIdPhone(idPhone);
      }
      else {
        getFeedersByIdPhoneOffLine(idPhone);
      }
    },[isOnline]) 

    const renderLabel = () => {
      if (value || isFocus) {
        return (
          <Text style={[styles.label,{ color: 'blue' }]}>
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
          style={[styles.dropdown,  { borderColor: 'blue' }]}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          inputSearchStyle={styles.inputSearchStyle}
          data= {feeders}
          search
          maxHeight={300}
          labelField="alimEtiqueta"
          valueField="alimInterno"
          placeholder={'Alimentadores'}
          searchPlaceholder="Buscar..."
          value={value}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          onChange={item => {
            setValue(item.value);
            setIsFocus(false);
            dispatch(setSelectedFeeder(item));
            dispatch(setSelectedPin(null));
          }}
        />
      </View>
    );
  };

  export default DropdownComponent;
