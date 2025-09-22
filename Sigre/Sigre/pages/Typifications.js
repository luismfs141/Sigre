import React, { useEffect } from 'react';
import { SafeAreaView } from "react-native";
import { Typification } from "../components/Typification"
import { ScrollView } from "react-native-gesture-handler";
import { useTypification } from "../hooks/useTypification"
import { useSelector} from 'react-redux';
import { setSelectedTypification } from '../context/actions/Actions';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

export  const Typifications =() => {

  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {getTypifications, typifications} = useTypification();
  const { selectedPin } = useSelector(state => state.AppReducer);

  useEffect(() => {
    if(selectedPin){
      var tipoTabla = selectedPin.type == 0 ? "3" :
      selectedPin.type == 5 ? "1" :
      selectedPin.type == 1 ? "2" :
      selectedPin.type == 2 ? "2" :
      selectedPin.type == 3 ? "2" :
      selectedPin.type == 4 ? "2" :
      selectedPin.type == 6 ? "2" :
      selectedPin.type == 7 ? "2" : "2";
      getTypifications(tipoTabla);
    }
  }, [selectedPin])

  const onTypificationPressed= (typification) =>{
    dispatch(setSelectedTypification(typification));
    navigation.navigate("Deficiencias");
  }
  

    return (
      <SafeAreaView>
        <ScrollView>
          {
          typifications.map((item,i) => (
            <Typification 
            key={i+item.tipiCode}
            object ={item}
            onPress={() => onTypificationPressed(item)}
            />
          ))
          }
        </ScrollView>
      </SafeAreaView>
    );
  }