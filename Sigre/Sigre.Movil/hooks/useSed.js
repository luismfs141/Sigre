import { useDatos } from "../context/DatosContext";
import { getAllSedsLocal, getSedById } from "../database/offlineDB/seds";

export const useSed = () => {
  const { setSelectedItem, checkDatabase } = useDatos();

  // 🔹 Obtener una SED por ID
  const fetchAndSelectSed = async (id) => {
    const dbOk = await checkDatabase();
    if (!dbOk) return null;

    try {
      const data = await getSedById(id);
      setSelectedItem(data);
      return data ?? null;
    } catch (err) {
      console.error("❌ Error obteniendo SED por ID:", err);
      return null;
    }
  };

  // 🔹 Obtener TODAS las SEDs locales
  const fetchAllSedsLocal = async () => {
    const dbOk = await checkDatabase();
    if (!dbOk) return [];

    try {
      const data = await getAllSedsLocal();

      if (!data || data.length === 0) {
        console.warn("⚠ No hay SEDs locales en el hook");
        return [];
      }
      return data;

    } catch (err) {
      console.error("❌ Error obteniendo SEDs locales:", err);
      return [];
    }
  };

  return {
    fetchAndSelectSed,
    fetchAllSedsLocal
  };
};
