// utils/map/mapUtils.js

// ---------------- CONFIG ----------------
export const ZOOM_THRESHOLD = 0.003;

// Tamaños
export const ICON_SIZES = {
  DEFAULT: 24,
  SED: 32,
};

const LABEL_GAP = 16;

// ---------------- TYPES ----------------
export const isSedType = (type) => Number(type) === 1 || Number(type) === 2;
export const isPostType = (type) => Number(type) === 5;

export const getIconSizeByType = (type) =>
  isSedType(type) ? ICON_SIZES.SED : ICON_SIZES.DEFAULT;



// ---------------- TEXT ----------------
export const formatLabel = (label) =>
  label?.replace(/\r?\n|\r/g, " - ").trim() || "";

export const getCleanLabel = (pin) => {
  const raw = pin?.Label || pin?.ElementCode || "";
  if (!raw) return "";
  return String(raw).split("\n")[0].trim();
};

// ---------------- REGION / FILTER ----------------
export const getPinsVisibleInRegion = (pinsArray, reg) => {
  if (!Array.isArray(pinsArray)) return [];
  if (!reg) return pinsArray;

  // misma regla que useMap.getPinsByRegion
  if (reg.latitudeDelta > 0.008) return [];

  const { latitude, longitude, latitudeDelta, longitudeDelta } = reg;

  const minLat = latitude - latitudeDelta * 0.6;
  const maxLat = latitude + latitudeDelta * 0.6;
  const minLng = longitude - longitudeDelta * 0.6;
  const maxLng = longitude + longitudeDelta * 0.6;

  return pinsArray.filter(
    (p) =>
      Number(p.Latitude) >= minLat &&
      Number(p.Latitude) <= maxLat &&
      Number(p.Longitude) >= minLng &&
      Number(p.Longitude) <= maxLng,
  );
};

export const centerMap = (mapRef, lat, lng, opts = {}) => {
  const _lat = Number(lat);
  const _lng = Number(lng);
  if (!Number.isFinite(_lat) || !Number.isFinite(_lng)) return;

  const {
    latitudeDelta = 0.0005,
    longitudeDelta = 0.0005,
    duration = 800,
  } = opts;

  mapRef?.current?.animateToRegion(
    { latitude: _lat, longitude: _lng, latitudeDelta, longitudeDelta },
    duration,
  );
};

// ---------------- GAPS OVERLAP ----------------
export const areCoordsEqual = (a, b, tolerance = 0.00001) => {
  return Math.abs(Number(a) - Number(b)) <= tolerance;
};

export const findOverlappedGaps = (gap, allGaps) => {
  if (!gap || !Array.isArray(allGaps)) return [];
  return allGaps.filter(
    (g) =>
      areCoordsEqual(g.VanoLatitudIni, gap.VanoLatitudIni) &&
      areCoordsEqual(g.VanoLongitudIni, gap.VanoLongitudIni) &&
      areCoordsEqual(g.VanoLatitudFin, gap.VanoLatitudFin) &&
      areCoordsEqual(g.VanoLongitudFin, gap.VanoLongitudFin),
  );
};

// ---------------- SEARCH ----------------
export const normalizeText = (s) =>
  String(s ?? "")
    .replace(/\r?\n|\r/g, " ")
    .trim()
    .toLowerCase();

export const scoreText = (text, query) => {
  if (!text || !query) return 0;
  if (text === query) return 100;
  if (text.startsWith(query)) return 80;
  if (text.includes(query)) return 60;
  return 0;
};

export const buildSearchResults = (queryRaw, pinsUniverse, gapsUniverse) => {
  const query = normalizeText(queryRaw);
  if (!query) return [];

  const currentPins = Array.isArray(pinsUniverse) ? pinsUniverse : [];
  const currentGaps = Array.isArray(gapsUniverse) ? gapsUniverse : [];

  const pinResults = currentPins
    .map((pin, idx) => {
      const code = normalizeText(pin?.ElementCode);
      const label = normalizeText(pin?.Label);

      const sc = Math.max(scoreText(code, query), scoreText(label, query));
      if (sc <= 0) return null;

      const t = Number(pin?.Type);
      const subKind = t === 5 ? "Poste" : isSedType(t) ? "SED" : "Pin";

      const lat = Number(pin?.Latitude);
      const lng = Number(pin?.Longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

      const keyBase = pin?.Id ?? pin?.IdOriginal ?? pin?.ElementCode ?? idx;

      return {
        key: `PIN_${keyBase}`,
        kind: "PIN",
        subKind,
        code: pin?.ElementCode ?? "",
        label: pin?.Label ?? "",
        lat,
        lng,
        raw: pin,
        score: sc,
      };
    })
    .filter(Boolean);

  const gapResults = currentGaps
    .map((gap, idx) => {
      const code = normalizeText(gap?.VanoCodigo);
      const label = normalizeText(gap?.VanoEtiqueta);

      const sc = Math.max(scoreText(code, query), scoreText(label, query));
      if (sc <= 0) return null;

      const lat = Number(gap?.VanoLatitudIni);
      const lng = Number(gap?.VanoLongitudIni);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

      const keyBase = gap?.VanoInterno ?? gap?.VanoCodigo ?? idx;

      return {
        key: `VANO_${keyBase}`,
        kind: "VANO",
        subKind: "Vano",
        code: gap?.VanoCodigo ?? "",
        label: gap?.VanoEtiqueta ?? "",
        lat,
        lng,
        raw: gap,
        score: sc,
      };
    })
    .filter(Boolean);

  return [...pinResults, ...gapResults]
    .sort((a, b) => b.score - a.score)
    .slice(0, 80);
};
