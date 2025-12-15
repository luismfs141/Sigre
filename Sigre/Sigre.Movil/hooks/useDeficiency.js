import { useDatos } from "../context/DatosContext";
import { deleteDeficiencyById, getDeficiencyByTypificationElement, saveOrUpdateDeficiency } from "../database/offlineDB/deficiencies";


import { DEFICIENCY_FIELD_MAP } from "../utils/Deficiencies/deficiencyFieldMap";

export const useDeficiency = () => {
  const { checkDatabase } = useDatos();

  const normalizeByTypification = (def, typificationId) => {
    const allowed =
      DEFICIENCY_FIELD_MAP[typificationId]?.fields.map(f => f.key) ?? [];

    const normalized = { ...def };

    Object.keys(normalized).forEach(key => {
      if (
        key.startsWith("Defi") &&
        !allowed.includes(key) &&
        ![
          "DefiInterno",
          "DefiIdElemento",
          "DefiTipoElemento",
          "DefiCodigoElemento",
          "TipiInterno",
          "DefiFechaCreacion",
          "DefiFecRegistro",
          "DefiEstado",
          "EstadoOffLine"
        ].includes(key)
      ) {
        normalized[key] = null;
      }
    });

    return normalized;
  };

  const createOrGetDeficiency = async ({
    element,
    typification,
    user
  }) => {
    const dbOk = await checkDatabase();
    if (!dbOk) return null;

    const existing = await getDeficiencyByTypificationElement(
      element.IdOriginal,
      element.TipoElemento,
      typification.TipiInterno
    );

    if (existing.length > 0) return existing[0];

    const now = new Date().toISOString();

    const newDef = {
      DefiEstado: "N",
      TablInterno: 8,
      TipiInterno: typification.TipiInterno,

      DefiCodigoElemento: element.ElementCode,
      DefiTipoElemento: element.TipoElemento,
      DefiIdElemento: element.IdOriginal,

      DefiLatitud: element.Latitude,
      DefiLongitud: element.Longitude,

      DefiFechaCreacion: now,
      DefiFecRegistro: now,

      DefiUsuarioInic: user?.usuario,
      DefiActivo: 1,
      DefiInspeccionado: 0,
      EstadoOffLine: 2
    };

    const defiInterno = await saveOrUpdateDeficiency(newDef);

    return {
      ...newDef,
      DefiInterno: defiInterno
    };
  };

  const saveDeficiencyByTypification = async (def) => {
    const normalized = normalizeByTypification(def, def.TipiInterno);
    return await saveOrUpdateDeficiency(normalized);
  };

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

  /**
   * 💾 Guarda o actualiza una deficiencia
   */
  const saveDeficiency = async (deficiency) => {
    console.log(deficiency);
    const dbOk = await checkDatabase();
    if (!dbOk) {
      console.warn("⚠ Base de datos no disponible. No se puede guardar la deficiencia.");
      return null;
    }

    try {
      const result = await saveOrUpdateDeficiency(deficiency);
      return result; // DefiInterno actualizado o insertId
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
    createOrGetDeficiency,
    saveDeficiencyByTypification,
    deleteDeficiency
  };
};