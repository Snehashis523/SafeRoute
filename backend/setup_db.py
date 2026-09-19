import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL")
if db_url:
    parsed = urlparse(db_url)
    db_user = parsed.username or "postgres"
    db_password = parsed.password or ""
    db_host = parsed.hostname or "localhost"
    db_port = parsed.port or 5432
else:
    db_user = os.getenv("DB_USER", "postgres")
    db_password = os.getenv("DB_PASSWORD", "")
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = int(os.getenv("DB_PORT", "5432"))

# Connect to default 'postgres' database to create 'saferoute'
try:
    conn = psycopg2.connect(
        dbname='postgres',
        user=db_user,
        password=db_password,
        host=db_host,
        port=db_port
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()

    try:
        cur.execute("CREATE DATABASE saferoute;")
        print("Database 'saferoute' created successfully.")
    except psycopg2.errors.DuplicateDatabase:
        print("Database 'saferoute' already exists.")
    finally:
        cur.close()
        conn.close()
except Exception as e:
    print(f"Failed to connect to default database: {e}")

# Connect to 'saferoute' database to enable extensions
try:
    conn = psycopg2.connect(
        dbname='saferoute',
        user=db_user,
        password=db_password,
        host=db_host,
        port=db_port
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    
    try:
        cur.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
        print("Extension 'postgis' enabled.")
    except Exception as e:
        print(f"Failed to enable 'postgis': {e}")
        
    try:
        cur.execute("CREATE EXTENSION IF NOT EXISTS h3;")
        print("Extension 'h3' enabled.")
    except Exception as e:
        print(f"Failed to enable 'h3' (will fallback to Python): {e}")

finally:
    if 'cur' in locals():
        cur.close()
    if 'conn' in locals():
        conn.close()
