import { api } from "../api/apiConfig";
import { useMap } from '../hooks/useMap';
import { useDeficiency } from './useDeficiency';
import { useFile } from './UseFile';
import { createGapsTable, createPinsTable, createDeficienciesTable,
    createFilesTable, createFeedersTable, createTypificationsTable,
    fieldsOfDeficiency, fieldsOfGap, fieldsOfPin, fieldsOfFile, 
    appSettings, controlError } from '../utils/utils';
import * as SQLite from 'expo-sqlite';
import { useSelector, useDispatch } from 'react-redux';
import { setIsLoading, setIsLoadingMessage, setTotalPins, setPins, setFiles,
    setGaps, setRegion, setFeeders, setIsOnline, setTypifications} from "../context/actions/Actions";
import { useEffect, useState } from 'react';
import { Alert } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTypification } from './useTypification';
import axios from "axios";
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export const useOffLine = () => {
 
    const database = SQLite.openDatabase('sigre.db');
    const { typifications, selectedFeeder, totalPins, gaps, isOnline } = useSelector(state => state.AppReducer);
    const dispatch = useDispatch();
    const { getGapsByFeeder, getPinsByFeeder } = useMap();
    const { getDeficienciesByFeeder, totalDeficiencies} = useDeficiency();
    const { getFilesByFeeder, totalFiles} = useFile();
    const { getAll } = useTypification();

    useEffect(() => {
        if (isOnline && selectedFeeder) {
            getAll();
            getGapsByFeeder(selectedFeeder.alimInterno);
            getPinsByFeeder(selectedFeeder.alimInterno);
            getDeficienciesByFeeder(selectedFeeder.alimInterno);
            getFilesByFeeder(selectedFeeder.alimInterno);
        }
    }, [selectedFeeder]);

    const synchronizeData = () => {
        let result = null;
        const source = axios.CancelToken.source();
        let offlineData = {
            deficiencies: [],
            files: []
        };
        
        // Se obtienen los datos desde un callback
        getAllDeficienciesOffLine((data) => {
            for (let i = 0; i < data.length; i++) {
                data[i] = {
                    ...data[i], 
                    "defiActivo": Boolean(data[i].defiActivo),
                    "defiResponsable": Boolean(data[i].defiResponsable),
                    "defiInspeccionado":Boolean(data[i].defiInspeccionado)
                };
            }

            offlineData.deficiencies = data;

            // Se vuelve a enviar un callback para obtener los archivos
            getAllFilesOffLine ((data) => {
                for (let i = 0; i < data.length; i++) {
                    data[i] = {
                        ...data[i], 
                        "archActivo": Boolean(data[i].archActivo)
                    };
                }

                offlineData.files = data;
                console.log(offlineData);
                api().post('Deficiency/SynchronizeData/', offlineData, { cancelToken: source.token})
                .then((resp) => {
                    dispatch(setIsLoading(false));
                    setConectionMode(true);
                    Alert.alert("Arjen", "Sincronización Finalizada", [
                        {
                            text: "Aceptar",
                        }
                ]);
            })
            .catch(error => controlError(error));
            });
        });
       
    }

    const download = async () => {
        dispatch(setIsLoadingMessage("Descargando ..."));
        dispatch(setIsLoading(true));
        await dropTables();
    }

    const setConectionMode = async (isOnline) => {
        await AsyncStorage.setItem(appSettings.isOnlineState, isOnline.toString());
        dispatch(setIsOnline(isOnline));
    }

    const dropTables = async () => {
        dispatch(setIsLoadingMessage("Limpiando la base de datos ..."));

        await database.transaction( async (tx) =>
        {
            await tx.executeSql(
                "drop table if exists tipificaciones", [],
                    (_, results) => {
                        console.log("Tabla tipificaciones eliminada");
                    },
                    (_, error) => {
                        console.log(error);
                    })
            await tx.executeSql(
                "drop table if exists alimentadores", [],
                    (_, results) => {
                        console.log("Tabla Alimentadores eliminada");
                    },
                    (_, error) => {
                        console.log(error);
                    })
           await tx.executeSql(
                "drop table if exists vanos", [], 
                    (_, results) => {
                        console.log("Tabla Vanos eliminada");
                    },
                    (_, error) => {
                        console.log(error);
                    })
            await tx.executeSql(
                "drop table if exists pins", [], 
                    (_, results) => {
                        console.log("tabla Pins eliminada");
                    },
                    (_, error) => {
                        console.log(error);
                    })
            await tx.executeSql(
                "drop table if exists deficiencias", [], 
                    (_, results) => {
                        console.log("tabla Deficiencias eliminada");
                    },
                    (_, error) => {
                        console.log(error);
                    })
            await tx.executeSql(
                "drop table if exists archivos", [], 
                    (_, results) => {
                        console.log("tabla Archivos eliminada");
                        createTables();
                    },
                    (_, error) => {
                        console.log(error);
                    })
        });
    }

    const deleteDB = async () => {
        setConectionMode(true);
        dispatch(setIsLoadingMessage("Limpiando la base de datos ..."));

        await database.transaction( async (tx) =>
        {
            await tx.executeSql(
                "drop table if exists tipificaciones", [],
                    (_, results) => {
                        console.log("Tabla tipificaciones eliminada");
                    },
                    (_, error) => {
                        console.log(error);
                    })
            await tx.executeSql(
                "drop table if exists alimentadores", [],
                    (_, results) => {
                        console.log("Tabla Alimentadores eliminada");
                    },
                    (_, error) => {
                        console.log(error);
                    })
           await tx.executeSql(
                "drop table if exists vanos", [], 
                    (_, results) => {
                        console.log("Tabla Vanos eliminada");
                    },
                    (_, error) => {
                        console.log(error);
                    })
            await tx.executeSql(
                "drop table if exists pins", [], 
                    (_, results) => {
                        console.log("tabla Pins eliminada");
                    },
                    (_, error) => {
                        console.log(error);
                    })
            await tx.executeSql(
                "drop table if exists deficiencias", [], 
                    (_, results) => {
                        console.log("tabla Deficiencias eliminada");
                    },
                    (_, error) => {
                        console.log(error);
                    })
            await tx.executeSql(
                "drop table if exists archivos", [], 
                    (_, results) => {
                        console.log("tabla Archivos eliminada");
                        setConectionMode(true);
                    },
                    (_, error) => {
                        console.log(error);
                    })
        });
    }

    const createTables = async () => {
        dispatch(setIsLoadingMessage("Creando tablas ..."));

        await database.transaction( async (tx) =>
        {
            await tx.executeSql(
                createTypificationsTable, [],
                    (_, results) => {
                        console.log("Tabla tipificaciones creada");
                    },
                    (_, error) => {
                        console.log(error);
                    })
            await tx.executeSql(
                createFeedersTable, [],
                    (_, results) => {
                        console.log("Tabla Alimentadores creada");
                    },
                    (_, error) => {
                        console.log(error);
                    })
           await tx.executeSql(
                createGapsTable, [], 
                    (_, results) => {
                        console.log("Tabla Vanos creada");
                    },
                    (_, error) => {
                        console.log(error);
                    })
            await tx.executeSql(
                createPinsTable, [], 
                    (_, results) => {
                        console.log("tabla Pins Creada");
                    },
                    (_, error) => {
                        console.log(error);
                    })
            await tx.executeSql(
                createDeficienciesTable, [], 
                    (_, results) => {
                        console.log("tabla Deficiencias Creada");
                    },
                    (_, error) => {
                        console.log(error);
                    })
            await tx.executeSql(
                createFilesTable, [], 
                    (_, results) => {
                        console.log("tabla Archivos Creada");
                        writeTypificationsData();
                    },
                    (_, error) => {
                        console.log(error);
                    })
        });
    }

    const writeTypificationsData = () => {
        dispatch(setIsLoadingMessage("Descargando tipificaciones ..."));
        var quantityOfTypifications = typifications.length;
        database.transaction(tx => {
            for (let index = 0; index < quantityOfTypifications; index++) {
                const typification = typifications[index];
                tx.executeSql(
                    "insert into tipificaciones (tableId, tableName, component, code, typification, typificationId) values (?,?,?,?,?,?)",
                    [
                        typification.tableId,
                        typification.table,
                        typification.component,
                        typification.code,
                        typification.typification,
                        typification.typificationId
                    ],
                    (_, results) => {
                        if ((index + 1) == quantityOfTypifications) {
                            writeFeedersData();
                        }
                    },
                    (_, error) => {
                        console.log(error);
                    },
            )}})
    }

    const writeFeedersData = () => {
        dispatch(setIsLoadingMessage("Descargando alimentadores ..."));
        database.transaction(tx => {
            tx.executeSql(
                "insert into alimentadores (alimInterno, alimCodigo, alimEtiqueta) values (?,?,?)",
                [
                    selectedFeeder.alimInterno,
                    selectedFeeder.alimCodigo,
                    selectedFeeder.alimEtiqueta
                ],
                (_, results) => {
                    console.log("Insertó alimentadores");
                    writeGapsData();
                },
                (_, error) => {
                    console.log(error);
                },
            )})
    }

    const writeGapsData = () => {
        var quantityOfGaps = gaps.length;
        if (quantityOfGaps > 0) {
            dispatch(setIsLoadingMessage("Descargando vanos ..."));
            database.transaction(tx => {
                for (let index = 0; index < quantityOfGaps; index++) {
                    const gap = gaps[index];
                    tx.executeSql(
                        "insert into vanos (" + fieldsOfGap + ") values (?,?,?,?,?,?,?,?,?,?,?,?,?)",
                        [
                            gap.vanoInterno,
                            gap.vanoCodigo,
                            gap.vanoLatitudIni,
                            gap.vanoLongitudIni,
                            gap.vanoLatitudFin,
                            gap.vanoLongitudFin,
                            gap.vanoEtiqueta,
                            gap.alimInterno,
                            gap.vanoTerceros,
                            gap.vanoMaterial,
                            gap.vanoNodoInicial,
                            gap.VanoNodoFinal,
                            gap.vanoInspeccionado
                        ],
                        (_, results) => {
                            if ((index + 1) == quantityOfGaps) {
                                writePinsData();
                            }
                        },
                        (_, error) => {
                            console.log(error);
                        },
                )
            }})
        }
    }
    const writePinsData = () => { 
        var quantityOfPins = totalPins.length;
        if( quantityOfPins > 0){
            dispatch(setIsLoadingMessage("Descargando pines ..."));
            database.transaction(tx => {
                for (let index = 0; index < quantityOfPins; index++) {
                    const pin = totalPins[index];
                    tx.executeSql(
                        "insert into pins (" + fieldsOfPin + ") values (?,?,?,?,?,?,?,?,?,?)",
                        [
                            pin.id, 
                            pin.label,
                            pin.type,
                            pin.latitude,
                            pin.longitude,
                            pin.idAlimentador, 
                            pin.elementCode,
                            pin.tipoMaterial,
                            pin.inspeccionado,
                            pin.tercero
                        ],
                        (_, results) => {
                            if ((index + 1) == quantityOfPins) {
                                writeDeficienciesData();
                            }
                            
                        },
                        (_, error) => {
                            console.log(error);
                        },
                )
            }})
        }
    }
    const writeDeficienciesData = () => {
        var quantityOfDeficiencies = totalDeficiencies.length;
        if( quantityOfDeficiencies > 0){
            dispatch(setIsLoadingMessage("Descargando deficiencias ..."));
            database.transaction(tx => {
                for (let index = 0; index < quantityOfDeficiencies; index++) {
                    const deficiency = totalDeficiencies[index];
                    tx.executeSql(
                        "insert into deficiencias (" + fieldsOfDeficiency + ") values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                        [
                            deficiency.defiInterno,
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
                            deficiency.defiKeyWords,
                            0
                        ],
                        (_, results) => {
                            if ((index + 1) == quantityOfDeficiencies) {
                                console.log("Insertó Deficiencias");
                                writeFilesData();
                            }
                        },
                        (_, error) => {
                            console.log(error);
                        },
                )
            }})
        }
        else {
            writeFilesData();
        }
    }
    const writeFilesData = () => { 
        var quantityOfFiles = totalFiles.length;
        if( quantityOfFiles > 0){
            dispatch(setIsLoadingMessage("Descargando archivos ..."));
            database.transaction(tx => {
                for (let index = 0; index < quantityOfFiles; index++) {
                    const file = totalFiles[index];
                    tx.executeSql(
                        "insert into archivos (" + fieldsOfFile + ") values (?,?,?,?,?,?)",
                        [
                            file.archInterno,
                            file.archTipo,
                            file.archTabla,
                            file.archCodTabla,
                            file.archNombre,
                            file.archActivo
                        ],
                        (_, results) => {
                            if ((index + 1) == quantityOfFiles) {
                                setConectionMode(false);
                                dispatch(setIsLoading(false));
                            }
                        },
                        (_, error) => {
                            console.log(error);
                        },
                )
            }})
        }
        else {
            setConectionMode(false);
            dispatch(setIsLoading(false));
        }
    }

    const getGapsByFeederOffLine =( x_feeder_id ) =>{
        dispatch(setIsLoadingMessage("Cargando vanos ..."));
        dispatch(setIsLoading(true));
        database.transaction(tx =>{
            tx.executeSql("SELECT * From vanos WHERE alimInterno ="+ x_feeder_id,[],
            (_,results) => {
                dispatch(setGaps(results.rows._array));
                dispatch(setIsLoading(false));
            },
            (_,error) => {
                console.log(error);
            }
            );
        });
    }
    const getPinsByFeederOffLine = (x_feeder_id) =>{
        dispatch(setIsLoadingMessage("Cargando pines ..."));
        dispatch(setIsLoading(true));
        database.transaction(tx =>{
            tx.executeSql("SELECT * From pins WHERE idAlimentador ="+ x_feeder_id,[],
            (_,results) => {
                dispatch(setTotalPins(results.rows._array));
                var maxLat = Math.max(...results.rows._array.map(s =>s.latitude));
                var minLat = Math.min(...results.rows._array.map(s =>s.latitude));
                var maxLng = Math.max(...results.rows._array.map(s =>s.longitude));
                var minLng = Math.min(...results.rows._array.map(s =>s.longitude));
                dispatch(setRegion({
                    latitude: (maxLat - minLat) / 2 + minLat, 
                    longitude: (maxLng - minLng) / 2 + minLng,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421
                }));
                dispatch(setIsLoading(false));
            },
            (_,error) => {
                console.log(error);
            }
            );
        });
    }
    const getPinsByRegionOffLine = (region) =>{
        if (region.latitudeDelta < 0.005) {
            var maxLatitud = region.latitude + region.latitudeDelta;
            var minLatitud = region.latitude - region.latitudeDelta;
            var maxLongitud = region.longitude + region.longitudeDelta;
            var minLongitud = region.longitude - region.longitudeDelta;

            dispatch(setPins(totalPins.filter(p=>
                p.latitude > minLatitud &&
                p.latitude <= maxLatitud &&
                p.longitude > minLongitud &&
                p.longitude <= maxLongitud)));
        }
        else{
            dispatch(setPins([]));
        }
    }

    const setRegionByCoordinateOffLine = (latitude, longitude) =>{
        dispatch(setRegion({
            latitude: latitude,
            longitude: longitude,
            latitudeDelta: 0.0005,
            longitudeDelta: 0.0005
        }));
    }

    const getFeedersByIdPhoneOffLine = (idPhone) =>{
        dispatch(setIsLoadingMessage("Cargando Alimentadores ..."));
        dispatch(setIsLoading(true));
        database.transaction(tx =>{
            tx.executeSql("select * from alimentadores", [],
            (_,results) => {
                dispatch(setIsLoading(false));
                dispatch(setFeeders(results.rows._array));
            },
            (_,error) => {
                console.log(error);
            }
            );
        });
    }

    const getAllTypificationsOffline = () => {
        dispatch(setIsLoadingMessage("Cargando tipificaciones ..."));
        dispatch(setIsLoading(true));
        database.transaction(tx =>{
            tx.executeSql("select * from tipificaciones", [],
            (_,results) => {
                dispatch(setIsLoading(false));
                dispatch(setTypifications(results.rows._array));
            },
            (_,error) => {
                console.log(error);
            }
            );
        });
    };

    const getFilesbyDeficiencyOffline = (x_deficiencyId) => {
        dispatch(setIsLoadingMessage("Cargando archivos ..."));
        dispatch(setIsLoading(true));
        database.transaction(tx =>{tx.executeSql("SELECT * From archivos WHERE archCodTabla ="+ x_deficiencyId,[],
        (_,results) => {
            dispatch(setIsLoading(false));
            dispatch(setFiles(results.rows._array));
        },
        (_,error) => {
            console.log(error);
        }
        );
        });
    }
    

    const getAllDeficienciesOffLine = (callback)=> {
        dispatch(setIsLoadingMessage("Preparando deficiencias ..."));
        dispatch(setIsLoading(true));
        database.transaction(tx =>{tx.executeSql("select * From deficiencias where defiEstadoOffLine != 0",[],
        (_,results) => {
            dispatch(setIsLoading(false));
            callback(results.rows._array);            
        },
        (_,error) => {
            console.log(error);
        }
        );
        });
    }

    const getAllFilesOffLine = (callback) => {
            dispatch(setIsLoadingMessage("Preparando archivos ..."));
            dispatch(setIsLoading(true));
            database.transaction(tx =>{tx.executeSql("select * from archivos where archInterno == 0",[],
            (_,results) => {
                dispatch(setIsLoading(false));
                callback(results.rows._array);
            },
            (_,error) => {
                console.log(error);
            }
            );
        });
    }

    const sharingDB = async () => {
        console.log(FileSystem.documentDirectory+'SQLite/sigre.db') 
        await Sharing.shareAsync(
            FileSystem.documentDirectory + 'SQLite/sigre.db', 
            {dialogTitle: 'share or copy your DB via'}
            ).catch(error =>{
            console.log(error);
            }) 
    }

    return {
        download,
        synchronizeData,
        getGapsByFeederOffLine,
        getPinsByRegionOffLine,
        getPinsByFeederOffLine,
        getFeedersByIdPhoneOffLine,
        setRegionByCoordinateOffLine,
        getAllTypificationsOffline,
        getFilesbyDeficiencyOffline,
        sharingDB,
        deleteDB
    };
}