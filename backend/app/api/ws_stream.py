from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from app.models.database import get_db, SessionLocal
from app.state import trip_websockets, ping_buffers
from app.models.schema import GpsPing
from geoalchemy2.shape import from_shape
from shapely.geometry import Point
from datetime import datetime
import uuid

router = APIRouter(tags=["WebSocket"])

@router.websocket("/trips/{trip_id}/stream")
async def trip_stream(websocket: WebSocket, trip_id: str):
    await websocket.accept()
    trip_websockets[trip_id].add(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # Expecting GPS ping data here
            # data = {"lat": ..., "lon": ..., "speed": ..., "accuracy": ...}
            
            ts = datetime.utcnow()
            
            # Store in in-process buffer
            ping_buffers[trip_id].append({
                "ts": ts,
                **data
            })
            
            # Also persist to database
            db = SessionLocal()
            try:
                point = Point(data["lon"], data["lat"])
                gps_ping = GpsPing(
                    trip_id=trip_id,
                    ts=ts,
                    geom=from_shape(point, srid=4326),
                    speed=data.get("speed"),
                    accuracy=data.get("accuracy")
                )
                db.add(gps_ping)
                db.commit()
            except Exception as e:
                db.rollback()
                print(f"[WS] Error persisting ping: {e}")
            finally:
                db.close()
            
            # Echo back status
            await websocket.send_json({"status": "received"})
            
    except WebSocketDisconnect:
        trip_websockets[trip_id].discard(websocket)