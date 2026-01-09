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

// Orden de campos en 7006: insertar después de Estado Subsanación
const idxSub = COMMON_BEFORE_OBSERVACION.findIndex(f => f.key === "DefiEstadoSubsanacion");

const COMMON_BEFOREOBS_UNTIL_SUBSANACION =
  idxSub >= 0 ? COMMON_BEFORE_OBSERVACION.slice(0, idxSub + 1) : [...COMMON_BEFORE_OBSERVACION];

const COMMON_BEFOREOBS_AFTER_SUBSANACION =
  idxSub >= 0 ? COMMON_BEFORE_OBSERVACION.slice(idxSub + 1) : [];





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
              if (v < 3) return "Si es Accesible, la distancia vertical debe ser mayor o igual a 3.00 m.";
              return null;
            }

            // No accesible: 1.80 <= v < 3.00
            if (v < 1.8 || v >= 3) {
              return "Si es No accesible, la distancia vertical debe estar entre 1.80 m y menor a 3.00 m.";
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
      ...COMMON_BEFOREOBS_UNTIL_SUBSANACION, // ✅ hasta Estado Subsanación (incluido)

      // ✅ Tipo de cruce (va después de Estado Subsanación)
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

      // lo que venga después de subsanación (si algún día agregas otro campo antes de Observación)
      ...COMMON_BEFOREOBS_AFTER_SUBSANACION,

      // ✅ Distancia vertical (depende del tipo de cruce)
      // {
      //   key: "DefiDistVertical",
      //   label: "Distancia Vertical (m)",
      //   type: "number",
      //   required: true,
      //   validation: {
      //     min: 5.5,   // base (luego lo sobreescribimos dinámicamente)
      //     max: 20,
      //     message: "Revise el tipo de cruce para el mínimo requerido."
      //   }
      // },

      // ✅ Distancia vertical (depende del tipo de cruce)
      {
        key: "DefiDistVertical",
        label: "Distancia Vertical (m)",
        type: "number",
        required: true,
        validation: {
          custom: (value, values) => {
            console.log("🧪 custom DistVertical ejecutado", { value, tipo: values?.DefiCol1 });
            const v = Number(value);
            const tipo = Number(values?.DefiCol1); // 1=Calle, 2=Avenida, 3=Cruce de trenes

            if (!Number.isFinite(v)) return "Ingrese un número válido en distancia vertical.";
            if (![1, 2, 3].includes(tipo)) return "Seleccione primero el tipo de cruce.";

            const minByTipo = { 1: 5.5, 2: 6.5, 3: 7.5 };
            const min = minByTipo[tipo];

            if (v < min) {
              const tipoTxt = tipo === 1 ? "Calle" : tipo === 2 ? "Avenida" : "Cruce de trenes";
              return `Para ${tipoTxt}, la distancia vertical debe ser mayor o igual a ${min.toFixed(2)} m.`;
            }

            if (v > 20) return "La distancia vertical no debe exceder 20.00 m.";
            return null;
          }
        }
      },

      ...COMMON_FROM_OBSERVACION // ✅ Observación y Comentario al final
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


