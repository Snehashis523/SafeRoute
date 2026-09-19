def check_prolonged_stop(ping_dict, stop_state, expected_wait_sec=120) -> tuple[bool, bool]:
    speed = ping_dict.get('speed', 0)
    ts = ping_dict.get('ts')
    
    if speed > 1.0:
        stop_state['stopped_since'] = None
        return False, False
        
    if not stop_state.get('stopped_since'):
        stop_state['stopped_since'] = ts
        return True, False # Unconfirmed
        
    dwell_time = (ts - stop_state['stopped_since']).total_seconds()
    return True, dwell_time > expected_wait_sec

