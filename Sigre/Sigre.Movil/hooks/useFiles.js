// // hooks/useFiles.js
// import { useCallback } from "react";
// import {
//     getNextArchCodTablaLocal,
//     insertArchivoLocal,
// } from "../database/offlineDB/files";

// // Hook para trabajar con archivos (fotos / audios) OFFLINE
// export function useFiles() {
//   // Obtener el siguiente código de tabla para Archivos
//   const getNextArchCodTabla = useCallback(async () => {
//     return await getNextArchCodTablaLocal();
//   }, []);

//   // Insertar un registro en Archivos
//   const saveArchivoLocal = useCallback(async (data) => {
//     // data = { archTipo, archTabla, archCodTabla, archNombre, archLatit, archLong, archFech, archActiv? }
//     return await insertArchivoLocal(data);
//   }, []);

//   return {
//     getNextArchCodTabla,
//     saveArchivoLocal,
//   };
// }



// hooks/useFiles.js
import { useCallback } from "react";
import {
    getArchivosByBasePathLocal,
    getNextArchCodTablaLocal,
    insertArchivoLocal,
    markArchivoDeletedLocal,
} from "../database/offlineDB/files";

// Hook para trabajar con archivos (fotos / audios) OFFLINE
export function useFiles() {
  // Obtener el siguiente código de tabla para Archivos
  const getNextArchCodTabla = useCallback(async () => {
    return await getNextArchCodTablaLocal();
  }, []);

  // Insertar un registro en Archivos
  // data = { archTipo, archTabla, archCodTabla, archNombre, archLatit, archLong, archFech, archActiv? }
  const saveArchivoLocal = useCallback(async (data) => {
    return await insertArchivoLocal(data);
  }, []);

  // Leer archivos activos de una ruta base (prefijo de ArchNombre)
  // basePathPrefix = 'SIGRE/.../DEFxxxx/Fotos/' o 'SIGRE/.../DEFxxxx/Audios/'
  const getArchivosByBasePath = useCallback(async (basePathPrefix) => {
    return await getArchivosByBasePathLocal(basePathPrefix);
  }, []);

  // Marcar un archivo como borrado (ArchActivo = 0, ArchNombre = BORRADOS/...)
  const markArchivoAsDeleted = useCallback(
    async (archInterno, newRelativePath) => {
      return await markArchivoDeletedLocal(archInterno, newRelativePath);
    },
    []
  );

  return {
    getNextArchCodTabla,
    saveArchivoLocal,
    getArchivosByBasePath,
    markArchivoAsDeleted,
  };
}
