from geoalchemy2.shape import to_shape
from shapely.geometry import Point, LineString
import math

def calculate_distance(point: Point, line: LineString) -> float:
    # Projection distance in meters. This is simplified; proper ST_Distance with geography is better.
    # Using roughly 1 deg = 111km for quick approximation.
    return point.distance(line) * 111000

def check_deviation(ping_dict, planned_route_geom, deviation_state) -> tuple[bool, bool]:
    """
    Returns (is_unconfirmed_anomaly, is_confirmed_anomaly)
    """
    accuracy = ping_dict.get('accuracy', 0)
    if accuracy > 50.0:
        return False, deviation_state.get('consecutive', 0) >= 3
        
    point = Point(ping_dict['lon'], ping_dict['lat'])
    line = to_shape(planned_route_geom)
    
    distance = calculate_distance(point, line)
    is_deviating = distance > 100.0

    
    if is_deviating:
        deviation_state['consecutive'] = deviation_state.get('consecutive', 0) + 1
    else:
        deviation_state['consecutive'] = max(0, deviation_state.get('consecutive', 0) - 1)
        
    is_confirmed = deviation_state['consecutive'] >= 3
    return is_deviating, is_confirmed

