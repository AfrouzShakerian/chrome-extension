document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('api-key');
    const saveButton = document.getElementById('save-key');
    const status = document.getElementById('status');

    // Load the saved API key when the page loads
    chrome.storage.local.get(['openaiApiKey'], (data) => {
        if (data.openaiApiKey) {
            apiKeyInput.value = data.openaiApiKey;
        }
    });

    // Save the API key and activate the extension
    saveButton.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            chrome.storage.local.set({ openaiApiKey: apiKey, extensionActive: true }, () => {
                status.textContent = 'API Key saved and extension activated!';
                setTimeout(() => (status.textContent = ''), 3000); // Clear message after 3 seconds
                console.log('API Key saved and extension activated.');
            });
        } else {
            status.textContent = 'Please enter a valid API Key.';
        }
    });
});
