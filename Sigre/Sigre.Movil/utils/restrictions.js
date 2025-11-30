import { useEffect, useState } from "react";
import { Alert } from "react-native";

const [msgError,setMsgError] = useState();
const [controlSave, setControlSave] = useState();

export const controlTipification =(def)=>{
    if(def.defiEstado == "N" ||def.defiEstado == "S"){
        if(def.tipiInterno == 0 || def.tipiInterno == null){
          Alert.alert("Sigre", "Seleccione una tipificación");
          return false;
        }
        else{
            return true;
        }
    }
    else{
        return true;
    }
}

export const controlDistancias = (def) =>{
    if(def.defiDistHorizontal == null && def.defiDistVertical == null){
        Alert.alert("Sigre", "Registrar todas las distancias");
        return false;
      }
    else{
        return true;
    }
}

export const controlSubsanacionS2 =(def,selectDef) =>{
    if(selectDef.defiEstadoSubsanacion=="2" && selectDef.defiEstado=="S" && selectDef.defiFecModificacion==null){
        if(def.estadoSubsanacion =="2"){
          setMsgError("Sigre", "Cambie el estado de subsanación");
          return false;
        }
      }
}