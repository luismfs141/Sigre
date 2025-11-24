import { useEffect } from "react";
import { ActivityIndicator, Modal, View, Text } from "react-native"
import { useSelector} from 'react-redux';

export default function Loading () {

    const { isLoading, isLoadingMessage } = useSelector(state => state.AppReducer);
    
    return(
        <Modal transparent visible={isLoading}>
            <View style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <ActivityIndicator size="large" color="black" animating={true}/>
                <Text>{isLoadingMessage}</Text>
            </View>
        </Modal>
    )
}