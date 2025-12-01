console.log("🚀 EXTENSION LOADED! Connected to Cloud.");

// YOUR LIVE SERVER URL
const API_BASE = "https://takealot-honey-server.onrender.com";

let lastScannedUrl = "";

// --- GRAPH DRAWING FUNCTION ---
function drawGraph(historyData) {
    // Prevent drawing twice
    if (document.getElementById("honey-price-chart")) return;

    const priceSpan = document.querySelector('span[class*="currency-module_currency"]');
    
    if (priceSpan) {
        // Find container
        const container = priceSpan.closest('div').parentNode; 

        // Create Graph Box
        const graphDiv = document.createElement("div");
        graphDiv.id = "honey-price-chart";
        graphDiv.style.padding = "15px";
        graphDiv.style.marginTop = "10px";
        graphDiv.style.backgroundColor = "white";
        graphDiv.style.borderRadius = "8px";
        graphDiv.style.border = "1px solid #e0e0e0";
        graphDiv.style.width = "100%";
        graphDiv.style.boxSizing = "border-box";

        const title = document.createElement("h4");
        title.innerText = "📉 Price History Analysis";
        title.style.margin = "0 0 10px 0";
        title.style.fontSize = "14px";
        title.style.color = "#333";
        graphDiv.appendChild(title);

        const canvas = document.createElement("canvas");
        graphDiv.appendChild(canvas);
        container.appendChild(graphDiv);

        // Prepare Data
        const labels = historyData.map(item => item.date.split(' ')[0]); 
        const prices = historyData.map(item => item.price);

        // Draw Chart
        new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Price History (R)',
                    data: prices,
                    borderColor: '#0b79bf',
                    backgroundColor: 'rgba(11, 121, 191, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: false } }
            }
        });
    }
}

// --- MAIN LOGIC ---
function checkPrice() {
    const priceSpan = document.querySelector('span[class*="currency-module_currency"]');

    if (priceSpan) {
        if (window.location.href !== lastScannedUrl) {
            
            const rawText = priceSpan.innerText;
            const cleanPriceString = rawText.replace(/[^\d]/g, '');
            const priceInt = parseInt(cleanPriceString);
            const title = document.title;

            if (!isNaN(priceInt)) {
                console.log(`💰 Current Price: R${priceInt}`);

                // 1. Send Data to Cloud (Write)
                chrome.runtime.sendMessage({
                    type: "PRICE_DATA",
                    payload: { title: title, price: priceInt, url: window.location.href }
                });

                // 2. Fetch History from Cloud (Read)
                const checkUrl = `${API_BASE}/check_history?url=${encodeURIComponent(window.location.href)}`;
                
                fetch(checkUrl)
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === "found") {
                            // If history exists, draw the graph
                            if (data.history && data.history.length > 1) {
                                drawGraph(data.history);
                            }
                        }
                    })
                    .catch(err => console.log("Cloud Error:", err));

                lastScannedUrl = window.location.href;
            }
        }
    }
}

setInterval(checkPrice, 1000);