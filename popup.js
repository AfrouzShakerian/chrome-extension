document.addEventListener('DOMContentLoaded', () => {
    const apiKey = '';

    chrome.storage.local.set({ 'openai-api-key': apiKey }, function () {
        console.log('API key securely stored in local storage.');
    });

    // Get the active tab and execute the content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        let activeTab = tabs[0].id;

        chrome.scripting.executeScript({
            target: { tabId: activeTab },
            files: ['content.js']
        });
    });
});
