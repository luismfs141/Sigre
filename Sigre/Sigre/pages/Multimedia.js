import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet,Dimensions, SafeAreaView ,Image, Alert} from "react-native";
import { Camera, CameraType } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { TouchableOpacity, PinchGestureHandler } from "react-native-gesture-handler";
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useFile } from "../hooks/UseFile";
import { Deficiency } from './Deficiency';


const windowWidth = Dimensions.get('window').width;

export const Multimedia = () =>{

  const { selectedPin, selectedDeficiency, typifications, photo, controlSave, idDeficiency, selectedFeeder, isOnline} = useSelector(state => state.AppReducer);

  const { saveFile } = useFile();
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [image, setImage] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [flash, setFlash] = useState(Camera.Constants.FlashMode.off);
  const [file, setFile] = useState({});
  const cameraRef = useRef(null);
  const [ typification, setTypification ] = useState([{}]);
  const navigation = useNavigation();
  const [zoom, setZoom] = useState(0);

  const { archTipo,archTabla,archCodTabla,archNombre,archActivo} =file;

  useEffect(() => {
    if(selectedDeficiency){
      var def = typifications.find(x => x.typificationId === selectedDeficiency.tipiInterno);
    }
    setTypification(def); 
    (async () => {
      MediaLibrary.requestPermissionsAsync();
      MediaLibrary.getPermissionsAsync();
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef) {
      try {
        const data = await cameraRef.current.takePictureAsync();
        setImage(data);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const savePicture = async () => {
    var path="";
    if (image) {
      try {
        const asset = await MediaLibrary.createAssetAsync(image.uri);
        if(controlSave=="undef"){
          path =selectedFeeder.alimEtiqueta+"/Sin Deficiencias/"+ (selectedPin.elementCode).replace(/(\r\n|\n|\r)/gm, "")+"-"+(selectedPin.label).replace(/(\r\n|\n|\r)/gm, "")+"/"+photo
        }
        else{
          if(controlSave == "new"){
            let root = selectedFeeder.alimEtiqueta+"/Deficiencias/";
            path = root.concat((selectedDeficiency.defiTipoElemento).replace("SED ","SED"),"/",(selectedPin.elementCode).replace(/(\r\n|\n|\r)/gm, ""),"-",(selectedPin.label).replace(/(\r\n|\n|\r)/gm, ""),"/",idDeficiency,"/",typification.code,"/",photo);
          }
          else{
            if(selectedDeficiency.defiEstado=='O'){
              path = selectedFeeder.alimEtiqueta+"/Sin Deficiencias/"+ (selectedPin.elementCode).replace(/(\r\n|\n|\r)/gm, "")+"-"+(selectedPin.label).replace(/(\r\n|\n|\r)/gm, "")+"/"+photo
            }
            else{
              let root = selectedFeeder.alimEtiqueta+"/Deficiencias/";
              if(selectedDeficiency.defiEstado=='N'){  
                path = root.concat((selectedDeficiency.defiTipoElemento).replace("SED ","SED"),"/",(selectedPin.elementCode).replace(/(\r\n|\n|\r)/gm, ""),"-",(selectedPin.label).replace(/(\r\n|\n|\r)/gm, ""),"/",idDeficiency,"/",typification.code,"/",photo);
              }
              else{
                path = root.concat((selectedDeficiency.defiTipoElemento).replace("SED ","SED"),"/",(selectedPin.elementCode).replace(/(\r\n|\n|\r)/gm, ""),"-",(selectedPin.label).replace(/(\r\n|\n|\r)/gm, ""),"/",selectedDeficiency.defiCodDef,"/",typification.code,"/",photo);
              }
            }
          }
        }
        if(isOnline){
          const album = await MediaLibrary.createAlbumAsync(path.toString(), asset);
        }
        else{
          path = path.toString().replace(selectedFeeder.alimEtiqueta,selectedFeeder.alimEtiqueta+'-OFF');
          const album = await MediaLibrary.createAlbumAsync(path.toString(), asset);
        }
        
        file.archTipo=photo;
        file.archTabla="Deficiencias";
        file.archCodTabla=idDeficiency;
        file.archNombre=path;
        file.archActivo=true;
        
        saveFile(file);

        setImage(null);
        navigation.navigate("ListaMultimedia");
      } catch (error) {
        console.log(error);
      }
    }
  };

  const changeZoom = (event) => {
    if (event.nativeEvent.scale > 1 && zoom < 1) {
      setZoom(zoom + 0.03);
    }
    if (event.nativeEvent.scale < 1 && zoom > 0) {
      setZoom(zoom - 0.03);
    }
  };

  if (hasCameraPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', backgroundColor: '#000' }}>
      <PinchGestureHandler onGestureEvent={(event) => changeZoom(event)}>
        <View style={{ flex: 1}}>
        {!image ? (
        <Camera 
          style={styles.camera}
          type={type}
          zoom={zoom}
          ref={cameraRef}
          ratio='4:3'
          width={'100%'}
          height={'100%'}
          flashMode={flash}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingHorizontal: 30,
            }}>
              <TouchableOpacity onPress={() => {
                setType(
                  type === CameraType.back ? CameraType.front : CameraType.back
                );
              }}>
              <Image 
                source={require('../assets/retweet.png')}
              />
              </TouchableOpacity>
              <TouchableOpacity onPress={() =>
                setFlash(
                  flash === Camera.Constants.FlashMode.off
                    ? Camera.Constants.FlashMode.on
                    : Camera.Constants.FlashMode.off
                )
              } >
              <Image
                source={flash === Camera.Constants.FlashMode.off ?
                  require('../assets/flash-off.png')
                  : require('../assets/flash.png')}
              />
              </TouchableOpacity>
            </View>
        </Camera>
        ) : (
          <Image source={{ uri: image.uri }} style={styles.camera} />
        )}
        <View style={styles.controls}>
        {image ? (
          <View
            style={{
              flex:1,
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingHorizontal: 50,
              width: '100%',
              height: '100%'
            }}
          >
            <TouchableOpacity onPress={() => setImage(null)}>
              <Image source={require("../assets/return.png")}/>
            </TouchableOpacity>
            <TouchableOpacity onPress={savePicture}>
              <Image source={require("../assets/save.png")}/>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 50,
            alignSelf:'center'
          }}>
            <TouchableOpacity onPress={takePicture}>
              <Image source={require("../assets/camera.png")}/>
            </TouchableOpacity>
            
          </View>
        )}
      </View>
        </View>
      </PinchGestureHandler>
      </SafeAreaView>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000',
    padding: 8,
  },
  controls: {
    flex: 0.1,
  },
  button: {
    height: 40,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#E9730F',
    marginLeft: 10,
  },
  camera: {
    flex: 1,
    borderRadius: 20,
  },
  topControls: {
    flex: 0.5,
  },
  buttonCamera: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});