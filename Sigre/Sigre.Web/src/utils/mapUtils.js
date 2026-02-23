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
// utils/mapPinLogic.js

export const getPinColorForElement = (elemento, deficienciasDelElemento = []) => {
  // Manejo de seguridad por si el elemento viene nulo
  if (!elemento) return { status: "DESCONOCIDO", color: "gray", hex: "gray" };

  // 1. 🔴 ROJO: Validamos si es de Terceros (No existe para nosotros)
  // Normalizamos el valor por si viene como booleano, string ("true") o número (1) desde tu API/BD
  const isPosteTerceros = 
    elemento.postTerceros === true || 
    String(elemento.postTerceros).toLowerCase() === "true" || 
    Number(elemento.postTerceros) === 1;

  const isVanoTerceros = 
    elemento.vanoTerceros === true || 
    String(elemento.vanoTerceros).toLowerCase() === "true" || 
    Number(elemento.vanoTerceros) === 1;

  if (isPosteTerceros || isVanoTerceros) {
    return { status: "NO EXISTE", color: "#ef4444", hex: "red" };
  }

  // 2. 🔵 AZUL: Si el elemento SÍ existe, pero aún no tiene ninguna deficiencia registrada
  if (!deficienciasDelElemento || deficienciasDelElemento.length === 0) {
    return { status: "PENDIENTE", color: "#3b82f6", hex: "blue" };
  }

  // 3. 🟢 VERDE: Verificamos si TODAS las deficiencias están finalizadas
  const todasFinalizadas = deficienciasDelElemento.every((def) => {
    // Tomamos la columna que me mostraste en tu captura
    const inspeccionado = Number(def.DEFI_Inspeccionado) || Number(def.defiInspeccionado);
    return inspeccionado === 1;
  });

  if (todasFinalizadas) {
    return { status: "FINALIZADA", color: "#10b981", hex: "green" };
  }

  // 4. 🔵 AZUL: Si tiene deficiencias, pero al menos una tiene DEFI_Inspeccionado en 0
  return { status: "PENDIENTE", color: "#3b82f6", hex: "blue" };
};

// 📏 COLOR PARA LAS LÍNEAS (VANOS)
export const getGapColor = (gap) => {
    // Si quieres que las líneas también se vean "inspeccionadas"
    if (gap.inspeccionado) return COLORS.inspeccionado;
    return '#60a5fa'; // Un azul un poco más suave para las líneas
};
// Agrega esta función al final de tu archivo

export const getIconFromType = (elemento, deficienciasDelElemento = []) => {
  // 1. Obtenemos los datos del color según nuestra regla de negocio
  const pinData = getPinColorForElement(elemento, deficienciasDelElemento);

  // 2. Generamos el string del SVG usando el color devuelto
  const svgString = getSvgMarker(pinData.color);

  // 3. Creamos y retornamos el ícono compatible con react-leaflet / leaflet
  return L.divIcon({
    className: "custom-leaflet-pin", // Clase custom para evitar el cuadrito blanco por defecto de Leaflet
    html: svgString,
    iconSize: [32, 32], // Coincide con el tamaño base de tu getSvgMarker
    iconAnchor: [16, 32], // El "eje" del pin: la mitad en X (16) y abajo del todo en Y (32) para que la punta apunte a la coordenada exacta
    popupAnchor: [0, -32], // Para que los popups se abran justo encima del pin y no lo tapen
  });
};