from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.state import trip_websockets, ping_buffers
from datetime import datetime

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
            
            # Store in in-process buffer
            ping_buffers[trip_id].append({
                "ts": datetime.utcnow(),
                **data
            })
            
            # Echo back status
            await websocket.send_json({"status": "received"})
            
    except WebSocketDisconnect:
        trip_websockets[trip_id].remove(websocket)

