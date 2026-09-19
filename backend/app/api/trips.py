from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.schema import Trip, EscalationLevel
from app.schemas.core import TripStartRequest
from app.deps import get_current_user
import uuid
import secrets
from datetime import datetime, timezone
from geoalchemy2.shape import from_shape
from shapely.geometry import Point, LineString

router = APIRouter(prefix="/trips", tags=["Trips"])

@router.post("/start")
async def start_trip(req: TripStartRequest, db: Session = Depends(get_db), user_id: str = Depends(get_current_user)):
    trip_id = str(uuid.uuid4())
    
    origin_pt = Point(req.origin[0], req.origin[1])
    dest_pt = Point(req.destination[0], req.destination[1])
    
    trip = Trip(
        id=trip_id,
        user_id=user_id,
        origin_geom=from_shape(origin_pt, srid=4326),
        dest_geom=from_shape(dest_pt, srid=4326),
        mode=req.mode,
        planned_segments=req.planned_segments,
        started_at=datetime.now(timezone.utc),
        status="active",
        share_token=secrets.token_urlsafe(24)
    )
    
    db.add(trip)
    db.commit()
    
    # Initialize in-process state
    from app.state import trip_runtimes
    trip_runtimes[trip_id] = {
        "status": "active",
        "started_at": datetime.now(timezone.utc)
    }
    
    # Return WebSocket token (for simplicity using trip_id as token here)
    return {"trip_id": trip_id, "ws_token": trip_id}

@router.get("/{trip_id}/escalation")
async def get_escalation(trip_id: str, db: Session = Depends(get_db)):
    from app.models.schema import EscalationState
    state = db.query(EscalationState).filter(EscalationState.trip_id == trip_id).first()
    if not state:
        return {"level": EscalationLevel.L0.value, "reason": "normal"}
    return {"level": state.level, "reason": state.reason}

