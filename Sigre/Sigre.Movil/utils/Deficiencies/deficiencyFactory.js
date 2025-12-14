import { DEFICIENCY_FIELD_MAP } from "./deficiencyFieldMap";

/**
 * Crea una deficiencia base según tipificación y elemento
 */
export const createEmptyDeficiency = ({
  typificationId,
  typificationCode,
  tableId,
  elementId,
  typeElement,
  userId
}) => {
  const fieldConfig =
    DEFICIENCY_FIELD_MAP?.[String(typificationCode)]?.fields ?? [];

  // Inicializar campos dinámicos
  const dynamicFields = {};
  fieldConfig.forEach(f => {
    if (f.type === "number") dynamicFields[f.key] = 0;
    else dynamicFields[f.key] = "";
  });

  return {
    DefiInterno: null,
    TipiInterno: typificationId,
    TablInterno: tableId,
    DefiTipoElemento: typeElement,
    DefiIdElemento: elementId,

    // Estados base
    DefiEstado: dynamicFields.DefiEstado || "N",
    DefiActivo: 1,
    DefiInspeccionado: 1,
    EstadoOffLine: 2,
    DefiEstadoCriticidad: dynamicFields.DefiEstadoCriticidad || 0,

    // Usuario / fechas
    DefiUsuarioInic: userId,
    DefiUsuarioMod: userId,
    DefiFechaCreacion: new Date().toISOString(),
    DefiFecRegistro: new Date().toISOString(),

    // Tipificación
    typificationId,
    typificationCode,

    // Campos dinámicos
    ...dynamicFields
  };
};
