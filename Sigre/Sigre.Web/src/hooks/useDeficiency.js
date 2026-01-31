import { useState, useCallback } from 'react';
import api from '../api/apiConfig';

// ====================================================================
// HOOK 1: useDeficiencyByGis 
// ====================================================================
export const useDeficiencyByGis = () => {
    const [deficiencies, setDeficiencies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchByGis = useCallback(async (codigoGis) => {
        if (!codigoGis || codigoGis.trim() === '') return null;
        setLoading(true);
        setError(null);
        try {
            console.log(`📡 [GET] Buscando historial para: ${codigoGis}`);
            const response = await api.get('/Deficiency/GetByGis', { params: { codigoGis } });
            const data = response.data || [];
            setDeficiencies(data);
            return data;
        } catch (err) {
            console.error("❌ Error GIS:", err);
            setDeficiencies([]);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const clearSearch = () => { setDeficiencies([]); setError(null); };

    return { deficiencies, loading, error, fetchByGis, clearSearch, setDeficiencies };
};

// ====================================================================
// HOOK 2: useDeficienciesBySed (CON AUTO-RESCATE DE ID POR GIS Y RESTAURAR)
// ====================================================================
export const useDeficienciesBySed = () => {
    const [deficiencies, setDeficiencies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- A. BUSCAR POR SED ---
    const fetchBySed = useCallback(async (sedId) => {
        if (!sedId || parseInt(sedId) <= 0) {
            console.warn("⚠️ ID de SED inválido");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            console.log(`📡 [GET] Buscando SED ID: ${sedId}`);
            // NOTA: Asegúrate de que tu backend NO filtre por activo=true si quieres ver los eliminados
            const response = await api.get('/Deficiency/GetBySed', { params: { x_sed: sedId } });
            const rawData = response.data || [];
            setDeficiencies(rawData); 
            return rawData;
        } catch (err) {
            console.error("❌ Error SED:", err);
            setDeficiencies([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- B. GUARDAR (CREATE / UPDATE) ---
    const saveDeficiency = async (rawData) => {
        setLoading(true);
        try {
            // Helpers
            const toNumOrNull = (val) => (val === "" || val === null || val === undefined) ? null : Number(val);
            const toStrOrNull = (val) => (val === "" || val === null || val === undefined) ? null : String(val);

            // 1. REGLAS AUTOMÁTICAS (TABL_INTERNO)
            let autoTablInterno = null;
            if (rawData.defiTipoElemento === 'POST') {
                autoTablInterno = 8;
            } else if (rawData.defiTipoElemento === 'VANO') {
                autoTablInterno = 9;
            }

            // 2. BUSCAR ID EN PROPIEDADES (POST_Interno / VAN_Interno)
            let finalIdElemento = rawData.defiIdElemento ? Number(rawData.defiIdElemento) : 0;
            
            if (finalIdElemento === 0) {
                // Buscamos en propiedades comunes que el backend o frontend puedan enviar
                if (rawData.defiTipoElemento === 'POST') {
                    finalIdElemento = Number(rawData.POST_Interno || rawData.PostInterno || rawData.id || 0);
                } else if (rawData.defiTipoElemento === 'VANO') {
                    finalIdElemento = Number(rawData.VAN_Interno || rawData.VanInterno || rawData.id || 0);
                }
            }

            // 3. 🔥 ESTRATEGIA DE SALVAVIDAS: BUSCAR POR CÓDIGO GIS SI EL ID SIGUE SIENDO 0
            const codigoGis = rawData.defiCodigoElemento || rawData.POST_CODIGO || rawData.VAN_CODIGO;
            
            if (finalIdElemento === 0 && codigoGis) {
                console.log(`🔎 ID es 0. Intentando rescatar ID buscando GIS: ${codigoGis}...`);
                try {
                    // Reutilizamos el endpoint de búsqueda para ver si el elemento ya tiene historial y sacar su ID
                    const searchRes = await api.get('/Deficiency/GetByGis', { params: { codigoGis } });
                    const foundData = searchRes.data || [];
                    
                    if (foundData.length > 0) {
                        // ¡ENCONTRADO! Tomamos el ID del primer registro histórico
                        finalIdElemento = foundData[0].defiIdElemento;
                        console.log(`✅ ID Rescatado exitosamente: ${finalIdElemento}`);
                    } else {
                        console.warn(`⚠️ No se encontró historial para ${codigoGis}. El ID se enviará como 0.`);
                    }
                } catch (e) {
                    console.error("❌ Falló la búsqueda de rescate por GIS", e);
                }
            }

            // 4. CONSTRUCCIÓN DEL PAYLOAD FINAL
            const payload = {
                ...rawData,
                
                // --- CAMPOS CRÍTICOS ---
                inspInterno: null,          // Regla: Siempre NULL
                tablInterno: autoTablInterno, // Regla: 8 o 9
                defiIdElemento: finalIdElemento, // <--- ID Final (Propiedad o Rescatado)
                
                // Usuario como STRING "99" (Regla de DB)
                defiUsuarioInic: (rawData.defiUsuarioInic && rawData.defiUsuarioInic !== 0) 
                                 ? String(rawData.defiUsuarioInic) : "99",
                defiUsuarioMod: "99", 

                // Datos Básicos
                defiFecRegistro: rawData.defiFecRegistro || new Date().toISOString(),
                defiActivo: true, 
                defiInterno: rawData.defiInterno ? Number(rawData.defiInterno) : 0,
                
                // Conversiones Numéricas
                tipiInterno: rawData.tipiInterno ? Number(rawData.tipiInterno) : 0,
                defiEstadoCriticidad: toNumOrNull(rawData.defiEstadoCriticidad),
                
                // Coordenadas
                defiLatitud: rawData.defiLatitud ? parseFloat(rawData.defiLatitud) : 0,
                defiLongitud: rawData.defiLongitud ? parseFloat(rawData.defiLongitud) : 0,

                // Distancias y Medidas
                defiDistHorizontal: toNumOrNull(rawData.defiDistHorizontal),
                defiDistVertical: toNumOrNull(rawData.defiDistVertical),
                defiDistTransversal: toNumOrNull(rawData.defiDistTransversal),
                defiNumPostes: toNumOrNull(rawData.defiNumPostes),

                // Textos
                defiAccesibilidad: toStrOrNull(rawData.defiAccesibilidad),
                defiTipoCruce: toStrOrNull(rawData.defiTipoCruce),
                defiObservacion: rawData.defiObservacion || "", 
                defiComentario: toStrOrNull(rawData.defiComentario),
                defiNumSuministro: toStrOrNull(rawData.defiNumSuministro),

                // Limpieza
                sedCodigo: undefined, label: undefined, value: undefined,
                estadoOffLine: undefined, inspInternoNavigation: undefined,
                POST_Interno: undefined, PostInterno: undefined, 
                VAN_Interno: undefined, VanInterno: undefined,
                POST_CODIGO: undefined, VAN_CODIGO: undefined,
                id: undefined
            };

            console.log("💾 Payload Definitivo:", payload);
            
            // 5. PETICIÓN
            const response = await api.post('/Deficiency/saveOrUpdateWeb', payload);
            
            console.log("✅ Guardado exitoso:", response.data);
            return { success: true, data: response.data };

        } catch (err) {
            console.error("❌ Error al guardar:", err);
            let errorMsg = "Error al guardar el registro.";
            if (err.response) {
                if (err.response.data?.errors) {
                    errorMsg = Object.values(err.response.data.errors).flat().join(", ");
                } else if (err.response.data?.message) {
                    errorMsg = err.response.data.message;
                }
            }
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    // --- C. ELIMINAR (SOFT DELETE) ---
    const softDeleteDeficiency = async (defiInterno) => {
        try {
            await api.post('/Deficiency/SoftDelete', null, { params: { id: defiInterno } });
            // Actualizamos el estado local marcándolo como inactivo (para no tener que recargar todo)
            setDeficiencies(prev => prev.map(d => 
                d.defiInterno === defiInterno ? { ...d, defiActivo: false } : d
            ));
            return true;
        } catch (err) {
            console.error("Error al eliminar:", err);
            return false;
        }
    };

    // --- D. RESTAURAR (NUEVO) ---
    const restoreDeficiency = async (defiInterno) => {
        try {
            const response = await api.post('/Deficiency/Restaurar', null, { params: { id: defiInterno } });
            
            // Actualizamos estado local
            setDeficiencies(prev => prev.map(d => 
                d.defiInterno === defiInterno ? { ...d, defiActivo: true } : d
            ));
            
            return { success: true, message: response.data.mensaje || "Restaurado" };
        } catch (err) {
            console.error("Error al restaurar:", err);
            let msg = "Error al restaurar.";
            if (err.response && err.response.data && err.response.data.mensaje) {
                msg = err.response.data.mensaje;
            }
            return { success: false, message: msg };
        }
    };

    const clearData = () => { setDeficiencies([]); setError(null); };

    return { 
        deficiencies, loading, error, fetchBySed, 
        saveDeficiency, softDeleteDeficiency, restoreDeficiency, // <--- No olvides exportarlo
        clearData, setDeficiencies 
    };
};