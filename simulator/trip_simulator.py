import asyncio
import websockets
import json
import argparse
from datetime import datetime

async def simulate_trip(scenario: str, trip_id: str):
    uri = f"ws://localhost:8000/trips/{trip_id}/stream"
    try:
        async with websockets.connect(uri) as websocket:
            print(f"Connected to {uri} for scenario {scenario}")
            # Mocking ping stream
            for i in range(10):
                ping = {
                    "lat": 22.57 + (i * 0.001),
                    "lon": 88.36 + (i * 0.001),
                    "speed": 1.2,
                    "accuracy": 10.0
                }
                await websocket.send(json.dumps(ping))
                resp = await websocket.recv()
                print(f"Server: {resp}")
                await asyncio.sleep(1)
    except Exception as e:
        print(f"Simulator error: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--scenario", default="normal")
    parser.add_argument("--trip-id", default="test_trip")
    args = parser.parse_args()
    
    asyncio.run(simulate_trip(args.scenario, args.trip_id))

