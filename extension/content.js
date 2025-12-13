console.log("🚀 AMAZON ARBITRAGE: URL MODE");

let lastScannedUrl = "";

// --- 1. THE SEARCH GENERATOR (The Fix) ---
function generateSearchQueryFromURL() {
    // Get the path: "/the-ordinary-glycolic-acid-100ml/PLID12345"
    const path = window.location.pathname; 
    
    // Split by slash and get the product name part (usually index 1)
    const segments = path.split('/').filter(s => s.length > 0);
    
    // Safety check: Ensure we are actually on a product page (usually has 'PLID' at the end)
    const hasPLID = segments.some(s => s.startsWith("PLID") || s.startsWith("plid"));
    if (!hasPLID || segments.length < 2) return null;

    // The product slug is usually the one BEFORE the PLID
    // e.g. [ "samsung-tv-55", "PLID123" ]
    let slug = segments[0]; 

    // Convert "samsung-tv-55" to "samsung tv 55"
    let cleanQuery = slug.replace(/-/g, " ");

    // Extra cleanup: Remove specific keywords that confuse Amazon
    // Amazon doesn't like "ml" or "pack" sometimes, but usually keeping it simple is best.
    return cleanQuery;
}

// --- 2. THE UI INJECTOR (Standard) ---
function showAmazonButton(amazonPrice, savings, url) {
    if (document.getElementById("amazon-deal-btn")) return;

    const priceSpan = document.querySelector('span[class*="currency-module_currency"]');
    if (priceSpan) {
        const container = priceSpan.closest('div').parentNode;

        const btn = document.createElement("a");
        btn.id = "amazon-deal-btn";
        btn.href = `${url}&tag=YOUR_TAG-21`; // <--- REMEMBER TO PUT YOUR TAG HERE LATER
        btn.target = "_blank";
        btn.style.display = "block";
        btn.style.marginTop = "15px";
        btn.style.padding = "12px";
        btn.style.background = "linear-gradient(to bottom, #f0c14b, #f7dfa5)";
        btn.style.color = "#111";
        btn.style.fontWeight = "bold";
        btn.style.textAlign = "center";
        btn.style.borderRadius = "4px";
        btn.style.textDecoration = "none";
        btn.style.border = "1px solid #a88734";
        btn.style.boxShadow = "0 1px 0 rgba(255,255,255,0.4) inset";
        
        btn.innerHTML = `
            <div style="font-size: 14px;">Found on Amazon</div>
            <div style="font-size: 18px; color: #B12704;">R ${amazonPrice}</div>
            <div style="font-size: 12px; color: green;">You Save R ${savings}!</div>
        `;

        container.appendChild(btn);
    }
}

// --- 3. THE AMAZON HUNTER ---
async function checkAmazonPrice(searchQuery, takealotPrice) {
    if (!searchQuery) return;
    
    console.log(`🕵️ Hunting on Amazon for: "${searchQuery}"`);
    const searchUrl = `https://www.amazon.co.za/s?k=${encodeURIComponent(searchQuery)}`;

    try {
        const response = await fetch(searchUrl);
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");

        // Amazon Price Selector
        const priceElement = doc.querySelector('.a-price-whole');
        
        if (priceElement) {
            let amazonPriceRaw = priceElement.innerText.replace(/[.,\n]/g, '');
            let amazonPrice = parseInt(amazonPriceRaw);

            console.log(`📦 Found: R${amazonPrice}`);

            // Safety Check: Ignore if price is less than 30% of Takealot (preventing accessory matches)
            // Example: TV is R10,000. Found Remote for R200. 200 < 3000 -> Ignore.
            if (amazonPrice < (takealotPrice * 0.30)) {
                console.log("⚠️ Ignored: Price too low (likely an accessory).");
                return; 
            }

            if (amazonPrice < takealotPrice) {
                const savings = takealotPrice - amazonPrice;
                showAmazonButton(amazonPrice, savings, searchUrl);
                
                // Optional: Send to your Render server logic if you want to track stats again later
                // chrome.runtime.sendMessage({ ... });
            }
        }
    } catch (err) {
        console.error("Amazon check failed:", err);
    }
}

// --- 4. THE TRIGGER ---
function checkPage() {
    // Only run if the URL changed (SPA navigation)
    if (window.location.href === lastScannedUrl) return;

    const priceSpan = document.querySelector('span[class*="currency-module_currency"]');
    
    if (priceSpan) {
        const rawText = priceSpan.innerText;
        const cleanPriceString = rawText.replace(/[^\d]/g, '');
        const priceInt = parseInt(cleanPriceString);

        if (!isNaN(priceInt)) {
            // NEW: Use URL instead of Title
            const smartQuery = generateSearchQueryFromURL();
            checkAmazonPrice(smartQuery, priceInt);
            
            lastScannedUrl = window.location.href;
        }
    }
}

// Check every 1 second to catch page changes quickly
setInterval(checkPage, 1000);