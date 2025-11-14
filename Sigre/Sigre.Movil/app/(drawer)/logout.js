import { useRouter } from "expo-router";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";

export default function Logout() {
  const { signOut } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    const salir = async () => {
      await signOut();
      router.replace("/"); // redirige al login (index.js)
    };
    salir();
  }, []);

  return null; // no muestra nada visualmente
}
