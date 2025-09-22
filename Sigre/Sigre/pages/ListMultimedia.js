
import { useEffect, useState } from "react";
import { ComponentMultimedia } from "../components/Multimedia";
import { Button, SafeAreaView, View, Text,StyleSheet,Alert } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useNavigation,useIsFocused } from '@react-navigation/native';
import { useFile } from '../hooks/UseFile';
import { useSelector } from 'react-redux';
import { useOffLine } from "../hooks/useOffLine";
import { RecordAudio } from '../components/RecordAudio';


export const ListMultimedia = () =>{

    const { getFiles } = useFile();
    const { getFilesbyDeficiencyOffline } = useOffLine();
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const {idDeficiency, files, isOnline,selectedDeficiency} = useSelector(state => state.AppReducer);

    useEffect(() => {
        if(isFocused){
            if(isOnline){
                getFiles(idDeficiency);
            }
            else{
                getFilesbyDeficiencyOffline(idDeficiency);
            }
        }
    }, [isFocused])

    const onFinalizarPressed = () =>{
        navigation.navigate("Mapa");
    }

    const onDeficienciesPressed = () =>{
        navigation.navigate("Deficiencias");
    }


    return (
        <>
            <SafeAreaView style={{height:'90%'}}>
                <ScrollView>
                    <ComponentMultimedia label={"Foto Lado Izquierdo"} type={"1"} archivo={files} />
                    <ComponentMultimedia label={"Foto Frontal"} type={"2"} archivo={files}/>
                    <ComponentMultimedia label={"Foto Lado Derecho"} type={"3"} archivo={files}/>
                    <ComponentMultimedia label={"Foto Panorámica"} type={"4"} archivo={files}/>
                    <ComponentMultimedia label={"Foto Pozo Tierra 1"} type={"5"} archivo={files}/>
                    <ComponentMultimedia label={"Foto Pozo Tierra 2"} type={"6"} archivo={files}/>
                    <ComponentMultimedia label={"otros"} type={"7"} archivo={files}/>
                    {
                    <View style={styles.item}>
                        {
                            selectedDeficiency != null?
                                (selectedDeficiency.defiEstado == 'N'||selectedDeficiency.defiEstado == 'S')?
                                    Object.values(files).length>3?
                                        <Text>Registro Completado</Text>
                                        :
                                        <Text>Mínimo 4 fotos para completar registro</Text>
                                :
                                Object.values(files).length>1?
                                    <Text>Registro Completado</Text>
                                    :
                                    <Text>Mínimo 2 fotos para completar registro</Text>
                            :
                            <></>
                        }
                        {
                             selectedDeficiency != null?
                                Object.values(files).length>1?
                                    <RecordAudio files={files}/>
                                :
                                <></>
                            :
                            <></>
                        }
                    </View>
                    }                    
                </ScrollView>
            </SafeAreaView>

            <View style={{flexDirection:"row", alignSelf:"center"}}>
              <View style={{paddingHorizontal:30 }}>
                <Button title='Mapa' onPress={onFinalizarPressed}/>
              </View>
              <View style={{paddingHorizontal:30 }}>
                <Button title='Deficiencias' onPress={onDeficienciesPressed}/>
              </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    item: {
        alignItems:'center',
        paddingTop:'20%'
    }
  });
