import L from 'leaflet';

// 🎨 PALETA DE COLORES "MODERNA"
const COLORS = {
    normal: '#3b82f6',       // Azul (Poste Normal)
    inspeccionado: '#10b981', // Verde Esmeralda (Inspeccionado)
    deficiencia: '#ef4444',   // Rojo Intenso (Con fallas)
    sed: '#f59e0b',           // Naranja (Subestación)
    tercero: '#6b7280'        // Gris (Terceros)
};

// 🖌️ PLANTILLA SVG (La forma de gota "tipo Google Maps")
const getSvgMarker = (color, scale = 1) => {
    const size = 32 * scale; // Tamaño base 32px
    
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" style="filter: drop-shadow(1px 3px 2px rgba(0,0,0,0.4)); overflow: visible;">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${color}" stroke="white" stroke-width="1.5"/>
        <circle cx="12" cy="9" r="3.5" fill="white" opacity="0.9"/>
    </svg>
    `;
};

// 📍 FUNCIÓN PRINCIPAL
export const getPinColorForElement = (elemento) => {
  if (!elemento) return { status: "DESCONOCIDO", color: "gray" };

  // 1. 🔴 GRIS: Terceros (Propiedad 'Tercero' de C#)
  if (elemento.Tercero === true || elemento.tercero === true) {
    return { status: "TERCEROS", color: "#6b7280" }; 
  }

  // 2. 🟢 VERDE: Inspeccionado (Propiedad 'Inspeccionado' de C#)
  // Agregamos redundancia por si el serializador cambia a minúsculas
  const estaCompletado = 
    elemento.inspeccionado === true ||
    elemento.estadoRevision === 'COMPLETADO';

  if (estaCompletado) {
    return { status: "FINALIZADA", color: "#10b981" };
  }

  // 3. 🔵 AZUL: Pendiente
  return { status: "PENDIENTE", color: "#3b82f6" }; 
};

// 📏 COLOR PARA LAS LÍNEAS (VANOS)
export const getGapColor = (gap) => {
    if (!gap) return '#60a5fa'; // Azul suave por defecto

    // 1. Verificamos Terceros
    if (gap.Tercero === true || gap.tercero === true || gap.tercero === "true") {
        return COLORS.tercero; 
    }

    // 2. Extracción paranoica (cubre "inspeccionado", "Inspeccionado", true y "true")
    const valorInspeccionado = gap.inspeccionado ?? gap.Inspeccionado;
    
    const estaCompletado = 
        valorInspeccionado === true || 
        String(valorInspeccionado).toLowerCase() === 'true' ||
        gap.estadoRevision === 'COMPLETADO';

    if (estaCompletado) {
        return COLORS.inspeccionado; // Verde Esmeralda (#10b981)
    }

    // 3. Azul por defecto (Pendiente)
    return COLORS.normal; // (#3b82f6)
};

export const getIconFromType = (elemento) => {
  // 1. Obtenemos color basado en estadoRevision del elemento
  const pinData = getPinColorForElement(elemento);
  const svgString = getSvgMarker(pinData.color);

  return L.divIcon({
    className: "custom-leaflet-pin",
    html: svgString,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};