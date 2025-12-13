// background.js

// YOUR RENDER URL (Keep this for the logging feature)
const API_BASE = "https://takealot-honey-api.onrender.com";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    // --- 1. NEW: PROXY THE AMAZON SEARCH ---
    if (message.type === "CHECK_AMAZON_PRICE") {
        const searchUrl = `https://www.amazon.co.za/s?k=${encodeURIComponent(message.searchTerm)}`;

        fetch(searchUrl)
            .then(response => response.text()) // Get raw HTML
            .then(html => {
                sendResponse({ success: true, html: html, url: searchUrl });
            })
            .catch(error => {
                console.error("Background Fetch Error:", error);
                sendResponse({ success: false, error: error.message });
            });
        
        return true; // Keep the message channel open for the async response
    }

    // --- 2. EXISTING: SERVER LOGGING ---
    if (message.type === "PRICE_DATA") {
        fetch(`${API_BASE}/track`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(message.payload)
        }).catch(err => console.log("Track Error:", err));
    }

    if (message.type === "ARBITRAGE_FOUND") {
        fetch(`${API_BASE}/log_arbitrage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(message.payload)
        }).catch(err => console.log("Log Error:", err));
    }
});