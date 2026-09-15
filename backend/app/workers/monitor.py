from app.models.database import SessionLocal
import logging

logger = logging.getLogger(__name__)

def check_active_trips():
    """
    Scheduled via APScheduler to run very frequently (e.g. every 5-10s).
    Consumes in-memory ping_buffers, runs deviation/stop detection.
    """
    # This is a stub for the background worker that monitors trips
    pass

