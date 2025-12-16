chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "CHECK_AMAZON_PRICE") {
        
        const searchTerm = request.searchTerm;
        // CHANGED: Now searching Amazon South Africa
        const searchUrl = `https://www.amazon.co.za/s?k=${encodeURIComponent(searchTerm)}`;

        fetch(searchUrl)
            .then(response => response.text())
            .then(html => {
                sendResponse({ success: true, html: html, url: searchUrl });
            })
            .catch(error => {
                console.error("Fetch error:", error);
                sendResponse({ success: false, error: error.message });
            });

        return true; 
    }
});