// import { useState, useCallback, useEffect } from "react";
// import { getAllTypifications } from "../services/typificationService";

// export const useTypification = () => {
//   const [loading, setLoading] = useState(false);
//   const [masterTypifications, setMasterTypifications] = useState([]);

//   // 1. Cargar TODAS las tipificaciones al iniciar (Diccionario Maestro)
//   useEffect(() => {
//     const loadMasterData = async () => {
//       setLoading(true);
//       try {
//         const data = await getAllTypifications();
//         if(data) setMasterTypifications(data);

//       } catch (error) {
//         console.error("Error cargando maestro de tipificaciones:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     loadMasterData();
//   }, []);

//   // 2. Función para buscar el Código (ej: "6002") dado un ID Interno (ej: 52)
// const getCodeById = useCallback((internalId) => {


//     if (!masterTypifications.length || !internalId) return "";

//     const match = masterTypifications.find(t => 
//         String(t.tipiInterno) === String(internalId) || 
//         String(t.typificationId) === String(internalId)
//     );


//     return match ? match.code : "";
// }, [masterTypifications]);


//   // 3. Función para filtrar por Tabla (Poste/Vano) para el Dropdown manual
//   const fetchTypificationsByTypeElement = useCallback((tableId) => {
//     return masterTypifications
//         .filter(t => t.tableID === tableId || t.TableId === tableId)
//         .map(t => ({
//             label: `${t.code} - ${t.typification}`,
//             value: t.code // Usamos el código como valor
//         }));
//   }, [masterTypifications]);

// // --- DENTRO DE useTypification.js ---

// const getTypificationsByElement = useCallback((elementType) => {
//     // 1. Verificamos si hay datos maestros
//     if (!masterTypifications.length) {
//         console.warn("⚠️ [useTypification] Maestro vacío. Esperando carga...");
//         return [];
//     }


//     // 2. FILTRADO
//     const filtered = masterTypifications.filter(t => {
//         const tipoDb = (t.tipiTipoElemento || t.defiTipoElemento || "").toUpperCase();
//         const tipoForm = (elementType || "").toUpperCase();
//         return tipoDb === 'BOTH' || tipoDb === tipoForm;
//     });


//     // 3. MAPEO (Aquí vemos el ID real)
//     const mapped = filtered.map(t => {
//         // Obtenemos el ID real
//         const realId = Number(t.tipiInterno || t.typificationId);
//         const code = t.code || t.tipiCodigo;

//         // Logueamos solo los sospechosos (ej: la 6026)
//         if (code === '6026' || code === '7004') {

//         }

//         return {
//             label: `${code} - ${t.typification || t.tipiDescripcion}`,
//             value: realId // <--- ESTE ES EL VALOR QUE SE ENVÍA AL FORMULARIO
//         };
//     });

//     console.groupEnd();
//     return mapped;

// }, [masterTypifications]);

//   return {
//     masterTypifications,
//     getCodeById, // 👈 ESTA ES LA CLAVE PARA AUTOMATIZAR
//     fetchTypificationsByTypeElement,
//     getTypificationsByElement,
//     loading
//   };
// };



import { useState, useCallback, useEffect } from "react";
import {
  getAllTypifications,
  getTypificationOptionsByTipiInterno
} from "../services/typificationService";

export const useTypification = () => {
  const [loading, setLoading] = useState(false);
  const [masterTypifications, setMasterTypifications] = useState([]);

  // 1. Cargar TODAS las tipificaciones al iniciar (Diccionario Maestro)
  useEffect(() => {
    const loadMasterData = async () => {
      setLoading(true);
      try {
        const data = await getAllTypifications();
        if (data) setMasterTypifications(data);
      } catch (error) {
        console.error("Error cargando maestro de tipificaciones:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMasterData();
  }, []);

  // 2. Buscar el Código dado un ID Interno
  const getCodeById = useCallback((internalId) => {
    if (!masterTypifications.length || !internalId) return "";

    const match = masterTypifications.find(t =>
      String(t.tipiInterno) === String(internalId) ||
      String(t.typificationId) === String(internalId)
    );

    return match ? (match.code || match.tipiCodigo || "") : "";
  }, [masterTypifications]);

  // 3. Filtrar por Tabla
  const fetchTypificationsByTypeElement = useCallback((tableId) => {
    return masterTypifications
      .filter(t => t.tableID === tableId || t.TableId === tableId)
      .map(t => ({
        label: `${t.code} - ${t.typification}`,
        value: t.code
      }));
  }, [masterTypifications]);

  // 4. Filtrar por tipo de elemento
  const getTypificationsByElement = useCallback((elementType) => {
    if (!masterTypifications.length) {
      return [];
    }

    const filtered = masterTypifications.filter(t => {
      const tipoDb = (t.tipiTipoElemento || t.defiTipoElemento || "").toUpperCase();
      const tipoForm = (elementType || "").toUpperCase();
      return tipoDb === 'BOTH' || tipoDb === tipoForm;
    });

    return filtered.map(t => {
      const realId = Number(t.tipiInterno || t.typificationId);
      const code = t.code || t.tipiCodigo;

      return {
        label: `${code} - ${t.typification || t.tipiDescripcion}`,
        value: realId
      };
    });
  }, [masterTypifications]);

  // 5. Obtener opciones de tipificación por TIPI_Interno
  const fetchTypificationOptionsByTipiInterno = useCallback(async (tipiInterno) => {
    if (!tipiInterno || Number(tipiInterno) <= 0) return [];

    const data = await getTypificationOptionsByTipiInterno(tipiInterno);

    return (data ?? []).map(item => ({
      label: item.codopOpcion ?? item.CodopOpcion ?? "",
      value: Number(item.codopInterno ?? item.CodopInterno),
      col1: item.codopCol1 ?? item.CodopCol1 ?? "",
      col2: item.codopCol2 ?? item.CodopCol2 ?? ""
    }));
  }, []);

  return {
    masterTypifications,
    getCodeById,
    fetchTypificationsByTypeElement,
    getTypificationsByElement,
    fetchTypificationOptionsByTipiInterno,
    loading
  };
};