from app.models.database import SessionLocal
from app.models.schema import RiskCell
import logging

logger = logging.getLogger(__name__)

def run_aggregator():
    """
    Scheduled via APScheduler.
    Rebuilds `risk_cells` from pings, reports, and incidents.
    """
    logger.info("Running aggregator worker to rebuild risk cells...")
    with SessionLocal() as db:
        # 1. Fetch recent incidents/reports
        # 2. Recompute weights per H3 index, hour, dow
        # 3. Update risk_cells table
        
        # H3 neighbour-fill for cold-start cells
        
        db.commit()
    logger.info("Aggregator finished.")

