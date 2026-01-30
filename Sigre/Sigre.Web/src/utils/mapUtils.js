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
export const getIconFromType = (pin) => {
    let color = COLORS.normal;
    let scale = 1; // Tamaño normal

    // 1. Lógica de Colores (Jerarquía: Deficiencia > Inspeccionado > Normal)
    if (pin.hasDeficiency || pin.status === 'deficient') {
        color = COLORS.deficiencia; // 🔴 Rojo
        scale = 1.2; // Un poco más grande para resaltar
    } else if (pin.inspeccionado) {
        color = COLORS.inspeccionado; // 🟢 Verde
    } else if (pin.tercero) {
        color = COLORS.tercero; // ⚫ Gris
    }

    // 2. Si es una SED (Subestación), la hacemos Naranja y Grande
    // Verificamos si es SED por tipo o si el ID del pin coincide con el de la SED buscada
    if (pin.elementType === 'SED' || pin.idSed === pin.id) {
        color = COLORS.sed; // 🟠 Naranja
        scale = 1.5; // Muy grande para destacar la cabecera
    }

    // 3. Generar el DivIcon de Leaflet
    return L.divIcon({
        className: 'custom-svg-pin', // Clase vacía para quitar estilos feos de Leaflet
        html: getSvgMarker(color, scale),
        iconSize: [30 * scale, 42 * scale], // Espacio que ocupa
        iconAnchor: [15 * scale, 42 * scale], // La "punta" del pin está abajo al centro
        popupAnchor: [0, -40 * scale] // El popup sale arriba del pin
    });
};

// 📏 COLOR PARA LAS LÍNEAS (VANOS)
export const getGapColor = (gap) => {
    // Si quieres que las líneas también se vean "inspeccionadas"
    if (gap.inspeccionado) return COLORS.inspeccionado;
    return '#60a5fa'; // Un azul un poco más suave para las líneas
};