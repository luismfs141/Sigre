// =============================================================================
// 1. CAMPOS COMUNES (Keys estandarizadas con Backend: camelCase)
// =============================================================================
export const COMMON_DEFICIENCY_FIELDS = [
  {
    key: "defiEstado",
    label: "Estado",
    type: "text",
    required: false,
    readonly: true,
    valueMap: {
      N: "Nueva Deficiencia",
      O: "Sin deficiencia",
      S: "Deficiencia SEAL"
    }
  },
  {
    key: "defiCodigoElemento",
    label: "Código",
    type: "text",
    required: false,
    readonly: true,
    hidden: true 
  },
  {
    key: "defiLatitud",
    label: "Latitud",
    type: "text",
    required: true,
    readonly: true,
    hidden: true,
    validation: { message: "La latitud es obligatoria" }
  },
  {
    key: "defiLongitud",
    label: "Longitud",
    type: "text",
    required: true,
    readonly: true,
    hidden: true,
    validation: { message: "La longitud es obligatoria" }
  },
  {
    key: "defiEstadoCriticidad",
    label: "Criticidad",
    type: "text",
    selectable: true,
    required: true,
    valueMap: {
      1: "Leve",
      2: "Moderado",
      3: "Crítico"
    },
    validation: { message: "Seleccione una criticidad" }
  },
  {
    key: "defiNumSuministro",
    label: "Número de suministro",
    type: "text",
    required: true,
    keyboardType: "numeric",
    noSpaces: true,
    onlyDigits: true, 
    validation: {
      custom: (value) => {
        const s = String(value ?? "").trim();
        if (!s) return "El número de suministro es obligatorio.";
        if (!/^\d+$/.test(s)) return "El número de suministro debe contener solo dígitos.";
        return null;
      }
    }
  },
  {
    key: "defiObservacion",
    label: "Observación",
    type: "text",
    required: true,
    maxChars: 20,
    showMaxError: true,
    showCounter: true,
    validation: {
      custom: (value) => {
        const s = String(value ?? "");
        if (!s.trim()) return "La observación es obligatoria.";
        if (s.length > 20) return "La observación no puede exceder 20 caracteres.";
        return null;
      }
    }
  },
  {
    key: "defiComentario",
    label: "Comentario",
    type: "textarea",
    required: false,
    placeholder: "Comentarios o notas..."
  },
  {
    key: "defiInspeccionado",
    label: "Inspeccionado",
    type: "number",
    required: false,
    readonly: true,
    hidden: true 
  },
];

// =============================================================================
// 2. LÓGICA DE ORDENAMIENTO (Slicing) - ACTUALIZADO
// =============================================================================

const idxObs = COMMON_DEFICIENCY_FIELDS.findIndex(f => f.key === "defiObservacion");
const COMMON_BEFORE_OBSERVACION = idxObs >= 0 ? COMMON_DEFICIENCY_FIELDS.slice(0, idxObs) : [...COMMON_DEFICIENCY_FIELDS];
const COMMON_FROM_OBSERVACION = idxObs >= 0 ? COMMON_DEFICIENCY_FIELDS.slice(idxObs) : [];

const idxSum = COMMON_BEFORE_OBSERVACION.findIndex(f => f.key === "defiNumSuministro");
const COMMON_BEFOREOBS_UNTIL_SUMINISTRO = idxSum >= 0 ? COMMON_BEFORE_OBSERVACION.slice(0, idxSum + 1) : [...COMMON_BEFORE_OBSERVACION];
const COMMON_BEFOREOBS_AFTER_SUMINISTRO = idxSum >= 0 ? COMMON_BEFORE_OBSERVACION.slice(idxSum + 1) : [];

// =============================================================================
// 3. MAPA DE CONFIGURACIÓN POR CÓDIGO
// =============================================================================
export const DEFICIENCY_FIELD_MAP = {
  "0": {
    label: "SIN DEFICIENCIA",
    fields: [
      { key: "defiEstado", label: "Estado", type: "text", readonly: true, valueMap: { N: "Nueva", O: "Sin deficiencia", S: "SEAL" } },
      { key: "defiCodigoElemento", label: "Código", type: "text", readonly: true },
      { key: "defiComentario", label: "Comentario", type: "textarea" }
    ]
  },

  // --- POSTES ---
  "6002": { label: "POSTE - POSTE EN MAL ESTADO DE CONSERVACIÓN O INAPROPIADO PARA LA FUNCIÓN DE APOYO ", fields: [...COMMON_DEFICIENCY_FIELDS] },
  "6004": { label: "POSTE - POSTE INCLINADO MÁS DE 5° O CON DEFICIENCIAS EN LA CIMENTACIÓN.", fields: [...COMMON_DEFICIENCY_FIELDS] },
  "6006": { label: "POSTE - CAJA PORTAFUSIBLE DE POSTE CON PARTES ENERGIZADAS EXPUESTAS Y ACCESIBLES.", fields: [...COMMON_DEFICIENCY_FIELDS] },
  "6008": { label: "POSTE - PROTECCIÓN MECÁNICA DE CABLE ROTA, INEXISTENTE, INSUFICIENTE O MATERIAL INAPROPIADO.", fields: [...COMMON_DEFICIENCY_FIELDS] },
  "6024": { label: "POSTE - RETENIDA EN MAL ESTADO.", fields: [...COMMON_DEFICIENCY_FIELDS] },
  "6026": { label: "POSTE - PASTORAL DE AP EN MAL ESTADO O POR DESPRENDERSE.", fields: [...COMMON_DEFICIENCY_FIELDS] },
  "6028": { label: "POSTE - ARTEFACTO DE AP DESPRENDIDO O POR DESPRENDERSE.", fields: [...COMMON_DEFICIENCY_FIELDS] },

  // --- VANOS ---
  "7002": { label: "VANO - CONDUCTOR DESNUDO, FORRADO O AISLADO CON AISLAMIENTO DETERIORADO O INADECUADO.", fields: [...COMMON_DEFICIENCY_FIELDS] },
  
 "7004": {
    label: "VANO - CONDUCTOR DE BAJA TENSIÓN SOBRE EDIFICACIÓN O EN CONTACTO CON TECHO O SOPORTE METÁLICO.",
    fields: [
      ...COMMON_BEFORE_OBSERVACION,
      {
        key: "defiDistHorizontal",
        label: "Distancia Horizontal (m)",
        type: "number",
        required: true,
        // AGREGADO: Texto de ayuda visual
        helperText: "(Máx: 2.50m)", 
        validation: {
          max: 2.5,
          message: "Valores mayores a 2.5m no suelen ser deficiencia horizontal."
        }
      },
      {
        key: "defiAccesibilidad",
        label: "Accesibilidad*",
        type: "text",
        selectable: true,
        required: true,
        valueMap: {
          1: "Accesible (Balcones/Techos)",
          2: "No accesible (Paredes ciegas)"
        },
        validation: { message: "Seleccione el nivel de accesibilidad" }
      },
      {
        key: "defiDistVertical",
        label: "Distancia Vertical (m)",
        type: "number",
        required: true,
        // AGREGADO: Resumen de la regla de negocio
        helperText: "(Accesible < 3.0m | No Acc. < 1.8m)",
        validation: {
          custom: (value, formData) => {
            const v = Number(value);
            const acc = Number(formData?.defiAccesibilidad); 

            if (!Number.isFinite(v)) return "Ingrese una distancia válida.";
            if (![1, 2].includes(acc)) return "Seleccione primero la Accesibilidad.";

            if (acc === 1 && v >= 3.0) return "Si es Accesible, la distancia debe ser < 3.00 m.";
            if (acc === 2 && v >= 1.8) return "Si es No accesible, la distancia debe ser < 1.80 m.";
            return null;
          }
        }
      },
      ...COMMON_FROM_OBSERVACION
    ]
  },

  "7006": {
    label: "VANO - CONDUCTOR INCUMPLE DS RESPECTO AL NIVEL DE TERRENO.",
    fields: [
      ...COMMON_BEFOREOBS_UNTIL_SUMINISTRO,
      {
        key: "defiTipoCruce",
        label: "Tipo de cruce*",
        type: "text",
        selectable: true,
        required: true,
        valueMap: {
          1: "Calle / Camino",
          2: "Avenida / Carretera",
          3: "Vía Férrea (Tren)",
          4: "Longitudinal a Vía (1 piso)",
          5: "Longitudinal a Vía (Cochera)"
        },
        validation: { message: "Seleccione el tipo de cruce" }
      },
      ...COMMON_BEFOREOBS_AFTER_SUMINISTRO,
      {
        key: "defiDistVertical",
        label: "Altura medida (m)*",
        type: "number",
        required: true,
        // AGREGADO: Tabla resumida de límites
        helperText: "(Calle <5.5 | Av <6.5 | Tren <7.5)", 
        validation: {
          custom: (value, formData) => {
            const v = Number(value);
            const tipo = Number(formData?.defiTipoCruce);
            if (!Number.isFinite(v)) return "Ingrese la altura medida.";
            
            const limitesSeguridad = { 1: 5.5, 2: 6.5, 3: 7.5, 4: 4.0, 5: 5.5 };

            if (!limitesSeguridad[tipo]) return "Seleccione primero el tipo de cruce.";

            if (v >= limitesSeguridad[tipo]) {
               // ... tu lógica de retorno de mensaje ...
               const labelMap = { 1: "Calle", 2: "Avenida", 3: "Vía Férrea", 4: "Longitudinal", 5: "Longitudinal Cochera" };
               return `Para ${labelMap[tipo]}, la altura debe ser MENOR a ${limitesSeguridad[tipo].toFixed(2)}m.`;
            }
            return null;
          }
        }
      },
      ...COMMON_FROM_OBSERVACION
    ]
  },

  "7008": {
    label: "VANO - CONDUCTOR INCUMPLE DS RESPECTO A GRIFO.",
    fields: [
      ...COMMON_BEFORE_OBSERVACION,
      {
        key: "defiDistHorizontal",
        label: "Distancia Horizontal (m)",
        type: "number",
        required: true,
        // AGREGADO: Restricción visual
        helperText: "(Debe ser < 7.50m)",
        validation: {
          custom: (value) => {
             const v = Number(value);
             if (v >= 7.5) return "La distancia debe ser menor a 7.5m para esta deficiencia.";
             return null;
          }
        }
      },
      ...COMMON_FROM_OBSERVACION
    ]
  }
};
export const ALL_DEFICIENCY_OPTIONS = [
    { code: "0", name: "SIN DEFICIENCIA", type: "BOTH" },
    { code: "6002", name: "6002 - POSTE EN MAL ESTADO DE CONSERVACIÓN O INAPROPIADO PARA LA FUNCIÓN DE APOYO", type: "POST" },
    { code: "6004", name: "6004 - POSTE INCLINADO MÁS DE 5° O CON DEFICIENCIAS EN LA CIMENTACIÓN", type: "POST" },
    { code: "6006", name: "6006 - CAJA PORTAFUSIBLE DE POSTE CON PARTES ENERGIZADAS EXPUESTAS Y ACCESIBLES", type: "POST" },
    { code: "6008", name: "6008 - PROTECCIÓN MECÁNICA DE CABLE ROTA, INEXISTENTE, INSUFICIENTE O MATERIAL INAPROPIADO", type: "POST" },
    { code: "6024", name: "6024 - RETENIDA EN MAL ESTADO", type: "POST" },
    { code: "6026", name: "6026 - PASTORAL DE AP EN MAL ESTADO O POR DESPRENDERSE", type: "POST" },
    { code: "6028", name: "6028 - ARTEFACTO DE AP DESPRENDIDO O POR DESPRENDERSE", type: "POST" },
    { code: "7002", name: "7002 - CONDUCTOR DESNUDO, FORRADO O AISLADO CON AISLAMIENTO DETERIORADO O INADECUADO", type: "VANO" },
    { code: "7004", name: "7004 - CONDUCTOR DE BAJA TENSIÓN SOBRE EDIFICACIÓN O EN CONTACTO CON TECHO O SOPORTE METÁLICO", type: "VANO" },
    { code: "7006", name: "7006 - CONDUCTOR INCUMPLE DS RESPECTO AL NIVEL DE TERRENO", type: "VANO" },
    { code: "7008", name: "7008 - CONDUCTOR INCUMPLE DS RESPECTO A GRIFO", type: "VANO" }
];


export default DEFICIENCY_FIELD_MAP;