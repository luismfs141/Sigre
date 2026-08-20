// Archivo: src/utils/geoUtils.js

// Función auxiliar (No la exportamos porque solo se usa aquí adentro)
const getUtmBandLetter = (lat) => {
    if (-16 >= lat && lat >= -24) return 'K'; 
    if (-8 >= lat && lat > -16) return 'L';   
    if (0 >= lat && lat > -8) return 'M';     
    return 'S'; 
};

// Función principal (Añadimos "export" para poder llamarla desde otros archivos)
export const latLonToUTM = (lat, lon) => {
    if (!lat || !lon) return { zone: "--", easting: 0, northing: 0, letter: "-" };

    const a = 6378137.0; 
    const f = 1 / 298.257223563; 
    const k0 = 0.9996; 

    const phi = parseFloat(lat) * (Math.PI / 180);
    const lambda = parseFloat(lon) * (Math.PI / 180);
    
    const zoneNumber = Math.floor((parseFloat(lon) + 180) / 6) + 1;
    const lambda0 = ((zoneNumber - 1) * 6 - 180 + 3) * (Math.PI / 180);

    const e2 = 2 * f - f * f;
    const N = a / Math.sqrt(1 - e2 * Math.sin(phi) * Math.sin(phi));
    const T = Math.tan(phi) * Math.tan(phi);
    const C = e2 * Math.cos(phi) * Math.cos(phi) / (1 - e2);
    const A = (lambda - lambda0) * Math.cos(phi);

    const M = a * ((1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256) * phi
        - (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 * e2 * e2 / 1024) * Math.sin(2 * phi)
        + (15 * e2 * e2 / 256 + 45 * e2 * e2 * e2 / 1024) * Math.sin(4 * phi)
        - (35 * e2 * e2 * e2 / 3072) * Math.sin(6 * phi));

    const easting = 500000 + k0 * N * (A + (1 - T + C) * A * A * A / 6
        + (5 - 18 * T + T * T + 72 * C - 58 * e2) * A * A * A * A / 120);

    let northing = k0 * M + k0 * N * Math.tan(phi) * (A * A / 2
        + (5 - T + 9 * C + 4 * C * C) * A * A * A * A / 24
        + (61 - 58 * T + T * T + 600 * C - 330 * e2) * A * A * A * A * A * A / 720);

    if (parseFloat(lat) < 0) northing += 10000000.0;

    const letter = getUtmBandLetter(lat);

    return {
        zone: zoneNumber,
        letter: letter,
        easting: Math.round(easting),   // REDONDEADO AL ENTERO
        northing: Math.round(northing)  // REDONDEADO AL ENTERO
    };
};