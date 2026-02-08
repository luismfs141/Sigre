export const DEF_STD_COMMENT_BY_CODE = {
  6002: "Poste mal conservado",
  6004: "Inclinado/falla cimt",
  6006: "Portafus energ expos",
  6008: "Prot mec cable defic",
  6024: "Retenida mal estado",
  6026: "Past. AP inestab y/o roto",
  6028: "Artefacto AP suelto",

  7002: "Cond aisl deter/inad",
  7004: "Cond BT s/techo/met",
  7006: "Cond BT alt baja DS",
  7008: "Cond BT cerca grifo",
};

export const getStdCommentByCode = (code) => {
  const n = Number(code);
  return Number.isFinite(n) ? DEF_STD_COMMENT_BY_CODE[n] ?? null : null;
};

export const isStdCommentValue = (value) => {
  if (value == null) return false;
  const v = String(value);
  return Object.values(DEF_STD_COMMENT_BY_CODE).includes(v);
};
