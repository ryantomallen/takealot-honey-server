console.log("🚀 AMAZON SEARCH AGENT: ACTIVE");

// --- CONFIGURATION ---
const AFFILIATE_TAG = "rian0ea-20"; // Your Store ID
let lastUrl = window.location.href;   // To track page changes

// --- 1. THE STYLES (Injected via JS so you don't need a separate CSS file) ---
const style = document.createElement('style');
style.innerHTML = `
    #amazon-deal-popup {
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: auto;
        max-width: 220px;
        background-color: #232f3e; /* Amazon Dark Blue */
        color: white;
        padding: 12px 20px;
        border-radius: 50px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.4);
        cursor: pointer;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        z-index: 2147483647; /* Maximum Z-Index to stay on top */
        transition: all 0.2s ease-in-out;
        border: 2px solid #ff9900; /* Amazon Orange border */
        display: flex;
        align-items: center;
        justify-content: center;
        animation: slideIn 0.5s ease-out;
    }

    #amazon-deal-popup:hover {
        transform: scale(1.05);
        background-color: #ff9900;
        border-color: #232f3e;
    }

    .amazon-popup-text {
        font-size: 14px; 
        font-weight: bold;
        pointer-events: none; /* Let clicks pass through to the container */
    }

    @keyframes slideIn {
        from { transform: translateY(100px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
`;
document.head.appendChild(style);


// --- 2. MAIN LOGIC ---
function init() {
    // A. Clean up old button if it exists (for when page changes)
    const existingBtn = document.getElementById("amazon-deal-popup");
    if (existingBtn) existingBtn.remove();

    // B. Check if we are on a Product Page (Look for "PLID" in URL or H1 tag)
    // Takealot product URLs always contain "PLID"
    if (!window.location.href.includes("PLID")) {
        return; // Not a product page, stop here.
    }

    // C. Get the Product Title
    const h1 = document.querySelector('h1');
    if (h1) {
        const productTitle = h1.innerText.trim();
        createFloatingButton(productTitle);
    }
}

// --- 3. CREATE THE BUTTON ---
function createFloatingButton(query) {
    const container = document.createElement('div');
    container.id = "amazon-deal-popup";
    
    container.innerHTML = `
        <div class="amazon-popup-text">Check this on Amazon 🇺🇸</div>
    `;

    // The Click Action
    container.addEventListener('click', function() {
        // Construct the Search URL with your Tag
        const url = "https://www.amazon.com/s?k=" + encodeURIComponent(query) + "&tag=" + AFFILIATE_TAG;
        window.open(url, '_blank');
    });

    document.body.appendChild(container);
    console.log(`✅ Button added for: "${query}"`);
}


// --- 4. STARTUP & WATCHER ---

// Run once when page loads
init();

// Watch for URL changes (because Takealot is a Single Page App)
setInterval(() => {
    if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        console.log("🔄 URL Changed, re-initializing...");
        // Wait a small moment for the new content to load
        setTimeout(init, 1000); 
    }
}, 1000);