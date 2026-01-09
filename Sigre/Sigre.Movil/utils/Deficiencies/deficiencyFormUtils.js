import { DEFICIENCY_FIELD_MAP } from "./deficiencyFieldMap";

export const getDeficiencyFields = typificationCode =>
  DEFICIENCY_FIELD_MAP?.[String(typificationCode)]?.fields ?? [];


// const build7006VerticalValidation = (tipoCruce) => {
//   const tipo = Number(tipoCruce);
//   if (tipo === 1) {
//     return {
//       min: 5.5,
//       max: 20,
//       message: "Para Calle, la distancia vertical debe ser mayor o igual a 5.50 m."
//     };
//   }
//   if (tipo === 2) {
//     return {
//       min: 6.5,
//       max: 20,
//       message: "Para Avenida, la distancia vertical debe ser mayor o igual a 6.50 m."
//     };
//   }
//   if (tipo === 3) {
//     return {
//       min: 7.5,
//       max: 20,
//       message: "Para Cruce de trenes, la distancia vertical debe ser mayor o igual a 7.50 m."
//     };
//   }
//   // si aún no selecciona tipo de cruce
//   return {
//     min: 0,
//     max: 20,
//     message: "Seleccione primero el tipo de cruce."
//   };
// };
// export const getDeficiencyFields = (typificationCode, values = {}) => {
//   const code = String(typificationCode);
//   const base = DEFICIENCY_FIELD_MAP?.[code]?.fields ?? [];
//   // Solo aplica a 7006
//   if (code !== "7006") return base;
//   const validation = build7006VerticalValidation(values?.DefiCol1);
//   // ⚠️ IMPORTANTE: devolvemos un NUEVO array y un NUEVO field (no mutar el original)
//   return base.map(f => {
//     if (f.key !== "DefiDistVertical") return f;
//     return {
//       ...f,
//       validation
//     };
//   });
// };

//------------------------------------


export const getDeficiencyLabel = typificationCode =>
  DEFICIENCY_FIELD_MAP?.[String(typificationCode)]?.label ?? "Deficiencia";
