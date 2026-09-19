import os
import re
from dotenv import dotenv_values
import psycopg2

def is_placeholder(value):
    if not value:
        return True
    val = value.lower()
    return "your" in val or "user:password" in val or "dummy" in val

def check_env():
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    if not os.path.exists(env_path):
        print("❌ .env file is missing!")
        return

    config = dotenv_values(env_path)
    
    required_keys = ["JWT_SECRET_KEY", "DATABASE_URL", "CHECKIN_WINDOW_SEC", "ESCALATION_SUSTAINED_SEC", "ALERT_COOLDOWN_SEC", "PUBLIC_BASE_URL"]
    mockable_keys = ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER", "FCM_SERVICE_ACCOUNT_JSON_PATH"]
    
    print("--- Environment Check ---")
    for key in required_keys:
        val = config.get(key, "")
        if not val or is_placeholder(val):
            print(f"[ERROR] {key}: missing or placeholder (required)")
        else:
            print(f"[OK] {key}: set")
            
    for key in mockable_keys:
        val = config.get(key, "")
        if not val or is_placeholder(val):
            print(f"[WARN] {key}: missing or placeholder (mock mode)")
        else:
            print(f"[OK] {key}: set")

    print("\n--- Testing DB Connection ---")
    db_url = config.get("DATABASE_URL")
    if db_url and not is_placeholder(db_url):
        try:
            conn = psycopg2.connect(db_url)
            conn.close()
            print("[OK] Database connection successful.")
        except Exception as e:
            print(f"[ERROR] Database connection failed: {e}")
    else:
        print("[ERROR] Cannot test DB: DATABASE_URL missing or placeholder")
    
    print("-------------------------")

if __name__ == "__main__":
    check_env()
