// Inject the external CSS for button styling
const style = document.createElement('link');
style.rel = 'stylesheet';
style.href = chrome.runtime.getURL('style.css');
document.head.appendChild(style);

console.log('Content script is running...');

// Wait for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'injectButtons') {
        console.log('Injecting buttons...');

        document.querySelectorAll('p').forEach((p, index) => {
            // Store the original HTML structure
            const originalHTML = p.innerHTML;

            // Create button container
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'button-container';

            // Create "Simplify" button
            const simplifyButton = document.createElement('button');
            simplifyButton.textContent = 'Simplify';
            simplifyButton.className = 'simplify-btn';

            // Create "Show Original" button
            const originalButton = document.createElement('button');
            originalButton.textContent = 'Show Original';
            originalButton.className = 'original-btn';

            // Append buttons to the container
            buttonContainer.appendChild(simplifyButton);
            buttonContainer.appendChild(originalButton);
            p.insertAdjacentElement('afterend', buttonContainer);

            // Simplify Button Logic
            simplifyButton.addEventListener('click', () => {
                chrome.storage.local.get('openaiApiKey', (result) => {
                    const apiKey = result.openaiApiKey;
                    if (!apiKey) {
                        alert('API key is missing! Please set it in the popup.');
                        return;
                    }

                    // Extract text content only (ignore HTML tags)
                    const originalText = p.innerText;

                    fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`
                        },
                        body: JSON.stringify({
                            model: 'gpt-3.5-turbo',
                            messages: [
                                { role: 'system', content: 'Simplify the following text.' },
                                { role: 'user', content: originalText }
                            ],
                            max_tokens: 100,
                            temperature: 0.7
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.choices && data.choices[0].message.content) {
                            p.innerText = data.choices[0].message.content.trim(); // Replace text, keeping HTML safe
                        } else {
                            console.error('Error simplifying text:', data);
                        }
                    })
                    .catch(error => console.error('OpenAI API error:', error));
                });
            });

            // Show Original Button Logic
            originalButton.addEventListener('click', () => {
                p.innerHTML = originalHTML; // Restore the full original HTML content
            });
        });
    }
});
