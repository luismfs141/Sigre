// Campos comunes a todas las deficiencias
const COMMON_DEFICIENCY_FIELDS = [
  {
    key: "DefiEstado",
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
    key: "DefiCodigoElemento",
    label: "Código",
    type: "text",
    required: false,
    readonly: true
  },
  {
    key: "DefiLatitud",
    label: "Latitud",
    type: "text",
    required: true,
    readonly: true,
    validation: { message: "La longitud es obligatoria" }
  },
  {
    key: "DefiLongitud",
    label: "Longitud",
    type: "text",
    required: true,
    readonly: true,
    validation: { message: "La longitud es obligatoria" }
  },
  {
    key: "DefiEstadoCriticidad",
    label: "Criticidad",
    type: "text",
    selectable: true,
    required: true,
    valueMap: {
      1: "Leve",
      2: "Moderado",
      3: "Grave"
    },
    validation: { message: "Seleccione una criticidad" }
  },
  {
    key: "DefiEstadoSubsanacion",
    label: "Estado Subsanación",
    type: "text",
    selectable: true,
    required: true,
    valueMap: {
      0: "Por Subsanar",
      1: "Subsanación Preventiva",
      2: "Subsanación definitiva"
    },
    validation: { message: "Seleccione un estado de subsanación" }
  },
  {
    key: "DefiObservacion",
    label: "Observación",
    type: "text",
    required: true,
    validation: { message: "La observación es obligatoria" }
  },
  {
    key: "DefiComentario",
    label: "Comentario",
    type: "textarea",
    required: false
  }
];

// Mapa de tipificaciones
export const DEFICIENCY_FIELD_MAP = {
  "0000": {
    label: "SIN DEFICIENCIA",
    fields: [
      {
        key: "DefiEstado",
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
        key: "DefiCodigoElemento",
        label: "Código",
        type: "text",
        required: false,
        readonly: true
      },
      {
        key: "DefiComentario",
        label: "Comentario",
        type: "textarea",
        required: false
      }
    ]
  },
  "6002": { label: "POSTE - DEF 6002", fields: [...COMMON_DEFICIENCY_FIELDS] },
  "6004": { label: "POSTE - DEF 6004", fields: [...COMMON_DEFICIENCY_FIELDS] },
  "6006": { label: "POSTE - DEF 6006", fields: [...COMMON_DEFICIENCY_FIELDS] },
  "6008": { label: "POSTE - DEF 6008", fields: [...COMMON_DEFICIENCY_FIELDS] },
  "6024": { label: "POSTE - DEF 6024", fields: [...COMMON_DEFICIENCY_FIELDS] },
  "6026": { label: "POSTE - DEF 6026", fields: [...COMMON_DEFICIENCY_FIELDS] },
  "6028": { label: "POSTE - DEF 6028", fields: [...COMMON_DEFICIENCY_FIELDS] },

  "7002": { label: "VANO - DEF 7002", fields: [...COMMON_DEFICIENCY_FIELDS] },
  "7004": { label: "VANO - DEF 7004", fields: [...COMMON_DEFICIENCY_FIELDS] },
  "7006": {
    label: "VANO - DEF 7006",
    fields: [
      ...COMMON_DEFICIENCY_FIELDS,
      {
        key: "DefiDistVertical",
        label: "Distancia Vertical (m)",
        type: "number",
        required: true,
        validation: {
          min: 0.5,
          max: 10,
          message: "La distancia vertical debe estar entre 0.5 y 10 metros"
        }
      }
    ]
  },
  "7008": {
    label: "VANO - DEF 7008",
    fields: [
      ...COMMON_DEFICIENCY_FIELDS,
      {
        key: "DefiDistHorizontal",
        label: "Distancia Horizontal (m)",
        type: "number",
        required: true,
        validation: {
          min: 1,
          max: 15,
          message: "La distancia horizontal debe estar entre 1 y 15 metros"
        }
      }
    ]
  }
};
