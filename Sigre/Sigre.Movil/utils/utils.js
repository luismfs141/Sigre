import * as MediaLibrary from 'expo-media-library';

// Tabla de iconos según estado
const ICONS = {
  inspected: {
    1: require("../assets/Elements/Inspected/1.png"),
    2: require("../assets/Elements/Inspected/2.png"),
    3: require("../assets/Elements/Inspected/3.png"),
    5: require("../assets/Elements/Inspected/5.png"),
  },

  removed: {
    1: require("../assets/Elements/Removed/1.png"),
    2: require("../assets/Elements/Removed/2.png"),
    3: require("../assets/Elements/Removed/3.png"),
    5: require("../assets/Elements/Removed/5.png"),
  },

  uninspected: {
    0: require("../assets/Elements/Uninspected/8.png"),
    1: require("../assets/Elements/Uninspected/1.png"),
    2: require("../assets/Elements/Uninspected/2.png"),
    3: require("../assets/Elements/Uninspected/3.png"),
    4: require("../assets/Elements/Uninspected/4.png"),
    5: require("../assets/Elements/Uninspected/5.png"),
    6: require("../assets/Elements/Uninspected/6.png"),
    8: require("../assets/Elements/Uninspected/0.png"),
    default: require("../assets/Elements/Uninspected/7.png"),
  },
};

export const getSourceImageFromType2 = (pin) => {
  const type = Number(pin.Type);

  // Si el pin tiene un tipo válido (0–8), NO usar default
  const hasValidType = type !== null && !isNaN(type);

  // 1️⃣ Inspeccionado
  if (pin.Inspeccionado) {
    if (hasValidType && ICONS.inspected[type]) {
      return ICONS.inspected[type];   // usa icono real
    }
    return hasValidType ? null : ICONS.uninspected.default;
  }

  // 2️⃣ Tercero
  if (pin.Tercero) {
    if (hasValidType && ICONS.removed[type]) {
      return ICONS.removed[type];
    }
    return hasValidType ? null : ICONS.uninspected.default;
  }

  // 3️⃣ No inspeccionado
  if (hasValidType && ICONS.uninspected[type]) {
    return ICONS.uninspected[type];
  }

  // Si hay tipo pero no existe el icono → NO poner default
  if (hasValidType) return null;

  // Solo si NO tiene tipo → default
  return ICONS.uninspected.default;
};


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
