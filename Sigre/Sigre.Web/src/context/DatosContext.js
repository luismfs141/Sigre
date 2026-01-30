import React, { createContext, useContext, useEffect, useState } from "react";
import api from '../api/apiConfig'; 

const DatosContext = createContext();

// CLAVES PARA LOCALSTORAGE
const SELECTED_FEEDER_KEY = "SIGRE_SELECTED_FEEDER";
const SELECTED_SED_KEY = "SIGRE_SELECTED_SED";

export const DatosProvider = ({ children }) => {
  
  // =========================================================
  // 1. ESTADOS
  // =========================================================
  
  // --- Filtros ---
  const [selectedProject, setSelectedProject] = useState(0);
  
  // Alimentador seleccionado
  const [selectedFeeder, _setSelectedFeeder] = useState(null);
  const [feeders, setFeeders] = useState([]); 
  
  // SED seleccionada (Opcional)
  const [selectedSed, _setSelectedSed] = useState(null);
  
  // --- Datos del Mapa ---
  const [pins, setPins] = useState([]);           // Lo que se ve actualmente (puede estar filtrado)
  const [totalPins, setTotalPins] = useState([]); // 🔥 Memoria completa (Backup)
  
  const [gaps, setGaps] = useState([]);           // Vanos (Líneas)
  const [sedsData, setSedsData] = useState([]);   // Iconos de Subestaciones
  const [deficiencies, setDeficiencies] = useState([]); 
  
  const [loadingData, setLoadingData] = useState(false);

  // --- Otros ---
  const [selectedTypification, setSelectedTypification] = useState(null);
  const [selectedDeficiency, setSelectedDeficiency] = useState(null);

  // =========================================================
  // 2. PERSISTENCIA (Recuperar sesión al recargar)
  // =========================================================
  useEffect(() => {
    try {
      const rawFeeder = localStorage.getItem(SELECTED_FEEDER_KEY);
      if (rawFeeder) {
          const parsed = JSON.parse(rawFeeder);
          _setSelectedFeeder(parsed);
      }
    } catch (e) {
      console.error("Error restaurando sesión:", e);
    }
  }, []);

  // =========================================================
  // 3. CARGA AUTOMÁTICA (POR ALIMENTADOR)
  // =========================================================
  useEffect(() => {
    if (!selectedFeeder) return;

    // Obtenemos el ID de forma segura
    const idParaBuscar = selectedFeeder.alimInterno || selectedFeeder.AlimInterno || selectedFeeder.id || selectedFeeder.value;

    if (!idParaBuscar) {
        console.warn("⚠️ [Contexto] ID de alimentador inválido:", selectedFeeder);
        return;
    }

    const cargarRedCompleta = async () => {
        setLoadingData(true);
        console.group("📡 [Contexto] Cargando Red por Alimentador");
        console.log("🔹 ID Alimentador:", idParaBuscar);

        // Limpiamos todo
        setPins([]); setTotalPins([]); setGaps([]); setDeficiencies([]);

        try {
            const params = { idFeeder: idParaBuscar };

            // Llamadas paralelas a endpoints masivos
            const [resPosts, resGaps, resSeds, resDefs] = await Promise.all([
                api.get('/Post/GetStructByFeeder', { params }), // Pines
                api.get('/Gap/GetByFeeder', { params }),        // Vanos
                api.get('/Sed/GetStructByFeeder', { params }),  // SEDs (Iconos)
                api.get('/Deficiency/GetByFeeder', { params })  // Deficiencias
            ]);

            // --- A. Procesar Deficiencias ---
            const rawDefs = resDefs.data || [];
            const elementosConDeficiencia = new Set(rawDefs.map(d => d.DefiIdElemento));
            setDeficiencies(rawDefs);

            // --- B. Procesar Postes (Pines) ---
            const rawPosts = resPosts.data || [];
            const cleanPins = rawPosts.map(p => {
                const idPoste = p.IdPoste || p.id || p.Id;
                const tieneDeficiencia = elementosConDeficiencia.has(idPoste);

                return {
                    id: idPoste,
                    elementCode: p.PostCodigo || p.codigo || p.ElementCode, 
                    label: p.PostEtiqueta || p.Label,
                    
                    // Coordenadas seguras
                    Latitude: Number(p.Latitud || p.latitude || p.Latitude || 0),
                    Longitude: Number(p.Longitud || p.longitude || p.Longitude || 0),
                    
                    status: tieneDeficiencia ? 'deficient' : (p.Estado || 'pending'), 
                    elementType: 'Poste',
                    type: 5,
                    hasDeficiency: tieneDeficiencia,

                    // 🔥 AQUÍ AGREGAMOS EL DATO CLAVE DE LA SED:
                    idSed: p.PostSubestacion || p.IdSed || p.sedId || 0 
                };
            }).filter(p => p.Latitude !== 0 && !isNaN(p.Latitude));

            // --- C. Procesar Vanos (Gaps) ---
            const rawGaps = resGaps.data || [];
            const cleanGaps = rawGaps.map(g => ({
                id: g.IdVano || g.id,
                code: g.VanoCodigo,
                lat1: Number(g.VanoLatitudIni),
                lon1: Number(g.VanoLongitudIni),
                lat2: Number(g.VanoLatitudFin),
                lon2: Number(g.VanoLongitudFin),
                color: '#3b82f6',
                // También agregamos idSed a los vanos por si acaso
                idSed: g.VanoSubestacion || g.IdSed || 0
            }));

            // --- D. Procesar Iconos SED ---
            const rawSeds = resSeds.data || [];
            const cleanSeds = rawSeds.map(s => ({
                id: s.IdSed || s.id,
                Etiqueta: s.SedEtiqueta,
                latitude: Number(s.Latitud || s.SedLatitud),
                longitude: Number(s.Longitud || s.SedLongitud)
            }));

            // GUARDAR EN ESTADO GLOBAL
            setPins(cleanPins);
            setTotalPins(cleanPins); // ✅ Backup completo
            setGaps(cleanGaps);
            setSedsData(cleanSeds);

            console.log(`✅ Carga completa: ${cleanPins.length} Postes, ${cleanGaps.length} Vanos.`);

        } catch (error) {
            console.error("❌ Error cargando red por alimentador:", error);
            setPins([]); setTotalPins([]);
        } finally {
            setLoadingData(false);
            console.groupEnd();
        }
    };

    cargarRedCompleta();

  }, [selectedFeeder]);

  // =========================================================
  // 4. BÚSQUEDA AISLADA (Por Deficiencia o Código)
  // =========================================================
  const buscarPorDeficiencia = async (criterio) => {
    if (!criterio) return;
    setLoadingData(true);
    
    setPins([]); setTotalPins([]); setGaps([]); setSedsData([]); 
    _setSelectedFeeder(null); 

    try {
        const params = { codigo: criterio }; 
        const [resPosts, resGaps] = await Promise.all([
            api.get('/Post/GetByDeficiency', { params }), 
            api.get('/Gap/GetByDeficiency', { params })   
        ]);

        const cleanPins = (resPosts.data || []).map(p => ({
            id: p.IdPoste || p.id,
            elementCode: p.PostCodigo,
            Latitude: Number(p.Latitud),
            Longitude: Number(p.Longitud),
            status: 'deficient',
            elementType: 'Resultado Búsqueda',
            // En búsqueda por deficiencia a veces no viene la SED, manejamos fallback
            idSed: p.PostSubestacion || 0 
        }));

        setPins(cleanPins);
        setTotalPins(cleanPins);

    } catch (error) {
        console.error("Error búsqueda:", error);
    } finally {
        setLoadingData(false);
    }
  };

  // =========================================================
  // 5. SETTERS PÚBLICOS
  // =========================================================
  const setSelectedFeeder = (feeder) => {
    _setSelectedFeeder(feeder);
    setPins([]); setTotalPins([]); setGaps([]);
    if (feeder) localStorage.setItem(SELECTED_FEEDER_KEY, JSON.stringify(feeder));
    else localStorage.removeItem(SELECTED_FEEDER_KEY);
  };

  const setSelectedSed = (sed) => {
    _setSelectedSed(sed);
    if (sed) localStorage.setItem(SELECTED_SED_KEY, JSON.stringify(sed));
    else localStorage.removeItem(SELECTED_SED_KEY);
  };

  return (
    <DatosContext.Provider
      value={{
        // Filtros
        selectedProject, setSelectedProject,
        feeders, setFeeders,
        selectedFeeder, setSelectedFeeder,
        selectedSed, setSelectedSed,
        
        // Datos Mapa
        pins, setPins,
        totalPins, setTotalPins, // ✅ IMPORTANTE: Setter expuesto
        
        gaps, setGaps,
        sedsData, setSedsData,
        deficiencies, setDeficiencies,
        
        // UI
        loadingData, setLoadingData,
        
        // Acciones
        buscarPorDeficiencia,
        
        // Otros
        selectedTypification, setSelectedTypification,
        selectedDeficiency, setSelectedDeficiency,
      }}
    >
      {children}
    </DatosContext.Provider>
  );
};

export const useDatos = () => useContext(DatosContext);