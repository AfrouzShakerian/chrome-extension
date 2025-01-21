document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('api-key');
    const saveButton = document.getElementById('save-key');
    const status = document.getElementById('status');

    // Disable save button initially if input is empty
    saveButton.disabled = !apiKeyInput.value.trim();

    // Enable or disable save button based on input
    apiKeyInput.addEventListener('input', () => {
        saveButton.disabled = !apiKeyInput.value.trim(); // Disable if input is empty
    });

    // Load the saved API key when the page loads
    chrome.storage.local.get(['openaiApiKey'], (data) => {
        if (data.openaiApiKey) {
            apiKeyInput.value = data.openaiApiKey;
            saveButton.disabled = false; // Enable save button if a key exists
        }
    });

    // Save the API key and activate the extension
    saveButton.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            chrome.storage.local.set({ openaiApiKey: apiKey, extensionActive: true }, () => {
                status.textContent = 'API Key saved and extension activated!';
                setTimeout(() => (status.textContent = ''), 5000); // Clear message after 5 seconds
                console.log('API Key saved and extension activated.');
            });
        } else {
            status.textContent = 'Please enter a valid API Key.';
        }
    });
});
