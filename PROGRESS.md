# SafeRoute+ Progress Summary

*Last Updated: 2026-09-19*

## Completed Milestones

### 1. Phase A: Infrastructure & Backend Core
- Configured PostgreSQL + PostGIS with environment variable management.
- Defined SQLAlchemy Object Relational Models (`schema.py`).
- Implemented Tiered Escalation state machine (`escalation.py`) for states L0 through L4.
- Built Anomaly Detectors for deviations (>50m) and prolonged stops (`deviation.py`, `stop_detector.py`).
- Handled SOS WebSockets (`ws_stream.py`) and Voice Verification hashes (`voice.py`).
- Wired Background Workers (`monitor.py`) to handle overdue check-in deadlines and sustained escalations independently of active connections.
- Handled deduplication of repeating alert triggers while still logging state tier changes.
- Added 13 Pytests for the escalation engine rules, duplication, check-in deadlines, and duress-word fallback logic.
- Generated distinct share links via `share_token` (urlsafe).

## What is Left to Do (Phase B & Beyond)

### Phase B0: Leftovers
- Completed share token logic.

### Phase B1: Risk Data Pipeline
- Download OSM extract (Geofabrik West Bengal or Kolkata clip).
- `build_static_features.py`: Turn OSM tags (lit, shops, police, transit) into per-H3 res-9 cell features.
- `build_risk_table.py`: Turn features + time-of-day into `risk_cells`. (Note: This is a proxy built from OSM features, not real crime data. High confidence is given to confirmed cells, estimated for neighbor-filled cells).
- Ensure queries return scores with a confidence flag that differ by time bucket.

### Phase B2: Routing and POST /routes/plan
- Precompute OSRM geometry for 5-8 demo origin/destination pairs into a `route_cache` table.
- Update `osrm_client.py` to use config switches (cache, local, public).
- Score cached geometry dynamically using `route_scorer.py` and `time_shift.py`.
- Return 2-3 routes with per-segment scores, overall scores, confidence, and factors.

### Phase B3: Endpoints (Frontend API)
- Auth: register and login (JWT).
- Trips: start, end, list.
- `GET /trips/{id}/escalation` (for reconnect resync).
- `GET /share/{token}` (public, expires when the trip ends).
- Trusted contacts CRUD (primary/secondary).
- `POST /users/voice-config` (stores hashes and salt).
- `POST /trips/{id}/voice-event`, `POST /trips/{id}/checkin`, `POST /trips/{id}/sos`.
- `POST /trips/{id}/report` (Post-trip rating).

### Phase B4: Feedback Loop
- `POST /trips/{id}/report` accepts ratings.
- `aggregator.py` scheduled to adjust H3 cells with damping based on user reports.

### Phase B5: Real Notifications
- Swap mock Twilio/FCM logs for real SDK calls (with mock as a fallback).

### Phase B6: Tests & Acceptance
- Full integration manual testing and pytests for routing scoring.
