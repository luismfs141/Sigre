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
  const [selectedFeeder, _setSelectedFeeder] = useState(null);
  const [feeders, setFeeders] = useState([]); 
  const [selectedSed, _setSelectedSed] = useState(null);
  
  // --- Datos del Mapa ---
  const [pins, setPins] = useState([]);      // Postes
  const [gaps, setGaps] = useState([]);      // Vanos
  const [sedsData, setSedsData] = useState([]); // Subestación (Icono)
  const [loadingData, setLoadingData] = useState(false);

  // --- Otros ---
  const [selectedTypification, setSelectedTypification] = useState(null);
  const [selectedDeficiency, setSelectedDeficiency] = useState(null);

  // =========================================================
  // 2. PERSISTENCIA (Recuperar sesión)
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
  // 3. 🔥 CARGA AUTOMÁTICA AL SELECCIONAR ALIMENTADOR
  // =========================================================
  useEffect(() => {
    if (!selectedFeeder) return;

    // A. OBTENER EL ID CORRECTO (Basado en tus logs: alimInterno)
    const idParaBuscar = selectedFeeder.alimInterno || selectedFeeder.AlimInterno || selectedFeeder.id;

    if (!idParaBuscar) {
        console.warn("⚠️ [Contexto] ID de alimentador inválido:", selectedFeeder);
        return;
    }

    const cargarRedElectrica = async () => {
        setLoadingData(true);
        console.group("📡 [Contexto] Cargando Red Eléctrica");
        console.log("🔹 Alimentador:", selectedFeeder.label || selectedFeeder.alimEtiqueta);
        console.log("🔹 ID:", idParaBuscar);

        try {
            const params = { idFeeder: idParaBuscar };

            // B. PETICIONES PARALELAS A TU API
            const [resPosts, resGaps, resSeds] = await Promise.all([
                api.get('/Post/GetStructByFeeder', { params }),
                api.get('/Gap/GetByFeeder', { params }),
                api.get('/Sed/GetStructByFeeder', { params })
            ]);

            // C. MAPEO DE DATOS PARA LEAFLET

            // 1. Postes (Pins)
            const rawPosts = resPosts.data || [];
            const cleanPins = rawPosts.map(p => ({
                id: p.IdPoste || p.id,
                elementCode: p.PostCodigo || p.codigo, 
                // Convertimos Lat/Lng a Number y a nombres estándar
                latitude: Number(p.Latitud || p.latitude),
                longitude: Number(p.Longitud || p.longitude),
                status: p.Estado || 'pending', 
                elementType: 'Poste'
            }));

            // 2. Vanos (Gaps)
            const rawGaps = resGaps.data || [];
            const cleanGaps = rawGaps.map(g => ({
                id: g.IdVano || g.id,
                lat1: Number(g.VanoLatitudIni),
                lon1: Number(g.VanoLongitudIni),
                lat2: Number(g.VanoLatitudFin),
                lon2: Number(g.VanoLongitudFin),
                color: '#3b82f6'
            }));

            // 3. Seds (Ubicación)
            const rawSeds = resSeds.data || [];
            const cleanSeds = rawSeds.map(s => ({
                id: s.IdSed || s.id,
                Etiqueta: s.SedEtiqueta,
                latitude: Number(s.Latitud || s.SedLatitud),
                longitude: Number(s.Longitud || s.SedLongitud)
            }));

            setPins(cleanPins);
            setGaps(cleanGaps);
            setSedsData(cleanSeds);

            console.log(`✅ ÉXITO: ${cleanPins.length} Postes, ${cleanGaps.length} Vanos.`);

        } catch (error) {
            console.error("❌ Error API:", error);
            // Limpiar mapa si falla
            setPins([]);
            setGaps([]);
            setSedsData([]);
        } finally {
            setLoadingData(false);
            console.groupEnd();
        }
    };

    cargarRedElectrica();

  }, [selectedFeeder]);

  // =========================================================
  // 4. BÚSQUEDA POR DEFICIENCIA / CÓDIGO
  // =========================================================
  const buscarPorDeficiencia = async (criterio) => {
    if (!criterio) return;
    setLoadingData(true);
    
    // Limpiamos mapa y desmarcamos feeder
    setPins([]); setGaps([]); setSedsData([]);
    _setSelectedFeeder(null); 

    try {
        console.log(`🔍 Buscando: ${criterio}`);
        const params = { codigo: criterio }; 

        const [resPosts, resGaps] = await Promise.all([
            api.get('/Post/GetByDeficiency', { params }), 
            api.get('/Gap/GetByDeficiency', { params })   
        ]);

        const cleanPins = (resPosts.data || []).map(p => ({
            id: p.IdPoste || p.id,
            elementCode: p.PostCodigo,
            latitude: Number(p.Latitud),
            longitude: Number(p.Longitud),
            status: 'deficient',
            elementType: 'Resultado Búsqueda'
        }));

        const cleanGaps = (resGaps.data || []).map(g => ({
            id: g.IdVano,
            lat1: Number(g.VanoLatitudIni),
            lon1: Number(g.VanoLongitudIni),
            lat2: Number(g.VanoLatitudFin),
            lon2: Number(g.VanoLongitudFin),
            color: '#ef4444'
        }));

        setPins(cleanPins);
        setGaps(cleanGaps);

        if(cleanPins.length === 0 && cleanGaps.length === 0) {
            alert("No se encontraron resultados.");
        }

    } catch (error) {
        console.error("Error búsqueda:", error);
    } finally {
        setLoadingData(false);
    }
  };

  // =========================================================
  // 5. SETTERS
  // =========================================================
  const setSelectedFeeder = (feeder) => {
    _setSelectedFeeder(feeder);
    setPins([]); setGaps([]); setSedsData([]);
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
        selectedProject, setSelectedProject,
        feeders, setFeeders,
        selectedFeeder, setSelectedFeeder,
        selectedSed, setSelectedSed,
        pins, setPins,
        gaps, setGaps,
        sedsData, setSedsData,
        loadingData, setLoadingData,
        buscarPorDeficiencia,
        selectedTypification, setSelectedTypification,
        selectedDeficiency, setSelectedDeficiency,
      }}
    >
      {children}
    </DatosContext.Provider>
  );
};

export const useDatos = () => useContext(DatosContext);