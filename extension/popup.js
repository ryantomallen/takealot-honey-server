// YOUR LIVE SERVER URL
const API_BASE = "https://takealot-honey-server.onrender.com";

document.addEventListener('DOMContentLoaded', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentUrl = tabs[0].url;

        if (currentUrl.includes("takealot.com") && currentUrl.includes("PLID")) {
            fetchData(currentUrl);
        } else {
            document.getElementById("loading").innerText = "Open a Takealot product page to see stats.";
        }
    });
});

function fetchData(url) {
    const checkUrl = `${API_BASE}/check_history?url=${encodeURIComponent(url)}`;
    
    fetch(checkUrl)
        .then(res => res.json())
        .then(data => {
            document.getElementById("loading").style.display = "none";
            document.getElementById("content").style.display = "block";

            if (data.status === "found") {
                document.getElementById("average").innerText = "R " + data.average;
                
                // Use the latest price from history
                const latestPrice = data.history[data.history.length - 1].price; 
                document.getElementById("price").innerText = "R " + latestPrice;

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
            document.getElementById("loading").innerText = "Server Error. Is the cloud app sleeping?";
        });
}