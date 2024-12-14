document.addEventListener('DOMContentLoaded', () => {
    const saveKeyButton = document.getElementById('save-key');
    const status = document.getElementById('status');

    // Save the API key to Chrome storage
    saveKeyButton.addEventListener('click', () => {
        const apiKey = document.getElementById('api-key').value;
        if (apiKey.trim() === '') {
            status.textContent = 'API key cannot be empty.';
            return;
        }

        // Save the API key in storage
        chrome.storage.local.set({ openaiApiKey: apiKey }, () => {
            status.textContent = 'API key saved securely!';

            // Send a message to the content script to inject buttons
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'injectButtons' });
            });
        });
    });
});
