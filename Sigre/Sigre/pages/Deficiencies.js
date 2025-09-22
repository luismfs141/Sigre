import React, { useEffect, useState } from 'react';
import { Alert, Button, SafeAreaView, View } from "react-native";
import { Deficiency } from "../components/Deficiency";
import { ScrollView } from "react-native-gesture-handler";
import { useDeficiency } from "../hooks/useDeficiency";
import { useDispatch, useSelector} from 'react-redux';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { setControlSave, setSelectedDeficiency, setTypeForm } from '../context/actions/Actions';

export const Deficiencies = () => {

    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const { getDeficiencies } = useDeficiency();
    const { selectedPin, deficiencies, user } = useSelector(state => state.AppReducer);
    const dispatch = useDispatch();
    
      useEffect(() => { 
        if(isFocused){
          getDeficiencies(selectedPin.type,selectedPin.id)
          if(user.usuaTipo =='DMS1'){
            if(selectedPin.type==5){
              Alert.alert('Recordatorio','Recuerda siempre revisar la tipificación 1034');
            }
            else{
              if(selectedPin.type==0){
                Alert.alert('Recordatorio','Recuerda siempre revisar la tipificación 5016, 5026 ó 5038');
              }
              else{
                Alert.alert('Recordatorio','Recuerda siempre revisar la tipificación 2024');
              }
            } 
          }
        }
     }, [isFocused]);

    const onDeficiencyPressed = (deficiency) => {
      dispatch(setSelectedDeficiency(deficiency));
      dispatch(setControlSave("def"));
      dispatch(setTypeForm("Deficiencia"));
      navigation.navigate("Deficiencia");
    }

    const onNewPressed = () => {
      dispatch(setSelectedDeficiency(null));
      dispatch(setControlSave("new"));
      dispatch(setTypeForm("Deficiencia"));
      navigation.navigate("Deficiencia")
    }
    const onNodeficiencyPressed = () => {
      dispatch(setSelectedDeficiency(null));
      dispatch(setControlSave("undef"));
      dispatch(setTypeForm("Sin Deficiencia"));
      navigation.navigate("Deficiencia")
    }

    return (
          <SafeAreaView style={{height:'90%'}}>
            <ScrollView>
              {
              deficiencies.map((item,i) => (
                <Deficiency
                key={i+item.defiInterno}
                object ={item}
                onPress={()=>onDeficiencyPressed(item)}
                />
              ))
              }
            </ScrollView>
            <View style={{flexDirection:"row", alignSelf:"center"}}>
              <View style={{paddingHorizontal:30 }}>
                  <Button title='Nuevo' onPress={()=>onNewPressed() }/>
              </View>
              <View style={{paddingHorizontal:30 }}>
                <Button title='Sin Deficiencia' onPress={()=>onNodeficiencyPressed()}/>
              </View>
            </View>
        </SafeAreaView>
    );
}