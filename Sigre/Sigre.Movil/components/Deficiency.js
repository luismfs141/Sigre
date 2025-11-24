import { TouchableOpacity } from "react-native-gesture-handler";
import { View, Text, Image, StyleSheet, Alert } from "react-native";
import { useSelector } from 'react-redux';
import { useEffect, useState } from "react";
import { useIsFocused } from '@react-navigation/native';

export const Deficiency =( {object, onPress } ) =>{

    const { typifications } = useSelector(state => state.AppReducer);
    const [ typification, setTypification ] = useState([{}]);
    const [ label, setLabel ] = useState("");
    const isFocused = useIsFocused();

    useEffect(() => {
        if(isFocused){
        var def = typifications.find(x => x.typificationId === object.tipiInterno);
        setTypification(def);  
        if(typification!=null){
            setLabel(typification.code+" "+typification.typification+" ("+object.defiEstado+" - "+object.defiEstadoSubsanacion+")"+
                    (object.defiNumSuministro!=null? "Num: "+object.defiNumSuministro : "")
                    + " \n Cod. Def: "+ object.defiCodDef);
            if(object.defiEstado=='S'&& object.defiEstadoSubsanacion!=2 && object.defiFecModificacion == null){
                Alert.alert('Recordatorio','Revisar primero las deficiencias S-0 ó S-1')
            }
        }
        else{
            if(object.defiEstado=="N"){
                setLabel("Nueva Deficiencia ("+object.defiEstado+" - "+object.defiEstadoSubsanacion+")"+
                            (object.defiNumSuministro!=null?"Num: "+ object.defiNumSuministro : ""));
            }
            else{
                setLabel("Sin Deficiencia ("+object.defiEstado+")");
            }
        }
    }
    })

    const getColorDeficiency =( code ) =>{
        if(code!= null){
            if(code == 1034 || code == 2024 || code == 5016){
                return {
                        marginVertical: 20,
                        paddingHorizontal: 10,
                        width: '85%',
                        color: 'red'
                      }
            }
            else{
                if(code == 5026){
                    return {
                        marginVertical: 20,
                        paddingHorizontal: 10,
                        width: '85%',
                        color: 'blue'
                    } 
                }
                else{
                    if(code ==5038){
                        return {
                            marginVertical: 20,
                            paddingHorizontal: 10,
                            width: '85%',
                            color: 'green'
                        }   
                    }
                    else{
                        return {
                            marginVertical: 20,
                            paddingHorizontal: 10,
                            width: '85%',
                        } 
                    }
                }
            }
        }
        else{
            return{
                marginVertical: 20,
                paddingHorizontal: 10,
                width: '85%',
            }
        }
    }

    return(
        
        <View style={{borderWidth: 1, flexDirection: 'row', alignItems: "center", display:object.defiActivo==false?'none':'flex',
                        backgroundColor:object.defiInspeccionado?"#FFF62E":"white"}} >
                {typification!=null?
                    <Text style={ getColorDeficiency(typification.code)}>{label}</Text>
                    :
                    <Text style={styles.itemDeficiency}>{label}</Text>
                }
            <TouchableOpacity onPress={onPress}>
                <Image source={require('../assets/rigth-button.png')} style={{ width: 30, height: 30}}/>
            </TouchableOpacity>
        </View>
    );
}
const styles = StyleSheet.create({
      itemDeficiency: {
        marginVertical: 20,
        paddingHorizontal: 10,
        width: '85%',
      }
    });
  