from app.models.database import SessionLocal
from app.models.schema import EscalationState, EscalationLevel
from app.core.escalation import transition_escalation
import logging
from datetime import datetime, timezone
import asyncio

logger = logging.getLogger(__name__)

async def check_active_trips():
    """
    Scheduled via APScheduler to run every 1-2s.
    Identifies trips in L2/L3 where `checkin_deadline` has passed, and transitions them.
    """
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        # Find states in L2 or L3 that have missed their deadline
        states = db.query(EscalationState).filter(
            EscalationState.level.in_([EscalationLevel.L2.value, EscalationLevel.L3.value]),
            EscalationState.checkin_deadline != None,
            EscalationState.checkin_deadline <= now
        ).all()
        
        for state in states:
            if state.level == EscalationLevel.L2.value:
                logger.info(f"Trip {state.trip_id} missed L2 checkin, escalating to L3.")
                transition_escalation(db, state.trip_id, EscalationLevel.L3, "checkin_missed", now)
            elif state.level == EscalationLevel.L3.value:
                logger.info(f"Trip {state.trip_id} sustained L3, escalating to L4.")
                transition_escalation(db, state.trip_id, EscalationLevel.L4, "sustained_alert", now)
    except Exception as e:
        logger.error(f"Error checking active trips: {e}")
    finally:
        db.close()
