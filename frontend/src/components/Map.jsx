// src/components/Map.jsx (CORREGIDO)

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import MarkerPopup from './MarkerPopup';

// --- Iconos personalizados (bikeIcon y barIcon) ---
const bikeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
const barIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
// -------------------------------------------------


function Map({ markers, children, onProximitySearch }) {
  const mapCenter = [41.3851, 2.1734];

  return (
    <MapContainer 
      center={mapCenter} 
      zoom={13} 
      className="leaflet-container" 
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {children}

      {/* --- ESTA ES LA CORRECCIÓN --- */}
      {markers
        .filter(marker => {
          // 1. Primero filtramos los marcadores que NO tienen coordenadas
          const hasCoords = marker.latitude && marker.longitude;
          if (!hasCoords) {
            console.warn('Marcador omitido por falta de coordenadas (filtrado):', marker);
          }
          return hasCoords;
        })
        .map((marker) => { 
          // 2. Ahora solo mapeamos los marcadores VÁLIDOS
          const position = [marker.latitude, marker.longitude];
          const isBike = marker.type === 'bike';

          return (
            <Marker 
              key={marker.uri} // 3. Usamos marker.uri como key (es único y estable)
              position={position} 
              icon={isBike ? bikeIcon : barIcon}
            >
              <Popup>
                <MarkerPopup 
                  marker={marker} 
                  onProximitySearch={onProximitySearch}
                />
              </Popup>
            </Marker>
          );
        })}
      {/* --- FIN DE LA CORRECCIÓN --- */}
      
    </MapContainer>
  );
}

export default Map;