import { TouchableOpacity } from "react-native-gesture-handler";
import { View, Text, Image} from "react-native";
import { styles } from '../assets/styles/Typification';


export const Typification =( {object, onPress} ) =>{

    return(
        <View style={styles.container }>
            <Text style={ styles.itemTypification}>{object.label} </Text>
            <TouchableOpacity onPress={onPress}>
                <Image source={require('../assets/rigth-button.png')} style={{ width: 20, height: 20}}/>
            </TouchableOpacity>
        </View>
    );
}

