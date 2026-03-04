import { useState, useCallback } from 'react';
import api from '../api/apiConfig';

export const useEstadisticas = () => {
    // Estados para el Dashboard Principal
    const [metrics, setMetrics] = useState(null);
    const [loadingMetrics, setLoadingMetrics] = useState(false);

    // Estados para el Modal de Desglose (Detalle)
    const [detailData, setDetailData] = useState([]);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // 1. OBTENER ESTADÍSTICAS PRINCIPALES
    const fetchEstadisticas = useCallback(async (sedId, sedCodigo) => {
        if (!sedId) return null;
        
        setLoadingMetrics(true);
        setMetrics(null); // Limpiamos la data anterior para evitar parpadeos visuales
        
        console.group(`📊 [Estadísticas] Buscando para SED: ${sedCodigo} (ID: ${sedId})`);
        
        try {
            const response = await api.get('/Deficiency/EstadisticasCalidad', {
                params: { sedId: sedId, sedCodigo: sedCodigo }
            });

            if (response.data && response.data.success) {
                console.log("✅ Datos recibidos:", response.data.data);
                setMetrics(response.data.data);
                return response.data.data;
            } else {
                console.warn("⚠️ La API respondió pero no con success:true");
                return null;
            }
        } catch (error) {
            console.error("❌ Error en fetchEstadisticas:", error);
            throw error; // Lanzamos el error para que el componente pueda mostrar un Toast/Alert
        } finally {
            setLoadingMetrics(false);
            console.groupEnd();
        }
    }, []);

    // 2. OBTENER EL DETALLE DE UN KPI (Para la tabla del Modal)
    const fetchDetalleKpi = useCallback(async (tipoKpi, sedId) => {
        if (!tipoKpi || !sedId) return [];
        
        setLoadingDetail(true);
        setDetailData([]); // Limpiamos la tabla anterior

        console.log(`🔍 [Detalle KPI] Buscando '${tipoKpi}' para SED ID: ${sedId}`);

        try {
            const response = await api.get('/Deficiency/DetalleKpi', {
                params: { tipoKpi: tipoKpi, sedId: sedId } // Asegúrate de que los nombres de params coincidan con tu C#
            });

            // Dependiendo de cómo armaste tu C#, la data puede venir directo en response.data o en response.data.data
            const dataObtenida = response.data.data || response.data || [];
            
            setDetailData(dataObtenida);
            return dataObtenida;

        } catch (error) {
            console.error(`❌ Error trayendo el detalle de ${tipoKpi}:`, error);
            return [];
        } finally {
            setLoadingDetail(false);
        }
    }, []);

    return { 
        metrics, 
        loadingMetrics, 
        fetchEstadisticas, 
        
        detailData, 
        loadingDetail, 
        fetchDetalleKpi 
    };
};