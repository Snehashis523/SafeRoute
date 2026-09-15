import httpx
from app.config import settings

async def get_routes(origin: tuple, dest: tuple, mode: str = "driving"):
    """
    Fetch routes from OSRM.
    Supports cached mode via configuration.
    """
    # mode mapping for OSRM
    # if using public router, only driving is supported
    # origin/dest as (lon, lat)
    
    url = f"{settings.OSRM_BASE_URL}/route/v1/{mode}/{origin[0]},{origin[1]};{dest[0]},{dest[1]}?alternatives=true&overview=full&geometries=geojson"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                return data.get("routes", [])
            return []
        except Exception:
            return []

