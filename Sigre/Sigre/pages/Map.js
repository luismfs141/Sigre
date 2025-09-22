import React, { useEffect, useState } from 'react';
import MapView, { Marker, Overlay, Polyline } from 'react-native-maps';
import { View, Text, Alert, Image, Modal, StyleSheet, Button, ToastAndroid } from 'react-native';
import { useMap } from '../hooks/useMap';
import { DropdownComponent } from '../components/DropDown';
import { getSourceImageFromType2, getGapColorByInspected } from '../utils/utils';
import { PinCallout } from '../components/PinCallout';
import { mapStyles, pinStyles } from '../assets/styles/Map.js';
import { useSelector, useDispatch } from 'react-redux';
import { setSelectedPin } from '../context/actions/Actions';
import { useNavigation } from '@react-navigation/native';
import { useTypification} from '../hooks/useTypification';
import * as Location from 'expo-location';
import { TouchableOpacity } from "react-native-gesture-handler";
import FormInput from "../components/Form/FormInput";
import { useOffLine } from '../hooks/useOffLine';

export const Map = () => {

  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { selectedFeeder,selectedPin,isOnline,totalPins, gaps,pins,region } = useSelector(state => state.AppReducer);
  const { getPinsByRegion, setRegionByCoordinate, getPinsByFeeder,getGapsByFeeder,drawMapByFeeder } = useMap();
  const { getAll } = useTypification(); //mod Online-Offline
  const { getPinsByRegionOffLine, getPinsByFeederOffLine, getGapsByFeederOffLine,
    getAllTypificationsOffline } = useOffLine();
  const [showModal, setShowModal] = useState(false);
  const [selectItem,setSelectItem] = useState(false);
  const [userRegion, setUserRegion]= useState({
    latitude:-16.364801103648222,
    longitude:-71.52841639353615,
    latitudeDelta:0.1922,
    longitudeDelta:0.0421,
  });
  const [x_elementCode, setX_elementCode] = useState();
  const SEAVanos = ["SEA085VMT0","SEA095VMT0","SEA060VMT0","SEA022VMT0",
                  "SEA051VMT0","SEA093VMT0","SEA081VMT0","SEA030VMT0",
                  "SEA052VMT0","SEA050VMT0","SEA070VMT0","SEA091VMT0",
                  "SEA092VMT0","SEA087VMT0","SEA040VMT0","SEA088VMT0",
                  "SEA000VMT0","SEA045VMT0"];

  useEffect (() => {
    if(selectedFeeder){
      if(isOnline === true ) {
        getPinsByFeeder(selectedFeeder.alimInterno);
        getGapsByFeeder(selectedFeeder.alimInterno);
        getAll();
        drawMapByFeeder(selectedFeeder.alimInterno);
      }
      else{
        getGapsByFeederOffLine(selectedFeeder.alimInterno);
        getPinsByFeederOffLine(selectedFeeder.alimInterno);
        getAllTypificationsOffline();
      }
    }
  }, [selectedFeeder])

  const onRegionChangeComplete = (region) => {
    if(isOnline === true){
      getPinsByRegion(region);
    }
    else{
      getPinsByRegionOffLine(region);
    }
  }

  const onGapPressed= (gap) =>{
    gap.vanoSelected = !gap.vanoSelected
    dispatch (setSelectedPin ({
      "id":gap.vanoInterno,
      "label":gap.vanoEtiqueta,
      "type":0,
      "elementCode": gap.vanoCodigo,
      "latitude": gap.vanoLatitudIni,
      "longitude": gap.vanoLongitudIni,
      "nodoInicial": gap.vanoNodoInicial,
      "nodoFinal":gap.vanoNodoFinal,
      "selected":gap.vanoSelected,
      "inspeccionado":gap.vanoInspeccionado,
      "tercero":gap.vanoTercero
    }));
    if(selectItem == false){
      navigation.navigate("Deficiencias");
    }
    
  }

  const onPinPressed = (pin) => {
    pin.selected = !pin.selected;
    if(pin.type<8){
      dispatch(setSelectedPin(pin));//subterraneas
    }
  }

  const userLocation = async () => {
    let {status} = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted'){
      setErrorMsg('Permiso de Locación Denegado');
    }
    let providerStatus = await Location.getProviderStatusAsync();
    let location = await Location.getCurrentPositionAsync({enableHighAccuracy:true,
                                                          accuracy: Location.Accuracy.Highest,
                                                          mayShowUserSettingsDialog: true});

    if (location) {
      ToastAndroid.show(
        `Got accuracy: ${location.coords.accuracy?.toFixed(2)} meters, gps: ${
          providerStatus.gpsAvailable
        }`,
        2000
      );
    }
    setUserRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta:0.005,
      longitudeDelta:0.005,
    });
    setRegionByCoordinate(location.coords.latitude,location.coords.longitude);
  }
  const onChangeText = (value, fieldName) => {
    setX_elementCode( ""+value );
  }

  const shearchItem = () => {
    var pin = totalPins.find(p => p.label == x_elementCode || p.elementCode == x_elementCode);

    SEAVanos.forEach(function (element){
      var gap = gaps.find(g => g.vanoCodigo == element+x_elementCode);
      if(gap != null){
        setRegionByCoordinate(gap.vanoLatitudIni,gap.vanoLongitudIni);
      }
    });
    if(pin != null){
      setRegionByCoordinate(pin.latitude,pin.longitude);
    }
    setShowModal(!showModal);
  }

  const activatedSelect = () => {
    if(selectItem ==false){
      Alert.alert("Sigre",
      "Desea seleccionar elementos para retirar?",
      [
        { text: 'Cancel'},
        { text: 'OK',onPress: () => setSelectItem(!selectItem)},
      ],
      { cancelable: false });
    }
    else{
      Alert.alert("Sigre",
      "Desea retirar los elementos seleccionados?",
      [
        { text: 'Cancel'},
        { text: 'OK',onPress: () => dropItems()},
      ],
      { cancelable: false });
    }
  }

  const dropItems = () =>{
    setSelectItem(!selectItem);
  }

  const gapSelectColor = (gap) =>{
    var color ="";
    if(selectItem){
      gap.vanoSelected? color ='#FCF400': color='#55AAFF';
    }
    else{
      color = '#55AAFF';
    }
    return color;
  }
  
  return (
    <View>
      <DropdownComponent/>
      <MapView style={mapStyles.mapContainer} region={region} onRegionChangeComplete={(region) => onRegionChangeComplete(region)}
      mapType={'satellite'}>
        {
          
            gaps.map((gap, i) => (
                <Polyline key={i}
                coordinates = {[
                  { latitude: gap.vanoLatitudIni, longitude: gap.vanoLongitudIni },
                  { latitude: gap.vanoLatitudFin, longitude: gap.vanoLongitudFin }
                ]}
                strokeWidth={3}
                strokeColor = {getGapColorByInspected(gap)}
                tappable={true}
                onPress={
                  selectItem?
                  ()=> onGapPressed(gap)
                  :
                  ()=> Alert.alert(
                  "Vano",
                  "Presione Ir para registrar Deficiencia",
                  [
                    {text: 'Ir', onPress: () => onGapPressed(gap)},
                    {text: 'Cancel'},
                    ],
                    {cancelable: false}
                )}
                />
        ))
        }
        {
          pins.map((pin, i) => (
            <Marker
              key={i +pin.id+pin.label}
              title={pin.label}
              tracksViewChanges={false}
              draggable={true}
              anchor={{x: 0.5, y: 0.5}}
              coordinate={{
                latitude: pin.latitude,
                longitude: pin.longitude
              }}
              onPress={() => onPinPressed(pin)}
              icon={getSourceImageFromType2(pin)}
            >
              <Text key={i+pin.elementCode} style={pinStyles.label}>{pin.label}</Text>
              <PinCallout pin={pin}/>
            </Marker>
          ))
        }
        <Marker coordinate={userRegion} title='user'/>
      </MapView>
      <View style={{width:40, backgroundColor:"transparent",position:'absolute',top:"10%",left:"85%",zIndex:10}}>
        <TouchableOpacity onPress={()=>userLocation()}>
            <Image source={require("../assets/GPS.png")} style={{width:40, height:40}}/>
        </TouchableOpacity>
      </View>
      <Modal
          animationType={'slide'}
          transparent={true}
          visible={showModal}
          onRequestClose={() => {
            console.log('Modal has been closed.');
          }}>
          <View style={styles.modal}>
            <FormInput 
                      value={x_elementCode}
                      onChangeText={(value) => onChangeText(value, 'x_elementCode')}
                      label='Código Elemento'
                      placeholder= {"--------------"}
                      editable={true}
                      />
            <View style={{flexDirection:'row'}}>
              <View style={{marginRight:25}}>
                <Button
                    onPress={shearchItem}
                    title='Buscar'
                    />
              </View>
              <View style={{marginLeft:25}}>
                <Button 
                color={'red'}
                title="Close"
                onPress={() => {
                  setShowModal(!showModal);
                }}
                />
              </View>
            </View>
          </View>
        </Modal>
        {selectedFeeder?
          <View style={{width:40, backgroundColor:"transparent",position:'absolute',top:"20%",left:"85%",zIndex:10}}>
            <TouchableOpacity onPress={()=>{setShowModal(!showModal)}}>
                <Image source={require("../assets/Find_Element.png")} style={{width:40, height:40}}/>
            </TouchableOpacity>
          </View>
        :
        <></>}
        {selectedFeeder?
          <View style={{width:40, backgroundColor:"transparent",position:'absolute',top:"30%",left:"85%",zIndex:10}}>
            <TouchableOpacity onPress={()=>{activatedSelect()}}>
              {selectItem==false?
              <Image source={require("../assets/removeItem.png")} style={{width:40, height:40}}/>
              :
              <Image source={require("../assets/removeItem2.png")} style={{width:40, height:40}}/>
              }
            </TouchableOpacity>
          </View>
        :
        <></>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
  },
  modal: {
    position:'absolute',
    top:'30%',
    marginTop:-10,
    flex: 0.15,
    alignItems: 'center',
    alignSelf:'center',
    backgroundColor: 'white',
    paddingHorizontal:20
  },
  text: {
    color: '#3f2949',
  },
});