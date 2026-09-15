import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function LiveSharePage() {
  const { token } = useParams();
  const [tripStatus, setTripStatus] = useState('active');
  const [position, setPosition] = useState<[number, number] | null>([22.57, 88.36]);

  useEffect(() => {
    // connect to WS to get live updates for this token/trip
    // const ws = new WebSocket(`ws://localhost:8000/trips/${token}/stream`);
    // ws.onmessage = (e) => { ... }
  }, [token]);

  if (tripStatus !== 'active') {
    return <div style={{ padding: '20px', fontFamily: 'sans-serif' }}><h1>This trip has ended.</h1></div>;
  }

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <MapContainer center={[22.57, 88.36]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {position && <Marker position={position} />}
      </MapContainer>
    </div>
  );
}

