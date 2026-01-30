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
  userId,
  selectedItem
}) => {
  const fieldConfig =
    DEFICIENCY_FIELD_MAP?.[String(typificationCode)]?.fields ?? [];

  // Inicializar SOLO campos dinámicos (no sistema)
  const dynamicFields = {};
  fieldConfig.forEach(f => {
    // Excluir campos controlados por el sistema
    if (
      [
        "DefiEstado",
        "DefiCodigoElemento",
        "DefiLatitud",
        "DefiLongitud"
      ].includes(f.key)
    ) {
      return;
    }

    if (f.type === "number") dynamicFields[f.key] = null;
    else dynamicFields[f.key] = "";
  });

  return {
    // Identificadores
    DefiInterno: 0,
    TipiInterno: typificationId,
    TablInterno: tableId,
    DefiTipoElemento: typeElement,
    DefiIdElemento: elementId,

    // Código del elemento (POST / VANO)
    DefiCodigoElemento:
      typeElement === "POST"
        ? selectedItem?.PostCodigoNodo ?? ""
        : selectedItem?.VanoCodigo ?? "",

    // Estados base (sistema)
    DefiEstado: "N",
    DefiActivo: 1,
    DefiInspeccionado: 0,
    EstadoOffLine: 2,

    // Criticidad por defecto
    DefiEstadoCriticidad: 0,

    // Ubicación (vacío real → permite autogeneración)
    DefiLatitud: null,
    DefiLongitud: null,

    // Usuario / fechas
    DefiUsuarioInic: userId,
    DefiUsuarioMod: userId,
    DefiFechaCreacion: new Date().toISOString(),
    DefiFecRegistro: new Date().toISOString(),

    // Tipificación
    typificationId,
    typificationCode,
    DefiCol3: null,

    // Campos dinámicos (usuario)
    ...dynamicFields
  };
};
