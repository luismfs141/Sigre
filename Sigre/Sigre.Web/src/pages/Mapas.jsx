import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline,Tooltip, useMap as useLeafletMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// PrimeReact
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { AutoComplete } from 'primereact/autocomplete';
import { Toast } from 'primereact/toast';
import { getIconFromType, getGapColor } from '../utils/mapUtils';

// Hooks & Context
import { useDatos } from '../context/DatosContext';
import { useFeeder, useSedsByFeeder } from '../hooks/useFeeder'; 
import { usePinsBySed } from '../hooks/usePin';
import { useGapsBySed } from '../hooks/useGap'; 

// Fix Leaflet Icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// ✅ COMPONENTE QUE FALTABA
const MapController = ({ coords }) => {
  const map = useLeafletMap();
  useEffect(() => {
    if (coords && coords[0] !== 0) {
        map.flyTo(coords, 19, { duration: 1.5 });
    }
  }, [coords, map]);
  return null;
};

export default function MapaPrincipalWeb() {
  const toast = useRef(null);
  const [flyToCoords, setFlyToCoords] = useState(null);
  
  // UI States
  const [selectedFeeder, setSelectedFeeder] = useState(null);
  const [selectedSed, setSelectedSed] = useState(null); 
  const [filteredSeds, setFilteredSeds] = useState([]);

  // Data Hooks
  const { setPins, setGaps, setTotalPins, pins, gaps } = useDatos(); 
  const { feeders, loading: lFeeders } = useFeeder();
  const { seds: listaSeds, loading: lSeds } = useSedsByFeeder(selectedFeeder);
  const { fetchPinsBySed, loading: lPins } = usePinsBySed();
  const { fetchGapsBySed, loading: lGaps } = useGapsBySed();

  const isLoading = lPins || lGaps || lFeeders;

  // --- FILTRO LOCAL DE SEDs (Evita 404) ---
  const searchSedsLocal = (event) => {
    if (!selectedFeeder || !listaSeds) {
        setFilteredSeds([]);
        return;
    }
    const query = event.query.toLowerCase();
    const filtered = listaSeds.filter(s => 
        (s.sedCodigo || "").toString().toLowerCase().includes(query) || 
        (s.sedEtiqueta || "").toString().toLowerCase().includes(query)
    );
    setFilteredSeds(filtered.map(s => ({
        label: `${s.sedCodigo}`,
        value: s.sedInterno || s.id, // ID 1696
        data: s
    })));
  };

 // En src/screens/MapaPrincipalWeb.jsx

const handleVisualize = async () => {
    console.clear(); // Limpiamos consola para ver claro
    console.group("🚀 [DEBUG] CLICK EN VISUALIZAR");

    // 1. CHEQUEO DE SELECCIÓN
    console.log("1. Objeto selectedSed:", selectedSed);
    
    if (!selectedSed) {
        console.error("❌ selectedSed es NULL. El botón no debería estar activo.");
        toast.current.show({ severity: 'warn', detail: 'Seleccione una SED' });
        console.groupEnd();
        return;
    }

    // 2. EXTRACCIÓN DE ID
    // Intentamos todas las combinaciones posibles donde podría esconderse el ID
    const idSed = selectedSed.value || selectedSed.sedInterno || selectedSed.id || selectedSed.Id;
    console.log("2. ID Extraído:", idSed, "| Tipo:", typeof idSed);

    if (!idSed) {
        console.error("❌ El ID es inválido (0, null o undefined)");
        alert("Error: El ID de la SED es inválido. Revisa la consola."); // Alerta visible
        console.groupEnd();
        return;
    }

    // 3. CHEQUEO DEL CONTEXTO (CRÍTICO)
    // Si setTotalPins es undefined, la app crashea aquí y se resetea todo.
    console.log("3. Verificando Contexto...");
    console.log("   - setPins:", typeof setPins);
    console.log("   - setTotalPins:", typeof setTotalPins); // <--- OJO AQUÍ

    if (typeof setTotalPins !== 'function') {
        console.error("🔥 ERROR FATAL: setTotalPins NO existe en el contexto.");
        alert("ERROR DE CÓDIGO: Faltó agregar 'setTotalPins' en DatosContext.jsx. La app va a fallar.");
    }

    // 4. EJECUCIÓN
    try {
        console.log("4. Iniciando petición a API...");
        
        // Limpiamos UI antes de pedir
        setPins([]); 
        setGaps([]); 
        if (typeof setTotalPins === 'function') setTotalPins([]);

        const [pinesRes, vanosRes] = await Promise.all([
            fetchPinsBySed(idSed),
            fetchGapsBySed(idSed)
        ]);

        console.log("5. RESPUESTA API:", { 
            Pines: pinesRes, 
            Vanos: vanosRes 
        });

        const safePins = pinesRes || [];
        const safeGaps = vanosRes || [];

        // 5. GUARDAR DATOS
        console.log("6. Actualizando estado global...");
        setPins(safePins);
        setGaps(safeGaps);
        if (typeof setTotalPins === 'function') setTotalPins(safePins);

        // 6. MOVER CÁMARA
        if (safePins.length > 0) {
            console.log("7. Moviendo cámara a:", safePins[0].Latitude, safePins[0].Longitude);
            setFlyToCoords([safePins[0].Latitude, safePins[0].Longitude]);
            toast.current.show({ severity: 'success', summary: 'Mapa Cargado', detail: `${safePins.length} postes` });
        } else {
            console.warn("⚠️ API devolvió 0 elementos válidos.");
            toast.current.show({ severity: 'info', summary: 'Vacío', detail: 'La SED existe pero no tiene coordenadas.' });
        }

    } catch (e) {
        console.error("🔥 ERROR EN PROMISE:", e);
        alert("Error al conectar con el servidor: " + e.message);
    } finally {
        console.groupEnd();
    }
};

  return (
    <div className="relative w-full h-screen flex flex-column bg-gray-100 overflow-hidden">
      <Toast ref={toast} />

      {/* PANEL FLOTANTE */}
      <div className="absolute top-0 left-0 m-3 shadow-6 border-round-lg surface-card" style={{ zIndex: 5000, width: '320px', backgroundColor: 'rgba(255,255,255,0.96)' }}>
        <div className="p-3 flex flex-column gap-3">
            <span className="font-bold text-lg text-gray-800">Visualizador GIS</span>
            
            {/* 1. Alimentador */}
            <div className="flex flex-column gap-1">
                <label className="text-xs font-bold text-gray-500">ALIMENTADOR</label>
                <Dropdown 
                    value={selectedFeeder} 
                    onChange={(e) => { setSelectedFeeder(e.value); setSelectedSed(null); }} 
                    options={feeders} 
                    optionLabel="label" 
                    placeholder="Seleccione..." 
                    filter 
                    className="w-full p-inputtext-sm"
                />
            </div>

            {/* 2. SED */}
            <div className="flex flex-column gap-1">
                <label className="text-xs font-bold text-gray-500">CÓDIGO SED</label>
                <AutoComplete 
                    value={selectedSed} 
                    suggestions={filteredSeds} 
                    completeMethod={searchSedsLocal} 
                    field="label" 
                    onChange={(e) => setSelectedSed(e.value)}
                    placeholder="Escribe cód..."
                    dropdown
                    forceSelection
                    className="w-full p-inputtext-sm"
                    disabled={!selectedFeeder}
                />
            </div>

            <Button 
                label={isLoading ? "Cargando..." : "Ver en Mapa"} 
                icon={isLoading ? "pi pi-spin pi-spinner" : "pi pi-bolt"} 
                onClick={handleVisualize}
                disabled={isLoading || !selectedSed}
                className="w-full"
            />
        </div>
      </div>

      {/* MAPA */}
      {/* MAPA */}
      <div className="flex-grow-1 relative" style={{ zIndex: 0 }}>
          <MapContainer center={[-16.409, -71.537]} zoom={13} maxZoom={20} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <MapController coords={flyToCoords} />
            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxNativeZoom={19} 
                maxZoom={20}/>
            
{/* VANOS (Líneas / Cables) */}
{gaps.map((gap, i) => {
    // Leemos las coordenadas
    const p1 = [gap.lat1, gap.lon1];
    const p2 = [gap.lat2, gap.lon2];

    if (!p1[0] || !p2[0]) return null;

    // Leemos los datos extraídos gracias a la corrección del Hook
    const isGapCompletado = gap.inspeccionado === true;
    const gapCode = gap.code || "S/N";

    return (
        <Polyline 
            key={`gap-${gap.code || gap.id || i}`} 
            positions={[p1, p2]} 
            pathOptions={{ 
                color: isGapCompletado ? '#10b981' : '#3b82f6', 
                weight: 5 // Un poco más grueso (5) para que sea más fácil darle clic
            }}
        >
            {/* 1. TOOLTIP: Aparece al pasar el mouse (Hover) */}
            <Tooltip sticky className="font-bold text-xs">
                {gapCode}
            </Tooltip>

            {/* 2. POPUP: Aparece al darle clic a la línea */}
            <Popup>
                <div className="flex flex-column gap-1">
                    <span className="font-bold text-gray-800">Cód Vano: {gapCode}</span>
                    <span className={`text-xs font-bold ${isGapCompletado ? 'text-green-600' : 'text-blue-600'}`}>
                        {isGapCompletado ? 'COMPLETADO' : 'PENDIENTE'}
                    </span>
                </div>
            </Popup>
        </Polyline>
    );
})}

            {/* PINES (Postes) */}
            {pins.map((pin, i) => {
                // Forzamos minúsculas (camelCase de ASP.NET Core) con un respaldo por si acaso
                const lat = pin.latitude ?? pin.Latitude ?? 0;
                const lng = pin.longitude ?? pin.Longitude ?? 0;

                if (lat === 0) return null;
                
                // Extraemos exactamente elementCode e inspeccionado
                const textoCodigo = pin.elementCode ?? pin.ElementCode ?? "S/N";
                const textoEtiqueta = pin.label ?? pin.Label ?? textoCodigo;
                const estaInspeccionado = pin.inspeccionado === true || pin.Inspeccionado === true;

                return (
                    <Marker 
                        key={`pin-${pin.id || pin.Id || i}`} 
                        position={[lat, lng]} 
                        icon={getIconFromType(pin)} 
                    >
                        <Tooltip 
                            direction="top" 
                            offset={[0, -10]} 
                            opacity={0.9} 
                            permanent 
                            className="font-bold text-xs"
                        >
                            {textoEtiqueta}
                        </Tooltip>
                        <Popup>
                            <div className="flex flex-column gap-1">
                                <span className="font-bold text-gray-800">Cód: {textoCodigo}</span>
                                <span className={`text-xs font-bold ${estaInspeccionado ? 'text-green-600' : 'text-blue-600'}`}>
                                    {estaInspeccionado ? 'COMPLETADO' : 'PENDIENTE'}
                                </span>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
          </MapContainer>
      </div>
    </div>
  );
}