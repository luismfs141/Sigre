import { useDatos } from "../context/DatosContext";
import { deleteDeficiencyById, getDeficiencyByTypificationElement, saveOrUpdateDeficiency } from "../database/offlineDB/deficiencies";
import { nowPeruISO } from "../utils/dateUtils";

export const useDeficiency = () => {
  const { checkDatabase } = useDatos();

  /**
   * Obtiene las deficiencias asociadas a un elemento y tipificación
   */

  const fetchDeficiencyByTypificationElement = async (idElement, typeElement, idTypification) => {
    const dbOk = await checkDatabase();
    if (!dbOk) {
      console.warn("⚠ Base de datos no disponible. No se pueden cargar las deficiencias.");
      return [];
    }

    try {
      const deficiencies = await getDeficiencyByTypificationElement(idElement, typeElement, idTypification);
      return deficiencies;
    } catch (error) {
      console.error("❌ Error al obtener las deficiencias:", error);
      return [];
    }
  };

  const normalizeDeficiencyBeforeSave = (deficiency, userId) => {
    const now = nowPeruISO();

    const isNew =
      deficiency.DefiInterno === 0 ||
      deficiency.DefiInterno === null ||
      deficiency.DefiInterno === undefined;

    return {
      ...deficiency,

      // 🆕 NUEVA
      ...(isNew && {
        DefiEstado: deficiency.DefiEstado || "N",
        DefiFechaCreacion: now,
        DefiFecRegistro: now,
        DefiUsuarioInic: userId
      }),

      // 🔁 SIEMPRE
      DefiUsuarioMod: userId,
      DefiFecModificacion: now
    };
  };


  /**
   * 💾 Guarda o actualiza una deficiencia
   */
  const saveDeficiency = async (deficiency, userId) => {
    const dbOk = await checkDatabase();
    if (!dbOk) {
      console.warn("⚠ Base de datos no disponible. No se puede guardar la deficiencia.");
      return null;
    }

    try {
      const normalized =
        normalizeDeficiencyBeforeSave(deficiency, userId);

      return await saveOrUpdateDeficiency(normalized);
    } catch (error) {
      console.error("❌ Error al guardar la deficiencia:", error);
      return null;
    }
  };

  /**
   * 🗑 Elimina una deficiencia si existe en BD
   */
  const deleteDeficiency = async (defiInterno) => {
    const dbOk = await checkDatabase();
    if (!dbOk) {
      console.warn("⚠ Base de datos no disponible. No se puede eliminar.");
      return false;
    }

    try {
      return await deleteDeficiencyById(defiInterno);
    } catch (error) {
      console.error("❌ Error eliminando deficiencia:", error);
      return false;
    }
  };


  return {
    fetchDeficiencyByTypificationElement,
    saveDeficiency,
    deleteDeficiency
  };
};