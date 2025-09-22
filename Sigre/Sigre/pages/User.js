import { View, Text, SafeAreaView, Alert, Button } from "react-native";
import { useEffect, useState } from "react";
import { ScrollView } from "react-native-gesture-handler";
import { useSelector, useDispatch } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import { useFeeder } from "../hooks/useFeeder";
import FormContainer from "../components/Form/FormContainer";
import FormInput from "../components/Form/FormInput";
import FormSubmitButton from "../components/Form/FormSubmitButton";
import { Picker } from '@react-native-picker/picker';
import { useUser } from "../hooks/useUser";

export const User = ()=>{
    
    const { isOnline,user,feeders,selectedUser } = useSelector(state => state.AppReducer);
    const isFocused = useIsFocused();
    const [usuario, setUsuario] = useState({});
    const { getFeeders } = useFeeder();
    const { saveUser } = useUser();

    const { 
        usuaNombres, usuaApellidos, usuaActivo, usuaEquipo, usuaTipo, usuaImei,
        alimInterno} = usuario;

    const onChangeText = (value, fieldName) => {
        setUsuario({ ...usuario, [fieldName]: value });
      };

      useEffect (() => {
        getFeeders();
        if(selectedUser){
          setUsuario(selectedUser);
        }
      },[])

      const submit = () =>{
        saveUser(usuario);
      }

    return(
        <SafeAreaView style={{marginBottom:20}}>
        <ScrollView>
            <View >
                <FormContainer>
                    <FormInput 
                      value={usuaNombres}
                      onChangeText={(value) => onChangeText(value, 'usuaNombres')}
                      label='Nombres: '
                      placeholder= ""
                      editable={true}
                    />
                    <FormInput 
                      value={usuaApellidos}
                      onChangeText={(value) => onChangeText(value, 'usuaApellidos')}
                      label='Apellidos: '
                      placeholder= ""
                      editable={true}
                    />
                    <FormInput 
                      value={usuaEquipo}
                      onChangeText={(value) => onChangeText(value, 'usuaEquipo')}
                      label='Tipo Celular: '
                      placeholder= "DMS"
                      editable={true}
                    />
                    <Text style={{fontWeight:'bold'}}>Tipo Usuario:</Text>
                    <Picker
                      selectedValue={usuaTipo}
                      onValueChange={(itemValue) => onChangeText(itemValue, 'usuaTipo') }
                      >
                        <Picker.Item label="Inspector Campo N1" value="IN1"/>
                        <Picker.Item label="Inspector Campo N2" value="IN2"/>
                        <Picker.Item label="Inspector Campo N3" value="IN3"/>
                        <Picker.Item label="Inspector Pozos" value="IPO"/>
                        <Picker.Item label="Inspector Operador" value="OPE"/>
                    </Picker>
                    <FormInput 
                      value={usuaImei}
                      onChangeText={(value) => onChangeText(value, 'usuaImei')}
                      label='Código Celular: '
                      placeholder= ""
                      editable={true}
                    />
                    <Text style={{fontWeight:'bold'}}>Estado usuario:</Text>
                    <Picker
                      selectedValue={usuaActivo}
                      onValueChange={(itemValue) => onChangeText(itemValue, 'usuaActivo') }
                      >
                        <Picker.Item label="Habilitado" value={true}/>
                        <Picker.Item label="Deshabilitado" value={false}/>
                    </Picker>
                    <Text style={{fontWeight:'bold'}}>Alimentador Asignado:</Text>
                    <Picker 
                      selectedValue={alimInterno} numberOfLines={5}
                      onValueChange={(itemValue) => onChangeText(itemValue, 'alimInterno') }>
                    {
                      feeders.map((f,i) => (
                        <Picker.Item label={f.alimCodigo+" -> "+f.alimEtiqueta} value={f.alimInterno} key={i+f.alimInterno}/>
                        ))
                    }
                  </Picker>
                    <FormSubmitButton onPress={submit} title='Guardar'/>
                </FormContainer>
            </View>
      </ScrollView>
    </SafeAreaView>
  );
}

