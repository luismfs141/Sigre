import * as MediaLibrary from "expo-media-library";
import * as React from "react";
import { Image, StyleSheet, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useSelector } from "react-redux";
import { useMultimedia } from "../hooks/useMultimedia";

// ✅ NUEVO: expo-audio 
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";

export const RecordAudio = ({ files }) => {
  const { selectedPin, selectedDeficiency, typifications, controlSave, idDeficiency } =
    useSelector((state) => state.AppReducer);

  const { upLoadFile } = useMultimedia();

  // ✅ NUEVO: recorder administrado por hook
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  const [typification, setTypification] = React.useState([{}]);

  function getPosition(string, subString, index) {
    return string.split(subString, index).join(subString).length;
  }

  const ensurePermissions = React.useCallback(async () => {
    // MediaLibrary (para guardar el asset)
    const mediaPerm = await MediaLibrary.requestPermissionsAsync();
    if (!mediaPerm?.granted) return false;

    // Mic (para grabar audio) -> expo-audio
    const micPerm = await AudioModule.requestRecordingPermissionsAsync();
    if (!micPerm?.granted) return false;

    return true;
  }, []);

  const startRecording = React.useCallback(async () => {
    try {
      const ok = await ensurePermissions();
      if (!ok) {
        console.warn("Permisos denegados (MediaLibrary o Mic).");
        return;
      }

      // ✅ NUEVO: propiedades cambiaron
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      console.log("Starting recording..");
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }, [ensurePermissions, audioRecorder]);

  const stopRecording = React.useCallback(async () => {
    try {
      let path = "";

      const route = String(Object.values(files ?? {})?.[0]?.archNombre ?? "");
      console.log(route);

      // ✅ NUEVO: stop() (ya no stopAndUnloadAsync)
      // El archivo queda disponible en audioRecorder.uri
      await audioRecorder.stop();

      await setAudioModeAsync({
        allowsRecording: false,
      });

      const uri = audioRecorder.uri;
      if (!uri) {
        console.warn("No se obtuvo uri de grabación.");
        return;
      }

      if (route.indexOf("Sin Deficiencias") >= 0) {
        path = route.substring(0, getPosition(route, "/", 3));
      } else {
        path = route.substring(0, getPosition(route, "/", 6));
      }

      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync(path.toString(), asset);

      console.log("Recording stopped and stored at", uri);
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  }, [audioRecorder, files]);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={recorderState.isRecording ? stopRecording : startRecording}>
        <Image
          source={
            recorderState.isRecording
              ? require("../assets/mic-on.png")
              : require("../assets/mic-off.png")
          }
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    alignContent: "flex-start",
    alignSelf: "center",
    marginTop: 20,
  },
});