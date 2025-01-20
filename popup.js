document.addEventListener('DOMContentLoaded', () => {
    const toggleExtension = document.getElementById('toggle-extension');
    const toggleStatus = document.getElementById('toggle-status');
    const optionsButton = document.getElementById('options-button');

    // Initialize toggle state from storage
    chrome.storage.local.get('extensionActive', (data) => {
        const isActive = data.extensionActive || false;
        toggleExtension.checked = isActive;
        toggleStatus.textContent = isActive ? 'Extension is Activated' : 'Extension is Deactivated';
    });

    // Handle toggle change
    toggleExtension.addEventListener('change', () => {
        const isActive = toggleExtension.checked;
        chrome.storage.local.set({ extensionActive: isActive }, () => {
            toggleStatus.textContent = isActive ? 'Extension is Activated' : 'Extension is Deactivated';

            // Send message to content scripts
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { action: isActive ? 'activate' : 'deactivate' });
            });
        });
    });

    // Open options page
    optionsButton.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
});
