document.addEventListener('DOMContentLoaded', () => {
    const toggleExtension = document.getElementById('toggle-extension');
    const toggleStatus = document.getElementById('toggle-status');
    const optionsButton = document.getElementById('options-button');

    // Initialize toggle state from the background script
    chrome.runtime.sendMessage({ action: 'getApiKey' }, (response) => {
        if (!response.success || !response.apiKey) {
            toggleExtension.disabled = true;
            toggleStatus.textContent = 'OpenAI API Key is required!';
            toggleStatus.style.color = 'red';
        } else {
            chrome.storage.local.get('extensionActive', (data) => {
                const isActive = data.extensionActive || false;
                toggleExtension.checked = isActive;
                toggleStatus.textContent = isActive
                    ? 'Extension is Activated'
                    : 'Extension is Deactivated';
            });
        }
    });

    // Handle toggle change
    toggleExtension.addEventListener('change', () => {
        chrome.runtime.sendMessage({ action: 'getApiKey' }, (response) => {
            if (!response.success || !response.apiKey) {
                toggleExtension.checked = false;
                toggleStatus.textContent = 'API Key is required to activate the extension.';
                return;
            }

            const isActive = toggleExtension.checked;
            chrome.storage.local.set({ extensionActive: isActive }, () => {
                toggleStatus.textContent = isActive
                    ? 'Extension is Activated'
                    : 'Extension is Deactivated';

                // Notify the content script about the activation state
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    chrome.tabs.sendMessage(tabs[0].id, { action: isActive ? 'activate' : 'deactivate' });
                });
            });
        });
    });

    // Open options page
    optionsButton.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
});