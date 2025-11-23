import { TouchableOpacity } from "react-native-gesture-handler";
import { View, Text, Image, StyleSheet, Alert } from "react-native";
import { useEffect, useState } from "react";
import { useIsFocused } from '@react-navigation/native';
import { useSelector } from 'react-redux';


export const User =( {object, onPress } ) =>{

    const isFocused = useIsFocused();
    const [ label, setLabel ] = useState("");
    const { feeders } = useSelector(state => state.AppReducer);
    const [alimentador,setAlimentador] = useState([{}]);

    useEffect(() => {
        var alim = feeders.find( f => f.alimInterno === object.alimInterno);
        setAlimentador(alim);
        if(isFocused){
        setLabel(object.usuaNombres+" "+object.usuaApellidos+" -> "+object.usuaEquipo +"( "+" )");
        }
    })

    return(
        <View style={{borderWidth: 1, flexDirection: 'row', alignItems: "center",display:object.usuaTipo=='ADM'||object.usuaTipo=='SIS' ?'none':'flex'}} >
            <Text style={styles.itemUser}>{label}</Text>
            <TouchableOpacity onPress={onPress}>
                <Image source={require('../assets/rigth-button.png')} style={{ width: 30, height: 30}}/>
            </TouchableOpacity>
        </View>
    );
}
const styles = StyleSheet.create({
    itemUser: {
    marginVertical: 20,
    paddingHorizontal: 10,
    width: '85%'
    }
});
  