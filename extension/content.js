console.log("🚀 AMAZON ARBITRAGE LOADED");

// YOUR RENDER URL
const API_BASE = "https://takealot-honey-api.onrender.com"; 

let lastScannedUrl = "";

// --- 1. THE UI INJECTOR ---
function showAmazonButton(amazonPrice, savings, url) {
    if (document.getElementById("amazon-deal-btn")) return;

    // Find the Takealot price box to inject next to
    const priceSpan = document.querySelector('span[class*="currency-module_currency"]');
    if (priceSpan) {
        const container = priceSpan.closest('div').parentNode;

        const btn = document.createElement("a");
        btn.id = "amazon-deal-btn";
        // REPLACE 'tag=...' WITH YOUR AMAZON AFFILIATE ID LATER
        btn.href = `${url}&tag=YOUR_TAG-21`; 
        btn.target = "_blank";
        btn.style.display = "block";
        btn.style.marginTop = "15px";
        btn.style.padding = "15px";
        btn.style.backgroundColor = "#FF9900"; // Amazon Orange
        btn.style.color = "#111"; // Amazon Black text
        btn.style.fontWeight = "bold";
        btn.style.textAlign = "center";
        btn.style.borderRadius = "8px";
        btn.style.textDecoration = "none";
        btn.style.fontSize = "16px";
        btn.style.boxShadow = "0 4px 6px rgba(0,0,0,0.2)";
        btn.style.border = "1px solid #c47600";
        
        btn.innerHTML = `
            <span style="font-size: 20px;">🔥</span> 
            <b>Cheaper on Amazon</b><br>
            <span style="font-size: 14px;">Buy for R${amazonPrice} (Save R${savings})</span>
        `;

        container.appendChild(btn);
    }
}

// --- 2. THE AMAZON HUNTER ---
async function checkAmazonPrice(productTitle, takealotPrice) {
    // Clean title: remove "Takealot" specific junk to get better matches
    const cleanTitle = productTitle.split('|')[0].trim();
    console.log(`🕵️ Searching Amazon for: ${cleanTitle}`);

    const searchUrl = `https://www.amazon.co.za/s?k=${encodeURIComponent(cleanTitle)}`;

    try {
        // Fetch Amazon search results in background
        const response = await fetch(searchUrl);
        const htmlText = await response.text();

        // Parse HTML to find price
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");

        // Amazon's price class (usually reliable)
        const priceElement = doc.querySelector('.a-price-whole');
        
        if (priceElement) {
            // Remove commas/dots to get integer
            let amazonPriceRaw = priceElement.innerText.replace(/[.,\n]/g, '');
            let amazonPrice = parseInt(amazonPriceRaw);

            console.log(`📦 Found Amazon Match: R${amazonPrice}`);

            if (amazonPrice < takealotPrice) {
                const savings = takealotPrice - amazonPrice;
                console.log(`✅ ARBITRAGE FOUND! Saving: R${savings}`);
                
                // Show the Button
                showAmazonButton(amazonPrice, savings, searchUrl);

                // Log this "Win" to your Cloud Database
                chrome.runtime.sendMessage({
                    type: "ARBITRAGE_FOUND",
                    payload: { 
                        title: cleanTitle, 
                        takealot_price: takealotPrice,
                        amazon_price: amazonPrice,
                        savings: savings
                    }
                });
            }
        }
    } catch (err) {
        console.error("Amazon check failed:", err);
    }
}

// --- 3. THE TRIGGER ---
function checkPage() {
    const priceSpan = document.querySelector('span[class*="currency-module_currency"]');

    if (priceSpan && window.location.href !== lastScannedUrl) {
        const rawText = priceSpan.innerText;
        const cleanPriceString = rawText.replace(/[^\d]/g, '');
        const priceInt = parseInt(cleanPriceString);
        const title = document.title;

        if (!isNaN(priceInt)) {
            // Run the hunter
            checkAmazonPrice(title, priceInt);
            lastScannedUrl = window.location.href;
        }
    }
}

// Check every 2 seconds (Takealot is a Single Page App, so url changes dynamically)
setInterval(checkPage, 2000);