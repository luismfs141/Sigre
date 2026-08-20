// utils/mapAdapters.js

/**
 * Transforma la data cruda de PINES del API a la estructura que usa el mapa.
 */
export const adaptPin = (p) => ({
  // Identificadores
  id: p.IdPoste || p.id || p.Id,
  idOriginal: p.IdOriginal,
  
  // Coordenadas (Aseguramos que sean números)
  Latitude: Number(p.Latitud || p.latitude || p.Latitude),
  Longitude: Number(p.Longitud || p.longitude || p.Longitude),
  
  // Metadatos
  type: Number(p.Tipo || p.Type || 5), // Default 5 (Poste)
  elementCode: p.PostCodigo || p.Codigo || '',
  label: p.PostEtiqueta || p.Etiqueta || '',
  status: p.Estado || 'pending',
  
  // Flags booleanos
  inspeccionado: Boolean(p.Inspeccionado),
  tercero: Boolean(p.Tercero)
});

/**
 * Transforma la data cruda de GAPS del API.
 */
export const adaptGap = (g) => ({
  id: g.IdVano || g.id,
  
  // Coordenadas de línea (Inicio -> Fin)
  lat1: Number(g.VanoLatitudIni || g.lat1),
  lon1: Number(g.VanoLongitudIni || g.lon1),
  lat2: Number(g.VanoLatitudFin || g.lat2),
  lon2: Number(g.VanoLongitudFin || g.lon2),
  
  // Metadatos
  code: g.VanoCodigo,
  label: g.VanoEtiqueta,
  
  // Estados para coloreado
  inspeccionado: Boolean(g.VanoInspeccionado),
  tercero: Boolean(g.VanoTerceros)
});