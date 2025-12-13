console.log("🚀 AMAZON SEARCH AGENT LOADED");

let lastScannedUrl = "";

// --- 1. GET THE SEARCH TERM ---
// We use the Takealot URL slug because it's usually cleaner than the Title
// Example: takealot.com/samsung-55-inch-tv/PLID... -> "samsung 55 inch tv"
function getSearchTerm() {
    const path = window.location.pathname; 
    const segments = path.split('/').filter(s => s.length > 0);
    
    // Safety: Ensure we are on a product page
    const hasPLID = segments.some(s => s.toLowerCase().startsWith("plid"));
    if (!hasPLID || segments.length < 2) return null;

    // The product name is usually the part before the PLID
    let rawSlug = segments[0]; 
    
    // Clean it: "samsung-tv-55" -> "samsung tv 55"
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
        btn.href = `${url}&tag=YOUR_TAG-21`; // <--- Add your Affiliate Tag here later
        btn.target = "_blank";
        
        // Button Styling
        btn.style.display = "block";
        btn.style.marginTop = "15px";
        btn.style.padding = "12px";
        btn.style.background = "#FF9900"; // Amazon Orange
        btn.style.color = "#111";
        btn.style.fontWeight = "bold";
        btn.style.textAlign = "center";
        btn.style.borderRadius = "5px";
        btn.style.textDecoration = "none";
        btn.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
        
        // Text inside the button
        btn.innerHTML = `
            <div style="font-size: 14px;">Found on Amazon</div>
            <div style="font-size: 20px; font-weight: 800;">R ${amazonPrice}</div>
            <div style="font-size: 12px; opacity: 0.9;">(Save R${savings})</div>
        `;

        container.appendChild(btn);
    }
}

// --- 3. THE "FIRST RESULT" HUNTER ---
async function checkAmazon(searchTerm, takealotPrice) {
    if (!searchTerm) return;
    
    console.log(`🕵️ Searching Amazon for: "${searchTerm}"`);
    
    // This matches the URL structure you provided:
    const searchUrl = `https://www.amazon.co.za/s?k=${encodeURIComponent(searchTerm)}`;

    try {
        const response = await fetch(searchUrl);
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");

        // STRATEGY: Grab the FIRST price we find in the results
        // This relies on Amazon showing the most relevant result at the top
        const priceElement = doc.querySelector('.a-price-whole');
        
        if (priceElement) {
            // Clean the price string (remove commas/dots)
            let amazonPriceRaw = priceElement.innerText.replace(/[.,\n]/g, '');
            let amazonPrice = parseInt(amazonPriceRaw);

            console.log(`📦 First Result Price: R${amazonPrice}`);

            // Only show if it's actually cheaper
            if (amazonPrice < takealotPrice) {
                const savings = takealotPrice - amazonPrice;
                showAmazonButton(amazonPrice, savings, searchUrl);
            } else {
                console.log("📉 Amazon was more expensive (or same price).");
            }
        } else {
            console.log("❌ No price found in Amazon search results.");
        }
    } catch (err) {
        console.error("Amazon check failed:", err);
    }
}

// --- 4. THE TRIGGER ---
function checkPage() {
    // Only run if URL changed
    if (window.location.href === lastScannedUrl) return;

    const priceSpan = document.querySelector('span[class*="currency-module_currency"]');
    
    if (priceSpan) {
        // Get Takealot Price
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

// Check every 1 second
setInterval(checkPage, 1000);