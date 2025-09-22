import { Image, Alert } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { setIsLoading } from "../context/actions/Actions";
import { useState } from 'react';


/*export const getSourceImageFromType= (type) =>{
    switch (type) {
        case 0:
          return <Image source={require('../assets/0.png')} style={{width:50, height:50}}/>
        case 1:
          return <Image source={require('../assets/1.png')} style={{width:50, height:50}}/>
        case 2:
          return <Image source={require('../assets/2.png')} style={{width:50, height:50}}/>
        case 3:
          return <Image source={require('../assets/3.png')} style={{width:50, height:50}}/>
        case 4:
          return <Image source={require('../assets/4.png')} style={{width:50, height:50}}/>
        case 5:
          return <Image source={require('../assets/5.png')} style={{width:25, height:25}}/>
        case 6:
          return <Image source={require('../assets/6.png')} style={{width:50, height:50}}/>
        case 8:
          return <Image source={require('../assets/0.png')} style={{width:20, height:20}}/>
        default:
          return <Image source={require('../assets/7.png')} style={{width:20, height:20}}/>
      }
}*/

export const getSourceImageFromType2= (pin) =>{
  switch (pin.type) {
      case 0:
        return require('../assets/Elements/Uninspected/8.png');
      case 1:
        if(pin.inspeccionado){
          return require('../assets/Elements/Inspected/1.png');
        }
        else{
          if(pin.tercero){
            return require('../assets/Elements/Removed/1.png');
          }
          else{
            return require('../assets/Elements/Uninspected/1.png');
          }
        }
      case 2:
        if(pin.inspeccionado){
          return require('../assets/Elements/Inspected/2.png');
        }
        else{
          if(pin.tercero){
            return require('../assets/Elements/Removed/2.png');
          }
          else{
            return require('../assets/Elements/Uninspected/2.png');
          }
        }
      case 3:
        if(pin.inspeccionado){
          return require('../assets/Elements/Inspected/3.png');
        }
        else{
          if(pin.tercero){
            return require('../assets/Elements/Removed/3.png');
          }
          else{
            return require('../assets/Elements/Uninspected/3.png');
          }
        }
      case 4:
        return require('../assets/Elements/Uninspected/4.png');
      case 5:
        if(pin.inspeccionado){
          return require('../assets/Elements/Inspected/5.png');
        }
        else{
          if(pin.tercero){
            return require('../assets/Elements/Removed/5.png');
          }
          else{
            return require('../assets/Elements/Uninspected/5.png');
          }
        }
      case 6:
        return require('../assets/Elements/Uninspected/6.png');
      case 8:
        return require('../assets/Elements/Uninspected/0.png');
      default:
        return require('../assets/Elements/Uninspected/7.png');
    }
}

export const getGapColorByInspected = (gap)=>{
  if(gap.vanoInspeccionado==true){
    return '#55BA00';
  }
  else{
    if(gap.vanoTerceros ==true){
      return  '#EA0000';
    }
    else{
      return "#55AAFF";
    }
  }
}

export const getElementNameFromType = (type) => {
  switch (type) {
    case 0:
      return "Vano";
    case 1:
      return "Subestación MonoPoste";
    case 2:
      return "Subestación Biposte";
    case 3:
      return "Subestación en Caseta";
    case 4:
      return "Subestación Privada";
    case 5:
      return "Poste";
    case 6:
      return "Equipo de protección";
    case 9:
      return "Subestación Subterránea";
    default:
      return "Desconocido";
  }
}

export const getTableFromByPinType = (type) => {
  switch (type) {
    case 0:
      return {id: 3, name: 'VANO'};
    case 1:
      return {id: 2, name: "SED "};      
    case 2:
      return {id: 2, name: "SED "};
    case 3:
      return {id: 4, name: "SED "}
    case 4:
      return {id: 2, name: "SED "};
    case 5:
      return {id: 1, name: "POST"};
    case 6:
    case 7:
      return {id: 0, name: ""};
    case 8:
      return {id: 5, name: "SED "};
    default:
      return {id: 0, name: ""};
  }
}

export const mustRegisterDeficiency = (type) => {
  switch (type) {
    case 0:
    case 1:      
    case 2:
    case 3:
    case 4:
    case 5:
      return true;
    default:
      return false;
  }
}

export const fixDate = (date) => {
  var fixed = new Date(date.setHours(date.getHours() - 5));
  return fixed;
}

export const saveFile = async (uri,path) => {
  const asset = await MediaLibrary.createAssetAsync(uri);
  await MediaLibrary.createAlbumAsync(path.toString(), asset);
}

export const controlError = (error, dispatch) =>{
  dispatch(setIsLoading(false));
  Alert.alert(error.toString());
}

export const appSettings = {
  getTimeout: 5000,
  postTimeout: 10000,
  isOnlineState: "IS_ONLINE_STATE"
}

export const controlSaveDeficiency = (deficiency,selectedDeficiency) => {
  var control="";
  if(deficiency.defiEstado != 'O'){
    if(selectedDeficiency != null){
      if(selectedDeficiency.defiEstado=='S' && selectedDeficiency.defiEstadoSubsanacion == '2' && deficiency.defiEstadoSubsanacion !='2'){
        control = "Degradacion";
      }
    }
    else{
      if(deficiency.tipiInterno != 0){
        if(deficiency.tipiInterno == 4 || deficiency.tipiInterno == 5 || deficiency.tipiInterno == 18 ||
          deficiency.tipiInterno == 19 || deficiency.tipiInterno == 35 || deficiency.tipiInterno == 36 ||
          deficiency.tipiInterno == 37 || deficiency.tipiInterno == 38 || deficiency.tipiInterno == 41 ||
          deficiency.tipiInterno == 42){
          if(deficiency.defiDistHorizontal == null || deficiency.defiDistHorizontal == "" ||
            deficiency.defiDistVertical == null || deficiency.defiDistVertical == ""){
              control = "Distancias";
            }
        }
      }
      else{
        control = "Tipificacion";
      }
    }
  }
  return control;
}

export const createTypificationsTable =
'create table if not exists tipificaciones ' +
'(' +
    'tableId integer, ' +
    'tableName text, ' + 
    'component text, ' +
    'code text, ' +
    'typification text, ' +
    'typificationId integer' +
')';

export const createFeedersTable = 
'create table if not exists alimentadores ' +
'(' + 
    'alimInterno integer, ' +
    'alimCodigo text, ' +
    'alimEtiqueta text' +
');';

export const createGapsTable = 
  //'drop table vanos; ' +
  'create table if not exists vanos ' +
  '(' + 
    'vanoInterno integer, ' +
    'vanoCodigo text, ' +
    'vanoLatitudIni real, ' + 
    'vanoLongitudIni real, ' +
    'vanoLatitudFin real, ' +
    'vanoLongitudFin real, ' +
    'vanoEtiqueta text, ' +
    'alimInterno integer,' +
    'vanoTerceros integer, ' +
    'vanoMaterial text, ' +
    'vanoNodoInicial text, ' +
    'vanoNodoFinal text, ' +
    'vanoInspeccionado integer' +
  ');';

export const createPinsTable = 
//'drop table if exists pins; ' +
'create table if not exists pins ' +
'(' + 
    'id integer, ' +
    'label text, ' +
    'type integer, ' +
    'latitude real, ' +
    'longitude real, ' +
    'idAlimentador integer, ' +
    'elementCode text,' +
    'tipoMaterial text,' +
    'inspeccionado integer,'+
    'tercero integer,' +
    'selected integer'+
');';

export const createDeficienciesTable = 
  //'drop table if exists deficiencias; ' //+
  'create table if not exists deficiencias ' +
  '(' + 
    'defiInterno integer PRIMARY KEY AUTOINCREMENT, ' +
    'defiEstado text, ' +
    'inspInterno integer, ' +
    'tablInterno integer, ' +
    'defiCodigoElemento text, ' +
    'tipiInterno integer, ' +
    'defiNumSuministro text, ' +
    'defiFechaDenuncia text, ' +
    'defiFechaInspeccion text, ' +
    'defiFechaSubsanacion text, ' +
    'defiObservacion text, ' +
    'defiEstadoSubsanacion text, ' +
    'defiLatitud real, ' +
    'defiLongitud real, ' +
    'defiTipoElemento text, ' +
    'defiDistHorizontal real, ' +
    'defiDistVertical real, ' +
    'defiDistTransversal real, ' +
    'defiIdElemento integer, ' +
    'defiFecRegistro text, ' +
    'defiCodDef text, ' +
    'defiCodRes integer, ' +
    'defiCodDen integer, ' +
    'defiRefer1 text, ' +
    'defiRefer2 text, ' +
    'defiCoordX real, ' +
    'defiCoordY real, ' +
    'defiCodAMT text, ' +
    'defiNroOrden text, ' +
    'defiPointX real, ' +
    'defiPointY real, ' +
    'defiUsuCre text, ' +
    'defiUsuNPC text, ' +
    'defiFecModificacion text, ' +
    'defiFechaCreacion text, ' +
    'defiTipoMaterial text, ' +
    'defiNodoInicial text, ' +
    'defiNodoFinal text, ' +
    'defiTipoRetenida text, ' +
    'defiRetenidaMaterial text, ' +
    'defiTipoArmado text, ' +
    'defiArmadoMaterial text, ' +
    'defiNumPostes integer, ' +
    'defiPozoTierra text, ' +
    'defiResponsable integer, ' +
    'defiComentario text, ' +
    'defiPozoTierra2 text, ' +
    'defiUsuarioInic text, ' +
    'defiUsuarioMod text, ' +
    'defiActivo integer, ' +
    'defiEstadoCriticidad integer, ' +
    'defiInspeccionado integer, ' +
    'defiKeyWords text, ' +
    'defiEstadoOffLine integer '+
  ');';

  export const createFilesTable = 
//'drop table if exists archivos; ' +
'create table if not exists archivos' +
'(' + 
  'archInterno integer, '+
  'archTipo text, '+
  'archTabla text, '+
  'archCodTabla integer, '+
  'archNombre text, '+
  'archActivo integer '+
');';

  export const fieldsOfGap =
'vanoInterno, ' +
'vanoCodigo, ' +
'vanoLatitudIni, ' +
'vanoLongitudIni, ' + 
'vanoLatitudFin, ' + 
'vanoLongitudFin, ' + 
'vanoEtiqueta, ' + 
'alimInterno,' +
'vanoTerceros, ' + 
'vanoMaterial, ' +
'vanoNodoInicial, ' +
'vanoNodoFinal, ' +
'vanoInspeccionado'; 

export const fieldsOfPin =
'id, ' +
'label, ' +
'type, ' +
'latitude, ' +
'longitude, ' +
'idAlimentador, ' +
'elementCode,' +
'tipoMaterial,' +
'inspeccionado,' +
'tercero';


export const fieldsOfDeficiency =
'defiInterno, ' +
'defiEstado, ' +
'inspInterno, ' +
'tablInterno, ' +
'defiCodigoElemento, ' +
'tipiInterno, ' +
'defiNumSuministro, ' +
'defiFechaDenuncia, ' +
'defiFechaInspeccion, ' +
'defiFechaSubsanacion, ' +
'defiObservacion, ' +
'defiEstadoSubsanacion, ' +
'defiLatitud, ' +
'defiLongitud, ' +
'defiTipoElemento, ' +
'defiDistHorizontal, ' +
'defiDistVertical, ' +
'defiDistTransversal, ' +
'defiIdElemento, ' +
'defiFecRegistro, ' +
'defiCodDef, ' +
'defiCodRes, ' +
'defiCodDen, ' +
'defiRefer1, ' +
'defiRefer2, ' +
'defiCoordX, ' +
'defiCoordY, ' +
'defiCodAMT, ' +
'defiNroOrden, ' +
'defiPointX, ' +
'defiPointY, ' +
'defiUsuCre, ' +
'defiUsuNPC, ' +
'defiFecModificacion, ' +
'defiFechaCreacion, ' +
'defiTipoMaterial, ' +
'defiNodoInicial, ' +
'defiNodoFinal, ' +
'defiTipoRetenida, ' +
'defiRetenidaMaterial, ' +
'defiTipoArmado, ' +
'defiArmadoMaterial, ' +
'defiNumPostes, ' +
'defiPozoTierra, ' +
'defiResponsable, ' +
'defiComentario, ' +
'defiPozoTierra2, ' +
'defiUsuarioInic, ' +
'defiUsuarioMod, ' +
'defiActivo, ' +
'defiEstadoCriticidad, ' +
'defiInspeccionado, ' +
'defiKeyWords, ' +
'defiEstadoOffLine ';

export const fieldsOfFile =
'archInterno, '+
'archTipo, '+
'archTabla, '+
'archCodTabla, '+
'archNombre, '+
'archActivo';

export const fieldsOfDeficiencyUpdate =
    'defiEstado =?,' +
    'inspInterno =?,' +
    'tablInterno =?,' +
    'defiCodigoElemento =?,' +
    'tipiInterno =?,' +
    'defiNumSuministro =?,' +
    'defiFechaDenuncia =?,' +
    'defiFechaInspeccion =?,' +
    'defiFechaSubsanacion =?,' +
    'defiObservacion =?,' +
    'defiEstadoSubsanacion =?,' +
    'defiLatitud =?,' +
    'defiLongitud =?,' +
    'defiTipoElemento =?,' +
    'defiDistHorizontal =?,' +
    'defiDistVertical =?,' +
    'defiDistTransversal =?,' +
    'defiIdElemento =?,' +
    'defiFecRegistro =?,' +
    'defiCodDef =?,' +
    'defiCodRes =?,' +
    'defiCodDen =?,' +
    'defiRefer1 =?,' +
    'defiRefer2 =?,' +
    'defiCoordX =?,' +
    'defiCoordY =?,' +
    'defiCodAMT =?,' +
    'defiNroOrden =?,' +
    'defiPointX =?,' +
    'defiPointY =?,' +
    'defiUsuCre =?,' +
    'defiUsuNPC =?,' +
    'defiFecModificacion =?,' +
    'defiFechaCreacion =?,' +
    'defiTipoMaterial =?,' +
    'defiNodoInicial =?,' +
    'defiNodoFinal =?,' +
    'defiTipoRetenida =?,' +
    'defiRetenidaMaterial =?,' +
    'defiTipoArmado =?,' +
    'defiArmadoMaterial =?,' +
    'defiNumPostes =?,' +
    'defiPozoTierra =?,' +
    'defiResponsable =?,' +
    'defiComentario =?,' +
    'defiPozoTierra2 =?,' +
    'defiUsuarioInic =?,' +
    'defiUsuarioMod =?,' +
    'defiActivo =?,' +
    'defiEstadoCriticidad =?,' +
    'defiInspeccionado =?, ' +
    'defiKeyWords =?, ' +
    'defiEstadoOffLine =? ';

    export const fieldsOfDeficiencyInsert =
    //'defiInterno, ' +
    'defiFechaCreacion,'+ 
    'defiActivo,'+ 
    'defiCodAMT,' + 
    'defiCodDef,' + 
    'defiCodigoElemento,' + 
    'defiComentario,' + 
    'defiDistHorizontal,' + 
    'defiDistTransversal,' + 
    'defiDistVertical,' + 
    'defiEstado,' + 
    'defiEstadoCriticidad,' + 
    'defiEstadoSubsanacion,' + 
    'defiFecRegistro,' + 
    'defiFechaDenuncia,' + 
    'defiFechaInspeccion,' + 
    'defiFechaSubsanacion,' + 
    'defiIdElemento,' + 
    'defiLatitud,' + 
    'defiLongitud,' + 
    'defiNumSuministro,' + 
    'defiObservacion,' + 
    'defiResponsable,' + 
    'defiTipoElemento,' +
    'defiUsuarioInic,' + 
    'defiUsuarioMod,' +
    'inspInterno,' + 
    'tablInterno,' + 
    'tipiInterno,' +
    'defiArmadoMaterial,' +
    'defiTipoMaterial,' +
    'defiNodoInicial,' +
    'defiNodoFinal,' +
    'defiTipoRetenida,' +
    'defiTipoArmado,' +
    'defiPozoTierra,' +
    'defiPozoTierra2,' +
    'defiInspeccionado, ' +
    'defiKeyWords, ' +
    'defiEstadoOffLine';