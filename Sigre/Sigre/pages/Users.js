import React, { useEffect, useState } from 'react';
import { Alert, Button, SafeAreaView, View,Text } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useUser } from "../hooks/useUser";
import { User } from "../components/User";
import { setSelectedUser } from '../context/actions/Actions';
import { useDispatch } from 'react-redux';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useSelector } from 'react-redux';

export const Users = () => {

  const navigation = useNavigation();
  const { getUsers, users } = useUser();
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const { user } = useSelector(state => state.AppReducer);

  useEffect(() => {
    if(isFocused){
      getUsers(); 
    } 
 },[isFocused]);

  const onUserPressed = (user) => {
    dispatch(setSelectedUser(user));
    navigation.navigate("Usuario");
  }

  const onNewUserPressed = () => {
    dispatch(setSelectedUser(null));
    navigation.navigate("Usuario");
  }

    return (
      <SafeAreaView style={{height:'90%'}}>
         {(user.usuaTipo =="ADM" || user.usuaTipo =="IN3")?
         <View>
            <ScrollView>
              {
              users.map((item,i) => (
                <User
                key={i+item.usuaInterno+item.usuaImei}
                object ={item}
                onPress={()=>onUserPressed(item)}
                />
              ))
              }
            </ScrollView>
            
            <View style={{flexDirection:"row", alignSelf:"center"}}>
              <View style={{paddingHorizontal:30 }}>
                  <Button title='Nuevo Usuario' onPress={()=>onNewUserPressed() }/>
              </View>
            </View>
            </View>
              :
              <>
              <Text>No tiene permisos</Text>
              </>}   
        </SafeAreaView>
        
    );
}