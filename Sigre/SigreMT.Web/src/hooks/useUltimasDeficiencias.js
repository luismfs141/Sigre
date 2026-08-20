import { useState, useCallback } from 'react';
import api from '../api/apiConfig';

// ====================================================
// HOOK 1: DEFICIENCIAS DEL DÍA (PAGINADAS)
// ====================================================
export const useUltimasDeficiencias = () => {
    const [deficiencies, setDeficiencies] = useState([]);
    const [totalRecords, setTotalRecords] = useState(0); // <-- Nuevo estado para el total del día
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchDeficienciasPaginadas = useCallback(async (skip, take, fechaStr) => {
        setLoading(true);
        setError(null);
        try {
            // 1. Traemos la PÁGINA de deficiencias (ej: 10 registros)
            const responseDefs = await api.get('/Deficiency/del-dia-paginado', {
                params: { skip, take, fecha: fechaStr }
            });
            
            const rawData = responseDefs.data?.data || [];
            // Guardamos el total (ej: 10,984) para el KPI rojo
            setTotalRecords(responseDefs.data?.totalRecords || 0);

            // 2. Traemos Usuarios (Inspectores)
            let mapaUsuarios = {};
            try {
                const resUsers = await api.get('/User/users'); 
                const usersList = resUsers.data || [];
                usersList.forEach(user => {
                    mapaUsuarios[user.usuaInterno.toString()] = `${user.usuaNombres} ${user.usuaApellidos}`.trim();
                });
            } catch (errUser) {
                console.warn("⚠️ Error cargando usuarios:", errUser);
            }

            // 3. Buscamos Elementos (¡Ahora solo hará 10 peticiones rápidas!)
            const promesasElementos = rawData.map(async (def) => {
                try {
                    const isPoste = def.defiTipoElemento === 'POST';
                    const endpoint = isPoste ? '/Post/GetPaginado' : '/Gap/GetPaginado';

                    const res = await api.get(endpoint, {
                        params: { skip: 0, take: 1, busqueda: def.defiCodigoElemento }
                    });

                    const datos = res.data?.data;
                    if (datos && datos.length > 0) {
                        const item = datos[0];
                        return {
                            alimentador: item.alimInterno || 'N/A', 
                            sed: isPoste ? item.postSubestacion : item.vanoSubestacion
                        };
                    }
                    return { alimentador: 'N/A', sed: 'N/A' };
                } catch (error) {
                    return { alimentador: 'N/A', sed: 'N/A' };
                }
            });

            const datosElementos = await Promise.all(promesasElementos);

            // 4. Cruzamos la información
            const dataCombinada = rawData.map((def, index) => {
                const elemento = datosElementos[index];
                const nombreInspector = def.defiUsuarioInic 
                                        ? mapaUsuarios[def.defiUsuarioInic] || `ID: ${def.defiUsuarioInic}`
                                        : 'Sin asignar';

                return {
                    ...def,
                    alimentador: elemento.alimentador,
                    sed: elemento.sed,
                    nombreInspector: nombreInspector
                };
            });

            setDeficiencies(dataCombinada);
            return dataCombinada;
        } catch (err) {
            console.error("❌ Error en useUltimasDeficiencias:", err);
            setError("No se pudieron cargar los datos recientes.");
            setDeficiencies([]);
            setTotalRecords(0);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { deficiencies, totalRecords, loading, error, fetchDeficienciasPaginadas };
};

// ====================================================
// HOOK 2: ESTADÍSTICAS DE INSPECTORES (SQL AGRUPADO)
// ====================================================
export const useEstadisticasInspectores = () => {
    const [estadisticas, setEstadisticas] = useState([]);
    const [loadingStats, setLoadingStats] = useState(false);

    const fetchEstadisticas = useCallback(async (fechaStr) => {
        setLoadingStats(true);
        try {
            const resStats = await api.get('/Deficiency/estadisticas-inspectores', {
                params: { fecha: fechaStr }
            });
            const datosAgrupados = resStats.data || [];

            let mapaUsuarios = {};
            try {
                const resUsers = await api.get('/User/users'); 
                (resUsers.data || []).forEach(u => {
                    mapaUsuarios[u.usuaInterno.toString()] = `${u.usuaNombres} ${u.usuaApellidos}`;
                });
            } catch (e) {}

            const dataFinal = datosAgrupados.map(stat => ({
                ...stat,
                nombreInspector: stat.idInspector ? (mapaUsuarios[stat.idInspector] || `ID: ${stat.idInspector}`) : 'Sin asignar'
            }));

            setEstadisticas(dataFinal);
        } catch (error) {
            console.error("Error cargando estadísticas:", error);
            setEstadisticas([]);
        } finally {
            setLoadingStats(false);
        }
    }, []);

    return { estadisticas, loadingStats, fetchEstadisticas };
};