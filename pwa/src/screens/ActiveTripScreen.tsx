import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet'
import { useTrip } from '../hooks/useTrip'
import { useShake } from '../hooks/useShake'
import { useVoice } from '../hooks/useVoice'
import { useNotifications } from '../hooks/useNotifications'
import { ESCALATION_COLORS, ESCALATION_LABELS } from '../services/config'

function ActiveTripScreen() {
  const { tripId } = useParams<{ tripId: string }>()
  const { 
    trip, 
    escalation, 
    connected, 
    fetchEscalation, 
    handleCheckin, 
    handleSOS, 
    handleVoiceEvent, 
    sendPing 
  } = useTrip(tripId || null)
  
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([])
  const [showCheckin, setShowCheckin] = useState(false)
  const [countdown, setCountdown] = useState(0)
  
  const { setHandler } = useVoice()
  const { notify } = useNotifications()
  
  const { active: shakeActive, start: startShake, stop: stopShake } = useShake(() => handleSOS(), true)

  // Get route coordinates from navigation state
  useEffect(() => {
    // In real app, this would come from navigation state
    // For now, using placeholder
  }, [])

  // Start location updates
  // useLocation hook would be used here in real implementation

  // Shake to SOS
  useEffect(() => {
    startShake()
    return () => stopShake()
  }, [])

  // Check-in countdown
  useEffect(() => {
    if (escalation?.level === 'L2_Checkin' && escalation.checkin_deadline) {
      setShowCheckin(true)
      const update = () => {
        const remaining = Math.max(0, Math.ceil((escalation.checkin_deadline! - Date.now()) / 1000))
        setCountdown(remaining)
        if (remaining <= 0) {
          // Auto-escalate handled by backend
        }
      }
      update()
      const interval = setInterval(update, 1000)
      return () => clearInterval(interval)
    } else {
      setShowCheckin(false)
    }
  }, [escalation])

  // Voice handler
  useEffect(() => {
    setHandler(async (event) => {
      if (event.kind === 'checkin_spoken') {
        await handleCheckin('voice')
      } else {
        await handleVoiceEvent(event.kind as 'duress_word' | 'safe_word' | 'checkin_spoken', event.confidence)
      }
    })
  }, [setHandler, handleCheckin, handleVoiceEvent])

  const isDuress = escalation?.level === 'L3_Alert' && (escalation as { trigger_source?: string }).trigger_source === 'voice_duress'
  const displayLevel = isDuress ? 'L0_Normal' : (escalation?.level || 'L0_Normal')
  const displayColor = ESCALATION_COLORS[displayLevel as keyof typeof ESCALATION_COLORS] || '#2e7d32'

  return (
    <div style={styles.container}>
      {displayLevel !== 'L0_Normal' && displayLevel !== 'L1_Watch' && !isDuress && (
        <div style={{ ...styles.banner, background: displayColor }}>
          <span>{ESCALATION_LABELS[displayLevel as keyof typeof ESCALATION_LABELS]}</span>
          {countdown > 0 && <span>{countdown}s</span>}
        </div>
      )}
      
      <div style={styles.mapContainer}>
        <MapContainer center={position || [22.57, 88.36]} zoom={15} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OSM" />
          
          {routeCoordinates.length > 0 && (
            <Polyline positions={routeCoordinates.map(([lat, lon]) => [lat, lon])} color="#1976d2" weight={3} />
          )}
          
          {position && (
            <Marker position={position}>
              <div>Current Position</div>
            </Marker>
          )}
        </MapContainer>
      </div>
      
      <div style={styles.footer}>
        <button onClick={handleSOS} style={styles.sosBtn}>SOS</button>
      </div>
      
      {showCheckin && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3>Are you okay?</h3>
            <p>{countdown}s remaining</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => handleCheckin('tap')}>I'm Okay</button>
              <button onClick={() => handleCheckin('voice')}>Speak "I'm Fine"</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { flex: 1, display: 'flex', flexDirection: 'column' as const },
  banner: { padding: '12px', textAlign: 'center', color: '#fff', fontWeight: 'bold' },
  mapContainer: { flex: 1 },
  footer: { padding: '16px', background: '#fff', borderTop: '1px solid #eee' },
  sosBtn: { width: '100%', padding: '16px', background: '#c62828', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 },
  modal: { background: '#fff', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '400px', textAlign: 'center' },
}

export default ActiveTripScreen