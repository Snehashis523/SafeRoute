from datetime import datetime
from sqlalchemy.orm import Session
from app.core.risk_engine import score_cell
from app.core.time_shift import estimate_arrival_times

def score_candidate_route(db: Session, route: dict, depart_at: datetime, mode: str) -> dict:
    """
    Implements the time-aware scoring logic.
    route: raw geometry from OSRM mapped to roughly 200m segments
    """
    segments = route.get("segments", [])
    if not segments:
        return {"score": 0.0, "confidence": "estimated", "factors": {}}
        
    time_shifted = estimate_arrival_times(segments, depart_at, mode)
    
    segment_scores = []
    for seg in time_shifted:
        h3_idx = seg.get("h3_index", "8928308280fffff") # placeholder H3
        score_data = score_cell(db, h3_idx, seg["predicted_arrival"])
        seg["score_data"] = score_data
        segment_scores.append(score_data["score"])
        
    worst_score = min(segment_scores) if segment_scores else 0.0
    mean_score = sum(segment_scores)/len(segment_scores) if segment_scores else 0.0
    
    return {
        "worst_segment_score": worst_score,
        "mean_segment_score": mean_score,
        "segments": time_shifted,
        "total_time_sec": route.get("duration", 0)
    }

def rank_routes(scored_routes: list) -> list:
    """
    Sorts routes based on lexicographic key:
    (worst_segment_score, mean_segment_score, -total_time_sec)
    Assuming higher score is safer.
    """
    def sort_key(r):
        return (r["worst_segment_score"], r["mean_segment_score"], -r["total_time_sec"])
        
    return sorted(scored_routes, key=sort_key, reverse=True)

