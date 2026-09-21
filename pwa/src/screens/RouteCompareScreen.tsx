import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet'
import { startTrip } from '../services/api'
import { MAP_DEFAULTS, PREDEFINED_TAGS } from '../services/config'
import { RouteCandidate, RouteSegment } from '../types'

function RouteCompareScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { routes, origin, destination, mode } = location.state as {
    routes: RouteCandidate[]
    origin: [number, number]
    destination: [number, number]
    mode: string
  }
  
  const [selectedRoute, setSelectedRoute] = useState<RouteCandidate | null>(null)
  const [showFactors, setShowFactors] = useState<RouteSegment | null>(null)

  const handleStart = async (route: RouteCandidate) => {
    try {
      const coordinates = route.segments.map(s => ({
        latitude: s.mid[1],
        longitude: s.mid[0],
      }))
      
      const res = await startTrip({
        origin,
        destination,
        mode,
        planned_route_geom: {
          type: 'LineString',
          coordinates: route.segments.map(s => [s.mid[0], s.mid[1]]),
        },
        planned_segments: route.segments,
      })
      
      navigate(`/trip/${res.trip_id}`, { 
        state: { routeCoordinates: coordinates } 
      })
    } catch (e: unknown) {
      alert('Failed to start trip: ' + (e instanceof Error ? e.message : 'Unknown error'))
    }
  }

  const getColor = (score: number) => {
    if (score >= 0.6) return '#2e7d32'
    if (score >= 0.4) return '#f57f17'
    return '#c62828'
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Select Your Route</h2>
        <p>{routes.length} option{routes.length > 1 ? 's' : ''} • Mode: {mode}</p>
      </div>
      
      <div style={styles.mapContainer}>
        <MapContainer center={[-37.8136, 144.9631]} zoom={13} style={{ height: '40vh', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OSM" />
          
          {routes.map((route, i) => (
            <Polyline
              key={i}
              positions={route.segments.map(s => [s.mid[1], s.mid[0]])}
              color={getColor(route.worst_segment_score)}
              weight={3}
              opacity={0.8}
            />
          ))}
        </MapContainer>
      </div>
      
      <div style={styles.routesList}>
        {routes.map((route, i) => (
          <div key={i} style={styles.routeCard}>
            <div style={styles.routeHeader}>
              <div style={{ background: getColor(route.worst_segment_score), padding: '8px 12px', borderRadius: '8px', color: '#fff', fontWeight: 'bold' }}>
                {Math.round(route.worst_segment_score * 100)}%
              </div>
              <div style={{ marginLeft: '12px' }}>
                <p>Worst: {Math.round(route.worst_segment_score * 100)}%</p>
                <p>Avg: {Math.round(route.mean_segment_score * 100)}%</p>
                <p>ETA: {Math.round(route.total_time_sec / 60)} min</p>
              </div>
            </div>
            
            <div style={styles.segments}>
              {route.segments.map((segment, idx) => (
                <div key={idx} style={styles.segment} onClick={() => setShowFactors(segment)}>
                  <div style={{ width: '4px', height: '40px', borderRadius: '2px', background: getColor(segment.score_data?.score ?? 0.5), marginRight: '10px' }} />
                  <div>
                    <p>Segment {idx + 1}</p>
                    <p>{segment.distance}m • Arrive ~{new Date(segment.predicted_arrival).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</p>
                    <p>Score: {Math.round((segment.score_data?.score ?? 0.5) * 100)}%</p>
                  </div>
                  <div style={{ background: getColor(segment.score_data?.score ?? 0.5), padding: '4px 8px', borderRadius: '12px', color: '#fff', fontWeight: 'bold', fontSize: '12px' }}>
                    {Math.round((segment.score_data?.score ?? 0.5) * 100)}%
                  </div>
                </div>
              ))}
            </div>
            
            <button onClick={() => handleStart(route)} style={styles.startBtn}>Start This Route</button>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '16px', maxWidth: '800px', margin: '0 auto' },
  header: { marginBottom: '16px' },
  mapContainer: { marginBottom: '16px', borderRadius: '12px', overflow: 'hidden' },
  routesList: { display: 'flex', flexDirection: 'column' as const, gap: '16px' },
  routeCard: { background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '16px' },
  routeHeader: { display: 'flex', alignItems: 'flex-start', marginBottom: '12px' },
  segments: { marginBottom: '16px' },
  segment: { display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '8px', background: '#fafafa', marginBottom: '8px', cursor: 'pointer' },
  startBtn: { width: '100%', padding: '14px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
}

export default RouteCompareScreen