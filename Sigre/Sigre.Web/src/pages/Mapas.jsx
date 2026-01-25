import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- PRIMEREACT ---
import { ProgressSpinner } from 'primereact/progressspinner'; // Spinner bonito
import { Toast } from 'primereact/toast'; // Notificaciones flotantes

// 1. CONTEXTO Y COMPONENTES
import { useDatos } from '../context/DatosContext';
import SelectorAlimentador from '../components/SelectorAlimentador';

// 2. FIX DE ICONOS DE LEAFLET
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// --- ICONOS PERSONALIZADOS ---
const createPosteIcon = (color) => {
  return L.divIcon({
    className: 'custom-pin',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [14, 14], iconAnchor: [7, 7]
  });
};

const sedIcon = L.divIcon({
  className: 'custom-sed',
  html: `<div style="background-color: #7c3aed; width: 26px; height: 26px; border-radius: 4px; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px;">SED</div>`,
  iconSize: [26, 26], iconAnchor: [13, 13]
});

// --- COMPONENTE DE AUTO-CENTRADO ---
const RecenterMap = ({ pins, seds }) => {
    const map = useMap();
    useEffect(() => {
        if (seds && seds.length > 0) {
            console.log("🗺️ Centrando mapa en Subestación:", seds[0].latitude, seds[0].longitude);
            const lat = Number(seds[0].latitude);
            const lng = Number(seds[0].longitude);
            if(lat && lng) map.setView([lat, lng], 14);
        } else if (pins && pins.length > 0) {
            console.log("🗺️ Centrando mapa en primer Poste:", pins[0].latitude, pins[0].longitude);
            map.setView([pins[0].latitude, pins[0].longitude], 14);
        }
    }, [pins, seds, map]);
    return null;
};

const Mapas = () => {
  const toast = useRef(null); // Referencia para notificaciones PrimeReact

  // 3. CONSUMIR DATOS
  const { 
    selectedFeeder,    
    pins,              
    gaps,              
    sedsData,          
    loadingData        
  } = useDatos();

  // =============================================================
  // 🕵️‍♂️ DEBUGGING LOGS (AQUÍ VEREMOS QUÉ PASA)
  // =============================================================
  useEffect(() => {
    // Solo logueamos si hay actividad para no ensuciar la consola
    if (loadingData) {
        console.log("⏳ [Mapas] Estado: CARGANDO DATOS...");
    } else {
        if (selectedFeeder) {
            console.group("📍 [Mapas] Reporte de Datos Recibidos");
            console.log("⚡ Alimentador Seleccionado:", selectedFeeder.label);
            console.log(`📌 Postes (Pins): ${pins.length}`);
            console.log(`📏 Vanos (Gaps): ${gaps.length}`);
            console.log(`🏢 Subestaciones (Seds): ${sedsData.length}`);
            
            // Verificamos si los datos tienen coordenadas válidas
            if (pins.length > 0) {
                console.log("🔍 Ejemplo primer poste:", pins[0]);
                if (!pins[0].latitude || !pins[0].longitude) {
                    console.error("❌ ALERTA: Los postes no tienen latitud/longitud válidas.");
                }
            }
            console.groupEnd();

            // Notificación visual con PrimeReact
            if (pins.length === 0 && gaps.length === 0 && !loadingData) {
                toast.current.show({severity:'warn', summary: 'Sin Datos', detail:'El alimentador seleccionado no tiene postes ni líneas georeferenciadas.', life: 3000});
            } else if (pins.length > 0) {
                // Solo mostramos éxito si es la primera vez que cargan (opcional)
                // toast.current.show({severity:'success', summary: 'Datos Cargados', detail:`Se visualizaron ${pins.length} postes.`, life: 3000});
            }
        }
    }
  }, [selectedFeeder, pins, gaps, sedsData, loadingData]);


  // Función Colores
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'deficient': return '#ef4444'; 
      case 'pending':   return '#3b82f6'; 
      case 'inspected': return '#22c55e'; 
      default:          return '#9ca3af'; 
    }
  };

  return (
    <div className="flex flex-col h-screen w-full relative">
      
      {/* Toast de PrimeReact para notificaciones */}
      <Toast ref={toast} />

      {/* HEADER */}
      <div className="bg-white p-4 shadow-sm z-10 flex justify-between items-center border-b h-16">
        <h1 className="text-xl font-bold text-gray-800 truncate">
          Mapa de Infraestructura
          {selectedFeeder && <span className="text-blue-600 ml-2 font-normal text-base">- {selectedFeeder.label || selectedFeeder.AlimEtiqueta}</span>}
        </h1>
      </div>

      {/* BODY */}
      <div className="flex-1 relative bg-gray-100">

        {/* 1. SELECTOR FLOTANTE */}
        <div className="absolute top-4 right-4 z-[1000]">
           <SelectorAlimentador />
        </div>

        {/* 2. SPINNER PRIMEREACT (Centrado) */}
        {loadingData && (
          <div className="absolute inset-0 z-[1000] bg-white/50 flex flex-col items-center justify-center backdrop-blur-sm">
             <ProgressSpinner style={{width: '50px', height: '50px'}} strokeWidth="4" fill="var(--surface-ground)" animationDuration=".5s" />
             <span className="mt-3 font-semibold text-gray-700 bg-white px-3 py-1 rounded shadow">Cargando Red...</span>
          </div>
        )}

        {/* 3. MAPA */}
        <MapContainer 
            center={[-16.3988, -71.5350]} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
            zoomSnap={0.5}          
            zoomDelta={0.5}          
            wheelPxPerZoomLevel={120}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OSM'
            />

            <RecenterMap pins={pins} seds={sedsData} />

            {/* SEDS */}
            {sedsData && sedsData.map((sed, i) => (
                 <Marker 
                    key={`sed-${i}`}
                    position={[Number(sed.latitude), Number(sed.longitude)]}
                    icon={sedIcon}
                 >
                    <Popup><div className="text-center"><strong>SUBESTACIÓN</strong><br/>{sed.Etiqueta}</div></Popup>
                 </Marker>
            ))}

            {/* GAPS */}
            {gaps.map((gap, i) => (
                <Polyline 
                    key={`gap-${i}`}
                    positions={[[gap.lat1, gap.lon1], [gap.lat2, gap.lon2]]}
                    pathOptions={{ color: gap.color || '#3b82f6', weight: 2, opacity: 0.8 }}
                />
            ))}

            {/* PINS */}
            <MarkerClusterGroup 
                chunkedLoading 
                showCoverageOnHover={false} 
                maxClusterRadius={60}
                spiderfyOnMaxZoom={true}
            >
                {pins.map((pin, index) => (
                    <Marker
                        key={`pin-${pin.id || index}`}
                        position={[pin.latitude, pin.longitude]}
                        icon={createPosteIcon(getStatusColor(pin.status))}
                    >
                        <Popup>
                            <div className="text-sm font-sans min-w-[150px]">
                                <strong className="text-base text-gray-800">{pin.elementCode}</strong>
                                <hr className="my-1"/>
                                <div className="text-xs text-gray-500">Tipo: {pin.elementType}</div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MarkerClusterGroup>

        </MapContainer>
      </div>
    </div>
  );
};

export default Mapas;