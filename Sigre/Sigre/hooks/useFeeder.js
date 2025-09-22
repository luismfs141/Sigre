import { useState } from "react";
import { api } from '../api/apiConfig';
import { useDispatch} from 'react-redux';
import { setIsLoading, setIsLoadingMessage, setFeeders } from "../context/actions/Actions";

export const useFeeder = () =>{

    const dispatch = useDispatch();
    
    const getFeeders = () =>{
        dispatch(setIsLoadingMessage("Cargando Alimentadores ..."));
        dispatch(setIsLoading(true));
        api().get('Feeder/GetFeeder')
        .then(resp => {
            dispatch(setIsLoading(false));
            dispatch(setFeeders(resp.data));
        })
        .catch(error => controlError(error));
    }

    const getFeedersByIdPhone = (idPhone) =>{
        dispatch(setIsLoadingMessage("Cargando Alimentadores ..."));
        dispatch(setIsLoading(true));
        api().get('Feeder/GetFeedersByIdPhone?x_idPhone='+idPhone)
        .then(resp =>{
            dispatch(setIsLoading(false));
            dispatch(setFeeders(resp.data));
        });
    }

    const controlError = (error) =>{
        dispatch(setIsLoading(false));
        Alert.alert(error);
    }

    return{
        getFeeders,
        getFeedersByIdPhone
    }
}
