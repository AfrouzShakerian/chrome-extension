document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('api-key');
    const saveButton = document.getElementById('save-key');
    const deleteButton = document.getElementById('delete-key'); // New Delete button
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
                apiKeyInput.value = ''; // Clear input field
                saveButton.disabled = true; // Disable save button since input is cleared
                status.textContent = 'API Key saved and extension activated!';
                setTimeout(() => (status.textContent = ''), 5000); // Clear message after 5 seconds
                console.log('API Key saved and extension activated.');
            });
        } else {
            status.textContent = 'Please enter a valid API Key.';
        }
    });

    // Delete the API key from storage
    deleteButton.addEventListener('click', () => {
        chrome.storage.local.remove(['openaiApiKey'], () => {
            chrome.storage.local.set({ extensionActive: false }, () => {
                apiKeyInput.value = ''; // Clear the input field
                saveButton.disabled = true; // Disable save button
                status.textContent = 'API Key deleted successfully.';
                setTimeout(() => (status.textContent = ''), 5000); // Clear message after 5 seconds
                console.log('API Key deleted and extension deactivated.');
            });
        });
    });
});