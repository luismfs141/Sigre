import * as MediaLibrary from 'expo-media-library';

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
