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
      0: "Por subsanar",
      1: "Subsanación Preventiva",
      2: "Subsanación definitiva"
    },
    validation: { message: "Seleccione un estado de subsanación" }
  },
  {
    key: "DefiNumSuministro",
    label: "Número de suministro",
    type: "text",
    required: true,
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

//Orden de campos en 7004
const idxObs = COMMON_DEFICIENCY_FIELDS.findIndex(f => f.key === "DefiObservacion");

const COMMON_BEFORE_OBSERVACION =
  idxObs >= 0 ? COMMON_DEFICIENCY_FIELDS.slice(0, idxObs) : [...COMMON_DEFICIENCY_FIELDS];

const COMMON_FROM_OBSERVACION =
  idxObs >= 0 ? COMMON_DEFICIENCY_FIELDS.slice(idxObs) : [];

// ✅ Orden de campos en 7006: insertar después de NumSuministro (para que quede pegado a Subsanación)
const idxSum = COMMON_BEFORE_OBSERVACION.findIndex(f => f.key === "DefiNumSuministro");

const COMMON_BEFOREOBS_UNTIL_SUMINISTRO =
  idxSum >= 0 ? COMMON_BEFORE_OBSERVACION.slice(0, idxSum + 1) : [...COMMON_BEFORE_OBSERVACION];

const COMMON_BEFOREOBS_AFTER_SUMINISTRO =
  idxSum >= 0 ? COMMON_BEFORE_OBSERVACION.slice(idxSum + 1) : [];







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
  "7004": {
    label: "VANO - DEF 7004",
    fields: [
      ...COMMON_BEFORE_OBSERVACION,


      {
        key: "DefiDistHorizontal",
        label: "Distancia Horizontal (m)",
        type: "number",
        required: true,
        validation: {
          min: 0.0001,
          max: 1,
          message: "La distancia horizontal debe ser:\n - Mayor a 0 metros y\n - Menor o igual a 1 metro."
        }
      },
      // ✅ NUEVO LISTBOX / PICKER
      {
        key: "DefiAccesibilidad",
        label: "Accesibilidad para Distancia Vertical*",
        type: "text",
        selectable: true,
        required: true,
        valueMap: {
          1: "Accesible",
          2: "No accesible"
        },
        validation: { message: "Seleccione Accesible o No accesible" }
      },
      // ✅ DISTANCIA VERTICAL con validación CONDICIONAL
      {
        key: "DefiDistVertical",
        label: "Distancia Vertical (m)",
        type: "number",
        required: true,
        validation: {
          custom: (value, values) => {
            const v = Number(value);
            const acc = Number(values?.DefiAccesibilidad); // 1=Accesible, 2=No accesible

            if (!Number.isFinite(v)) return "Ingrese un número válido en distancia vertical.";
            if (![1, 2].includes(acc)) return "Seleccione Accesible o No accesible.";

            if (acc === 1) {
              // Accesible: v >= 3
              if (v > 3) return "Si es Accesible, la distancia vertical debe ser menor a 3.00 m.";
              return null;
            }

            // No accesible: 1.80 <= v < 3.00
            if (v > 1.8) {
              return "Si es No accesible, la distancia vertical debe ser menor a 1.80 m.";
            }
            return null;
          }
        }
      },

      ...COMMON_FROM_OBSERVACION
    ]
  },


  "7006": {
  label: "VANO - DEF 7006",
  fields: [
    // ✅ hasta NumSuministro (incluye Subsanación + NumSuministro inmediatamente después)
    ...COMMON_BEFOREOBS_UNTIL_SUMINISTRO,

    // ✅ Tipo de cruce (va después de NumSuministro)
    {
      key: "DefiCol1",
      label: "Tipo de cruce*",
      type: "text",
      selectable: true,
      required: true,
      valueMap: {
        1: "Calle",
        2: "Avenida",
        3: "Cruce de trenes"
      },
      validation: { message: "Seleccione el tipo de cruce" }
    },

    // ✅ lo que quedaba antes de Observación (si algún día agregas algo más)
    ...COMMON_BEFOREOBS_AFTER_SUMINISTRO,

    // ✅ Distancia vertical depende de tipo de cruce
    {
      key: "DefiDistVertical",
      label: "Distancia Vertical (m)",
      type: "number",
      required: true,
      validation: {
        custom: (value, values) => {
          const v = Number(value);
          const tipo = Number(values?.DefiCol1);

          if (!Number.isFinite(v)) return "Ingrese un número válido en distancia vertical.";
          if (![1, 2, 3].includes(tipo)) return "Seleccione primero el tipo de cruce.";

          const maxByTipo = { 1: 5.5, 2: 6.5, 3: 7.5 };
          const max = maxByTipo[tipo];

          if (v > max) {
            const tipoTxt = tipo === 1 ? "Calle" : tipo === 2 ? "Avenida" : "Cruce de trenes";
            return `Para ${tipoTxt}, la distancia vertical debe ser mayor o igual a ${max.toFixed(2)} m.`;
          }

          return null;
        }
      }
    },

    // ✅ Observación y Comentario al final
    ...COMMON_FROM_OBSERVACION
  ]
},











  "7008": {
    label: "VANO - DEF 7008",
    fields: [
      ...COMMON_BEFORE_OBSERVACION,
      {
        key: "DefiDistHorizontal",
        label: "Distancia Horizontal (m)",
        type: "number",
        required: true,
        validation: {
          min: 7.5,

          message: "La distancia horizontal mínima es de 7.5 metros"
        }
      },
      ...COMMON_FROM_OBSERVACION
    ]
  }



};


