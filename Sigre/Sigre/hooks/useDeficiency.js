import { api } from "../api/apiConfig";
import axios from "axios";
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useState } from "react";
import { appSettings, controlError, fieldsOfDeficiencyInsert, fieldsOfDeficiencyUpdate} from '../utils/utils';
import { useSelector, useDispatch } from 'react-redux';
import { setIdDeficiency, setIsLoading, setIsLoadingMessage, setSelectedDeficiency, setDeficiencies} from "../context/actions/Actions";
import * as SQLite from 'expo-sqlite';

export const useDeficiency = () => {

    const dispatch = useDispatch();
    const navigation = useNavigation();
    const { isOnline } = useSelector(state => state.AppReducer);
    const [totalDeficiencies, setTotalDeficiencies] = useState([]);
    const database = SQLite.openDatabase('sigre.db');

    const saveDeficiency = (deficiency) => {
        let result = null;
        const source = axios.CancelToken.source();
        setTimeout(() => {
            if (result._z === null){
                source.cancel();
            }
        }, appSettings.postTimeout);

        dispatch(setIsLoadingMessage("Guardando ..."));
        dispatch(setIsLoading(true));
        if( isOnline ){
            result = api().post('Deficiency/Save/', deficiency, { cancelToken: source.token})
            .then((resp) => {
                dispatch(setIsLoading(false));
                dispatch(setSelectedDeficiency(deficiency));
                dispatch(setIdDeficiency(resp.data.id))
                Alert.alert("Arjen", "Se guardó correctamente. Ahora va a anexar archivos fotos y audio.", [
                    {
                        text: "Aceptar",
                        onPress: () => navigation.navigate("ListaMultimedia")
                    }
                ]);
            })
            .catch(error => controlError(error, dispatch));
        }
        else{
            saveDeficiencyOffLine(deficiency);
            result = true;
            dispatch(setIsLoading(false));
            dispatch(setSelectedDeficiency(deficiency));
        }
    }

    const deficiencyInspected = (id) =>{
        let result = null;
        const source = axios.CancelToken.source();
        setTimeout(() => {
            if (result._z === null){
                source.cancel();
            }
        }, appSettings.postTimeout);

        dispatch(setIsLoadingMessage("Guardando ..."));
        dispatch(setIsLoading(true));
        if( isOnline ){
            result = api().post('Deficiency/Inspected/?x_id='+ id, { cancelToken: source.token})
            .then((resp) => {
                dispatch(setIsLoading(false));
                Alert.alert("Arjen", "Registro completado", [
                    {
                        text: "Aceptar",
                    }
                ]);
            })
            .catch(error => controlError(error, dispatch));
        }
        else{
            deficiencyInspectedOffLine(id);
            result = true;
            dispatch(setIsLoading(false));
        }
    }

    const deficiencyInspectedOffLine = (id) =>{
        database.transaction((tx) => {
            tx.executeSql(
                'UPDATE deficiencias set defiInspeccionado=? where defiInterno=?',
                [
                    1,
                    id
                ],
                (_, results) => {
                    console.log('Results', results.rowsAffected);
                    if (results.rowsAffected > 0) {
                        Alert.alert("Arjen", "Registro completado", [
                            {
                                text: "Aceptar"
                            }
                        ]);
                    } else Alert.alert('Error');
                },
                (_, error) => {
                    console.log(error);
                },
            );
        });
    }

    const delDeficiency = (deficiency) => {
        let result = null;
        const source = axios.CancelToken.source();
        setTimeout(() => {
            if (result._z === null){
                source.cancel();
            }
        }, appSettings.postTimeout);

        dispatch(setIsLoadingMessage("Eliminando ..."));
        dispatch(setIsLoading(true));
        if(isOnline){
            result = api().post('Deficiency/Delete/', deficiency, { cancelToken: source.token})
            .then((resp) => {
                dispatch(setIsLoading(false));
                Alert.alert("Arjen", "Se eliminó correctamente", [
                    {
                        text: "Aceptar",
                        onPress: () => navigation.navigate("Deficiencias")
                    }
                ]);
            })
            .catch(error => controlError(error, dispatch));
        }
        else{
            delDeficiencyOffLine(deficiency);
            result = true;
            dispatch(setIsLoading(false));
        }
    }

    const getDeficiencies = (x_elementType, x_elementId) =>{
        dispatch(setIsLoadingMessage("Cargando deficiencias ..."));
        dispatch(setIsLoading(true));
        if(isOnline){
            api().get('Deficiency/GetByElement?x_elementType=' + x_elementType + '&x_ElementId='+x_elementId, { timeout: appSettings.getTimeout })
            .then(resp => {
                dispatch(setIsLoading(false));
                dispatch(setDeficiencies(resp.data));
            })
            .catch(error => controlError(error, dispatch));
        }
        else{
            let tipo = "";
            if(x_elementType==0){
                tipo = 'VANO'
            }
            if(x_elementType==5){
                tipo = 'POST';
            }
            if((x_elementType>=1 && x_elementType<=4)||x_elementType==9){
                tipo = 'SED ';
            }
            getDeficienciesOffline(tipo, x_elementId);
            dispatch(setIsLoading(false));
        }
    }

    const getDeficienciesByFeeder = (x_feeder_id) =>{
        dispatch(setIsLoadingMessage("Cargando deficiencias ..."));
        dispatch(setIsLoading(true));
        api().get('Deficiency/GetByFeeder?x_feeder_id=' + x_feeder_id, { timeout: appSettings.getTimeout })
        .then(resp => {
            dispatch(setIsLoading(false));
            setTotalDeficiencies(resp.data);
        })
        .catch(error => controlError(error, dispatch));
    }
    const saveDeficiencyOffLine =(deficiency) =>{
        if (deficiency.defiInterno ==0) {
            database.transaction(tx => {
                tx.executeSql(
                    "insert into deficiencias (" + fieldsOfDeficiencyInsert + ") values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                    [
                        deficiency.defFechaCreacion, 
                        deficiency.defiActivo, 
                        deficiency.defiCodAMT, 
                        deficiency.defiCodDef, 
                        deficiency.defiCodigoElemento, 
                        deficiency.defiComentario, 
                        deficiency.defiDistHorizontal, 
                        deficiency.defiDistTransversal, 
                        deficiency.defiDistVertical, 
                        deficiency.defiEstado, 
                        deficiency.defiEstadoCriticidad, 
                        deficiency.defiEstadoSubsanacion, 
                        deficiency.defiFecRegistro, 
                        deficiency.defiFechaDenuncia, 
                        deficiency.defiFechaInspeccion, 
                        deficiency.defiFechaSubsanacion, 
                        deficiency.defiIdElemento, 
                        deficiency.defiLatitud, 
                        deficiency.defiLongitud, 
                        deficiency.defiNumSuministro, 
                        deficiency.defiObservacion, 
                        deficiency.defiResponsable, 
                        deficiency.defiTipoElemento,
                        deficiency.defiUsuarioInic, 
                        deficiency.defiUsuarioMod,
                        deficiency.inspInterno,
                        deficiency.tablInterno, 
                        deficiency.tipiInterno,
                        deficiency.defiArmadoMaterial,
                        deficiency.defiTipoMaterial,
                        deficiency.defiNodoInicial,
                        deficiency.defiNodoFinal,
                        deficiency.defiTipoRetenida,
                        deficiency.defiTipoArmado,
                        deficiency.defiPozoTierra,
                        deficiency.defiPozoTierra2,
                        deficiency.defiInspeccionado,
                        deficiency.defiKeywords,
                        2
                    ],
                    (_, results) => {
                        console.log('Results', results.rowsAffected);
                        if (results.rowsAffected > 0) {
                            dispatch(setIdDeficiency(results.insertId));
                            Alert.alert("Arjen", "Se guardó correctamente. Ahora va a anexar archivos fotos y audio.", [
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
        else {
            database.transaction((tx) => {
                tx.executeSql(
                    'UPDATE deficiencias set ' + fieldsOfDeficiencyUpdate + 'where defiInterno=?',
                    [
                        deficiency.defiEstado,
                        deficiency.inspInterno,
                        deficiency.tablInterno,
                        deficiency.defiCodigoElemento,
                        deficiency.tipiInterno,
                        deficiency.defiNumSuministro,
                        deficiency.defiFechaDenuncia,
                        deficiency.defiFechaInspeccion,
                        deficiency.defiFechaSubsanacion,
                        deficiency.defiObservacion,
                        deficiency.defiEstadoSubsanacion,
                        deficiency.defiLatitud,
                        deficiency.defiLongitud,
                        deficiency.defiTipoElemento,
                        deficiency.defiDistHorizontal,
                        deficiency.defiDistVertical,
                        deficiency.defiDistTransversal,
                        deficiency.defiIdElemento,
                        deficiency.defiFecRegistro,
                        deficiency.defiCodDef,
                        deficiency.defiCodRes,
                        deficiency.defiCodDen,
                        deficiency.defiRefer1,
                        deficiency.defiRefer2,
                        deficiency.defiCoordX,
                        deficiency.defiCoordY,
                        deficiency.defiCodAMT,
                        deficiency.defiNroOrden,
                        deficiency.defiPointX,
                        deficiency.defiPointY,
                        deficiency.defiUsuCre,
                        deficiency.defiUsuNPC,
                        deficiency.defiFecModificacion,
                        deficiency.defiFechaCreacion,
                        deficiency.defiTipoMaterial,
                        deficiency.defiNodoInicial,
                        deficiency.defiNodoFinal,
                        deficiency.defiTipoRetenida,
                        deficiency.defiRetenidaMaterial,
                        deficiency.defiTipoArmado,
                        deficiency.defiArmadoMaterial,
                        deficiency.defiNumPostes,
                        deficiency.defiPozoTierra,
                        deficiency.defiResponsable,
                        deficiency.defiComentario,
                        deficiency.defiPozoTierra2,
                        deficiency.defiUsuarioInic,
                        deficiency.defiUsuarioMod,
                        deficiency.defiActivo,
                        deficiency.defiEstadoCriticidad,
                        deficiency.defiInspeccionado,
                        deficiency.defiKeywords,
                        deficiency.defiEstadoOffLine,
                        deficiency.defiInterno
                    ],
                    (_, results) => {
                        console.log('Results', results.rowsAffected);
                        if (results.rowsAffected > 0) {
                            dispatch(setIdDeficiency(deficiency.defiInterno));
                            Alert.alert("Arjen", "Se guardó correctamente. Ahora va a anexar archivos fotos y audio.", [
                                {
                                    text: "Aceptar",
                                    onPress: () => navigation.navigate("ListaMultimedia")
                                }
                            ]);
                        } else Alert.alert('Error');
                    },
                    (_, error) => {
                        console.log(error);
                    },
                );
            });
            
        }
    }
    const delDeficiencyOffLine = (deficiency) => {
        database.transaction(tx => {
            tx.executeSql(
                "UPDATE deficiencias set defiActivo=? where defiInterno=?",
                [
                    0,
                    deficiency.defiInterno
                ],
                (_, results) => {
                    console.log('Results', results.rowsAffected);
                    if (results.rowsAffected > 0) {
                        Alert.alert("Arjen", "Se eliminó correctamente", [
                            {
                                text: "Aceptar",
                                onPress: () => navigation.navigate("Deficiencias")
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
    const getDeficienciesOffline = (x_elementType, x_elementId) => {
        dispatch(setIsLoadingMessage("Cargando deficiencias ..."));
        dispatch(setIsLoading(true));
        database.transaction(tx =>{tx.executeSql("SELECT * From deficiencias WHERE defiIdElemento="+x_elementId +" and defiTipoElemento = \'"+x_elementType+"\'",[],
        (_,results) => {
            dispatch(setIsLoading(false));
            dispatch(setDeficiencies(results.rows._array));
        },
        (_,error) => {
            console.log(error);
        }
        );
        });
    }

    return {
        getDeficiencies,
        getDeficienciesByFeeder,
        totalDeficiencies,
        saveDeficiency,
        delDeficiency,
        deficiencyInspected
    }
}