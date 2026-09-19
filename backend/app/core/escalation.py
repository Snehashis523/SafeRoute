from datetime import datetime, timezone, timedelta
import asyncio
import os
import uuid
from sqlalchemy.orm import Session
from app.models.schema import EscalationState, EscalationLevel, Alert, AlertCooldown, Trip
from app.config import settings
from app.state import trip_websockets

async def broadcast_state(trip_id: str, state_dict: dict):
    websockets = trip_websockets.get(trip_id, set())
    for ws in websockets.copy():
        try:
            await ws.send_json(state_dict)
        except Exception:
            pass

def transition_escalation(db: Session, trip_id: str, new_level: EscalationLevel, reason: str, ts: datetime = None):
    if not ts:
        ts = datetime.now(timezone.utc)
        
    state = db.query(EscalationState).filter(EscalationState.trip_id == trip_id).first()
    if not state:
        state = EscalationState(trip_id=trip_id, level=EscalationLevel.L0.value, entered_at=ts)
        db.add(state)
        
    current = EscalationLevel(state.level)
    
    # 1. Reject safe word clearing a duress-triggered L3
    if new_level == EscalationLevel.L0 and current == EscalationLevel.L3 and state.reason == "voice_duress":
        return state
        
    # 2. Validate transition
    if new_level == EscalationLevel.L3 and reason in ["voice_duress", "manual_sos"]:
        # Always allow jumping to L3 for SOS
        pass
    elif new_level == EscalationLevel.L4 and current == EscalationLevel.L3:
        # L3 -> L4 timer triggered
        pass
    elif new_level == EscalationLevel.L0:
        # User manually cleared
        state.checkin_deadline = None
    elif new_level.value > current.value:
        # Enforce step-by-step for detector-driven
        expected_next_idx = list(EscalationLevel).index(current) + 1
        if expected_next_idx < len(EscalationLevel) and list(EscalationLevel)[expected_next_idx].value < new_level.value:
            # Force to go only one step up at a time
            new_level = list(EscalationLevel)[expected_next_idx]
    elif new_level.value < current.value and new_level != EscalationLevel.L0:
        return state
            
    if new_level.value == state.level:
        return state # no change
        
    # Apply new level
    state.level = new_level.value
    state.entered_at = ts
    state.reason = reason
    
    speed_mult = float(os.environ.get("SIMULATOR_SPEED", "1.0"))
    
    if new_level == EscalationLevel.L2:
        state.checkin_deadline = ts + timedelta(seconds=settings.CHECKIN_WINDOW_SEC / speed_mult)
    elif new_level == EscalationLevel.L3:
        state.checkin_deadline = ts + timedelta(seconds=settings.ESCALATION_SUSTAINED_SEC / speed_mult)
    else:
        state.checkin_deadline = None
        
    # Deduplicate alerts
    cooldown = db.query(AlertCooldown).filter(
        AlertCooldown.trip_id == trip_id, 
        AlertCooldown.alert_type == reason
    ).first()
    
    should_alert = False
    if new_level.value != current.value or not cooldown or cooldown.cooldown_until < ts:
        should_alert = True
        
    if should_alert:
        alert = Alert(id=str(uuid.uuid4()), trip_id=trip_id, level=new_level.value, type=reason, triggered_at=ts)
        db.add(alert)
        new_cooldown_time = ts + timedelta(seconds=settings.ALERT_COOLDOWN_SEC / speed_mult)
        if cooldown:
            cooldown.cooldown_until = new_cooldown_time
        else:
            db.add(AlertCooldown(trip_id=trip_id, alert_type=reason, cooldown_until=new_cooldown_time))
            
    db.commit()
    
    # Broadcast to websocket
    source_map = {
        "voice_duress": "voice",
        "manual_sos": "tap",
        "checkin_missed": "timer",
        "sustained_alert": "timer"
    }
    source = source_map.get(reason, "system")

    payload = {
        "type": "escalation_update",
        "level": state.level,
        "reason": state.reason,
        "source": source
    }
    
    # Mock Twilio/FCM logging
    if should_alert:
        trip = db.query(Trip).filter(Trip.id == trip_id).first()
        share_url = f"{settings.PUBLIC_BASE_URL}/share/{trip.share_token}" if trip and trip.share_token else "link"
        
        if new_level == EscalationLevel.L2:
            print(f"[MOCK TWILIO/FCM] Soft heads-up SMS/Push to PRIMARY contacts for trip {trip_id}: 'SafeRoute+ noticed something unusual... No action needed yet.'")
        elif new_level == EscalationLevel.L3:
            print(f"[MOCK TWILIO/FCM] Full SMS/Push to ALL contacts for trip {trip_id}: 'EMERGENCY: User might be in danger. Live location: {share_url}'")
        elif new_level == EscalationLevel.L4:
            print(f"[MOCK TWILIO/FCM] Re-notifying ALL contacts for trip {trip_id} + nearest police station info + explicit prompt to contact authorities")

    try:
        loop = asyncio.get_running_loop()
        loop.create_task(broadcast_state(trip_id, payload))
    except RuntimeError:
        pass
        
    return state
