import { useDatos } from "../context/DatosContext";
import { getAllSedsLocal, getSedById } from "../database/offlineDB/seds";

export const useSed = () => {
  const { setSelectedItem, checkDatabase } = useDatos();

  // ------------------- GET BY ID -------------------
  const fetchAndSelectSed = async (id) => {
    const dbOk = await checkDatabase();
    if (!dbOk) return null;

    try {
      console.log("📌 Buscando SED con ID:", id);

      const data = await getSedById(id);

      if (!data) {
        console.warn("⚠ No se encontró la SED con ID:", id);
        return null;
      }

      setSelectedItem(data);
      console.log("✅ SED seleccionada:", data);

      return data;
    } catch (err) {
      console.error("❌ Error obteniendo SED por ID:", err);
      return null;
    }
  };

  // ------------------- FETCH ALL -------------------
  const fetchAllSedsLocal = async () => {
    const dbOk = await checkDatabase();
    if (!dbOk) return [];

    try {
      console.log("📦 Cargando SEDs desde SQLite...");

      const data = await getAllSedsLocal();

      if (!data || data.length === 0) {
        console.warn("⚠ No hay SEDs locales en la base");
        return [];
      }

      //console.log("✅ SEDs locales recibidas:", data.length);
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
