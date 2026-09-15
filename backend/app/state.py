from collections import defaultdict, deque
from typing import Dict, Set, Any
from fastapi import WebSocket

# In-process registries to replace Redis

# Active trip runtimes
# trip_id -> TripRuntime (e.g., status, checkin_deadline, etc.)
trip_runtimes: Dict[str, Any] = {}

# GPS ping rolling buffers
# trip_id -> deque(maxlen=N)
ping_buffers: Dict[str, deque] = defaultdict(lambda: deque(maxlen=100))

# WebSocket connections for live-share fan-out
# trip_id -> set of WebSockets
trip_websockets: Dict[str, Set[WebSocket]] = defaultdict(set)

def rehydrate_state_from_db():
    """
    Rebuild in-process state from Postgres on startup so a restart 
    mid-demo recovers correctly.
    """
    # TODO: Implement DB query to load active trips into `trip_runtimes`
    pass

