const BASE_URL = "http://localhost:8000"; // Use 10.0.2.2 for Android emulator

export const planRoute = async (origin: number[], dest: number[], mode: string, depart_at: string) => {
  const res = await fetch(`${BASE_URL}/routes/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ origin, destination: dest, mode, depart_at })
  });
  return res.json();
};

export const startTrip = async (data: any) => {
  const res = await fetch(`${BASE_URL}/trips/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "test_user_id" },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const sendCheckin = async (tripId: string, payload: any) => {
  const res = await fetch(`${BASE_URL}/trips/${tripId}/checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "test_user_id" },
    body: JSON.stringify(payload)
  });
  return res.json();
};

export const triggerSOS = async (tripId: string) => {
  const res = await fetch(`${BASE_URL}/trips/${tripId}/sos`, {
    method: "POST",
    headers: { "Authorization": "test_user_id" }
  });
  return res.json();
};

export const sendVoiceEvent = async (tripId: string, payload: any) => {
  const res = await fetch(`${BASE_URL}/trips/${tripId}/voice-event`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "test_user_id" },
    body: JSON.stringify(payload)
  });
  return res.json();
};

