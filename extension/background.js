// YOUR LIVE SERVER URL
const API_BASE = "https://takealot-honey-server.onrender.com";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "PRICE_DATA") {
        
        fetch(`${API_BASE}/track`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(message.payload)
        })
        .then(res => console.log("Sent to Cloud successfully"))
        .catch(err => console.log("Error sending to Cloud:", err));
    }
});