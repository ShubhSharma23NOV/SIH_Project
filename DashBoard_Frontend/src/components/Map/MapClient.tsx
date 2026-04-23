'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useRef } from 'react';

// Fix for default marker icons in React Leaflet
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41]
});

// Sample data for water sources
const waterSources = [
  { id: 1, name: 'Village Well #1', position: [20.5937, 78.9629], status: 'Good', lastChecked: '2 hours ago' },
  { id: 2, name: 'Community Tank', position: [20.6037, 78.9529], status: 'Warning', lastChecked: '1 hour ago' },
  { id: 3, name: 'River Source', position: [20.5837, 78.9729], status: 'Critical', lastChecked: '30 minutes ago' },
];

const MapClient = () => {
  const mapRef = useRef(null);
  const center: [number, number] = [20.5937, 78.9629]; // Center of India

  return (
    <div className="map-container">
      <MapContainer 
        center={center} 
        zoom={6} 
        style={{ height: '100%', width: '100%', borderRadius: '8px' }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {waterSources.map((source) => (
          <Marker 
            key={source.id} 
            position={source.position as [number, number]} 
            icon={defaultIcon}
          >
            <Popup>
              <div>
                <h4>{source.name}</h4>
                <p>Status: <strong>{source.status}</strong></p>
                <p>Last checked: {source.lastChecked}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapClient;
