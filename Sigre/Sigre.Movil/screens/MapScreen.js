import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Alert, Modal, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useDispatch, useSelector } from 'react-redux';

import DropdownComponent from '../components/DropDown';
import FormInput from '../components/Form/FormInput';
import CustomMarker from '../components/Map/CustomMarker';
import FabButton from '../components/Map/FabButton';
import GapPolyline from '../components/Map/GapPolyline';

import { setSelectedPin } from '../context/actions/Actions';
import { useMap } from '../hooks/useMap';
import { useOffLine } from '../hooks/useOffLine';
import { useTypification } from '../hooks/useTypification';

import { mapStyles } from '../assets/styles/mapStyles';

const MapScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const {
    selectedFeeder,
    isOnline,
    totalPins,
    gaps,
    pins,
    region
  } = useSelector(state => state.AppReducer);

  const { getPinsByFeeder, getGapsByFeeder, drawMapByFeeder, getPinsByRegion, setRegionByCoordinate } = useMap();
  const { getAll } = useTypification();
  const { getPinsByFeederOffLine, getGapsByFeederOffLine, getAllTypificationsOffline, getPinsByRegionOffLine } = useOffLine();

  const [showModal, setShowModal] = useState(false);
  const [selectItem, setSelectItem] = useState(false);
  const [x_elementCode, setX_elementCode] = useState('');
  const [userRegion, setUserRegion] = useState({
    latitude: -16.3648,
    longitude: -71.5284,
    latitudeDelta: 0.1922,
    longitudeDelta: 0.0421,
  });

  const SEAVanos = [/* ... */];

  useEffect(() => {
    if (selectedFeeder) {
      if (isOnline) {
        getPinsByFeeder(selectedFeeder.alimInterno);
        getGapsByFeeder(selectedFeeder.alimInterno);
        drawMapByFeeder(selectedFeeder.alimInterno);
        getAll();
      } else {
        getGapsByFeederOffLine(selectedFeeder.alimInterno);
        getPinsByFeederOffLine(selectedFeeder.alimInterno);
        getAllTypificationsOffline();
      }
    }
  }, [selectedFeeder]);

  const handleGapPress = (gap) => {
    gap.vanoSelected = !gap.vanoSelected;
    dispatch(setSelectedPin({
      id: gap.vanoInterno,
      label: gap.vanoEtiqueta,
      type: 0,
      elementCode: gap.vanoCodigo,
      latitude: gap.vanoLatitudIni,
      longitude: gap.vanoLongitudIni,
      nodoInicial: gap.vanoNodoInicial,
      nodoFinal: gap.vanoNodoFinal,
      selected: gap.vanoSelected,
      inspeccionado: gap.vanoInspeccionado,
      tercero: gap.vanoTercero
    }));
    if (!selectItem) navigation.navigate('Deficiencias');
  };

  const handlePinPress = (pin) => {
    pin.selected = !pin.selected;
    if (pin.type < 8) dispatch(setSelectedPin(pin));
  };

  const locateUser = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permiso denegado", "Ubicación no permitida");
      return;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest
    });

    setUserRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });

    setRegionByCoordinate(location.coords.latitude, location.coords.longitude);
  };

  const searchElement = () => {
    const pin = totalPins.find(p => p.label === x_elementCode || p.elementCode === x_elementCode);
    SEAVanos.forEach(code => {
      const gap = gaps.find(g => g.vanoCodigo === code + x_elementCode);
      if (gap) setRegionByCoordinate(gap.vanoLatitudIni, gap.vanoLongitudIni);
    });
    if (pin) setRegionByCoordinate(pin.latitude, pin.longitude);
    setShowModal(false);
  };

  const toggleSelectionMode = () => {
    if (!selectItem) {
      Alert.alert("Seleccionar elementos", "¿Desea seleccionar elementos para retirar?", [
        { text: 'Cancelar' },
        { text: 'OK', onPress: () => setSelectItem(true) }
      ]);
    } else {
      Alert.alert("Retirar elementos", "¿Desea retirar los elementos seleccionados?", [
        { text: 'Cancelar' },
        { text: 'OK', onPress: () => setSelectItem(false) }
      ]);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <DropdownComponent />
      <MapView
        style={mapStyles.mapContainer}
        region={region}
        onRegionChangeComplete={region => {
          isOnline ? getPinsByRegion(region) : getPinsByRegionOffLine(region);
        }}
        mapType="satellite"
      >
        {gaps.map((gap, index) => (
          <GapPolyline
            key={`gap-${index}`}
            gap={gap}
            onPress={handleGapPress}
            selectionMode={selectItem}
          />
        ))}
        {pins.map((pin, index) => (
          <CustomMarker key={`pin-${index}`} pin={pin} onPress={handlePinPress} />
        ))}
        <Marker coordinate={userRegion} title="Tu ubicación" />
      </MapView>

      {/* Botones flotantes */}
      <FabButton icon={require('../assets/GPS.png')} onPress={locateUser} top={100} />
      {selectedFeeder && (
        <>
          <FabButton icon={require('../assets/Find_Element.png')} onPress={() => setShowModal(true)} top={160} />
          <FabButton
            icon={require(`../assets/${selectItem ? 'removeItem2' : 'removeItem'}.png`)}
            onPress={toggleSelectionMode}
            top={220}
          />
        </>
      )}

      {/* Modal de búsqueda */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modal}>
          <FormInput
            value={x_elementCode}
            onChangeText={setX_elementCode}
            label="Código Elemento"
            placeholder="--------------"
            editable
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <Button title="Buscar" onPress={searchElement} />
            <Button title="Cerrar" color="red" onPress={() => setShowModal(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modal: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    elevation: 10,
  }
});

export default MapScreen;