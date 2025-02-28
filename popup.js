document.addEventListener('DOMContentLoaded', () => {
    const toggleExtension = document.getElementById('toggle-extension');
    const toggleStatus = document.getElementById('toggle-status');
    const toggleCustomPrompt = document.getElementById('toggle-custom-prompt');
    const customPromptStatus = document.getElementById('custom-prompt-status');
    const optionsButton = document.getElementById('options-button');

    // 🔹 Load API key, extension activation, and custom prompt state
    chrome.runtime.sendMessage({ action: 'getApiKey' }, (response) => {
        if (!response.success || !response.apiKey) {
            toggleExtension.disabled = true;
            toggleStatus.textContent = 'OpenAI API Key is required!';
            toggleStatus.style.color = 'red';
        } else {
            chrome.storage.local.get(['extensionActive', 'useCustomPrompt'], (data) => {
                const isActive = data.extensionActive || false;
                toggleExtension.checked = isActive;
                toggleStatus.textContent = isActive ? 'Extension is Activated' : 'Extension is Deactivated';

                // Load Custom Prompt Toggle State
                toggleCustomPrompt.checked = data.useCustomPrompt || false;

                // 🔹 Disable custom prompt toggle if extension is active
                toggleCustomPrompt.disabled = isActive;
            });
        }
    });

    // 🔹 Handle Extension Activation Toggle
    toggleExtension.addEventListener('change', () => {
        chrome.runtime.sendMessage({ action: 'getApiKey' }, (response) => {
            if (!response.success || !response.apiKey) {
                toggleExtension.checked = false;
                toggleStatus.textContent = 'API Key is required to activate the extension.';
                return;
            }

            const isActive = toggleExtension.checked;
            
            if (isActive) {
                // 🔹 User is activating the extension
                chrome.storage.sync.get('customPrompt', (data) => {
                    if (toggleCustomPrompt.checked) {
                        // 🔹 Check if custom prompt exists
                        if (!data.customPrompt) {
                            // ❌ No custom prompt found, show error, turn toggle OFF
                            customPromptStatus.textContent = 'No custom prompt found! Using default prompt.';
                            toggleCustomPrompt.checked = false;
                            setTimeout(() => customPromptStatus.textContent = 'Use Custom Prompt', 5000);
                        }
                        // ✅ If a custom prompt exists, it will be used.
                    }
                    
                    // 🔹 Save states and disable the custom prompt toggle
                    chrome.storage.local.set({ extensionActive: true, useCustomPrompt: toggleCustomPrompt.checked }, () => {
                        toggleStatus.textContent = 'Extension is Activated';
                        toggleCustomPrompt.disabled = true; // Prevent changing after activation

                        // Notify the content script
                        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                            if (tabs.length > 0) {
                                chrome.tabs.sendMessage(tabs[0].id, { action: 'activate' });
                            }
                        });
                    });
                });
            } else {
                // 🔹 User is deactivating the extension
                chrome.storage.local.set({ extensionActive: false }, () => {
                    toggleStatus.textContent = 'Extension is Deactivated';
                    toggleCustomPrompt.disabled = false; // Allow changing custom prompt toggle again

                    // Notify the content script
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        if (tabs.length > 0) {
                            chrome.tabs.sendMessage(tabs[0].id, { action: 'deactivate' });
                        }
                    });
                });
            }
        });
    });

    // 🔹 Handle Custom Prompt Toggle (Only Before Activation)
    toggleCustomPrompt.addEventListener('change', () => {
        if (toggleExtension.checked) {
            // 🔹 Prevent changing the toggle if the extension is active
            toggleCustomPrompt.checked = !toggleCustomPrompt.checked; 
            return;
        }

        const useCustom = toggleCustomPrompt.checked;

        if (useCustom) {
            // Check if a custom prompt exists
            chrome.storage.sync.get('customPrompt', (data) => {
                if (!data.customPrompt) {
                    // ❌ No custom prompt found, show error & disable toggle
                    customPromptStatus.textContent = 'No custom prompt found! Set one in Options.';
                    toggleCustomPrompt.checked = false; // Turn off toggle
                    setTimeout(() => customPromptStatus.textContent = 'Use Custom Prompt', 3000);
                } else {
                    // ✅ Custom prompt exists, enable toggle
                    chrome.storage.local.set({ useCustomPrompt: true });
                }
            });
        } else {
            // 🔹 Turn off custom prompt
            chrome.storage.local.set({ useCustomPrompt: false });
        }
    });

    // 🔹 Open Options Page
    optionsButton.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
});
