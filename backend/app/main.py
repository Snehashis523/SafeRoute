from fastapi import FastAPI
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.state import rehydrate_state_from_db
from app.workers.aggregator import run_aggregator
from app.workers.monitor import check_active_trips

scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    rehydrate_state_from_db()
    
    # Schedule workers
    scheduler.add_job(run_aggregator, 'interval', minutes=60)
    scheduler.add_job(check_active_trips, 'interval', seconds=1)
    
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(title="SafeRoute+ Backend", lifespan=lifespan)

from app.api import routes_plan, trips, sos, voice, ws_stream

app.include_router(routes_plan.router)
app.include_router(trips.router)
app.include_router(sos.router)
app.include_router(voice.router)
app.include_router(ws_stream.router)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

