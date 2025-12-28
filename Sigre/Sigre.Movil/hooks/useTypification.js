// import { useDatos } from "../context/DatosContext";
// import { getTypificationByIdElement, getTypificationByTypeElement } from "../database/offlineDB/typification";

// export const useTypification = () => {
//   const { checkDatabase } = useDatos();

//   const fetchTypificationsByTypeElement = async (tableId) => {
//     const dbOk = await checkDatabase();
//     if (!dbOk) {
//       console.warn("⚠ Base de datos no disponible. No se pueden cargar las tipificaciones.");
//       return [];
//     }

//     try {
//       return await getTypificationByTypeElement(tableId);
//     } catch (error) {
//       console.error("❌ Error al obtener tipificaciones por tipo de elemento:", error);
//       return [];
//     }
//   };

//   const fetchTypificationsByElement = async (idElement, typeElement) => {
//     const dbOk = await checkDatabase();
//     if (!dbOk) {
//       console.warn("⚠ Base de datos no disponible. No se pueden cargar las tipificaciones.");
//       return [];
//     }

//     // ⚠ PARCHE QUE EVITA EL CRASH
//     if (!idElement) {
//       console.warn("⚠ No se encontraron tipificaciones para el elemento undefined");
//       return [];
//     }

//     try {
//       return await getTypificationByIdElement(idElement, typeElement);
//     } catch (error) {
//       console.error("❌ Error al obtener tipificaciones por elemento:", error);
//       return [];
//     }
//   };

//   return {
//     fetchTypificationsByTypeElement,
//     fetchTypificationsByElement
//   };
// };

import { useDatos } from "../context/DatosContext";
import {
  getTypificationByFiles,
  getTypificationByIdElement,
  getTypificationByTypeElement
} from "../database/offlineDB/typification";

export const useTypification = () => {
  const { checkDatabase } = useDatos();

  const ensureDb = async () => {
    const ok = await checkDatabase();
    if (!ok) {
      console.warn("⚠ Base de datos no disponible");
      return false;
    }
    return true;
  };

  /* ===============================
     🔹 USADAS (Deficiencias + Archivos)
     =============================== */
  const fetchUsedTypificationsByElement = async (idElement, typeElement) => {
    if (!(await ensureDb())) return [];

    if (!idElement || !typeElement) return [];

    try {
      const [fromDefs, fromFiles] = await Promise.all([
        getTypificationByIdElement(idElement, typeElement),
        getTypificationByFiles(idElement, typeElement)
      ]);

      // Unificar sin duplicados
      const map = new Map();

      [...fromDefs, ...fromFiles].forEach(t => {
        const id = t.TypificationId ?? t.id;
        if (!map.has(id)) {
          map.set(id, {
            ...t,
            TypificationId: id
          });
        }
      });

      return Array.from(map.values());
    } catch (error) {
      console.error("❌ Error obteniendo tipificaciones usadas:", error);
      return [];
    }
  };

  /* ===============================
     🔹 DISPONIBLES (por tipo elemento)
     =============================== */
  const fetchAvailableTypificationsForElement = async (
    tableId,
    idElement,
    typeElement
  ) => {
    if (!(await ensureDb())) return [];

    try {
      const allByType = await getTypificationByTypeElement(tableId);
      const used = await fetchUsedTypificationsByElement(
        idElement,
        typeElement
      );

      const usedIds = used.map(t => t.TypificationId);

      return allByType.filter(
        t => !usedIds.includes(t.TypificationId ?? t.id)
      );
    } catch (error) {
      console.error("❌ Error obteniendo tipificaciones disponibles:", error);
      return [];
    }
  };

  return {
    fetchUsedTypificationsByElement,
    fetchAvailableTypificationsForElement
  };
};
