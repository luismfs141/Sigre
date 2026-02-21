import { useState, useCallback } from 'react';
import api from '../api/apiConfig';

export const useUltimasDeficiencias = () => {
    const [deficiencies, setDeficiencies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchUltimas = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Traemos las deficiencias
            const responseDefs = await api.get('/Deficiency/del-dia');
            const dataDeficiencias = responseDefs.data || [];

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

            // 3. ✨ EL ARREGLO ESTÁ AQUÍ ✨: Buscamos Elementos usando GetPaginado
            const promesasElementos = dataDeficiencias.map(async (def) => {
                try {
                    // Evaluamos si es Poste o Vano
                    const isPoste = def.defiTipoElemento === 'POST';
                    const endpoint = isPoste ? '/Post/GetPaginado' : '/Gap/GetPaginado';

                    // Buscamos enviando el código GIS del elemento en el parámetro "busqueda"
                    const res = await api.get(endpoint, {
                        params: { skip: 0, take: 1, busqueda: def.defiCodigoElemento }
                    });

                    const datos = res.data?.data;
                    
                    // Si encontró el elemento, capturamos su alimentador y SED
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

            // 4. Cruzamos TODA la información
            const dataCombinada = dataDeficiencias.map((def, index) => {
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
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { deficiencies, loading, error, fetchUltimas };
};