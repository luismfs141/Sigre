// JavaScript source code
import { StatusBar } from "expo-status-bar";
import {ImageBackground, StyleSheet, Text, View, Switch,TouchableOpacity} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appSettings } from '../utils/utils';
import { setIsOnline } from "../context/actions/Actions";
import { useUser } from "../hooks/useUser";

const AppButton = ({ onPress, title, size, backgroundColor }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.appButtonContainer,
        size === "sm" && {
          paddingHorizontal: 18,
          paddingVertical: 6,
          elevation: 6,
          borderRadius: 20,
          alignItems: 'center',
        },
        backgroundColor && { backgroundColor }
      ]}
    >
      <Text style={[styles.appButtonText, size === "sm" && { fontSize: 24, color: 'white' }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );


export function Welcome(){

    const navigation = useNavigation();
    const { idPhone, isOnline, user } = useSelector(state => state.AppReducer);
    const dispatch = useDispatch();
    const { getUserByImei } = useUser();
    const isFocused = useIsFocused();
    

    useEffect(() => {
        getConectionStateValue();
        getUserByImei();      
    }, [isFocused]);


    const getConectionStateValue = async () => {
        const isOnline = await AsyncStorage.getItem(appSettings.isOnlineState)
        if (isOnline) {
            dispatch(setIsOnline(isOnline === "true"));
        }
        else {
            dispatch(setIsOnline(true));
        }
    }

    return(
        <View style={styles.Container}>
            <ImageBackground
                source={require('../assets/background.jpg')}
                resizeMode = 'cover'
                style ={{flex: 1, backgroundColor: '#031E52'}}>
                    <View style={styles.ConexionStyle}>
                        {isOnline?
                        <Text style={styles.TextConexion}>En Línea</Text>
                        :
                        <Text style={styles.TextConexion}>Sin Conexión</Text>
                        }  
                    </View>
                    <View style={styles.TitleStyle}>
                        <Text style={styles.TextIntro}>Distancias Mínimas de Seguridad</Text>
                    </View>
                    <View style={styles.DownStyle}>
                        <View style={styles.RegionButtonStyle}>
                            <AppButton title={'Ingresar'} size="sm" backgroundColor="#007bff" onPress={ () =>{isOnline?navigation.navigate("Mapa"):navigation.navigate("OffLineMode")} }></AppButton>
                        </View> 
                    </View>
                    <View style={{flexDirection: 'row'}}>
                        {/* <Text style={styles.TextIdDevice}>Id Device: {idPhone}</Text> */}
                        <Text style={styles.TextVersion}>Version: 1.0.0</Text>
                </View>
            </ImageBackground>
            <StatusBar style="auto" hidden ={false} backgroundColor='white' animated={true}>
            </StatusBar>
        </View>
    );
}

const styles = StyleSheet.create({
    Container:{
        flex:1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    TextIntro: {
        fontWeight: 'bold',
        fontSize: 30,
        textAlign: 'center',
        color: 'white'
    },
    TextConexion: {
        fontWeight: 'bold',
        fontSize: 20,
        textAlign:'center',
        color: 'Red',
        paddingHorizontal: 10
    },
    DownStyle:{
        flex:1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    TitleStyle:{
        alignItems: 'center',
        flex:1,
        justifyContent: 'center',
    },
    ConexionStyle:{
        alignItems: 'flex-start',
        flex:1,
        marginTop: '60%',
    },
    BodyStyle:{
        flex:1,
        alignItems: 'center',
        justifyContent: 'space-around',
        alignContent: 'space-between',
    },
    RegionButtonStyle:{
        width: '40%',
        height: 80,
        alignItems: 'center',
    },
    TextVersion: {
        fontWeight: 'bold',
        fontSize: 12,
        color: 'black',
        textAlign: 'right',
        alignItems: 'flex-end',
        color: 'white',
        width:'50%'
    },
    TextIdDevice: {
        fontWeight: 'bold',
        fontSize: 12,
        color: 'black',
        textAlign: 'left',
        alignItems: 'flex-start',
        color: 'white',
        width:'50%'
    },
    ImageStyle:{
        width:280,
        height:120,
    },
});
