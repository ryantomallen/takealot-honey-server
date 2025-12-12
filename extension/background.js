// YOUR RENDER URL
const API_BASE = "https://takealot-honey-api.onrender.com";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    
    // Existing Price Tracking
    if (message.type === "PRICE_DATA") {
        fetch(`${API_BASE}/track`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(message.payload)
        }).catch(err => console.log("Track Error:", err));
    }

    // NEW: Arbitrage Tracking
    if (message.type === "ARBITRAGE_FOUND") {
        fetch(`${API_BASE}/log_arbitrage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(message.payload)
        }).then(() => console.log("Arbitrage Logged to Cloud"))
          .catch(err => console.log("Log Error:", err));
    }
});