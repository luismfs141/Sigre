import { api } from "../api/apiConfig";
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { setIsLoading, setIsLoadingMessage,setFiles } from "../context/actions/Actions";
import * as SQLite from 'expo-sqlite';
import { useDeficiency } from "../hooks/useDeficiency";

export const useFile = () => {

    const dispatch = useDispatch();
    const navigation = useNavigation();
    const { deficiencyInspected } = useDeficiency();
    const { isOnline,selectedDeficiency,files,idDeficiency } = useSelector(state => state.AppReducer);
    const [totalFiles, setTotalFiles] = useState([]);
    const database = SQLite.openDatabase('sigre.db');

    const saveFile = (file) => {
        dispatch(setIsLoadingMessage("Guardando ..."));
        dispatch(setIsLoading(true));
        if(isOnline){
            api().post('File/UploadFile/', file)
            .then((resp) => {
                dispatch(setIsLoading(false));
                Alert.alert("Arjen", "Se guardó correctamente.", [
                    {
                        text: "Aceptar",
                        onPress: () => navigation.navigate("ListaMultimedia")
                    }
                ]);
                inspectedDeficiency();
            })
            .catch(error => controlError(error));
            }
        else{
            saveFileOffline(file);
            dispatch(setIsLoading(false));
            inspectedDeficiency();
        } 
    }

    const inspectedDeficiency = () =>{
        if(selectedDeficiency.defiEstado == 'N'||selectedDeficiency.defiEstado == 'S'){
            if(Object.values(files).length>2){   
                if(selectedDeficiency.defiInspeccionado == false){
                    deficiencyInspected(idDeficiency);
                }
            }
        }
        else{
            if(Object.values(files).length>0){
                if(selectedDeficiency.defiInspeccionado == false){
                    deficiencyInspected(idDeficiency);
                }
            }
        }
    }

    const getFiles = (x_deficiencyId) =>{
        dispatch(setIsLoadingMessage("Cargando archivos ..."));
        dispatch(setIsLoading(true));
        api().get('File/GetByDeficiency?x_deficiency=' + x_deficiencyId)
        .then(resp => {
            dispatch(setIsLoading(false));
            dispatch(setFiles(resp.data));
        })
        .catch(error => controlError(error));
    }

    const getFilesByFeeder = (x_feeder_id) =>{
        dispatch(setIsLoadingMessage("Cargando archivos ..."));
        dispatch(setIsLoading(true));
        api().get('File/GetByFeeder?x_feeder_id=' + x_feeder_id)
        .then(resp => {
            dispatch(setIsLoading(false));
            setTotalFiles(resp.data);
        })
        .catch(error => controlError(error));
    }

    const controlError = (error) =>{
        dispatch(setIsLoading(false));
        Alert.alert(error);
    }
    const saveFileOffline =(file) =>{
        database.transaction(tx => {
            tx.executeSql(
                "insert into archivos (archInterno ,archTipo, archTabla, archCodTabla, archNombre, archActivo) values (?,?,?,?,?,?)",
                [
                    0,
                    file.archTipo,
                    file.archTabla,
                    file.archCodTabla,
                    file.archNombre,
                    file.archActivo
                ],
                (_, results) => {
                    console.log('Results', results.rowsAffected);
                    if (results.rowsAffected > 0) {
                        Alert.alert("Arjen", "Se guardó correctamente", [
                            {
                                text: "Aceptar",
                                onPress: () => navigation.navigate("ListaMultimedia")
                            }
                        ]);
                    } else Alert.alert('Failed....');
                },
                (_, error) => {
                    console.log(error);
                },
            );
        });
    }

    return {
        getFiles,
        getFilesByFeeder,
        totalFiles,
        saveFile
    }
}
