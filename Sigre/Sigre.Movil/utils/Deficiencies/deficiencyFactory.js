import { formatLocalISO, getUniqueNowMs } from "../dateUtils"; // ✅ agrega esto
import { DEFICIENCY_FIELD_MAP } from "./deficiencyFieldMap";

/**
 * Crea una deficiencia base según tipificación y elemento
 * - Usa timestamp LOCAL único (ms) para FechaCreacion/FecRegistro (como audio)
 */
export const createEmptyDeficiency = ({
  typificationId,
  typificationCode,
  tableId,
  elementId,
  typeElement,
  userId,
  selectedItem,
}) => {
  const fieldConfig =
    DEFICIENCY_FIELD_MAP?.[String(typificationCode)]?.fields ?? [];

  // ✅ timestamp único por creación (igual que audio)
  const capturedAtMs = getUniqueNowMs();
  const nowIso = formatLocalISO(capturedAtMs);

  // Inicializar SOLO campos dinámicos (no sistema)
  const dynamicFields = {};
  fieldConfig.forEach((f) => {
    if (
      [
        "DefiEstado",
        "DefiCodigoElemento",
        "DefiLatitud",
        "DefiLongitud",
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

    // Usuario / fechas (✅ usando el mismo stamp local único)
    DefiUsuarioInic: userId,
    DefiUsuarioMod: userId,
    DefiFechaCreacion: nowIso,
    DefiFecRegistro: nowIso,

    // Tipificación
    typificationId,
    typificationCode,

    // UUID (se setea al guardar si está null)
    DefiCol3: null,

    // Campos dinámicos (usuario)
    ...dynamicFields,
  };
};
