import { useState } from "react";
import formatDate from '../utils/dateFormat';
import { fixDate } from "../utils/utils";
import { TouchableOpacity } from "react-native-gesture-handler";
import { View, TextInput, StyleSheet, Text, Image } from "react-native";
import { useDispatch } from 'react-redux';

export function DateInput ({value,label, placeholder, onPress, editable, pointerEvents,showSoftInputOnFocus, disabled }) {
    
    const [date, setDate] = useState(fixDate(new Date()));
    const [newDate, setNewDate] = useState(false);
    const dispatch = useDispatch();

      return(
        <View>
          <Text style={{ fontWeight: 'bold' }}>{label}</Text>
          <View style={styles.inputDate}>
            <TextInput style={{width:'90%'}} 
                  value={value}
                  placeholder={placeholder}
                  editable={editable}
                  pointerEvents={pointerEvents}
                  showSoftInputOnFocus={showSoftInputOnFocus}/>
            <TouchableOpacity onPress={onPress} disabled={disabled}>
              <Image source={require("../assets/calendario.png")} style={{width:20, height:20, marginTop:5}} />
            </TouchableOpacity>
          </View>
        </View>
        );
}

const styles = StyleSheet.create({
  input: {
    width:'90%'
  },
  inputDate: {
    flexDirection:'row',
    borderWidth: 1,
    borderColor: '#1b1b33',
    height: 35,
    borderRadius: 8,
    fontSize: 16,
    paddingLeft: 10,
    marginBottom: 20,
    width:'95%'
  }
});
