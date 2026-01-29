import { DEFICIENCY_FIELD_MAP } from "./deficiencyFormUtils"; // Tu archivo de configuración existente

// ==========================================
// 1. FÁBRICA DE OBJETOS (CREATE)
// ==========================================

/**
 * Crea una estructura de deficiencia vacía lista para enviar al backend.
 * Adapta la lógica móvil para usar tu DEFICIENCY_FIELD_MAP web.
 */
export const createEmptyDeficiency = ({
  typificationId,
  typificationCode, // Ej: "6002"
  elementCode,      // El código del poste/vano
  typeElement,      // "POST" o "VANO"
  userId,
  sedId
}) => {
  // Obtenemos campos dinámicos de tu configuración
  const fieldConfig = DEFICIENCY_FIELD_MAP?.[String(typificationCode)]?.fields ?? [];

  // Inicializar SOLO campos dinámicos definidos en el JSON
  const dynamicFields = {};
  
  fieldConfig.forEach(f => {
    // Saltamos campos que controla el sistema o el formulario base
    if (["DefiEstado", "DefiCodigoElemento", "DefiLatitud", "DefiLongitud", "DefiEstadoCriticidad"].includes(f.key)) {
      return;
    }
    // Inicialización por tipo
    if (f.type === "number") dynamicFields[f.key] = null;
    else dynamicFields[f.key] = "";
  });

  // Retornamos el objeto plano
  return {
    // Identificadores
    DefiInterno: 0, // 0 indica nuevo
    TipiInterno: Number(typificationId),
    DefiTipoElemento: typeElement,
    
    // Relación
    SedCodigo: sedId, // Adaptado a tu contexto web
    DefiCodigoElemento: elementCode || "",

    // Estados base (Reglas de Negocio)
    DefiEstado: "N",
    DefiActivo: true, // En web usamos booleanos true/false usualmente, o 1/0 según tu DB
    
    // Ubicación (Se llenará con el GPS del navegador)
    DefiLatitud: 0,
    DefiLongitud: 0,

    // Auditoría
    DefiUsuarioInic: userId,
    DefiUsuarioMod: userId,
    DefiFechaCreacion: new Date().toISOString(),
    DefiFecRegistro: new Date().toISOString(),

    // Campos dinámicos poblados vacíos
    ...dynamicFields
  };
};

// ==========================================
// 2. HELPERS DE VISUALIZACIÓN
// ==========================================

export const getElementNameFromType = (type) => {
  const types = {
    0: "Vano",
    1: "Subestación MonoPoste",
    2: "Subestación Biposte",
    3: "Subestación en Caseta",
    4: "Subestación Privada",
    5: "Poste",
    6: "Equipo de protección",
    9: "Subestación Subterránea"
  };
  return types[type] ?? "Desconocido";
};

// Mapea el tipo de pin a la tabla de base de datos correspondiente (útil para el backend)
export const getTableFromByPinType = (type) => {
  const map = {
    0: { id: 3, name: 'VANO' },
    1: { id: 2, name: "SED" },
    2: { id: 2, name: "SED" },
    3: { id: 4, name: "SED" },
    4: { id: 2, name: "SED" },
    5: { id: 1, name: "POST" },
    8: { id: 5, name: "SED" },
  };
  return map[type] ?? { id: 0, name: "" };
};

// ==========================================
// 3. VALIDACIONES DE NEGOCIO (UPDATE/SAVE)
// ==========================================

/**
 * Valida reglas de negocio complejas antes de guardar.
 * Retorna un string con el error o cadena vacía si todo está OK.
 */
export const validateBusinessRules = (deficiency, selectedDeficiency) => {
  // Regla 1: Degradación de estado (Si ya estaba subsanada definitiva (2), no puede volver atrás)
  if (selectedDeficiency?.defiEstado === 'S' && 
      String(selectedDeficiency.defiEstadoSubsanacion) === '2' && 
      String(deficiency.DefiEstadoSubsanacion) !== '2') {
      return "No se puede degradar una deficiencia subsanada definitivamente.";
  }

  // Regla 2: Validación obligatoria de distancias para ciertos IDs de tipificación
  // (Estos son los IDs mágicos que tenías en el móvil, idealmente deberían venir del backend flags)
  const TYPES_REQUIRING_DISTANCES = [4, 5, 18, 19, 35, 36, 37, 38, 41, 42];
  
  if (TYPES_REQUIRING_DISTANCES.includes(Number(deficiency.TipiInterno))) {
    const h = deficiency.DefiDistHorizontal;
    const v = deficiency.DefiDistVertical;
    
    // Verificamos si son nulos o vacíos
    if (h === null || h === "" || v === null || v === "") {
      return "Para esta tipificación, las Distancias Horizontal y Vertical son obligatorias.";
    }
  }

  return ""; // Todo OK
};

// ==========================================
// 4. UTILIDADES DE FECHA
// ==========================================

export const nowPeruISO = () => {
  // En Web, new Date() usa la zona horaria del navegador del usuario.
  // Si tus usuarios están en Perú, esto basta. 
  // Si quieres forzar formato local ISO sin UTC:
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};