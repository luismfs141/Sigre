import { api } from '../api/apiConfig';
import { appSettings, controlError } from '../utils/utils';
import { useDispatch,useSelector } from 'react-redux';
import { setIsLoading, setIsLoadingMessage, setUser } from "../context/actions/Actions";
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';
import axios from "axios";

export const useUser = () =>{

    const dispatch = useDispatch();
    const { idPhone } = useSelector(state => state.AppReducer);
    const [ users, setUsers ] = useState([]);
    const navigation = useNavigation();

    const getUsers =() =>{
        dispatch(setIsLoadingMessage("Cargando usuarios ..."));
        dispatch(setIsLoading(true));
        api().get('User/GetUsers', { timeout: appSettings.getTimeout })
        .then(resp => {
            setUsers(resp.data);
            dispatch(setIsLoading(false));
        })
        .catch(error => controlError(error, dispatch));
    }

    const getUserByImei = () =>{
        dispatch(setIsLoadingMessage("Cargando sistema ..."));
        dispatch(setIsLoading(true));
        api().get('User/GetUserByImei?x_imei='+idPhone, { timeout: appSettings.getTimeout })
        .then(resp => {
            dispatch(setUser(resp.data));
            dispatch(setIsLoading(false));
        })
        .catch(error => controlError(error, dispatch));
    }
    const saveUser = (user) =>{
        let result = null;
        const source = axios.CancelToken.source();
        setTimeout(() => {
            if (result._z === null){
                source.cancel();
            }
        }, appSettings.postTimeout);

        dispatch(setIsLoadingMessage("Guardando ..."));
        dispatch(setIsLoading(true));
        result = api().post('User/Save/', user, { cancelToken: source.token})
        .then((resp) => {
            dispatch(setIsLoading(false));
            Alert.alert("Arjen", "Usuario Guardado.", [
                {
                    text: "Aceptar",
                    onPress: () => navigation.navigate("Usuarios")
                }
            ]);
        })
        .catch(error => controlError(error, dispatch)); 
    }

    return{
        getUsers,
        getUserByImei,
        saveUser,
        users
    }
}