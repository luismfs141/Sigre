import { useState, useEffect } from 'react';
import api from '../api/apiConfig';

// ---------------------------------------------
// HOOK 1: Obtener lista de Alimentadores
// ---------------------------------------------
export const useFeeder = () => {
    const [feeders, setFeeders] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadFeeders = async () => {
            setLoading(true);
            try {
                const response = await api.get('/Feeder/GetFeeder');
                let rawData = response.data;
                
                if (response.data && response.data.result) rawData = response.data.result;

                // 🔍 DEBUG: Mira esto en la consola (F12)
                console.log("📡 RAW DATA BACKEND:", rawData); 

                if (!Array.isArray(rawData)) return;

                const lista = rawData.map((item) => {
                    // Intenta encontrar la propiedad correcta
                    // Agregamos más variantes comunes por si acaso
                    const etiqueta = item.alimEtiqueta || item.AlimEtiqueta || item.Nombre || item.Descripcion || "Sin Etiqueta";
                    const codigo = item.alimCodigo || item.AlimCodigo || item.Codigo || "S/C";
                    const id = item.alimInterno || item.AlimInterno || item.Id || item.ID;
                    const activo = (item.alimActivo !== undefined) ? item.alimActivo : 1;

                    return {
                        ...item,
                        alimInterno: id,
                        label: `${etiqueta} - ${codigo}`, 
                        value: id
                    };
                });
                
                setFeeders(lista);
            } catch (error) {
                console.error("Error cargando alimentadores:", error);
            } finally {
                setLoading(false);
            }
        };
        loadFeeders();
    }, []);

    return { feeders, loading };
};

// ---------------------------------------------
// HOOK 2: Obtener SEDs por Alimentador
// ---------------------------------------------
export const useSedsByFeeder = (selectedFeeder) => {
    const [seds, setSeds] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // 🛡️ GUARDIA DE SEGURIDAD
        // Si no hay alimentador seleccionado, o si está vacío, NO hacemos la petición.
        if (!selectedFeeder) {
            setSeds([]);
            return;
        }

        const fetchSeds = async () => {
            // Obtenemos el ID. Si selectedFeeder es solo el ID, úsalo directo.
            // Si es un objeto, busca la propiedad.
            const idFeeder = selectedFeeder.alimInterno || selectedFeeder.value || selectedFeeder;

            // 🛡️ VALIDACIÓN CRÍTICA:
            // Si el ID es undefined o null, DETENEMOS TODO para evitar el Error 400
            if (!idFeeder) {
                console.warn("⚠️ Intentando cargar SEDs con ID inválido:", selectedFeeder);
                return;
            }

            setLoading(true);
            try {
                // Ahora la petición solo sale si tenemos un ID real
                console.log(`📡 Buscando SEDs para Feeder ID: ${idFeeder}`);
                const response = await api.get(`/Feeder/GetSedsByFeederWeb`, { params: { x_feeder: idFeeder } });
                
                const data = response.data || [];
                const listaReal = (data.result) ? data.result : data;

                if (Array.isArray(listaReal)) {
                    const sedsProcesadas = listaReal.map(s => ({
                        ...s,
                        sedCodigo: s.sedCodigo || s.SedCodigo,
                        sedEtiqueta: s.sedEtiqueta || s.SedEtiqueta,
                        label: `${s.sedCodigo || ''} - ${s.sedEtiqueta || ''}`
                    }));
                    setSeds(sedsProcesadas);
                } else {
                    setSeds([]);
                }

            } catch (error) {
                console.error("Error cargando SEDs:", error);
                setSeds([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSeds();

    }, [selectedFeeder]); 

    return { seds, loading };
};