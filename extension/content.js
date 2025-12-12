console.log("🚀 AMAZON ARBITRAGE LOADED");

const API_BASE = "https://takealot-honey-api.onrender.com"; 

let lastScannedUrl = "";

// --- 1. INTELLIGENT SEARCH GENERATOR ---
function generateSearchQuery(rawTitle) {
    // Step 1: Cut off extra info usually found after punctuation
    // Example: "Samsung TV | 4K | Smart" -> "Samsung TV"
    let clean = rawTitle.split(/[|\-(]/)[0];

    // Step 2: Remove special characters and extra spaces
    clean = clean.replace(/[^a-zA-Z0-9\s]/g, "").trim();

    // Step 3: Limit to first 5 words (Amazon search works best with short queries)
    // Example: "Samsung 55 Inch Crystal UHD 4K Smart TV" -> "Samsung 55 Inch Crystal UHD"
    const words = clean.split(/\s+/);
    if (words.length > 5) {
        return words.slice(0, 5).join(" ");
    }
    return words.join(" ");
}

// --- 2. THE UI INJECTOR ---
function showAmazonButton(amazonPrice, savings, url) {
    if (document.getElementById("amazon-deal-btn")) return;

    const priceSpan = document.querySelector('span[class*="currency-module_currency"]');
    if (priceSpan) {
        const container = priceSpan.closest('div').parentNode;

        const btn = document.createElement("a");
        btn.id = "amazon-deal-btn";
        btn.href = `${url}&tag=YOUR_TAG-21`; // Remember to put your real tag here
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
        btn.style.borderColor = "#a88734 #9c7e31 #846a29";
        btn.style.borderStyle = "solid";
        btn.style.borderWidth = "1px";
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
async function checkAmazonPrice(rawTitle, takealotPrice) {
    // USE THE NEW SMART SEARCH
    const searchQuery = generateSearchQuery(rawTitle);
    console.log(`🕵️ Hunting on Amazon for: "${searchQuery}"`);

    const searchUrl = `https://www.amazon.co.za/s?k=${encodeURIComponent(searchQuery)}`;

    try {
        const response = await fetch(searchUrl);
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");

        // Find the first price in results
        const priceElement = doc.querySelector('.a-price-whole');
        
        if (priceElement) {
            let amazonPriceRaw = priceElement.innerText.replace(/[.,\n]/g, '');
            let amazonPrice = parseInt(amazonPriceRaw);

            console.log(`📦 Found potential match: R${amazonPrice}`);

            // Safety Check: Is the price "too good to be true"?
            // If Amazon price is less than 10% of Takealot price, it's probably an accessory (wrong item).
            if (amazonPrice < (takealotPrice * 0.10)) {
                console.log("⚠️ Ignored: Price too low, likely a mismatched accessory.");
                return; 
            }

            if (amazonPrice < takealotPrice) {
                const savings = takealotPrice - amazonPrice;
                showAmazonButton(amazonPrice, savings, searchUrl);

                // Log to Cloud
                chrome.runtime.sendMessage({
                    type: "ARBITRAGE_FOUND",
                    payload: { 
                        title: searchQuery, 
                        takealot_price: takealotPrice,
                        amazon_price: amazonPrice,
                        savings: savings
                    }
                });
            }
        } else {
            console.log("❌ No price found on Amazon search page.");
        }
    } catch (err) {
        console.error("Amazon check failed:", err);
    }
}

// --- 4. THE TRIGGER ---
function checkPage() {
    const priceSpan = document.querySelector('span[class*="currency-module_currency"]');

    if (priceSpan && window.location.href !== lastScannedUrl) {
        const rawText = priceSpan.innerText;
        const cleanPriceString = rawText.replace(/[^\d]/g, '');
        const priceInt = parseInt(cleanPriceString);
        const title = document.title;

        if (!isNaN(priceInt)) {
            checkAmazonPrice(title, priceInt);
            lastScannedUrl = window.location.href;
        }
    }
}

setInterval(checkPage, 2000);