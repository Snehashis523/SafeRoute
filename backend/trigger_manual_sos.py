import sys
import asyncio
from app.models.database import SessionLocal
from app.core.escalation import transition_escalation
from app.models.schema import EscalationLevel

async def main():
    db = SessionLocal()
    # Need to run in an event loop for broadcast_state
    transition_escalation(db, "test_trip", EscalationLevel.L3, "manual_sos")
    db.close()

if __name__ == "__main__":
    asyncio.run(main())
