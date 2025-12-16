console.log("🚀 AMAZON SEARCH AGENT: FLOATING WIDGET MODE");

let lastScannedUrl = "";
const AFFILIATE_TAG = "rian0ea-20"; // <--- Your Tag is defined here

// --- 1. GET THE SEARCH TERM ---
// Extracts "samsung 55 inch tv" from the Takealot URL
function getSearchTerm() {
    const path = window.location.pathname; 
    const segments = path.split('/').filter(s => s.length > 0);
    
    // Safety: Ensure we are on a product page (must have PLID)
    const hasPLID = segments.some(s => s.toLowerCase().startsWith("plid"));
    if (!hasPLID || segments.length < 2) return null;

    // The product name is usually the part before the PLID
    let rawSlug = segments[0]; 
    return rawSlug.replace(/-/g, " ");
}

// --- 2. THE UI INJECTOR (Floating Card) ---
function showAmazonButton(amazonPrice, savings, url) {
    // Prevent duplicates
    if (document.getElementById("amazon-deal-btn")) return;

    // Create the floating container
    const btn = document.createElement("a");
    btn.id = "amazon-deal-btn";
    
    // --- FIX: ADDING THE COMMISSION TAG CORRECTLY ---
    // We check if the URL already has a '?' to know how to add the tag
    const separator = url.includes("?") ? "&" : "?";
    btn.href = `${url}${separator}tag=${AFFILIATE_TAG}`; 
    
    btn.target = "_blank";
    
    // Style it to float on top (Honey Style)
    Object.assign(btn.style, {
        position: "fixed",
        top: "140px",        // Below the header
        right: "20px",       // Stuck to the right side
        zIndex: "2147483647", // Max Z-Index to stay on top
        backgroundColor: "white",
        border: "2px solid #FF9900", // Amazon Orange border
        borderRadius: "8px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.3)", // Nice drop shadow
        padding: "0",
        textDecoration: "none",
        fontFamily: "Arial, sans-serif",
        width: "240px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "transform 0.2s", // Smooth hover effect
        animation: "slideIn 0.5s ease-out" // Entrance animation
    });

    // Hover effect
    btn.onmouseover = () => { btn.style.transform = "scale(1.05)"; };
    btn.onmouseout = () => { btn.style.transform = "scale(1.0)"; };

    // The Content
    btn.innerHTML = `
        <div style="background: #FF9900; color: #111; padding: 12px; font-weight: bold; text-align: center; font-size: 16px;">
            🔥 Cheaper on Amazon
        </div>
        <div style="padding: 15px; color: #333; text-align: center; background: white;">
            <div style="font-size: 13px; margin-bottom: 5px; color: #555;">Found for:</div>
            <div style="font-size: 26px; font-weight: 800; color: #B12704; margin-bottom: 5px;">R ${amazonPrice}</div>
            <div style="font-size: 14px; color: #007600; font-weight: bold; background: #e6f4ea; padding: 4px; border-radius: 4px;">
                You Save R ${savings}!
            </div>
        </div>
        <div style="background: #f8f8f8; padding: 10px; text-align: center; font-size: 12px; color: #555; border-top: 1px solid #eee;">
            Click to view deal ➜
        </div>
    `;

    // Add the slide-in animation
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes slideIn {
            from { transform: translateX(300px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    // Inject into body
    document.body.appendChild(btn);
}

// --- 3. THE HUNTER (Proxy Mode) ---
function checkAmazon(searchTerm, takealotPrice) {
    if (!searchTerm) return;
    
    console.log(`🕵️ Asking Background to search: "${searchTerm}"`);
    
    // Send message to background.js to bypass CORS
    chrome.runtime.sendMessage(
        { type: "CHECK_AMAZON_PRICE", searchTerm: searchTerm },
        (response) => {
            if (response && response.success) {
                // We got HTML back, now parse it
                const parser = new DOMParser();
                const doc = parser.parseFromString(response.html, "text/html");

                // Find the first price
                const priceElement = doc.querySelector('.a-price-whole');
                
                if (priceElement) {
                    // FIX: Remove all non-digits (spaces, commas, 'R')
                    let amazonPriceRaw = priceElement.innerText.replace(/[^\d]/g, '');
                    let amazonPrice = parseInt(amazonPriceRaw);

                    console.log(`📦 Price Found: R${amazonPrice} (Raw: "${priceElement.innerText}")`);

                    if (amazonPrice < takealotPrice) {
                        const savings = takealotPrice - amazonPrice;
                        showAmazonButton(amazonPrice, savings, response.url);
                        
                        // Log the win to your server
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
    // Only run if URL changed
    if (window.location.href === lastScannedUrl) return;

    // Find Takealot price
    const priceSpan = document.querySelector('span[class*="currency-module_currency"]');
    
    if (priceSpan) {
        const rawText = priceSpan.innerText;
        // Clean Takealot price
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