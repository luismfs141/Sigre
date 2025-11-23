import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Alert, Button, Image, Modal, StyleSheet, Text, ToastAndroid, View } from 'react-native';
import { TouchableOpacity } from "react-native-gesture-handler";
import MapView, { Marker, Polyline } from 'react-native-maps';

import { DropDown } from '../../components/DropDown.js';
import FormInput from "../../components/Form/FormInput";
import { PinCallout } from '../../components/PinCallout';

import { mapStyles, pinStyles } from '../../assets/styles/Map.js';
import { getGapColorByInspected, getSourceImageFromType2 } from '../../utils/utils.js';

import { useDatos } from "../../context/DatosContext";
import { useMap } from '../../hooks/useMap';

export const Map = () => {
  const navigation = useNavigation();
  const {
    selectedFeeder,
    pins,
    setPins,
    gaps,
    setGaps,
    region,
    setRegion,
    selectedItem,
    setSelectedPin,
    setSelectedGap,
  } = useDatos();

  const {
    getPinsByFeeder,
    getGapsByFeeder,
    getPinsByRegion,
    setRegionByCoordinate,
    setRegionByFeeder
  } = useMap();

  const [showModal, setShowModal] = useState(false);
  const [selectItem, setSelectItem] = useState(false);
  const [userRegion, setUserRegion] = useState(region);
  const [x_elementCode, setX_elementCode] = useState("");

  const SEAVanos = [
    "SEA085VMT0","SEA095VMT0","SEA060VMT0","SEA022VMT0",
    "SEA051VMT0","SEA093VMT0","SEA081VMT0","SEA030VMT0",
    "SEA052VMT0","SEA050VMT0","SEA070VMT0","SEA091VMT0",
    "SEA092VMT0","SEA087VMT0","SEA040VMT0","SEA088VMT0",
    "SEA000VMT0","SEA045VMT0"
  ];

  // --------------------------------------------------------------
  // CARGA PRINCIPAL DE DATOS (SOLO OFFLINE)
  // --------------------------------------------------------------
  useEffect(() => {
  if (!selectedFeeder) return;

  Promise.all([
    getPinsByFeeder(selectedFeeder.AlimInterno),
    getGapsByFeeder(selectedFeeder.AlimInterno)
  ]).then(([pinsLoaded, gapsLoaded]) => {
    setPins(pinsLoaded);
    setGaps(gapsLoaded);
    setRegionByFeeder(pinsLoaded, gapsLoaded); // <-- centra automáticamente el mapa
  }).catch(err => console.error(err));

}, [selectedFeeder]);

  // --------------------------------------------------------------
  // MANEJO DE REGIÓN
  // --------------------------------------------------------------
  const onRegionChangeComplete = (region) => {
    getPinsByRegion(region);
  };

  // --------------------------------------------------------------
  // CLICK EN GAP
  // --------------------------------------------------------------
  const onGapPressed = (gap) => {
    gap.vanoSelected = !gap.vanoSelected;
    setSelectedGap({
      ...gap,
      latitude: gap.VanoLatitudIni,
      longitude: gap.VanoLongitudIni,
    });
    if (!selectItem) navigation.navigate("Deficiencias");
  };

  // --------------------------------------------------------------
  // CLICK EN PIN
  // --------------------------------------------------------------
  const onPinPressed = (pin) => {
    pin.selected = !pin.selected;
    setSelectedPin(pin);
  };

  // --------------------------------------------------------------
  // GPS
  // --------------------------------------------------------------
  const userLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    let providerStatus = await Location.getProviderStatusAsync();
    let location = await Location.getCurrentPositionAsync({
      enableHighAccuracy: true,
      accuracy: Location.Accuracy.Highest,
      mayShowUserSettingsDialog: true
    });

    ToastAndroid.show(
      `Accuracy: ${location.coords.accuracy?.toFixed(2)}m - GPS: ${providerStatus.gpsAvailable}`,
      2000
    );

    const regionUpdate = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };

    setUserRegion(regionUpdate);
    setRegionByCoordinate(location.coords.latitude, location.coords.longitude);
  };

  // --------------------------------------------------------------
  // BUSCAR ELEMENTO
  // --------------------------------------------------------------
  const onSearch = () => {
    const pin = pins.find(
      p => p.Label === x_elementCode || p.ElementCode === x_elementCode
    );

    SEAVanos.forEach(prefix => {
      const gap = gaps.find(g => g.VanoCodigo === prefix + x_elementCode);
      if (gap) setRegionByCoordinate(gap.VanoLatitudIni, gap.VanoLongitudIni);
    });

    if (pin) setRegionByCoordinate(pin.Latitude, pin.Longitude);

    setShowModal(false);
  };

  // --------------------------------------------------------------
  // SELECCIÓN/RETIRO
  // --------------------------------------------------------------
  const activatedSelect = () => {
    if (!selectItem) {
      Alert.alert("SIGRE", "¿Desea seleccionar elementos para retirar?", [
        { text: 'Cancel' },
        { text: 'OK', onPress: () => setSelectItem(true) }
      ]);
    } else {
      Alert.alert("SIGRE", "¿Desea retirar los elementos seleccionados?", [
        { text: 'Cancel' },
        { text: 'OK', onPress: () => setSelectItem(false) }
      ]);
    }
  };

  // --------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------
  return (
    <View style={{ flex: 1 }}>
      <DropDown />

      <MapView
        style={mapStyles.mapContainer}
        region={region}
        onRegionChangeComplete={onRegionChangeComplete}
        mapType="satellite"
      >
        {/* GAPs */}
        {Array.isArray(gaps) && gaps.map((gap, i) => (
          <Polyline
            key={i}
            coordinates={[
              { latitude: gap.VanoLatitudIni, longitude: gap.VanoLongitudIni },
              { latitude: gap.VanoLatitudFin, longitude: gap.VanoLongitudFin }
            ]}
            strokeWidth={3}
            strokeColor={getGapColorByInspected(gap)}
            tappable
            onPress={() => onGapPressed(gap)}
          />
        ))}

        {/* PINES */}
        {Array.isArray(pins) && pins
          .filter(pin => pin.Type !== 0 && pin.Latitude != null && pin.Longitude != null)
          .map((pin, i) => (
            <Marker
              key={i + pin.Id + pin.Label}
              coordinate={{ latitude: pin.Latitude, longitude: pin.Longitude }}
              title={pin.Label}
              tracksViewChanges={false}
              onPress={() => onPinPressed(pin)}
              icon={getSourceImageFromType2(pin)}
            >
              <Text style={pinStyles.label}>{pin.Label}</Text>
              <PinCallout pin={pin} />
            </Marker>
          ))
        }

        {/* USUARIO */}
        {userRegion && <Marker coordinate={userRegion} title="user" />}
      </MapView>

      {/* BOTÓN GPS */}
      <TouchableOpacity style={styles.floatBtn} onPress={userLocation}>
        <Image source={require("../../assets/GPS.png")} style={styles.btnImg} />
      </TouchableOpacity>

      {/* BOTÓN BUSCAR */}
      {selectedFeeder && (
        <TouchableOpacity
          style={[styles.floatBtn, { top: "20%" }]}
          onPress={() => setShowModal(true)}
        >
          <Image source={require("../../assets/Find_Element.png")} style={styles.btnImg} />
        </TouchableOpacity>
      )}

      {/* BOTÓN SELECCIÓN */}
      {selectedFeeder && (
        <TouchableOpacity
          style={[styles.floatBtn, { top: "30%" }]}
          onPress={activatedSelect}
        >
          <Image
            source={
              !selectItem
                ? require("../../assets/removeItem.png")
                : require("../../assets/removeItem2.png")
            }
            style={styles.btnImg}
          />
        </TouchableOpacity>
      )}

      {/* MODAL */}
      <Modal transparent visible={showModal} animationType="slide">
        <View style={styles.modal}>
          <FormInput
            value={x_elementCode}
            onChangeText={setX_elementCode}
            label="Código Elemento"
            placeholder="--------------"
          />
          <View style={{ flexDirection: "row", marginTop: 10 }}>
            <Button title="Buscar" onPress={onSearch} />
            <View style={{ width: 25 }} />
            <Button color="red" title="Cerrar" onPress={() => setShowModal(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  floatBtn: {
    width: 40,
    position: 'absolute',
    top: "10%",
    left: "85%",
    zIndex: 10,
  },
  btnImg: {
    width: 40,
    height: 40,
  },
  modal: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    elevation: 5
  }
});

export default Map;