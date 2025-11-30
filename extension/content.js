console.log("🚀 EXTENSION LOADED! Watching for products...");

let lastScannedUrl = "";

// Function to draw the graph onto the page
function drawGraph(historyData) {
    // 1. Check if we already drew it to avoid duplicates
    if (document.getElementById("honey-price-chart")) return;

    // 2. Find a place to put it. 
    // We look for the "Add to Cart" block or the Price block.
    // The class 'buybox-module_buybox_1N2c-' is common, but let's try to append near the price.
    const priceSpan = document.querySelector('span[class*="currency-module_currency"]');
    
    if (priceSpan) {
        // Find the container usually 3 levels up from the price text
        const container = priceSpan.closest('div').parentNode; 

        // 3. Create the Container for our Graph
        const graphDiv = document.createElement("div");
        graphDiv.id = "honey-price-chart";
        graphDiv.style.padding = "15px";
        graphDiv.style.marginTop = "10px";
        graphDiv.style.backgroundColor = "white";
        graphDiv.style.borderRadius = "8px";
        graphDiv.style.border = "1px solid #e0e0e0";
        graphDiv.style.width = "100%";
        graphDiv.style.boxSizing = "border-box";

        // Add a Title
        const title = document.createElement("h4");
        title.innerText = "📉 Price History Analysis";
        title.style.margin = "0 0 10px 0";
        title.style.fontSize = "14px";
        title.style.color = "#333";
        graphDiv.appendChild(title);

        // Add the Canvas (The drawing board)
        const canvas = document.createElement("canvas");
        graphDiv.appendChild(canvas);

        // Inject into the page
        container.appendChild(graphDiv);

        // 4. PREPARE DATA FOR CHART.JS
        // We take the "2025-11-27 10:00:00" strings and just keep the time/date
        const labels = historyData.map(item => item.date.split(' ')[0]); 
        const prices = historyData.map(item => item.price);

        // 5. DRAW THE CHART
        new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Price History (R)',
                    data: prices,
                    borderColor: '#0b79bf', // Takealot Blue
                    backgroundColor: 'rgba(11, 121, 191, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3 // Makes the line curvy and smooth
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false } // Hide legend to save space
                },
                scales: {
                    y: {
                        beginAtZero: false // Focus on the price variance
                    }
                }
            }
        });
    }
}

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

                // Send to DB
                chrome.runtime.sendMessage({
                    type: "PRICE_DATA",
                    payload: { title: title, price: priceInt, url: window.location.href }
                });

                // Check History AND Draw Graph
                const checkUrl = `http://localhost:8000/check_history?url=${encodeURIComponent(window.location.href)}`;
                
                fetch(checkUrl)
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === "found") {
                            // If we have history data, DRAW THE GRAPH!
                            if (data.history && data.history.length > 1) {
                                drawGraph(data.history);
                            } else {
                                console.log("Not enough history to draw a graph yet.");
                            }
                        }
                    });

                lastScannedUrl = window.location.href;
            }
        }
    }
}

setInterval(checkPrice, 1000);