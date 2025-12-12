import os
import psycopg2
import datetime
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow the extension to talk to this server from any website (Takealot/Amazon)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATABASE CONNECTION ---
# Gets the secret password from Render (or your local environment)
DATABASE_URL = os.environ.get("DATABASE_URL")

def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

def init_db():
    """Create tables in Neon PostgreSQL if they don't exist"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 1. Table for Price History (The Graph)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS price_history (
                id SERIAL PRIMARY KEY,
                title TEXT,
                price INTEGER,
                url TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # 2. Table for Arbitrage Wins (The Money Maker)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS arbitrage_events (
                id SERIAL PRIMARY KEY,
                title TEXT,
                takealot_price INTEGER,
                amazon_price INTEGER,
                savings INTEGER,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        conn.commit()
        cursor.close()
        conn.close()
        print("✅ Connected to Neon & tables verified.")
    except Exception as e:
        print(f"❌ Database Error: {e}")

# Run setup on startup
if DATABASE_URL:
    init_db()

# --- DATA MODELS ---
class Product(BaseModel):
    title: str
    price: int
    url: str

class ArbitrageEvent(BaseModel):
    title: str
    takealot_price: int
    amazon_price: int
    savings: int

# --- HELPER FUNCTIONS ---
def clean_url(url: str):
    return url.split('?')[0]

# --- API ENDPOINTS ---

@app.post("/track")
async def track_price(product: Product):
    """Saves a Takealot price check to the database."""
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

        print(f"💾 TRACKED: R{product.price} for {clean_title}")
        return {"status": "saved"}
    except Exception as e:
        print(f"Error saving track: {e}")
        return {"status": "error"}

@app.post("/log_arbitrage")
async def log_arbitrage(event: ArbitrageEvent):
    """Saves an Amazon vs Takealot win to the database."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO arbitrage_events (title, takealot_price, amazon_price, savings)
            VALUES (%s, %s, %s, %s)
        """, (event.title, event.takealot_price, event.amazon_price, event.savings))
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"💰 ARBITRAGE FOUND: {event.title} (Saving R{event.savings})")
        return {"status": "logged"}
    except Exception as e:
        print(f"Error logging arbitrage: {e}")
        return {"status": "error"}

@app.get("/check_history")
async def check_history(url: str):
    """Retrieves price history for the graph."""
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

        # Format for JSON response
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
        print(f"Error reading history: {e}")
        return {"status": "error"}