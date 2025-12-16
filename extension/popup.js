document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Get the button and input field from your HTML
    const searchButton = document.getElementById('amazon-search-btn');
    const inputField = document.getElementById('search-input');

    // 2. Define the function that runs when clicked
    function runSearch() {
        const query = inputField.value;

        // CHECK IF INPUT IS EMPTY
        if (!query) {
            return; // Do nothing if box is empty
        }

        // --- THE MONEY PART ---
        const affiliateTag = "rian0ea-20"; 
        
        // Build the URL with the query AND your tag
        let url = "https://www.amazon.com/s?k=" + encodeURIComponent(query) + "&tag=" + affiliateTag;
        
        // Open the new tab
        chrome.tabs.create({ url: url });
    }

    // 3. Add the click listener to the button
    searchButton.addEventListener('click', runSearch);

    // Optional: Allow pressing "Enter" key to search
    inputField.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            runSearch();
        }
    });
});