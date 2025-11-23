import { styles } from "../assets/styles/Multimedia";
import { useNavigation } from '@react-navigation/native'
import { TouchableOpacity } from "react-native-gesture-handler";
import { View, Text, Image} from "react-native";
import { useDispatch } from 'react-redux';
import { setPhoto } from "../context/actions/Actions";

export const ComponentMultimedia = ({label,type,archivo })=>{

    const navigation = useNavigation();
    const dispatch = useDispatch();

    var color = archivo.find(a => a.archTipo === type);

    const onPhotoPressed = (t) => {
        dispatch(setPhoto(t));
        navigation.navigate("Multimedia");
      }

    return(
        <View style={{borderWidth: 1, flexDirection: 'row', alignItems: "center", backgroundColor:color?"#02C505":"white"}}>
            <Text style={ styles.itemDeficiency}>{label}</Text>
            <TouchableOpacity onPress={() => onPhotoPressed(type)}>
                <Image source={require('../assets/rigth-button.png')} style={{ width: 30, height: 30}}/>
            </TouchableOpacity>
        </View>
    )
}