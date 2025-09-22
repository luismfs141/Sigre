import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { DrawerNavigation } from './navigation/DrawerNavigation';
import { Provider } from 'react-redux';
import Store from './context/Store';
//import { IdDevice } from "./utils/IdDevice";
import Loading from './components/Loading';


export default function App () {
  return (     
    <Provider store={Store}>
      <Loading/>
        <NavigationContainer>  
          <DrawerNavigation/>     
            {/* <IdDevice/> */}
        </NavigationContainer>
    </Provider>
  );
}