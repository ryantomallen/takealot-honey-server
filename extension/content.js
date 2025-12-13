console.log("🚀 AMAZON SEARCH AGENT: PROXY MODE");

let lastScannedUrl = "";

// --- 1. GET THE SEARCH TERM ---
function getSearchTerm() {
    const path = window.location.pathname; 
    const segments = path.split('/').filter(s => s.length > 0);
    
    const hasPLID = segments.some(s => s.toLowerCase().startsWith("plid"));
    if (!hasPLID || segments.length < 2) return null;

    let rawSlug = segments[0]; 
    return rawSlug.replace(/-/g, " ");
}

// --- 2. THE UI INJECTOR ---
function showAmazonButton(amazonPrice, savings, url) {
    if (document.getElementById("amazon-deal-btn")) return;

    const priceSpan = document.querySelector('span[class*="currency-module_currency"]');
    if (priceSpan) {
        const container = priceSpan.closest('div').parentNode;

        const btn = document.createElement("a");
        btn.id = "amazon-deal-btn";
        btn.href = `${url}&tag=YOUR_TAG-21`; 
        btn.target = "_blank";
        
        btn.style.display = "block";
        btn.style.marginTop = "15px";
        btn.style.padding = "12px";
        btn.style.background = "#FF9900"; 
        btn.style.color = "#111";
        btn.style.fontWeight = "bold";
        btn.style.textAlign = "center";
        btn.style.borderRadius = "5px";
        btn.style.textDecoration = "none";
        btn.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
        
        btn.innerHTML = `
            <div style="font-size: 14px;">Found on Amazon</div>
            <div style="font-size: 20px; font-weight: 800;">R ${amazonPrice}</div>
            <div style="font-size: 12px; opacity: 0.9;">(Save R${savings})</div>
        `;

        container.appendChild(btn);
    }
}

// --- 3. THE HUNTER (Updated to use Background Proxy) ---
function checkAmazon(searchTerm, takealotPrice) {
    if (!searchTerm) return;
    
    console.log(`🕵️ Asking Background to search: "${searchTerm}"`);
    
    // SEND MESSAGE TO BACKGROUND SCRIPT
    chrome.runtime.sendMessage(
        { type: "CHECK_AMAZON_PRICE", searchTerm: searchTerm },
        (response) => {
            if (response && response.success) {
                // We got the HTML back! Now we parse it here.
                const parser = new DOMParser();
                const doc = parser.parseFromString(response.html, "text/html");

                // Grab the first price
                const priceElement = doc.querySelector('.a-price-whole');
                
                if (priceElement) {
                    let amazonPriceRaw = priceElement.innerText.replace(/[.,\n]/g, '');
                    let amazonPrice = parseInt(amazonPriceRaw);

                    console.log(`📦 Price Found: R${amazonPrice}`);

                    if (amazonPrice < takealotPrice) {
                        const savings = takealotPrice - amazonPrice;
                        showAmazonButton(amazonPrice, savings, response.url);
                        
                        // Log the win
                        chrome.runtime.sendMessage({
                            type: "ARBITRAGE_FOUND",
                            payload: { 
                                title: searchTerm, 
                                takealot_price: takealotPrice,
                                amazon_price: amazonPrice,
                                savings: savings
                            }
                        });
                    } else {
                        console.log("📉 Amazon is not cheaper.");
                    }
                } else {
                    console.log("❌ No price element found in Amazon HTML.");
                }
            } else {
                console.error("Background search failed:", response ? response.error : "Unknown error");
            }
        }
    );
}

// --- 4. THE TRIGGER ---
function checkPage() {
    if (window.location.href === lastScannedUrl) return;

    const priceSpan = document.querySelector('span[class*="currency-module_currency"]');
    
    if (priceSpan) {
        const rawText = priceSpan.innerText;
        const cleanPriceString = rawText.replace(/[^\d]/g, '');
        const takealotPrice = parseInt(cleanPriceString);

        if (!isNaN(takealotPrice)) {
            const searchTerm = getSearchTerm();
            if (searchTerm) {
                checkAmazon(searchTerm, takealotPrice);
                lastScannedUrl = window.location.href;
            }
        }
    }
}

setInterval(checkPage, 1000);