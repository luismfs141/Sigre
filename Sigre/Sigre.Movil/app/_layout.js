// //app/_layout.js
// import { Stack } from "expo-router";
// import { SafeAreaProvider } from "react-native-safe-area-context";
// import { Provider } from "react-redux";

// import Loading from "../components/Loading";
// import store from "../context/store/Store";

// import { AuthProvider } from "../context/AuthContext";
// import { DatosProvider } from "../context/DatosContext";

// export default function RootLayout() {
//   return (
//     <SafeAreaProvider>
//       <Provider store={store}>
//         <AuthProvider>
//           <DatosProvider>
//             <Stack screenOptions={{ headerShown: false }} />
//             <Loading /> {/* ✅ overlay global */}
//           </DatosProvider>
//         </AuthProvider>
//       </Provider>
//     </SafeAreaProvider>
//   );
// }





// app/_layout.js
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";

import Loading from "../components/Loading";
import store from "../context/store/Store";

import { AuthProvider } from "../context/AuthContext";
import { DatosProvider } from "../context/DatosContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <AuthProvider>
          <DatosProvider>
            <Stack screenOptions={{ headerShown: false }} />
            <Loading />
          </DatosProvider>
        </AuthProvider>
      </Provider>
    </SafeAreaProvider>
  );
}
