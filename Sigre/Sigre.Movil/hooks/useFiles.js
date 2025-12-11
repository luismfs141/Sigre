// hooks/useFiles.js
import { useCallback } from "react";
import {
    getNextArchCodTablaLocal,
    insertArchivoLocal,
} from "../database/offlineDB/files";

// Hook para trabajar con archivos (fotos / audios) OFFLINE
export function useFiles() {
  // Obtener el siguiente código de tabla para Archivos
  const getNextArchCodTabla = useCallback(async () => {
    return await getNextArchCodTablaLocal();
  }, []);

  // Insertar un registro en Archivos
  const saveArchivoLocal = useCallback(async (data) => {
    // data = { archTipo, archTabla, archCodTabla, archNombre, archLatit, archLong, archFech, archActiv? }
    return await insertArchivoLocal(data);
  }, []);

  return {
    getNextArchCodTabla,
    saveArchivoLocal,
  };
}
