export const isPhotoArchTipo = (archTipo) => {
  const n = Number(archTipo);
  return Number.isFinite(n) && n >= 1 && n <= 6;
};
