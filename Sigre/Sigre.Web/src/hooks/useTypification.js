import { useState, useCallback, useEffect } from "react";
import { getAllTypifications } from "../services/typificationService";

export const useTypification = () => {
  const [loading, setLoading] = useState(false);
  const [masterTypifications, setMasterTypifications] = useState([]);

  // 1. Cargar TODAS las tipificaciones al iniciar (Diccionario Maestro)
  useEffect(() => {
    const loadMasterData = async () => {
      setLoading(true);
      try {
        const data = await getAllTypifications();
        if(data) setMasterTypifications(data);
      } catch (error) {
        console.error("Error cargando maestro de tipificaciones:", error);
      } finally {
        setLoading(false);
      }
    };
    loadMasterData();
  }, []);

  // 2. Función para buscar el Código (ej: "6002") dado un ID Interno (ej: 52)
  const getCodeById = useCallback((internalId) => {
    if (!masterTypifications.length || !internalId) return "";
    
    // Buscamos en el array maestro
    // Nota: Revisa si tu API devuelve 'typificationId' o 'TypificationId' (Mayúsculas importan)
    const match = masterTypifications.find(t => 
        t.typificationId === internalId || t.TypificationId === internalId
    );
    
    return match ? match.code : ""; // Retorna "6002" o vacío si no encuentra
  }, [masterTypifications]);

  // 3. Función para filtrar por Tabla (Poste/Vano) para el Dropdown manual
  const fetchTypificationsByTypeElement = useCallback((tableId) => {
    return masterTypifications
        .filter(t => t.tableID === tableId || t.TableId === tableId)
        .map(t => ({
            label: `${t.code} - ${t.typification}`,
            value: t.code // Usamos el código como valor
        }));
  }, [masterTypifications]);

  const getTypificationsByElement = useCallback((elementType) => {
    if (!masterTypifications.length) return [];

    // A. FILTRADO
    const filtered = elementType 
        ? masterTypifications.filter(t => 
            // Asegúrate de que tu BD usa 'POST', 'VANO', etc. en esta columna
            t.tipiTipoElemento === elementType || t.defiTipoElemento === elementType
          )
        : masterTypifications;

    // B. MAPEO
    return filtered.map(t => ({
        // Label: Lo que ve el humano ("6002 - Poste Roto")
        label: `${t.tipiCodigo || t.code} - ${t.tipiDescripcion || t.typification}`,
        
        // Value: Lo que guarda la BD (EL ID INTERNO)
        // ❌ INCORRECTO: value: t.code 
        // ✅ CORRECTO: 
        value: Number(t.tipiInterno || t.typificationId) 
    }));
  }, [masterTypifications]);

  return {
    masterTypifications,
    getCodeById, // 👈 ESTA ES LA CLAVE PARA AUTOMATIZAR
    fetchTypificationsByTypeElement,
    getTypificationsByElement,
    loading
  };
};