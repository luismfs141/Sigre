import { useState, useCallback } from 'react';
import api from '../api/apiConfig';

// ====================================================================
// HOOK 1: useDeficiencyByGis (Para Historial)
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
// HOOK 2: useDeficienciesBySed (CRUD Principal)
// ====================================================================
export const useDeficienciesBySed = () => {
    const [deficiencies, setDeficiencies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- A. BUSCAR POR SED ---
    const fetchBySed = useCallback(async (sedId) => {
        if (!sedId || (typeof sedId === 'number' && sedId <= 0)) {
            console.warn("⚠️ ID de SED inválido para búsqueda");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            console.log(`📡 [GET] Buscando Deficiencias de la SED: ${sedId}`);
            const response = await api.get('/Deficiency/GetBySedWithTerceros', { params: { x_sedId: sedId } });
            const rawData = response.data || [];
            setDeficiencies(rawData);
            return rawData;
        } catch (err) {
            console.error("❌ Error fetchBySed:", err);
            setDeficiencies([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // --- B. GUARDAR (CREATE / UPDATE) ---
    const saveDeficiency = async (rawData) => {
        setLoading(true);
        try {
            // Helpers de limpieza
            const toNumOrNull = (val) => (val === "" || val === null || val === undefined) ? null : Number(val);
            const toStrOrNull = (val) => (val === "" || val === null || val === undefined) ? null : String(val);

            // 1. OBTENER USUARIO ACTUAL (AUDITORÍA)
// 1. OBTENER USUARIO ACTUAL (AUDITORÍA)
            let currentUserId = "20"; // Fallback por defecto
            try {
                const storedUser = localStorage.getItem('usuario');
                console.log("🔍 [DEBUG] 1. Texto crudo del storage:", storedUser);

                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    console.log("🔍 [DEBUG] 2. Objeto parseado:", parsedUser);
                    console.log("🔍 [DEBUG] 3. Tipo de dato después de parsear:", typeof parsedUser);
                    
                    // CASO A: El fantasma del doble stringify
                    if (typeof parsedUser === 'string') {
                        console.warn("⚠️ ALERTA: El JSON estaba convertido a texto 2 veces. Arreglándolo...");
                        const secondParse = JSON.parse(parsedUser);
                        if (secondParse.usuaInterno !== undefined) {
                            currentUserId = String(secondParse.usuaInterno);
                        }
                    } 
                    // CASO B: Flujo normal correcto
                    else if (parsedUser && parsedUser.usuaInterno !== undefined) {
                        currentUserId = String(parsedUser.usuaInterno);
                        console.log("✅ [DEBUG] 4. ID asignado exitosamente:", currentUserId);
                    } 
                    // CASO C: La propiedad no se llama así o no existe
                    else {
                        console.warn("⚠️ [DEBUG] El JSON es un objeto válido, pero no tiene 'usuaInterno'.", parsedUser);
                    }
                } else {
                     console.warn("⚠️ [DEBUG] localStorage.getItem('usuario') devolvió null o vacío en este instante.");
                }
            } catch (e) {
                console.error("❌ [DEBUG] El parseo falló estrepitosamente:", e);
            }

            // 2. REGLAS AUTOMÁTICAS (TABL_INTERNO)
            let autoTablInterno = null;
            if (rawData.defiTipoElemento === 'POST') {
                autoTablInterno = 8;
            } else if (rawData.defiTipoElemento === 'VANO') {
                autoTablInterno = 9;
            }

            // 3. BUSCAR ID EXISTENTE (Si es edición)
            let finalIdElemento = rawData.defiIdElemento ? Number(rawData.defiIdElemento) : 0;

            // Estrategia de rescate de ID si viene en 0
            if (finalIdElemento === 0) {
                if (rawData.defiTipoElemento === 'POST') {
                    finalIdElemento = Number(rawData.POST_Interno || rawData.PostInterno || rawData.id || 0);
                } else if (rawData.defiTipoElemento === 'VANO') {
                    finalIdElemento = Number(rawData.VAN_Interno || rawData.VanInterno || rawData.id || 0);
                }
            }

            // 4. ESTRATEGIA DE RESCATE: Buscar ID por GIS si es nuevo
            const codigoGis = rawData.defiCodigoElemento;
            if (finalIdElemento === 0 && codigoGis) {
                try {
                    // Solo intentamos buscar si realmente parece que faltó el ID
                    const searchRes = await api.get('/Deficiency/GetByGis', { params: { codigoGis } });
                    const foundData = searchRes.data || [];
                    if (foundData.length > 0) {
                        finalIdElemento = foundData[0].defiIdElemento;
                        console.log(`✅ ID Rescatado por GIS: ${finalIdElemento}`);
                    }
                } catch (e) { /* Ignorar error de rescate */ }
            }

            // 5. DETERMINAR SI ES NUEVO O EDICIÓN
            const isNew = !rawData.defiInterno || rawData.defiInterno === 0;

            // 6. CONSTRUCCIÓN DEL PAYLOAD FINAL
            const payload = {
                ...rawData,

                // --- CAMPOS CRÍTICOS ---
                inspInterno: null,
                tablInterno: autoTablInterno,
                defiIdElemento: finalIdElemento,
                sedCodigo: rawData.sedCodigo,

                // --- AUDITORÍA DE USUARIOS (CORREGIDA) ---
                // Si es nuevo: Creador = Usuario Actual. Si es edición: Mantener original.
                defiUsuarioInic: isNew ? currentUserId : (rawData.defiUsuarioInic ? String(rawData.defiUsuarioInic) : currentUserId),
                // Modificador: SIEMPRE es el usuario actual.
                defiUsuarioMod: currentUserId,

                // Datos Básicos
                defiFecRegistro: rawData.defiFecRegistro || new Date().toISOString(),
                defiActivo: true,
                defiInterno: rawData.defiInterno ? Number(rawData.defiInterno) : 0,
                defiInspeccionado: (rawData.defiInspeccionado !== undefined && rawData.defiInspeccionado !== null)
                    ? Number(rawData.defiInspeccionado)
                    : true,

                // Conversiones Numéricas Seguras
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

                // Limpieza de basura (propiedades que no deben ir al backend)
                label: undefined,
                value: undefined,
                estadoOffLine: undefined,
                inspInternoNavigation: undefined,
                POST_Interno: undefined, PostInterno: undefined,
                VAN_Interno: undefined, VanInterno: undefined,
                POST_CODIGO: undefined, VAN_CODIGO: undefined,
                id: undefined
            };

            console.log("💾 Guardando Deficiencia (Usuario " + currentUserId + "):", payload);

            // 7. PETICIÓN POST
            const response = await api.post('/Deficiency/saveOrUpdateWeb', payload);

            return { success: true, data: response.data };

        } catch (err) {
            console.error("❌ Error al guardar:", err);
            let errorMsg = "Error de conexión o servidor.";
            if (err.response) {
                if (err.response.data?.message) errorMsg = err.response.data.message;
                else if (err.response.data) errorMsg = JSON.stringify(err.response.data);
            }
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    // --- C. ELIMINAR ---
    const softDeleteDeficiency = async (defiInterno) => {
        try {
            await api.post('/Deficiency/SoftDelete', null, { params: { id: defiInterno } });
            setDeficiencies(prev => prev.map(d =>
                d.defiInterno === defiInterno ? { ...d, defiActivo: false } : d
            ));
            return true;
        } catch (err) {
            console.error("Error al eliminar:", err);
            return false;
        }
    };

    // --- D. RESTAURAR ---
    const restoreDeficiency = async (defiInterno) => {
        try {
            const response = await api.post('/Deficiency/Restaurar', null, { params: { id: defiInterno } });
            setDeficiencies(prev => prev.map(d =>
                d.defiInterno === defiInterno ? { ...d, defiActivo: true } : d
            ));
            return { success: true, message: response.data.mensaje || "Restaurado" };
        } catch (err) {
            console.error("Error al restaurar:", err);
            return { success: false, message: "Error al restaurar" };
        }
    };

    const clearData = () => { setDeficiencies([]); setError(null); };

    return {
        deficiencies, loading, error,
        fetchBySed,
        saveDeficiency,
        softDeleteDeficiency,
        restoreDeficiency,
        clearData, setDeficiencies
    };
};