// src/utils/geoUtils.js

/**
 * Convierte coordenadas geográficas (Latitud/Longitud) a formato UTM (WGS84)
 * @param {number} lat - Latitud decimal
 * @param {number} lon - Longitud decimal
 * @returns {Object} Objeto con las coordenadas { easting, northing, zone }
 */
export function latLonToUTM(lat, lon) {
    if (!lat || !lon) return { northing: 0, easting: 0, zone: 0 };

    const a = 6378137; 
    const f = 1 / 298.257223563; 
    const k0 = 0.9996; 

    const phi = lat * (Math.PI / 180);
    const lambda = lon * (Math.PI / 180);
    const zone = Math.floor((lon + 180) / 6) + 1;
    const lambda0 = ((zone - 1) * 6 - 180 + 3) * (Math.PI / 180);

    const e2 = 2 * f - f * f; 
    const N = a / Math.sqrt(1 - e2 * Math.sin(phi) * Math.sin(phi));
    const T = Math.tan(phi) * Math.tan(phi);
    const C = (e2 / (1 - e2)) * Math.cos(phi) * Math.cos(phi);
    const A = (lambda - lambda0) * Math.cos(phi);

    const M = a * ((1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256) * phi
        - (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 * e2 * e2 / 1024) * Math.sin(2 * phi)
        + (15 * e2 * e2 / 256 + 45 * e2 * e2 * e2 / 1024) * Math.sin(4 * phi)
        - (35 * e2 * e2 * e2 / 3072) * Math.sin(6 * phi));

    const easting = 500000 + k0 * N * (A + (1 - T + C) * A * A * A / 6
        + (5 - 18 * T + T * T + 72 * C - 58 * e2) * A * A * A * A * A / 120);

    const northing = k0 * (M + N * Math.tan(phi) * (A * A / 2
        + (5 - T + 9 * C + 4 * C * C) * A * A * A * A / 24
        + (61 - 58 * T + T * T + 600 * C - 330 * e2) * A * A * A * A * A * A / 720));

    // Para hemisferio sur (Latitud negativa), sumar 10,000,000 al norte
    const finalNorthing = lat < 0 ? northing + 10000000 : northing;

    return {
        easting: parseFloat(easting.toFixed(3)),
        northing: parseFloat(finalNorthing.toFixed(3)),
        zone: zone
    };
}