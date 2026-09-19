from app.core.deviation import check_deviation

def test_low_accuracy_ignored():
    deviation_state = {'consecutive': 0}
    ping = {'lat': 22.5, 'lon': 88.3, 'accuracy': 51.0}
    
    # Mock route doesn't matter much because accuracy gating hits first
    is_unconf, is_conf = check_deviation(ping, None, deviation_state)
    assert not is_unconf
    assert not is_conf
    assert deviation_state['consecutive'] == 0

def test_high_accuracy_processed():
    deviation_state = {'consecutive': 0}
    ping = {'lat': 22.590, 'lon': 88.360, 'accuracy': 49.0}
    
    # Needs valid geometry
    from shapely.geometry import LineString
    from geoalchemy2.shape import from_shape
    mock_route = from_shape(LineString([(88.360, 22.570), (88.375, 22.585)]), srid=4326)
    
    is_unconf, is_conf = check_deviation(ping, mock_route, deviation_state)
    assert is_unconf # Distance is > 100m
    assert deviation_state['consecutive'] == 1
