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

    // Load the saved API key when the page loads (fetch encrypted key from background)
    chrome.runtime.sendMessage({ action: 'getApiKey' }, (response) => {
        if (response.success) {
            apiKeyInput.value = response.apiKey; // Display the decrypted API key
            saveButton.disabled = false; // Enable save button if a key exists
        } else {
            console.log('No API Key found or failed to decrypt:', response.error);
        }
    });

    // Save the API key and activate the extension
    saveButton.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            chrome.runtime.sendMessage({ action: 'encryptApiKey', apiKey }, (response) => {
                if (response.success) {
                    apiKeyInput.value = ''; // Clear the input field
                    saveButton.disabled = true; // Disable save button since input is cleared
                    status.textContent = 'API Key encrypted and saved!';
                    setTimeout(() => (status.textContent = ''), 5000); // Clear message after 5 seconds
                } else {
                    status.textContent = `Error: ${response.error}`;
                }
            });
        } else {
            status.textContent = 'Please enter a valid API Key.';
        }
    });

    // Delete the API key from storage
    deleteButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'deleteApiKey' }, (response) => {
            if (response.success) {
                apiKeyInput.value = ''; // Clear the input field
                saveButton.disabled = true; // Disable save button
                status.textContent = 'API Key deleted successfully.';
                setTimeout(() => (status.textContent = ''), 5000); // Clear message after 5 seconds
                console.log('API Key deleted and extension deactivated.');
            } else {
                status.textContent = `Error: ${response.error}`;
            }
        });
    });
});