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

  return {
    masterTypifications,
    getCodeById, // 👈 ESTA ES LA CLAVE PARA AUTOMATIZAR
    fetchTypificationsByTypeElement,
    loading
  };
};