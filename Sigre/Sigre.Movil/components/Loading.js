// import { ActivityIndicator, Modal, Text, View } from "react-native";
// import { useSelector } from 'react-redux';

// export default function Loading () {

//     //const { isLoading, isLoadingMessage } = useSelector(state => state.AppReducer);
//     const { isLoading, isLoadingMessage } = useSelector(state => state.app);

    
//     return(
//         <Modal transparent visible={isLoading}>
//             <View style={{
//                 flex: 1,
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 backgroundColor: "rgba(0,0,0,0.15)", //////////----------------------------------------------Z nuevo
//             }}>
//                 <ActivityIndicator size="large" color="black" animating={true}/>
//                 <Text>{isLoadingMessage}</Text>
//             </View>
//         </Modal>
//     )
// }


import { ActivityIndicator, Modal, Text, View } from "react-native";
import { useSelector } from "react-redux";

export default function Loading() {
  const { isLoading, isLoadingMessage } = useSelector((state) => state.app);

  return (
    <Modal transparent visible={isLoading}>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0,0,0,0.15)",
        }}
      >
        <ActivityIndicator size="large" color="black" />
        <Text style={{ marginTop: 10, color: "#000" }}>
          {isLoadingMessage}
        </Text>
      </View>
    </Modal>
  );
}
