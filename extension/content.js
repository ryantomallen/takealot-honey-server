console.log("🇿🇦 AMAZON ZA AGENT: ACTIVE WITH CLOSE BUTTON");

let lastScannedUrl = "";
const AFFILIATE_TAG = "rian0ea-20"; // <--- MAKE SURE THIS IS YOUR ZA TAG

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
    // Prevent duplicates
    if (document.getElementById("amazon-deal-btn")) return;

    const btn = document.createElement("a");
    btn.id = "amazon-deal-btn";
    
    // Ensure URL uses the correct separator for the tag
    const separator = url.includes("?") ? "&" : "?";
    btn.href = `${url}${separator}tag=${AFFILIATE_TAG}`; 
    btn.target = "_blank";
    
    // Main container styles
    Object.assign(btn.style, {
        position: "fixed",
        top: "140px",
        right: "20px",
        zIndex: "2147483647",
        backgroundColor: "white",
        border: "2px solid #FF9900",
        borderRadius: "8px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
        padding: "0",
        textDecoration: "none",
        fontFamily: "Arial, sans-serif",
        width: "240px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "transform 0.2s",
        animation: "slideIn 0.5s ease-out"
    });

    // Hover effect for the main container
    btn.onmouseover = () => { btn.style.transform = "scale(1.05)"; };
    btn.onmouseout = () => { btn.style.transform = "scale(1.0)"; };

    // The Content HTML
    btn.innerHTML = `
        <div style="background: #FF9900; color: #111; padding: 12px; font-weight: bold; text-align: center; font-size: 16px; position: relative;">
            🔥 Cheaper on Amazon
            <span id="amazon-close-btn" style="position: absolute; top: 0; right: 0; cursor: pointer; font-size: 24px; line-height: 1; color: #111; padding: 8px 12px; font-weight: normal;">&times;</span>
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

    // Add animation styles
    const style = document.createElement('style');
    style.innerHTML = `@keyframes slideIn { from { transform: translateX(300px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`;
    document.head.appendChild(style);

    // Inject into body
    document.body.appendChild(btn);

    // --- CLOSE BUTTON LOGIC ---
    const closeBtn = document.getElementById('amazon-close-btn');
    closeBtn.addEventListener('click', (e) => {
        // Stop the click from opening the Amazon link
        e.preventDefault(); 
        e.stopPropagation(); 
        // Remove the popup
        btn.remove();
        console.log("❌ Amazon popup closed by user.");
    });
    
    // Add a separate hover effect just for the close button
    closeBtn.onmouseover = () => { closeBtn.style.color = "#fff"; closeBtn.style.backgroundColor = "rgba(0,0,0,0.1)"; };
    closeBtn.onmouseout = () => { closeBtn.style.color = "#111"; closeBtn.style.backgroundColor = "transparent"; };
}

// --- 3. THE HUNTER ---
function checkAmazon(searchTerm, takealotPrice) {
    if (!searchTerm) return;
    
    console.log(`🕵️ Searching Amazon.co.za for: "${searchTerm}"`);
    
    chrome.runtime.sendMessage(
        { type: "CHECK_AMAZON_PRICE", searchTerm: searchTerm },
        (response) => {
            if (response && response.success) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(response.html, "text/html");

                const priceElement = doc.querySelector('.a-price-whole');
                
                if (priceElement) {
                    let amazonPriceRaw = priceElement.innerText.replace(/[^\d]/g, '');
                    let amazonPrice = parseInt(amazonPriceRaw);

                    console.log(`📦 Amazon Price: R${amazonPrice}`);

                    if (amazonPrice < takealotPrice) {
                        const savings = takealotPrice - amazonPrice;
                        showAmazonButton(amazonPrice, savings, response.url);
                    } else {
                        console.log("📉 Takealot is cheaper or same price.");
                    }
                } else {
                    console.log("❌ Product found, but no price listed on Amazon.");
                }
            } else {
                console.error("Background search failed.");
            }
        }
    );
}

// --- 4. THE TRIGGER ---
function checkPage() {
    if (window.location.href === lastScannedUrl) return;

    // Find Takealot price
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