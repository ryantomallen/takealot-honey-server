chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "PRICE_DATA") {
        
        // Send the data to your Python Localhost Server
        fetch("http://localhost:8000/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(message.payload)
        })
        .then(res => console.log("Sent to Python successfully"))
        .catch(err => console.log("Error sending to Python:", err));
    }
});