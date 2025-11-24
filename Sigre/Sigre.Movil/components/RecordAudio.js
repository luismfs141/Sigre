import * as React from 'react';
import { View, StyleSheet, Image} from 'react-native';
import { Audio } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import { TouchableOpacity } from "react-native-gesture-handler";
import mime from "mime";
import { useSelector } from 'react-redux';
import { useMultimedia } from "../hooks/useMultimedia";
import { saveFile } from "../utils/utils"

export const RecordAudio = ({files}) => {

  const { selectedPin, selectedDeficiency ,typifications, controlSave, idDeficiency} = useSelector(state => state.AppReducer);
  const { upLoadFile } = useMultimedia();
  const [recording, setRecording] = React.useState();
  const [ typification, setTypification ] = React.useState([{}]);

  async function startRecording() {
    try {
      MediaLibrary.requestPermissionsAsync();
      await MediaLibrary.getPermissionsAsync();      
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync( Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  function getPosition(string, subString, index) {
    return string.split(subString, index).join(subString).length;
  }

  async function stopRecording() {
    var path = "";

    var route = String(Object.values(files)[0].archNombre);

    console.log(route);

    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
    const uri = recording.getURI();
    if(route.indexOf('Sin Deficiencias')>=0){
      path = route.substring(0, getPosition(route, '/', 3));
    }
    else{
      path = route.substring(0, getPosition(route, '/', 6));
    }

    const asset = await MediaLibrary.createAssetAsync(uri);
    await MediaLibrary.createAlbumAsync(path.toString(), asset);
    console.log('Recording stopped and stored at', uri);
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={recording ? stopRecording : startRecording}>
        <Image source={recording ?
        require('../assets/mic-on.png')
        : require('../assets/mic-off.png')}/>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    alignContent: 'flex-start',
    alignSelf:'center',
    marginTop: 20
  },
});