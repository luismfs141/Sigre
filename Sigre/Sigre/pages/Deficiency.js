import { useEffect, useState } from "react";
import { View, Text, SafeAreaView, Alert, Button, Image } from "react-native";
import { ScrollView, TouchableOpacity} from "react-native-gesture-handler";
import FormContainer from "../components/Form/FormContainer";
import FormInput from "../components/Form/FormInput";
import FormSubmitButton from "../components/Form/FormSubmitButton";
import { Picker } from '@react-native-picker/picker';
import { useDeficiency } from "../hooks/useDeficiency";
import { useSelector, useDispatch } from 'react-redux';
import formatDate from '../utils/dateFormat';
import { useTypification } from "../hooks/useTypification";
import { getTableFromByPinType, fixDate, controlSaveDeficiency,messageSaveDeficiency } from "../utils/utils";
import { DateInput } from "../components/DateInput";
import DateTimePicker from '@react-native-community/datetimepicker';

export const Deficiency = () => {

  const { saveDeficiency, delDeficiency } = useDeficiency();
  const { getTypificationsByPinType } = useTypification();
  const { selectedPin, selectedDeficiency, typeForm, userMod, selectedFeeder, isOnline, idPhone } = useSelector(state => state.AppReducer);
  const [deficiency, setDeficiency] = useState({});
  const [datePicker, setDatePicker] = useState(false);
  const [tipiEstado, setTipiEstado] = useState(true);
  const [date, setDate] = useState(new Date());
  const [inputDate, setInputDate] = useState("");
  const [inputComponent, setInputComponent] = useState(
    {estadoDeficiencia: false,
      tipificacion: false,
      codigoElemento: false,
      tipoElemento: false,
      tipoMaterial: false,
      nodoInicial: false,
      nodoFinal: false,
      tipoRetenida: false,
      tipoArmado: false,
      armadoMaterial: false,
      numeroPostes: false,
      pozoTierra1: false,
      pozoTierra2: false,
      numeroSuministro: false,
      distHorizontal: false,
      distVertical: false,
      responsable: false,
      fechas: false,
      observacion: false,
      comentario: false,
      estadoSubsanacion: false,
      estadoCriticidad: false}
  )

  const { 
    defiEstado, inspInterno, tablInterno, defiCodigoElemento, tipiInterno, defiNumSuministro,
    defiFechaDenuncia, defiFechaInspeccion, defiFechaSubsanacion, defiObservacion, defiEstadoSubsanacion,
    defiLatitud, defiLongitud, defiTipoElemento, defiDistHorizontal, defiDistVertical,defiTipoArmado, defiTipoMaterial,
    defiTipoRetenida, defiArmadoMaterial, defiNumPostes, defiPozoTierra, defiPozoTierra2, defiNodoInicial,
    defiNodoFinal, defiComentario, defiResponsable, defiUsuarioMod, defiCodAMT,defiEstadoCriticidad,defiEstadoOffLine,
    defiInspeccionado, defikeywords} = deficiency;

  useEffect(() => {
    screenInput();
    if (selectedDeficiency) {
      setTipiEstado(false);
      selectedDeficiency.defiEstadoCriticidad !=null? selectedDeficiency.estadoCriticidad =1: selectedDeficiency.estadoCriticidad;
      selectedDeficiency.defiFecModificacion=fixDate(new Date());
      selectedDeficiency.defiUsuarioMod = idPhone;
      if(selectedDeficiency.defiEstado !="O"){
        selectedDeficiency.defiFechaDenuncia = formatDate(new Date(selectedDeficiency.defiFechaDenuncia));
        selectedDeficiency.defiFechaInspeccion = formatDate(new Date(selectedDeficiency.defiFechaInspeccion));
        if(selectedDeficiency.defiFechaSubsanacion !=null){
          selectedDeficiency.defiFechaSubsanacion = formatDate(new Date(selectedDeficiency.defiFechaSubsanacion));
        }
      }
      if(selectedDeficiency.defiNodoFinal ==null){
        selectedDeficiency.defiNodoFinal = selectedPin.nodoFinal;
      }
      if(selectedDeficiency.defiNodoInicial == null){
        selectedDeficiency.defiNodoInicial = selectedPin.nodoInicial;
      }
      if(selectedDeficiency.defiEstadoOffLine == 0){
        selectedDeficiency.defiEstadoOffLine =1;
      }
      setDeficiency(selectedDeficiency);
    }
    else {
      setTipiEstado(true);
      if(typeForm == "Sin Deficiencia"){
        setDeficiency({
          defiEstadoOffLine:2,
          defiInterno:0,
          defiCodDef:"",
          defiCodAMT: selectedFeeder.alimCodigo,
          defiEstado: "O",
          inspInterno: null,
          tablInterno: null,
          defiCodigoElemento: "" + selectedPin.label,
          defiIdElemento: selectedPin.id,
          tipiInterno: null,
          defiFecRegistro : fixDate(new Date()),
          defiNumSuministro: null,
          defiFechaDenuncia: null,
          defiFechaInspeccion: null,
          defiFechaSubsanacion: null,
          defiObservacion: "",
          defiEstadoSubsanacion: null,
          defiLatitud: selectedPin.latitude,
          defiLongitud: selectedPin.longitude,
          defiTipoElemento: getTableFromByPinType(selectedPin.type).name,
          defiDistHorizontal: null,
          defiDistVertical: null,
          defiDistTransversal: null,
          inspInternoNavigation: null,
          defiComentario:"",
          defiEstadoCriticidad: null,
          defiNodoFinal: selectedPin.nodoFinal,
          defiNodoInicial: selectedPin.nodoInicial,
          defikeywords:null,
          defiUsuarioInic:idPhone,
          defiUsuarioMod:"",
          defiInspeccionado: false
        })
    }
    else{
      setDeficiency({
        defiEstadoOffLine:2,
        defiInterno: 0,
        defiCodDef:"",
        defiEstado: "N",
        defiCodAMT: selectedFeeder.alimCodigo,
        inspInterno: null,
        tablInterno: 1,
        defiCodigoElemento: "" + selectedPin.label,
        defiIdElemento: selectedPin.id,
        tipiInterno: 0,
        defiNumSuministro: null,
        defiFecRegistro : fixDate(new Date()),
        defiFechaDenuncia: formatDate(fixDate(new Date())),
        defiFechaInspeccion: formatDate(fixDate(new Date())),
        defiFechaSubsanacion: null,
        defiObservacion: "",
        defiEstadoSubsanacion: "0",
        defiLatitud: selectedPin.latitude,
        defiLongitud: selectedPin.longitude,
        defiTipoElemento: getTableFromByPinType(selectedPin.type).name,
        defiDistHorizontal: null,
        defiDistVertical: null,
        defiDistTransversal: null,
        inspInternoNavigation: null,
        defiComentario:"",
        defiResponsable:false,
        defiEstadoCriticidad: 1,
        defiNodoFinal: selectedPin.nodoFinal,
        defiNodoInicial: selectedPin.nodoInicial,
        defiKeyWords:null,
        defiUsuarioInic:idPhone,
        defiUsuarioMod:"",
        defiInspeccionado: false
      })
    }
  }
  }, [selectedDeficiency, selectedPin]);

  const onChangeText = (value, fieldName) => {

    setDeficiency({ ...deficiency, [fieldName]: value });
    
    if(fieldName=="tipiInterno"){
      if(value=="4"||value=="5"||value=="18"||value=="19"||
        value =="35"||value=="36"||value=="37"||value=="38"||
        value=="41"||value=="42"){
          inputComponent.distVertical=true;
        }
        else{
          inputComponent.distVertical=false;
        }
        if(value=="4"||value=="5"||value=="18"||value=="19"||
        value=="36"||value=="37"||value=="38"||value=="41"){
          inputComponent.distHorizontal=true;
        }
        else{
          inputComponent.distHorizontal=false;
        }
        if(value=="4"||value=="18"||
        value=="36"||value=="38"||value=="42"){
          inputComponent.numeroSuministro=true;
        }
        else{
          inputComponent.numeroSuministro=false;
        }
        if(value=="31"){
          inputComponent.pozoTierra1=true;
          inputComponent.pozoTierra2=true;
        }
        else{
          inputComponent.pozoTierra1=false;
          inputComponent.pozoTierra2=false;
        }
    }
  };

  function showDatePicker(fieldName) {
    setDatePicker(true);
    setInputDate(fieldName);
  };

  function onDateSelected(event, value) {
    setDate(value);
    deficiency.defiFechaSubsanacion = formatDate(value);
    setDatePicker(false);
    setShow(false);
  };


  const deleteDeficiency = () => {
    Alert.alert("Sigre: ALERTA!!!!!!",
    "Está seguro de eliminar la deficiencia?",
    [
      selectedDeficiency.defiUsuarioMod = userMod,
      { text: 'Cancel'},
      { text: 'OK',onPress: () => delDeficiency(selectedDeficiency)},
    ],
    { cancelable: false });
  }

const submit = () => {
  if(deficiency.defiFechaSubsanacion !=null){
    if(deficiency.defiFechaSubsanacion == ""){
      deficiency.defiFechaSubsanacion = null;
    }
  }
  if(deficiency.defiFecModificacion !=null && deficiency.defiFecModificacion instanceof Date){
    deficiency.defiFecModificacion = deficiency.defiFecModificacion.toISOString().replace('Z','');
  }
  if(deficiency.defiFecRegistro !=null && deficiency.defiFecRegistro instanceof Date){
    deficiency.defiFecRegistro = deficiency.defiFecRegistro.toISOString().replace('Z','');
  }
  deficiency.defiCodAMT = selectedFeeder.alimCodigo;
  deficiency.defiActivo = true;
  if(deficiency.tipiInterno=="35" || deficiency.tipiInterno=="42"){
    deficiency.defiDistHorizontal = "0";
  }

  if(deficiency.defiPozoTierra!=null && deficiency.defiPozoTierra2!=null){
    Alert.alert('Sigre',
    'Existe Deficiencia 2086?',
    [
      { text: 'Si', onPress: () => savePozoTierra('CD',deficiency)},
      { text: 'No', onPress: () => savePozoTierra('SD',deficiency)},
    ],
    { cancelable: false });
  }
  else{
    var control = controlSaveDeficiency(deficiency,selectedDeficiency);
    alertSaveDeficiency(control);
  }
}

const savePozoTierra = (estado,deficiency) =>{

  if (estado == 'SD'){
    if(deficiency.defiEstado =='S'){
      deficiency.defiEstado = 'S';
      deficiency.defiestadoSubsanacion = '2';
      deficiency.tipiInterno = '31';
      deficiency.defiFechaSubsanacion = formatDate(fixDate(new Date()));
    }
    else{
      deficiency.defiEstado = 'O';
      deficiency.defiestadoSubsanacion = null;
      deficiency.tipiInterno = null;
      deficiency.defiFechaSubsanacion = null;
      deficiency.defiFechaInspeccion = null;
      deficiency.defiFechaDenuncia = null;
    }
  }
  if (estado == 'CD'){
    if(deficiency.defiEstado =='S'){
      deficiency.defiEstado = 'S';
      deficiency.defiEstadoSubsanacion = '0';
      deficiency.tipiInterno = 31;
      deficiency.defiFechaSubsanacion = null;
    }
    else{
      deficiency.defiEstado = 'N';
      deficiency.defiEstadoSubsanacion = '0';
      deficiency.tipiInterno = 31;
      deficiency.defiFechaSubsanacion = null;
      deficiency.defiFechaDenuncia = formatDate(fixDate(new Date()));
      deficiency.defiFechaInspeccion = formatDate(fixDate(new Date()));
    }
  }
  saveDeficiency(deficiency);
}

const alertSaveDeficiency = (message) =>{
  switch (message) {
    case "Degradacion":
      var msg = false;
      Alert.alert('Sigre',
      'Está seguro de guardar los cambios?',
      [
        { text: 'Si', onPress:()=>saveDeficiency(deficiency)},
        { text: 'No', onPress:()=>{}},
      ],
      { cancelable: false });
      break;
    case "Distancias":
      Alert.alert('Sigre, Complete las distancias');
      break;
    case "Tipificacion":
      Alert.alert('Sigre, Seleccione una tipificación');
      break;
    case "Success":
      saveDeficiency(deficiency);
    default:
      saveDeficiency(deficiency);
  }
}

const screenInput = () =>{
  
  if(typeForm=="Sin Deficiencia" || (selectedDeficiency!=null && selectedDeficiency.defiEstado=="O")){
    inputComponent.estadoDeficiencia=true;
    inputComponent.codigoElemento=true;
    inputComponent.tipoElemento=true;
    inputComponent.tipoMaterial=true;
    inputComponent.comentario=true;

    if(selectedPin.type==0){
      inputComponent.nodoInicial=true;
      inputComponent.nodoFinal=true;
    }
    if(selectedPin.type==5){
      inputComponent.tipoRetenida=true;
      inputComponent.tipoArmado=true;
      inputComponent.armadoMaterial=true;
    }
    if(selectedPin.type>0 && selectedPin.type<5 || selectedPin.type==9){
      inputComponent.tipoRetenida=true;
      inputComponent.tipoArmado=true;
      inputComponent.armadoMaterial=true;
      inputComponent.pozoTierra1=true;
      inputComponent.pozoTierra2=true;
    }
  }
  else{
    inputComponent.estadoDeficiencia=true;
    inputComponent.tipificacion=true;
    inputComponent.codigoElemento=true;
    inputComponent.tipoElemento=true;
    inputComponent.tipoMaterial=true;
    inputComponent.comentario=true;
    inputComponent.responsable=true;
    inputComponent.fechas=true;
    inputComponent.observacion=true;
    inputComponent.estadoSubsanacion=true;
    inputComponent.estadoCriticidad=true;

    if(selectedDeficiency){
      if(selectedDeficiency.tipiInterno =="4"||selectedDeficiency.tipiInterno =="18"||
      selectedDeficiency.tipiInterno =="36"||selectedDeficiency.tipiInterno =="38"||
      selectedDeficiency.tipiInterno =="42"){
        inputComponent.distHorizontal=true;
        inputComponent.distVertical=true;
        inputComponent.numeroSuministro= true;
      }
      if(selectedDeficiency.tipiInterno =="5"||selectedDeficiency.tipiInterno =="19"||
        selectedDeficiency.tipiInterno =="37"||selectedDeficiency.tipiInterno =="41"|| 
        selectedDeficiency.tipiInterno =="35"){
          inputComponent.distHorizontal=true;
          inputComponent.distVertical=true;
        }
      if(selectedDeficiency.tipiInterno =="31"){
        inputComponent.pozoTierra1=true;
        inputComponent.pozoTierra2=true;
      }
      if(selectedDeficiency.tipiInterno == "35" || selectedDeficiency.tipiInterno == "42"){
      inputComponent.distHorizontal = false;
      deficiency.distHorizontal = 0;
    }
    }
    
    if(selectedPin.type==0){
      inputComponent.nodoInicial=true;
      inputComponent.nodoFinal=true;
    }
    if(selectedPin.type==5){
      inputComponent.tipoRetenida=true;
      inputComponent.tipoArmado=true;
      inputComponent.armadoMaterial=true;
    }
    if((selectedPin.type>0 && selectedPin.type<5 )|| selectedPin.type==9){
      inputComponent.tipoRetenida=true;
      inputComponent.tipoArmado=true;
      inputComponent.armadoMaterial=true;
    }
  }
}

  return(
    <SafeAreaView style={{marginBottom:20}}>
      <ScrollView>
        <View>
          {selectedDeficiency?
          <Text>{selectedDeficiency.defiInterno}</Text>
          :
          <Text>En Progreso</Text>}
          <FormContainer>

            {inputComponent.estadoDeficiencia==true?
                <View style={{display:"flex"}}>
                  <Text style={{fontWeight:'bold'}}>Estado de Deficiencia</Text>
                  <Picker
                      selectedValue={defiEstado}
                      onValueChange={(itemValue) => onChangeText(itemValue, 'defiEstado') }
                      enabled={false}
                      >
                      <Picker.Item label="Nuevo" value="N"/>
                      <Picker.Item label="Sin Deficiencia" value="O"/>
                      <Picker.Item label="Seal" value="S"/>
                  </Picker>
                </View>
                :
                <></>
            }
            {inputComponent.tipificacion==true?
              <View>
                <Text style={{fontWeight:'bold'}}>Tipificación</Text>
                <Picker 
                    selectedValue={tipiInterno} numberOfLines={5}
                    enabled = { tipiEstado }
                    onValueChange={(itemValue) => onChangeText(itemValue, 'tipiInterno') }>
                  {
                    getTypificationsByPinType(selectedPin.type).map((t,i) => (
                      /*isOnline?
                      <Picker.Item label={t.code+" -> "+t.table+" "+t.component+" "+t.typification} value={t.typificationId} key={i+t.typificationId}/>
                      :*/
                      <Picker.Item label={t.code+" -> "+t.table+" "+t.component+" "+t.typification} value={t.typificationId} key={i+t.typificationId}/>
                      ))
                  }
                </Picker>
              </View>
              :
              <></>
            }
            <View>
                <FormInput 
                    value={selectedPin.elementCode}
                    label='Código'
                    placeholder= {""+selectedPin.elementCode}
                    editable={false}
                    />
              </View>
            {inputComponent.codigoElemento==true?
              <View>
                <FormInput 
                    value={defiCodigoElemento}
                    onChangeText={(value) => onChangeText(value, 'defiCodigoElemento')}
                    label='Código Elemento'
                    placeholder= {""+selectedPin.id}
                    editable={false}
                    />
              </View>
              :
              <></>
            }
            {inputComponent.tipoElemento==true?
              <View>
                <Text style={{fontWeight:'bold'}}>Tipo Elemento</Text>
                  <Picker
                    selectedValue={defiTipoElemento}
                    onValueChange={(itemValue) => onChangeText(itemValue, 'defiTipoElemento') }
                    enabled={false}
                  >
                    <Picker.Item label="----" value=""/>
                    <Picker.Item label="VANO" value="VANO"/>
                    <Picker.Item label="POSTE" value="POST"/>
                    <Picker.Item label="SUBESTACIÓN" value="SED "/>
                    <Picker.Item label="EQUIPO" value="EQUI"/>
                  </Picker>
              </View>
              :
              <></>
            }
            {inputComponent.tipoMaterial==true?
              selectedPin.type ==0?
                <View>
                  <Text style={{fontWeight:'bold'}}>Material Elemento</Text>
                  <Picker
                      selectedValue={defiTipoMaterial}
                      onValueChange={(itemValue) => onChangeText(itemValue, 'defiTipoMaterial') }
                      >
                      <Picker.Item label="----" value=""/>
                      <Picker.Item label="SUBTERRÁNEO" value="SUB"/>
                      <Picker.Item label="ALUMINIO" value="ALU"/>
                      <Picker.Item label="AUTOPORTANTE" value="AUT"/>
                  </Picker>
                </View>
                :
                <View>
                  <Text style={{fontWeight:'bold'}}>Material Elemento</Text>
                  <Picker
                      selectedValue={defiTipoMaterial}
                      onValueChange={(itemValue) => onChangeText(itemValue, 'defiTipoMaterial') }
                      >
                      <Picker.Item label="----" value=""/>
                      <Picker.Item label="MADERA" value="MAD"/>
                      <Picker.Item label="FIERRO" value="FIE"/>
                      <Picker.Item label="CONCRETO" value="CON"/>
                      <Picker.Item label="FIBRA DE VIDRIO" value="FDV"/>
                  </Picker>
                </View>
              :
              <></>
            }
            {inputComponent.nodoInicial==true?
              <View>
                <FormInput 
                  value={defiNodoInicial}
                  onChangeText={(value) => onChangeText(value, 'defiNodoInicial')}
                  label='Nodo Inicial'
                  placeholder= ""
                  editable={true}
                  />
              </View>
              :
              <></>
            }
            {inputComponent.nodoFinal==true?
              <View>
                <FormInput 
                  value={defiNodoFinal}
                  onChangeText={(value) => onChangeText(value, 'defiNodoFinal')}
                  label='Nodo Final'
                  placeholder= ""
                  editable={true}
                  />
              </View>
              :
              <></>
            }
            {inputComponent.tipoRetenida==true?
              <View>
                <Text style={{fontWeight:'bold'}}>Tipo de Retenida</Text>
                <Picker
                    selectedValue={defiTipoRetenida}
                    onValueChange={(itemValue) => onChangeText(itemValue, 'defiTipoRetenida') }
                    >
                    <Picker.Item label="----" value=""/>
                    <Picker.Item label="AÉREA" value="A"/>
                    <Picker.Item label="CONTRAPUNTA" value="C"/>
                    <Picker.Item label="RV" value="RV"/>
                    <Picker.Item label="RS" value="RS"/>
                    <Picker.Item label="NINGUNA" value="N"/>
                </Picker>
              </View>
              :
              <></>
            }
            {inputComponent.tipoArmado==true?
              <View>
                <FormInput
                    value={defiTipoArmado}
                    onChangeText={(value) => onChangeText(value, 'defiTipoArmado')}
                    label='Tipo de Armado'
                    placeholder=''
                    editable={true}/>
              </View>
              :
              <></>
            }
            {inputComponent.armadoMaterial==true?
              <View>
                <Text style={{fontWeight:'bold'}}>Material Armado</Text>
                <Picker
                    selectedValue={defiArmadoMaterial}
                    onValueChange={(itemValue) => onChangeText(itemValue, 'defiArmadoMaterial') }
                    >
                    <Picker.Item label="----" value=""/>
                    <Picker.Item label="MADERA" value="MA"/>
                    <Picker.Item label="FOGO" value="FO"/>
                    <Picker.Item label="CONCRETO" value="CO"/>
                    <Picker.Item label="NINGUNO" value="NN"/>
                </Picker>
              </View>
              :
              <></>
            }
            {inputComponent.numeroPostes==true?
              <View>
                <Text style={{fontWeight:'bold'}}>Número de Postes</Text>
                <Picker
                    selectedValue={defiNumPostes}
                    onValueChange={(itemValue) => onChangeText(itemValue, 'defiNumPostes') }
                    >
                    <Picker.Item label="----" value={0}/>
                    <Picker.Item label="1" value={1}/>
                    <Picker.Item label="2" value={2}/>
                    <Picker.Item label="3" value={3}/>
                </Picker>
              </View>
              :
              <></>
            }
            {inputComponent.pozoTierra1==true?
              <View>
                <FormInput 
                    value={defiPozoTierra}
                    onChangeText={(value) => onChangeText(value, 'defiPozoTierra')}
                    label='Pozo a Tierra Medicion 1'
                    placeholder=''
                    editable={true}
                    />
              </View>
              :
              <></>
            }
            {inputComponent.pozoTierra2==true?
              <View>
                <FormInput 
                    value={defiPozoTierra2}
                    onChangeText={(value) => onChangeText(value, 'defiPozoTierra2')}
                    label='Pozo a Tierra Medicion 2'
                    placeholder=''
                    editable={true}
                    />
              </View>
              :
              <></>
            }
            {inputComponent.numeroSuministro==true?
              <View>
                <FormInput 
                    value={defiNumSuministro}
                    onChangeText={(value) => onChangeText(value, 'defiNumSuministro')}
                    label='Num. Suministro (RF,SN)'
                    placeholder=''
                    editable={true}
                />
              </View>
              :
              <></>
            }
            {inputComponent.distHorizontal==true?
              <View>
                <FormInput 
                  value={defiDistHorizontal!=null?""+defiDistHorizontal:""}
                  onChangeText={(value) => onChangeText(value, 'defiDistHorizontal')}
                  label='Distancia Horizontal'
                  keyboardType = 'number-pad'
                  placeholder=''
                  editable={true}
                  />
              </View>
              :
              <></>
            }
            {inputComponent.distVertical==true?
              <View>
                <FormInput 
                  value={defiDistVertical!=null?""+defiDistVertical:""}
                  onChangeText={(value) => onChangeText(value, 'defiDistVertical')}
                  label='Distancia Vertical'
                  keyboardType = 'number-pad'
                  placeholder=''
                  editable={true}
                  />
              </View>
              :
              <></>
            }
            {inputComponent.responsable==true?
              <View>
                <Text style={{fontWeight:'bold'}}>Responsable</Text>
                <Picker
                  selectedValue={defiResponsable}
                  onValueChange={(itemValue) => onChangeText(itemValue, 'defiResponsable') }
                  >
                  <Picker.Item label="CONCESIONARIA" value={false}/>
                  <Picker.Item label="TERCERO" value={true}/>
                </Picker>
              </View>
              :
              <></>
            }
            {inputComponent.fechas==true?
              <View>
                <DateInput 
                  value={defiFechaDenuncia}
                  onPress={()=>showDatePicker('defiFechaDenuncia')}
                  label={"Fecha de Denuncia"}
                  placeholder={'Se encontró'}
                  editable={false}
                  pointerEvents={"none"}
                  showSoftInputOnFocus={false}
                  disabled={true}/>
                <DateInput 
                  value={defiFechaInspeccion}
                  onPress={()=>showDatePicker('defiFechaInspeccion')}
                  label={"Fecha de Inspección"}
                  placeholder={'Se encontró'}
                  editable={false}
                  pointerEvents={"none"}
                  showSoftInputOnFocus={false}
                  disabled={true}/>
                  <Text style={{fontWeight:'bold'}}>Fecha Subsanación:</Text>
                  <View style={{flexDirection:"row", alignSelf:"center"}}>
                    <View style ={{width:'90%'}}>
                      <FormInput 
                      value={defiFechaSubsanacion}
                      onChangeText={(value) => onChangeText(value, 'defiFechaSubsanacion')}
                      placeholder=''
                      editable={true}
                      />
                    </View>
                    <View style ={{width:'10%', alignSelf:'center'}}>
                      <TouchableOpacity onPress={()=>showDatePicker('defiFechaSubsanacion')} >
                        <Image source={require("../assets/calendario.png")} style={{width:20, height:20, marginTop:5}} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                {/*<DateInput 
                  value={defiFechaSubsanacion}
                  onChangeText={(value) => onChangeText(value, 'defiFechaSubsanacion')}
                  onPress={()=>showDatePicker('defiFechaSubsanacion')}
                  pointerEvents={"none"}
                  editable={true}
                  label={"Fecha de Subsanación"}
                  />*/}
              </View>
              :
            <></>
            }
            {inputComponent.observacion==true?
              <View>
                <FormInput 
                  value={defiObservacion}
                  onChangeText={(value) => onChangeText(value, 'defiObservacion')}
                  label='Observacion'
                  placeholder=''
                  editable={false}/>
              </View>
              :
              <></>
            }
            {inputComponent.comentario===true?
              <View>
                <FormInput 
                  value={defiComentario}
                  onChangeText={(value) => onChangeText(value, 'defiComentario')}
                  label='Comentarios'
                  placeholder=''
                  maxLength = {120}
                  editable={true}/>
              </View>
              :
              <></>
            }
            {inputComponent.estadoCriticidad==true?
              <View>
                <Text style={{fontWeight:'bold'}}>Criticidad de Deficiencia:</Text>
                {defiEstado =='O'?
                <Picker
                    selectedValue={defiEstadoCriticidad}
                    onValueChange={(itemValue) => onChangeText(itemValue, 'defiEstadoCriticidad') }
                    >
                    <Picker.Item label="Ninguno" value={null}/>
                </Picker>
                :
                <Picker
                    selectedValue={defiEstadoCriticidad}
                    onValueChange={(itemValue) => onChangeText(itemValue, 'defiEstadoCriticidad') }
                    >
                    <Picker.Item label="Leve" value={1}/>
                    <Picker.Item label="Moderado" value={2}/>
                    <Picker.Item label="Grave" value={3}/>
                </Picker>
                }
              </View>
              :
              <></>
            }
            
            {inputComponent.estadoSubsanacion==true?
            defiEstado == 'N'?
              <View>
                <Text style={{fontWeight:'bold'}}>Estado de Subsanación</Text>
                <Picker
                  selectedValue={defiEstadoSubsanacion}
                  onValueChange={(itemValue) => onChangeText(itemValue, 'defiEstadoSubsanacion') }
                  >
                    <Picker.Item label="Por Subsanar" value="0"/>
                    <Picker.Item label="Subsanación Preventiva" value="1"/>
                </Picker>
              </View>
              :
              <View>
                <Text style={{fontWeight:'bold'}}>Estado de Subsanación</Text>
                <Picker
                  selectedValue={defiEstadoSubsanacion}
                  onValueChange={(itemValue) => onChangeText(itemValue, 'defiEstadoSubsanacion') }
                  >
                    <Picker.Item label="Por Subsanar" value="0"/>
                    <Picker.Item label="Subsanación Preventiva" value="1"/>
                    <Picker.Item label="Subsanación Definitiva" value="2"/>
                </Picker>
              </View>
              :
              <></>
            }

            <FormSubmitButton
                onPress={submit}
                title='Guardar'/>
            {datePicker && (
              <DateTimePicker
                value={date}
                mode={'date'}
                onChange={onDateSelected}
              />
            )}

            {
              selectedDeficiency?
                selectedDeficiency.defiEstado!=="S"?
                <View>
                  <Button color={'red'} 
                          title="Eliminar"
                          onPress={deleteDeficiency}
                          />
                </View>
                :
                <></>
                :
                <></>
            }
          </FormContainer>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
