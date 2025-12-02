import os
import psycopg2
import datetime
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATABASE CONNECTION ---
# Get the secret password we just saved in Render
DATABASE_URL = os.environ.get("DATABASE_URL")

def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

def init_db():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS price_history (
                id SERIAL PRIMARY KEY,
                title TEXT,
                price INTEGER,
                url TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.commit()
        cursor.close()
        conn.close()
        print("✅ Connected to Neon PostgreSQL!")
    except Exception as e:
        print(f"❌ Database Error: {e}")

# Run setup
if DATABASE_URL:
    init_db()

class Product(BaseModel):
    title: str
    price: int
    url: str

def clean_url(url: str):
    return url.split('?')[0]

@app.post("/track")
async def track_price(product: Product):
    if "PLID" not in product.url and "plid" not in product.url:
        return {"status": "ignored"}

    clean_title = product.title.split('|')[0].strip()
    final_url = clean_url(product.url)
    now = datetime.datetime.now()

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO price_history (title, price, url, timestamp)
            VALUES (%s, %s, %s, %s)
        """, (clean_title, product.price, final_url, now))
        
        conn.commit()
        cursor.close()
        conn.close()

        print(f"💾 SAVED TO NEON: R{product.price} for {clean_title}")
        return {"status": "saved"}
    except Exception as e:
        print(f"Error saving: {e}")
        return {"status": "error"}

@app.get("/check_history")
async def check_history(url: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        search_url = clean_url(url)
        
        cursor.execute("SELECT timestamp, price FROM price_history WHERE url = %s ORDER BY timestamp ASC", (search_url,))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        if not rows:
            return {"status": "no_history", "average": 0}

        # Convert Postgres timestamp to string
        history_data = [{"date": str(row[0]), "price": row[1]} for row in rows]
        prices = [row[1] for row in rows]
        average_price = sum(prices) / len(prices)
        
        return {
            "status": "found",
            "average": int(average_price),
            "lowest": int(min(prices)),
            "highest": int(max(prices)),
            "history": history_data 
        }
    except Exception as e:
        print(f"Error reading: {e}")
        return {"status": "error"}