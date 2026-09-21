import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet'
import { useLocation } from '../hooks/useLocation'
import { planRoute } from '../services/api'
import { formatCoords } from '../services/location'
import { MAP_DEFAULTS } from '../services/config'
import type { LeafletMouseEvent, Map as LeafletMap } from 'leaflet'

function PlanScreen() {
  const navigate = useNavigate()
  const [origin, setOrigin] = useState<[number, number] | null>(null)
  const [destination, setDestination] = useState<[number, number] | null>(null)
  const [mode, setMode] = useState<'walk' | 'drive'>('walk')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { start, location: currentLoc } = useLocation()
  const mapRef = useRef<LeafletMap | null>(null)

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return
    const containerPoint = mapRef.current.containerPointToLayerPoint([e.nativeEvent.offsetX, e.nativeEvent.offsetY])
    const latlng = mapRef.current.layerPointToLatLng(containerPoint)
    const { lat, lng } = latlng
    if (!origin) {
      setOrigin([lng, lat])
    } else if (!destination) {
      setDestination([lng, lat])
    }
  }

  const handlePlan = async () => {
    if (!origin || !destination) {
      setError('Please select both origin and destination on the map')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const routes = await planRoute({
        origin,
        destination,
        mode,
        depart_at: new Date().toISOString(),
      })
      
      navigate('/compare', { 
        state: { routes, origin, destination, mode } 
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to plan route')
    } finally {
      setLoading(false)
    }
  }

  const useCurrentLocation = () => {
    if (currentLoc) {
      if (!origin) setOrigin([currentLoc.lon, currentLoc.lat])
      else if (!destination) setDestination([currentLoc.lon, currentLoc.lat])
    } else {
      start()
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' as const }}>
      <div style={styles.header}>
        <h1>Plan Your Route</h1>
      </div>
      
      <div style={styles.mapContainer} onClick={handleMapClick}>
        <MapContainer 
          ref={mapRef}
          center={currentLoc ? [currentLoc.lat, currentLoc.lon] : MAP_DEFAULTS.center} 
          zoom={MAP_DEFAULTS.zoom}
          style={styles.map}
        >
          <TileLayer
            attribution={MAP_DEFAULTS.attribution}
            url={MAP_DEFAULTS.tileUrl}
          />
          
          {origin && (
            <Marker position={[origin[1], origin[0]]}>
              <div>Origin</div>
            </Marker>
          )}
          
          {destination && (
            <Marker position={[destination[1], destination[0]]}>
              <div>Destination</div>
            </Marker>
          )}
        </MapContainer>
        
        <div style={styles.overlay}>
          <div style={styles.info}>
            <div style={styles.coordRow}>
              <span style={styles.label}>Origin:</span>
              <span>{origin ? formatCoords(origin[1], origin[0]) : 'Tap to set'}</span>
            </div>
            <div style={styles.coordRow}>
              <span style={styles.label}>Destination:</span>
              <span>{destination ? formatCoords(destination[1], destination[0]) : 'Tap to set'}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div style={styles.controls}>
        <div style={styles.modeRow}>
          <button
            style={{ ...styles.modeBtn, ...(mode === 'walk' ? styles.modeBtnActive : {}) }}
            onClick={() => setMode('walk')}
          >
            🚶 Walk
          </button>
          <button
            style={{ ...styles.modeBtn, ...(mode === 'drive' ? styles.modeBtnActive : {}) }}
            onClick={() => setMode('drive')}
          >
            🚗 Drive
          </button>
        </div>
        
        <button 
          style={styles.currentLocBtn}
          onClick={useCurrentLocation}
          disabled={loading}
        >
          📍 Use Current Location
        </button>
        
        {error && <div style={styles.error}>{error}</div>}
        
        <button 
          style={styles.submitBtn}
          onClick={handlePlan}
          disabled={loading || !origin || !destination}
        >
          {loading ? 'Planning...' : 'Find Routes'}
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    padding: '16px',
    background: '#fff',
    borderBottom: '1px solid #eee',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 100,
  },
  info: {
    background: 'rgba(255,255,255,0.95)',
    padding: '12px 16px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  coordRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '13px',
  },
  label: {
    fontWeight: '600',
    color: '#333',
  },
  controls: {
    padding: '16px',
    background: '#fff',
    borderTop: '1px solid #eee',
  },
  modeRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  modeBtn: {
    flex: 1,
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    background: '#fafafa',
    fontSize: '16px',
    fontWeight: '500',
  },
  modeBtnActive: {
    borderColor: '#1976d2',
    background: '#e3f2fd',
    color: '#1976d2',
  },
  currentLocBtn: {
    width: '100%',
    padding: '12px',
    marginBottom: '12px',
    background: '#e3f2fd',
    color: '#1976d2',
    border: '1px solid #1976d2',
    borderRadius: '8px',
    fontWeight: '600',
  },
  error: {
    color: '#c62828',
    marginBottom: '12px',
    textAlign: 'center',
    fontSize: '14px',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    background: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
  },
  submitBtnDisabled: {
    background: '#90caf9',
  },
}

export default PlanScreen