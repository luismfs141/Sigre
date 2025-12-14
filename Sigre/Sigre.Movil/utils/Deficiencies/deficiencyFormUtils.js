import { DEFICIENCY_FIELD_MAP } from "./deficiencyFieldMap";

export const getDeficiencyFields = typificationCode =>
  DEFICIENCY_FIELD_MAP?.[String(typificationCode)]?.fields ?? [];

export const getDeficiencyLabel = typificationCode =>
  DEFICIENCY_FIELD_MAP?.[String(typificationCode)]?.label ?? "Deficiencia";
