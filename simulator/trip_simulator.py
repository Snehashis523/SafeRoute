import asyncio
import websockets
import json
import argparse
import os
import aiohttp
from datetime import datetime

async def simulate_trip(scenario: str, trip_id: str, speed: float):
    scenario_file = os.path.join(os.path.dirname(__file__), "scenarios", f"{scenario}.json")
    with open(scenario_file, "r") as f:
        events = json.load(f)

    uri = f"ws://localhost:8000/trips/{trip_id}/stream"
    try:
        async with websockets.connect(uri) as websocket:
            print(f"Connected to {uri} for scenario {scenario}")
            
            # Start a background task to receive messages from the server
            async def receive_messages():
                try:
                    while True:
                        resp = await websocket.recv()
                        print(f"Server: {resp}")
                except websockets.exceptions.ConnectionClosed:
                    print("WebSocket connection closed by server")
                except asyncio.CancelledError:
                    pass

            recv_task = asyncio.create_task(receive_messages())

            for event in events:
                delay = event.get("delay_sec", 1) / speed
                await asyncio.sleep(delay)
                
                event_type = event.get("type")
                if event_type == "ping":
                    ping = {
                        "lat": event["lat"],
                        "lon": event["lon"],
                        "speed": event.get("speed", 1.2),
                        "accuracy": event.get("accuracy", 10.0)
                    }
                    await websocket.send(json.dumps(ping))
                
                elif event_type == "voice_event":
                    print(f"Triggering voice event: {event['kind']}")
                    async with aiohttp.ClientSession() as session:
                        # use a dummy hash that we will seed the DB with for testing
                        payload = {
                            "kind": event["kind"],
                            "phrase_hash": "dummy_duress_hash",
                            "confidence": event.get("confidence", 0.9)
                        }
                        headers = {"Authorization": "Bearer dummy"}
                        await session.post(f"http://localhost:8000/trips/{trip_id}/voice-event", headers=headers, json=payload)
                
                elif event_type == "disconnect":
                    print("Simulating phone battery dying / connection drop")
                    break

            # Let the recv_task run for a bit to catch any delayed L3 escalation (e.g. phone dies)
            # if we disconnected intentionally, we might want to just exit or wait and poll status
            if event.get("type") == "disconnect":
                print("Connection dropped. Awaiting server-side escalation...")
                await asyncio.sleep(10 / speed)
            else:
                await asyncio.sleep(5 / speed)
                
            recv_task.cancel()

    except Exception as e:
        print(f"Simulator error: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--scenario", default="normal")
    parser.add_argument("--trip-id", default="test_trip")
    parser.add_argument("--speed", type=float, default=1.0, help="Speed multiplier for simulation time")
    args = parser.parse_args()
    
    # We can pass environment overrides here for the backend if running in the same terminal,
    # but the backend is a separate process. The easiest way is for the backend to read
    # os.environ.get("SIMULATOR_SPEED") if we want the backend to speed up timers.
    # Alternatively, we just rely on the user running backend with CHECKIN_WINDOW_SEC=5
    
    asyncio.run(simulate_trip(args.scenario, args.trip_id, args.speed))
