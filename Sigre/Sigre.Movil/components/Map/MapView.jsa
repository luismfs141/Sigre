// src/components/MapView.jsx

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

// Configurar icono por defecto si usas react-leaflet + leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const defaultCenter = [ -12.0464, -77.0428 ]; // ejemplo Lima

const MapView = ({ markers = [] }) => {
  // Si necesitas algo al montarse
  useEffect(() => {
    // algo opcional, por ejemplo invalidar tamaño si el contenedor cambió de tamaño
  }, []);

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((m, idx) => (
        <Marker key={idx} position={[m.lat, m.lng]}>
          {m.popupText && <Popup>{m.popupText}</Popup>}
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapView;