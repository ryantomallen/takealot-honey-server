chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "CHECK_AMAZON_PRICE") {
        
        const searchTerm = request.searchTerm;
        // Construct the search URL
        const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(searchTerm)}`;

        // Perform the fetch (Background scripts can bypass some CORS issues)
        fetch(searchUrl)
            .then(response => response.text()) // Get the HTML text
            .then(html => {
                sendResponse({ success: true, html: html, url: searchUrl });
            })
            .catch(error => {
                console.error("Fetch error:", error);
                sendResponse({ success: false, error: error.message });
            });

        return true; // IMPORTANT: This tells Chrome to keep the channel open for the async fetch
    }
});