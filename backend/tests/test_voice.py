from app.core.voice import handle_voice_event
import hmac

def test_voice_duress():
    # Duress word ignores confidence (even low conf escalates)
    res = handle_voice_event("duress_word", "dummy_hash", 0.4, {"duress_word_hash": "dummy_hash", "safe_word_hash": "safe_hash"})
    assert res == "escalate_l3_silent"

def test_voice_safe_word_high_conf():
    # Safe word with high confidence
    res = handle_voice_event("safe_word", "safe_hash", 0.8, {"duress_word_hash": "dummy_hash", "safe_word_hash": "safe_hash"})
    assert res == "de_escalate"

def test_voice_safe_word_low_conf():
    # Safe word with low confidence must NOT de-escalate
    res = handle_voice_event("safe_word", "safe_hash", 0.5, {"duress_word_hash": "dummy_hash", "safe_word_hash": "safe_hash"})
    assert res == "ignore"

def test_voice_mismatch():
    res = handle_voice_event("duress_word", "wrong_hash", 0.9, {"duress_word_hash": "dummy_hash", "safe_word_hash": "safe_hash"})
    assert res == "ignore"
