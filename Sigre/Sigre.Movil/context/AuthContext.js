


import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from 'expo-application';
import { createContext, useEffect, useState } from "react";
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
      const url = `${baseURL}User/login`;

      const email = String(correo ?? "").trim();
      const pwd = String(password ?? "");

      console.log("Intentando login en:", url);
      console.log("Datos enviados:", {
        Correo: email,
        Password: pwd,
        Imei: deviceId ?? "",
      });


      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        // ✅ OJO: PASCAL CASE para que matchee 1:1 con LoginRequest
        body: JSON.stringify({
          Correo: email,
          Password: pwd,
          Imei: "", // ✅ igual que antes
        }),

      });

      if (response.status === 403) {
        // ✅ usuario desactivado (lo haremos en server)
        const err = await response.json().catch(() => null);
        console.log("Login 403:", err);
        return { ok: false, reason: err?.message || "Usuario desactivado" };
      }

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        console.log("Error HTTP:", response.status, err);
        return { ok: false, reason: err?.message || "Credenciales inválidas" };
      }

      const data = await response.json();

      const loggedUser = {
        id: data.usuaInterno,
        nombre: data.usuaNombres,
        apellido: data.usuaApellidos,
        correo: data.usuaCorreo ?? email,
        proyecto,
        token: data.token,
        deviceId,

        // ✅ perfil desde servidor
        perfilId: data.perfilId ?? null,
        perfilNombre: data.perfilNombre ?? null,
      };

      setUser(loggedUser);
      await AsyncStorage.setItem("user", JSON.stringify(loggedUser));

      return { ok: true };
    } catch (error) {
      console.error("Error login:", error);
      return { ok: false, reason: "Error de red o servidor" };
    }
  };




  const signOut = async () => {
    setUser(null);
    await AsyncStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
