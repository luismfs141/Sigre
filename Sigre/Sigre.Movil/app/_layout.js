// import { Stack } from 'expo-router';
// import { AuthProvider } from '../context/AuthContext';
// import { DatosProvider } from '../context/DatosContext';

// export default function RootLayout() {
//   return (
//     <AuthProvider>
//       <DatosProvider>
//         <Stack screenOptions={{ headerShown: false }} />
//       </DatosProvider>
//     </AuthProvider>
//   );
// }


import { Stack } from "expo-router";
import { Provider } from "react-redux";

import Loading from "../components/Loading";
import store from "../context/store/Store";

import { AuthProvider } from "../context/AuthContext";
import { DatosProvider } from "../context/DatosContext";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <DatosProvider>
          <Stack screenOptions={{ headerShown: false }} />
          <Loading /> {/* ✅ overlay global */}
        </DatosProvider>
      </AuthProvider>
    </Provider>
  );
}


