import requests
import json

headers = {"Authorization": "Bearer dummy"}
resp = requests.post("http://localhost:8000/trips/test_trip/voice-event", headers=headers, json={
    "kind": "duress_word",
    "phrase_hash": "dummy_duress_hash",
    "confidence": 0.9
})
print("Voice Duress Response:", resp.json())
