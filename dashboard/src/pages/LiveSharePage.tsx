import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const API_BASE = 'http://localhost:8000';

interface LiveTripData {
  id: string;
  status: string;
  origin: [number, number];
  destination: [number, number];
  planned_route_geom?: { coordinates: [number, number][] };
  position?: [number, number];
}

export default function LiveSharePage() {
  const { token } = useParams();
  const [trip, setTrip] = useState<LiveTripData | null>(null);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchTrip = async () => {
      try {
        // token is the trip ID for public share
        const res = await fetch(`${API_BASE}/share/${token}`);
        if (!res.ok) throw new Error('Trip not found or expired');
        const data = await res.json();
        setTrip(data);
        
        if (data.position) setPosition(data.position);
        
        if (data.status !== 'active') {
          setError('Trip ended');
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();

    // WebSocket for live updates
    const ws = new WebSocket(`ws://10.0.2.2:8000/trips/${token}/stream`);
    
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.lat && data.lon) {
          setPosition([data.lat, data.lon]);
        }
        if (data.status) {
          setTrip(prev => prev ? { ...prev, status: data.status } : null);
        }
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };

    ws.onclose = () => {
      if (trip?.status === 'active') {
        // Reconnect
        setTimeout(() => fetchTrip(), 3000);
      }
    };

    return () => { ws.close(); };
  }, [token]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ border: '3px solid #1976d2', borderTopColor: 'transparent', borderRadius: '50%', width: '40px', height: '40px', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
          <p>Loading live location...</p>
        </div>
      )
    );
  }

  if (error || !trip || trip.status !== 'active') {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        fontFamily: 'system-ui',
        background: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', maxWidth: '400px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📍</div>
          <h1 style={{ margin: '0 0 12px', color: '#1a1a1a' }}>Trip Ended</h1>
          <p style={{ color: '#666', lineHeight: '1.6', margin: 0 }}>
            This trip is no longer active. The live location sharing has expired.
          </p>
        </div>
      </div>
    );
  }

  const routeCoords = trip.planned_route_geom?.coordinates || [];
  const center = position || trip.origin;

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <MapContainer 
        center={center} 
        zoom={14} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Planned Route */}
        {routeCoords.length > 1 && (
          <Polyline
            positions={routeCoords.map(([lon, lat]) => [lat, lon] as [number, number])}
            color="#1976d2"
            weight={3}
            opacity={0.8}
            dashArray="5, 10"
          />
        )}

        {/* Current Position */}
        {position && (
          <Marker position={position} icon={
            {
              iconUrl: 'data:image/svg+xml;base64,' + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
                  <circle cx="12" cy="12" r="8" fill="#1976d2"/>
                  <circle cx="12" cy="12" r="4" fill="white"/>
                </svg>
              `),
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            }
          }>
            <div style={{ background: 'rgba(0,0,0,0.8)', color: 'white', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', whiteSpace: 'nowrap' }}>
              Live Location
            </div>
          </Marker>
        )}

        {/* Origin/Destination Markers */}
        {trip.origin && (
          <Marker position={[trip.origin[1], trip.origin[0]]} icon={
            { iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', iconSize: [25, 41], iconAnchor: [12, 41] }
          }>
            <div style={{ background: 'rgba(0,0,0,0.8)', color: 'white', padding: '6px 10px', borderRadius: '4px', fontSize: '11px' }}>Start</div>
          </Marker>
        )}
        {trip.destination && (
          <Marker position={[trip.destination[1], trip.destination[0]]} icon={
            { iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', iconSize: [25, 41], iconAnchor: [12, 41] }
          }>
            <div style={{ background: 'rgba(0,0,0,0.8)', color: 'white', padding: '6px 10px', borderRadius: '4px', fontSize: '11px' }}>Destination</div>
          </Marker>
        )}
      </MapContainer>

      {/* Status Bar */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'space-between',
        padding: 0 16,
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ fontWeight: '600', color: '#1a1a1a' }}>Live Location Sharing</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: 2 }}>
            Trip: {trip.id.slice(0, 8)}... • Mode: Active
          </div>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ 
            width: '10px', height: '10px', borderRadius: '50%', 
            background: trip.status === 'active' ? '#2e7d32' : '#c62828',
            animation: trip.status === 'active' ? 'pulse 2s infinite' : 'none'
          }} />
          <span style={{ fontSize: '13px', fontWeight: '500', textTransform: 'capitalize' }}>
            {trip.status}
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}
    </div>
  );
}