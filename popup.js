document.addEventListener('DOMContentLoaded', () => {
    const toggleExtension = document.getElementById('toggle-extension');
    const toggleStatus = document.getElementById('toggle-status');
    const optionsButton = document.getElementById('options-button');

    // Initialize toggle state from storage
    chrome.storage.local.get(['extensionActive', 'openaiApiKey'], (data) => {
        const isActive = data.extensionActive || false;
        const hasApiKey = Boolean(data.openaiApiKey);

        // If no API Key, disable the toggle and show an error message
        if (!hasApiKey) {
            toggleExtension.disabled = true;
            toggleStatus.textContent = 'OpenAI API Key is required!';
            toggleStatus.style.color = 'red';
        } else {
            toggleExtension.checked = isActive;
            toggleStatus.textContent = isActive
                ? 'Extension is Activated'
                : 'Extension is Deactivated';
        }
    });

    // Handle toggle change
    toggleExtension.addEventListener('change', () => {
        chrome.storage.local.get('openaiApiKey', (data) => {
            if (!data.openaiApiKey) {
                // Block toggling if no API Key
                toggleExtension.checked = false;
                toggleStatus.textContent = 'API Key is required to activate the extension.';
            } else {
                const isActive = toggleExtension.checked;
                chrome.storage.local.set({ extensionActive: isActive }, () => {
                    toggleStatus.textContent = isActive
                        ? 'Extension is Activated'
                        : 'Extension is Deactivated';

                    // Send message to content scripts
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        chrome.tabs.sendMessage(tabs[0].id, { action: isActive ? 'activate' : 'deactivate' });
                    });
                });
            }
        });
    });

    // Open options page
    optionsButton.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
});
