# SafeRoute+

## Deployment Constraints
- **Single Worker Process**: The FastAPI backend MUST be run with a single worker process (`uvicorn app.main:app --workers 1`). This is a hard constraint because all trip state, ping buffers, alert cooldowns, and WebSocket registries are maintained in in-process memory. Using multiple workers will cause silent failures (e.g., check-in timers not firing).
- **No Redis**: All caching and state management have been moved to PostgreSQL and the FastAPI in-process memory to facilitate easier free-tier deployments.
- **No Docker**: As per project requirements, Docker is excluded to simplify hackathon deployment. Services like PostgreSQL, OSRM, and MinIO must be run natively or hosted externally.

