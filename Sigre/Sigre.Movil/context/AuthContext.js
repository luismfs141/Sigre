// import AsyncStorage from "@react-native-async-storage/async-storage";
// import * as Application from 'expo-application';
// import React, { createContext, useEffect, useState } from "react";
// import { Platform } from 'react-native';
// import { API_URL } from '../config'; // 👈 Import directo

// export const AuthContext = createContext();

// export function AuthProvider({ children }) {
//   const baseURL = API_URL;
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const loadUser = async () => {
//       const storedUser = await AsyncStorage.getItem("user");
//       if (storedUser) {
//         setUser(JSON.parse(storedUser));
//       }
//       setLoading(false);
//     };
//     loadUser();
//   }, []);

//   const getDeviceId = async () => {
//     if (Platform.OS === 'android') return Application.getAndroidId();
//     if (Platform.OS === 'ios') return await Application.getIosIdForVendorAsync();
//   };

//   const signIn = async (correo, password, proyecto) => {
//     try {
//       const deviceId = await getDeviceId();

//       const response = await fetch(`${baseURL}Auth/login`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ correo, password, imei: deviceId }),
//       });

//       if (!response.ok) return false;

//       const data = await response.json();

//       const loggedUser = {
//         id: data.usuaInterno,
//         nombre: data.usuaNombres,
//         correo: data.usuaCorreo,
//         proyecto,
//         token: data.token,
//         deviceId, // lo guardamos también en contexto
//       };

//       setUser(loggedUser);
//       await AsyncStorage.setItem("user", JSON.stringify(loggedUser));

//       return true;
//     } catch (error) {
//       console.error("Error login:", error);
//       return false;
//     }
//   };

//   const signOut = async () => {
//     setUser(null);
//     await AsyncStorage.removeItem("user");
//   };

//   return (
//     <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }





import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from 'expo-application';
import React, { createContext, useEffect, useState } from "react";
import { Platform } from 'react-native';
import { API_URL } from '../config'; // 👈 Import directo

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const baseURL = API_URL;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const getDeviceId = async () => {
    if (Platform.OS === 'android') return Application.getAndroidId();
    if (Platform.OS === 'ios') return await Application.getIosIdForVendorAsync();
  };

  const signIn = async (correo, password, proyecto) => {
    try {
      const deviceId = await getDeviceId();

      const response = await fetch(`${baseURL}User/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, password, imei: deviceId }),
      });

      if (!response.ok) return false;

      const data = await response.json();

      const loggedUser = {
        id: data.usuaInterno,
        nombre: data.usuaNombres,
        correo: data.usuaCorreo,
        proyecto,
        token: data.token,
        deviceId, // lo guardamos también en contexto
      };

      setUser(loggedUser);
      await AsyncStorage.setItem("user", JSON.stringify(loggedUser));

      return true;
    } catch (error) {
      console.error("Error login:", error);
      return false;
    }
  };

  const signOut = async () => {
  try {
    await AsyncStorage.removeItem("user");
    setUser(null);
  } catch (error) {
    console.error("Error cerrando sesión:", error);
  }
};

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}