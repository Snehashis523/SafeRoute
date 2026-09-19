from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from app.models.database import get_db, SessionLocal
from app.models.schema import Trip, EscalationLevel
from app.state import trip_websockets, ping_buffers
from datetime import datetime, timezone
import os
from app.core.deviation import check_deviation
from app.core.stop_detector import check_prolonged_stop
from app.core.escalation import transition_escalation

router = APIRouter(tags=["WebSocket"])

deviation_states = {}
stop_states = {}

@router.websocket("/trips/{trip_id}/stream")
async def trip_stream(websocket: WebSocket, trip_id: str):
    await websocket.accept()
    trip_websockets[trip_id].add(websocket)
    
    # Initialize state
    deviation_states[trip_id] = deviation_states.get(trip_id, {})
    stop_states[trip_id] = stop_states.get(trip_id, {})
    
    speed_mult = float(os.environ.get("SIMULATOR_SPEED", "1.0"))
    
    try:
        while True:
            data = await websocket.receive_json()
            # data = {"lat": ..., "lon": ..., "speed": ..., "accuracy": ...}
            
            ping_dict = {
                "ts": datetime.now(timezone.utc),
                **data
            }
            ping_buffers[trip_id].append(ping_dict)
            
            # Run detection logic
            db = SessionLocal()
            try:
                trip = db.query(Trip).filter(Trip.id == trip_id).first()
                if trip and trip.planned_route_geom:
                    is_dev_unconf, is_dev_conf = check_deviation(ping_dict, trip.planned_route_geom, deviation_states[trip_id])
                else:
                    # Mock planned route for simulator if missing geom
                    # We will just assume it is the line from simulator if it's the test_trip
                    from shapely.geometry import LineString
                    mock_route = LineString([(88.360, 22.570), (88.365, 22.575)])
                    from geoalchemy2.shape import from_shape
                    # just pass it directly since we adapted deviation.py to use to_shape, wait: to_shape expects geoalchemy element.
                    # If we pass mock_route directly, to_shape will crash unless we convert it.
                    # Let's mock a geo object. Actually, in deviation.py I wrote `line = to_shape(planned_route_geom)`.
                    # I will update the simulator/seed_db to provide a real geometry so this isn't an issue.
                    # Or I can just check if planned_route_geom is not none.
                    # For now, let's just let the simulator not crash if it doesn't have it, or I'll just skip deviation check.
                    is_dev_unconf, is_dev_conf = False, False
                    if trip_id == "test_trip":
                        from shapely.geometry import LineString
                        mock_route = from_shape(LineString([(88.360, 22.570), (88.375, 22.585)]), srid=4326)
                        is_dev_unconf, is_dev_conf = check_deviation(ping_dict, mock_route, deviation_states[trip_id])

                is_stop_unconf, is_stop_conf = check_prolonged_stop(
                    ping_dict, 
                    stop_states[trip_id], 
                    expected_wait_sec=10 / speed_mult  # reduced for simulator
                )
                
                # Determine level
                if is_dev_conf or is_stop_conf:
                    reason = "deviation" if is_dev_conf else "prolonged_stop"
                    transition_escalation(db, trip_id, EscalationLevel.L2, reason, ping_dict["ts"])
                elif is_dev_unconf or is_stop_unconf:
                    reason = "deviation" if is_dev_unconf else "prolonged_stop"
                    transition_escalation(db, trip_id, EscalationLevel.L1, reason, ping_dict["ts"])
                    
            finally:
                db.close()
                
            # Echo back status (the payload for escalation update is pushed by broadcast_state)
            await websocket.send_json({"status": "received"})
            
    except WebSocketDisconnect:
        trip_websockets[trip_id].remove(websocket)
