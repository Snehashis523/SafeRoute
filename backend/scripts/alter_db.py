import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("No DATABASE_URL")
    exit(1)

conn = psycopg2.connect(db_url)
cur = conn.cursor()
try:
    cur.execute("ALTER TABLE trips ADD COLUMN share_token VARCHAR;")
    cur.execute("CREATE UNIQUE INDEX ix_trips_share_token ON trips (share_token);")
    conn.commit()
    print("Added share_token column")
except Exception as e:
    print("Already exists or error:", e)
finally:
    cur.close()
    conn.close()
