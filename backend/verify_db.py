import sys
from app.models.database import SessionLocal
from app.models.schema import EscalationState, Alert

def verify_db():
    db = SessionLocal()
    
    state = db.query(EscalationState).filter(EscalationState.trip_id == "test_trip").first()
    print("--- Escalation State ---")
    if state:
        print(f"Level: {state.level}")
        print(f"Reason: {state.reason}")
        print(f"Entered At: {state.entered_at}")
        print(f"Checkin Deadline: {state.checkin_deadline}")
    else:
        print("No state found.")
        
    print("\n--- Alerts Log ---")
    alerts = db.query(Alert).filter(Alert.trip_id == "test_trip").order_by(Alert.triggered_at).all()
    for a in alerts:
        print(f"Level: {a.level}, Reason: {a.type}, Time: {a.triggered_at}")
        
    db.close()

if __name__ == "__main__":
    verify_db()
