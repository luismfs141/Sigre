import { TouchableOpacity } from "react-native-gesture-handler";
import { View, Text, StyleSheet, Image, Alert } from "react-native";
import { DropdownComponent } from '../components/DropDown';
import { useOffLine } from '../hooks/useOffLine';
import { useSelector } from 'react-redux';

export const OffLineConfig = () => {
    const { selectedFeeder, isOnline } = useSelector(state => state.AppReducer);
    const {
        download,
        synchronizeData,
        message,
        percent,
        sharingDB,
        deleteDB        
    } = useOffLine();

    const onPressDownload =() =>{
      Alert.alert("Sigre:", "Descargar un nuevo alimentador, eliminará los registros anteriores. Desea Continuar?",
      [
        {text: 'Si', onPress: ()=> {download()}},
        {text: 'No', },
      ]
      )
    }
    const onPressShynchro =() =>{
      Alert.alert("Sigre:", "Desea sincronizar el registro de deficiencias?",
      [
        {text: 'Si', onPress: ()=> {synchronizeData()}},
        {text: 'No', },
      ]
      )
    }
    const onPressSharing =() =>{
      sharingDB();
    }
    const onPressDelete =() =>{
      Alert.alert("Sigre:", "¿Desea eliminar el registro de deficiencias?",
      [
        {text: 'Si', onPress: ()=> {deleteDB()}},
        {text: 'No', },
      ]
      )
    }

    return (
        <View>
          <DropdownComponent/>
          {!selectedFeeder || !isOnline?
          <></>
          :
          <View style={[styles.functionButton]} >
                      <Text style={styles.text}>DESCARGAR ALIMENTADOR</Text>
              <TouchableOpacity disabled={!selectedFeeder || !isOnline} onPress={() => onPressDownload()}>
                  <Image source={require('../assets/rigth-button.png')} style={{ width: 30, height: 30, backgroundColor:'skyblue'}}/>
              </TouchableOpacity>
          </View>
          }
          {
          isOnline?
          <></>
          :
          <View>
            <View style={[styles.functionButton]} >
                        <Text style={styles.text}>SINCRONIZAR REGISTRO</Text>
                <TouchableOpacity onPress={() => onPressShynchro()}>
                    <Image source={require('../assets/rigth-button.png')} style={{ width: 30, height: 30, backgroundColor:'#7DFA1E'}}/>
                </TouchableOpacity>
            </View>
            <View style={[styles.functionButton]} >
                        <Text style={styles.text}>COMPARTIR REGISTRO</Text>
                <TouchableOpacity onPress={() => onPressSharing()}>
                    <Image source={require('../assets/rigth-button.png')} style={{ width: 30, height: 30, backgroundColor:'yellow'}}/>
                </TouchableOpacity>
            </View>
            <View style={[styles.functionButton]} >
                        <Text style={styles.text}>ELIMINAR REGISTRO</Text>
                <TouchableOpacity onPress={() => onPressDelete()}>
                    <Image source={require('../assets/rigth-button.png')} style={{ width: 30, height: 30, backgroundColor:'red'}}/>
                </TouchableOpacity>
            </View>
          </View>
          }
      </View>
    );
}

const styles = StyleSheet.create({
    container: {
      backgroundColor: 'white',
    },
    text: {
      width: '85%',
      padding: 10,
      fontWeight: 'bold',
      fontSize: 17,
      textAlign: 'center'
    },
    functionButton: {
      alignContent: 'center',
      width: '80%',
      borderWidth: 1, 
      flexDirection: 'row', 
      alignItems: "center", 
      marginBottom: 30,
      marginTop:30,
      alignSelf: 'center'
    }
  });