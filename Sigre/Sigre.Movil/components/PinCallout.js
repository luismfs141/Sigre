import React from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native'
import { Callout } from 'react-native-maps';
import { getElementNameFromType, mustRegisterDeficiency } from '../utils/utils';
import { calloutStyles } from '../assets/styles/PinCallout';
import { themeStyles } from '../assets/styles/Theme';

export const PinCallout = ({pin}) => {

    if(pin.type<8){

    const navigation = useNavigation();
    
    const onCalloutPressed = () => {
        if (mustRegisterDeficiency(pin.type)) {
            navigation.navigate("Deficiencias");
        }
    }

    return (
        <Callout tooltip onPress={ () => onCalloutPressed() }>
            <View style={calloutStyles.container}>
                <Text style={themeStyles.title}>{getElementNameFromType(pin.type)}</Text>
                <Text style={themeStyles.subTitle}>{pin.label}</Text>
                <Text style={{textAlign: 'center'}}> {mustRegisterDeficiency(pin.type) && "Presione para registrar deficiencia"}  </Text>
            </View>
        </Callout>
    )
    }
}