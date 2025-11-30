document.addEventListener('DOMContentLoaded', function() {
    // 1. Ask the active tab for the URL
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentUrl = tabs[0].url;

        // Only run if we are on Takealot
        if (currentUrl.includes("takealot.com") && currentUrl.includes("PLID")) {
            fetchData(currentUrl);
        } else {
            document.getElementById("loading").innerText = "Open a Takealot product page to see stats.";
        }
    });
});

function fetchData(url) {
    const checkUrl = `http://localhost:8000/check_history?url=${encodeURIComponent(url)}`;
    
    fetch(checkUrl)
        .then(res => res.json())
        .then(data => {
            document.getElementById("loading").style.display = "none";
            document.getElementById("content").style.display = "block";

            if (data.status === "found") {
                // Update text
                document.getElementById("average").innerText = "R " + data.average;
                
                // We need to fetch the CURRENT price from the page context, 
                // but for now, let's use the 'latest' price from history to keep it simple.
                // (In a pro version, we'd message content.js to ask for the live price)
                const latestPrice = data.history[data.history.length - 1].price; 
                document.getElementById("price").innerText = "R " + latestPrice;

                // Set Verdict Color
                const vBox = document.getElementById("verdict-box");
                if (latestPrice < data.average) {
                    vBox.innerText = "✅ GOOD DEAL";
                    vBox.className = "verdict good";
                } else if (latestPrice > data.average) {
                    vBox.innerText = "⚠️ EXPENSIVE";
                    vBox.className = "verdict bad";
                } else {
                    vBox.innerText = "😐 NORMAL PRICE";
                    vBox.className = "verdict normal";
                }
            } else {
                document.getElementById("loading").style.display = "block";
                document.getElementById("loading").innerText = "No history for this item yet.";
                document.getElementById("content").style.display = "none";
            }
        })
        .catch(err => {
            document.getElementById("loading").innerText = "Server Error. Is Python running?";
        });
}