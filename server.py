import sqlite3
import datetime
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# --- CONFIGURATION ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATABASE SETUP ---
def init_db():
    conn = sqlite3.connect("prices.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS price_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            price INTEGER,
            url TEXT,
            timestamp DATETIME
        )
    """)
    conn.commit()
    conn.close()

init_db()

# --- DATA MODEL ---
class Product(BaseModel):
    title: str
    price: int
    url: str

# --- HELPER FUNCTION (This was missing!) ---
def clean_url(url: str):
    """Removes tracking parameters (everything after ?) from URL"""
    return url.split('?')[0]

# --- ENDPOINT 1: TRACK PRICE ---
@app.post("/track")
async def track_price(product: Product):
    # Only track valid product pages
    if "PLID" not in product.url and "plid" not in product.url:
        return {"status": "ignored"}

    clean_title = product.title.split('|')[0].strip()
    
    # Use the helper to clean the URL before saving
    final_url = clean_url(product.url)
    
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    conn = sqlite3.connect("prices.db")
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO price_history (title, price, url, timestamp)
        VALUES (?, ?, ?, ?)
    """, (clean_title, product.price, final_url, now))
    conn.commit()
    conn.close()

    print(f"💾 SAVED: R{product.price} for {clean_title}")
    return {"status": "saved"}

# --- ENDPOINT 2: GET HISTORY & GRAPH DATA ---
@app.get("/check_history")
async def check_history(url: str):
    conn = sqlite3.connect("prices.db")
    cursor = conn.cursor()
    
    # Use the helper to clean the incoming URL so it matches the DB
    search_url = clean_url(url)
    
    # Get timestamp AND price for the graph
    cursor.execute("SELECT timestamp, price FROM price_history WHERE url = ? ORDER BY timestamp ASC", (search_url,))
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        return {"status": "no_history", "average": 0}

    # Prepare data for the graph (X axis = Date, Y axis = Price)
    history_data = [{"date": row[0], "price": row[1]} for row in rows]
    
    # Calculate stats
    prices = [row[1] for row in rows]
    average_price = sum(prices) / len(prices)
    
    return {
        "status": "found",
        "average": int(average_price),
        "lowest": int(min(prices)),
        "highest": int(max(prices)),
        "history": history_data 
    }