document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('api-key');
    const saveButton = document.getElementById('save-key');
    const deleteButton = document.getElementById('delete-key');
    const status = document.getElementById('status');

    // Disable save button initially if input is empty
    saveButton.disabled = !apiKeyInput.value.trim();

    // Enable or disable save button based on input
    apiKeyInput.addEventListener('input', () => {
        saveButton.disabled = !apiKeyInput.value.trim();
    });

    // Load the saved API key when the page loads
    chrome.runtime.sendMessage({ action: 'getApiKey' }, (response) => {
        if (response.success) {
            apiKeyInput.value = response.apiKey;
            saveButton.disabled = false;
        } else {
            console.log('No API Key found or failed to decrypt:', response.error);
        }
    });

    // Save the API key
    saveButton.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            chrome.runtime.sendMessage({ action: 'encryptApiKey', apiKey }, (response) => {
                if (response.success) {
                    apiKeyInput.value = '';
                    saveButton.disabled = true;
                    status.textContent = 'API Key encrypted and saved!';
                    setTimeout(() => (status.textContent = ''), 5000);
                } else {
                    status.textContent = `Error: ${response.error}`;
                }
            });
        } else {
            status.textContent = 'Please enter a valid API Key.';
        }
    });

    // Delete the API key
    deleteButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'deleteApiKey' }, (response) => {
            if (response.success) {
                apiKeyInput.value = '';
                saveButton.disabled = true;
                status.textContent = 'API Key deleted successfully.';
                setTimeout(() => (status.textContent = ''), 5000);
                console.log('API Key deleted and extension deactivated.');
            } else {
                status.textContent = `Error: ${response.error}`;
            }
        });
    });

    // --- CUSTOM PROMPT FUNCTIONALITY BELOW ---

    const promptInput = document.getElementById('custom-prompt');
    const useCustomPromptCheckbox = document.getElementById('use-custom-prompt');
    const savePromptButton = document.getElementById('save-prompt');

    // Load saved prompt and checkbox state
    chrome.storage.sync.get(['customPrompt', 'useCustomPrompt'], (data) => {
        if (data.customPrompt) {
            promptInput.value = data.customPrompt;
        }
        useCustomPromptCheckbox.checked = data.useCustomPrompt || false;
    });

    // Function to save the custom prompt
    function savePrompt() {
        const customPrompt = promptInput.value.trim();
        if (customPrompt) {
            chrome.storage.sync.set({ customPrompt, useCustomPrompt: true }, () => {
                useCustomPromptCheckbox.checked = true;
                status.textContent = "Custom prompt saved!";
                setTimeout(() => status.textContent = '', 3000);
            });
        }
    }

    // Save prompt when pressing Enter
    promptInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            savePrompt();
        }
    });

    // Save prompt when clicking "Save Prompt" button
    savePromptButton.addEventListener('click', savePrompt);

    // Save checkbox state when toggled
    useCustomPromptCheckbox.addEventListener('change', () => {
        chrome.storage.sync.set({ useCustomPrompt: useCustomPromptCheckbox.checked });
    });
});