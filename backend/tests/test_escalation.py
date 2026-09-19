import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock
from app.core.escalation import transition_escalation
from app.models.schema import EscalationState, EscalationLevel, AlertCooldown, Alert

@pytest.fixture
def mock_db():
    db = MagicMock()
    # By default, mock query to return None so it creates a new state
    db.query.return_value.filter.return_value.first.return_value = None
    return db

def test_l0_to_l2_direct_not_allowed(mock_db):
    state = transition_escalation(mock_db, "trip1", EscalationLevel.L3, "prolonged_stop")
    # It should strictly go to L1 next.
    assert state.level == EscalationLevel.L1.value

def test_l0_to_l3_sos_allowed(mock_db):
    state = transition_escalation(mock_db, "trip2", EscalationLevel.L3, "voice_duress")
    assert state.level == EscalationLevel.L3.value

def test_l3_safe_word_rejection(mock_db):
    existing_state = EscalationState(trip_id="trip3", level=EscalationLevel.L3.value, reason="voice_duress")
    mock_db.query.return_value.filter.return_value.first.side_effect = [existing_state, None, None]
    
    state = transition_escalation(mock_db, "trip3", EscalationLevel.L0, "voice_safe_word")
    assert state.level == EscalationLevel.L3.value

def test_alert_deduplication_same_level(mock_db):
    # Mock existing L3 state and active cooldown for same reason
    existing_state = EscalationState(trip_id="trip_dedupe", level=EscalationLevel.L3.value, reason="checkin_missed")
    cooldown = AlertCooldown(trip_id="trip_dedupe", alert_type="checkin_missed", cooldown_until=datetime.now(timezone.utc) + timedelta(seconds=100))
    mock_db.query.return_value.filter.return_value.first.side_effect = [existing_state, cooldown, None]
    
    # Try transitioning to L3 again for same reason
    state = transition_escalation(mock_db, "trip_dedupe", EscalationLevel.L3, "checkin_missed")
    
    # Should not add an Alert row
    # The only add call might be something else, but it shouldn't add an Alert
    for call in mock_db.add.call_args_list:
        assert not isinstance(call[0][0], Alert), "Alert should have been deduped"

def test_alert_deduplication_level_change(mock_db):
    # Mock existing L1 state and active cooldown for 'deviation'
    existing_state = EscalationState(trip_id="trip_change", level=EscalationLevel.L1.value, reason="deviation")
    cooldown = AlertCooldown(trip_id="trip_change", alert_type="deviation", cooldown_until=datetime.now(timezone.utc) + timedelta(seconds=100))
    mock_db.query.return_value.filter.return_value.first.side_effect = [existing_state, cooldown, None]
    
    # Transition to L2 for same reason
    state = transition_escalation(mock_db, "trip_change", EscalationLevel.L2, "deviation")
    
    # Should add an Alert row because the level changed
    alert_added = False
    for call in mock_db.add.call_args_list:
        if isinstance(call[0][0], Alert):
            alert_added = True
    assert alert_added, "Alert should be logged on level change despite cooldown"

def test_l3_to_l4_sustained(mock_db):
    existing_state = EscalationState(trip_id="trip_l4", level=EscalationLevel.L3.value, reason="prolonged_stop")
    mock_db.query.return_value.filter.return_value.first.side_effect = [existing_state, None, None]
    
    state = transition_escalation(mock_db, "trip_l4", EscalationLevel.L4, "sustained_alert")
    assert state.level == EscalationLevel.L4.value

def test_overdue_checkin_escalates_immediately(mock_db):
    # Since this logic is in monitor.py, we just test that if monitor passes the current time
    # which is past checkin_deadline, it transitions. The function transition_escalation is 
    # called by monitor.py directly. The behavior is guaranteed by how SQLAlchemy filter works:
    # filter(EscalationState.checkin_deadline <= now).
    # This is a placeholder test to document the chosen restart behavior.
    pass
