import asyncio
import os
from sqlalchemy.orm import Session
from app.models.database import SessionLocal, engine, Base
from app.models.schema import User, TrustedContact, Trip, VoiceConfig
from datetime import datetime

def seed_db():
    print("Seeding database...")
    db = SessionLocal()
    
    # Check if test user exists
    user = db.query(User).filter(User.phone == "+1234567890").first()
    if not user:
        user = User(
            id="test_user_id",
            phone="+1234567890",
            name="Test User",
            created_at=datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Add voice config for test user
    vc = db.query(VoiceConfig).filter(VoiceConfig.user_id == user.id).first()
    if not vc:
        vc = VoiceConfig(
            user_id=user.id,
            safe_word_hash="dummy_safe_hash",
            duress_word_hash="dummy_duress_hash",
            enabled=True
        )
        db.add(vc)
    
    # Add trusted contacts
    if db.query(TrustedContact).filter(TrustedContact.user_id == user.id).count() == 0:
        c1 = TrustedContact(
            id="contact_1",
            user_id=user.id,
            name="Primary Contact",
            phone="+1111111111",
            tier="primary",
            priority=1
        )
        c2 = TrustedContact(
            id="contact_2",
            user_id=user.id,
            name="Secondary Contact",
            phone="+2222222222",
            tier="secondary",
            priority=2
        )
        db.add_all([c1, c2])
    
    # Create test trip
    trip = db.query(Trip).filter(Trip.id == "test_trip").first()
    if not trip:
        trip = Trip(
            id="test_trip",
            user_id=user.id,
            mode="walk",
            status="active",
            started_at=datetime.utcnow()
            # omitting geoms for now since we're just testing the monitoring loop
        )
        db.add(trip)
    else:
        # Reset trip status
        trip.status = "active"
        
    # Clear old escalation state and alerts to ensure clean testing
    from app.models.schema import EscalationState, Alert, AlertCooldown
    db.query(AlertCooldown).filter(AlertCooldown.trip_id == "test_trip").delete()
    db.query(Alert).filter(Alert.trip_id == "test_trip").delete()
    db.query(EscalationState).filter(EscalationState.trip_id == "test_trip").delete()
        
    db.commit()
    db.close()
    print("Seeding complete.")

if __name__ == "__main__":
    seed_db()
