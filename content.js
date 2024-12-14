// Content script to simplify text using OpenAI's updated API

console.log('Content script is running...');

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'injectButtons') {
        console.log('Injecting buttons...');

        // Find all paragraphs
        const paragraphs = document.querySelectorAll('p');
        console.log(`Found ${paragraphs.length} paragraphs.`);

        paragraphs.forEach((p, index) => {
            const simplifyButton = document.createElement('button');
            simplifyButton.textContent = 'Simplify';
            simplifyButton.style.marginLeft = '10px';

            const showOriginalButton = document.createElement('button');
            showOriginalButton.textContent = 'Show Original';
            showOriginalButton.style.marginLeft = '10px';

            // Attach buttons after the paragraph
            p.insertAdjacentElement('afterend', simplifyButton);
            p.insertAdjacentElement('afterend', showOriginalButton);

            // Save the original text
            const originalText = p.textContent;

            // Handle simplify button click
            simplifyButton.addEventListener('click', () => {
                chrome.storage.local.get('openaiApiKey', (result) => {
                    const apiKey = result.openaiApiKey;
                    if (!apiKey) {
                        alert('API key is missing! Please set it in the popup.');
                        return;
                    }

                    // Call OpenAI API to simplify text
                    fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`
                        },
                        body: JSON.stringify({
                            model: 'gpt-3.5-turbo', // Use gpt-3.5-turbo or gpt-4
                            messages: [
                                { role: 'system', content: 'You are a helpful assistant that simplifies text.' },
                                { role: 'user', content: `Simplify this text:\n\n${originalText}` }
                            ],
                            max_tokens: 100,
                            temperature: 0.7
                        })
                    })
                        .then((response) => response.json())
                        .then((data) => {
                            if (data.choices && data.choices[0].message.content) {
                                p.textContent = data.choices[0].message.content.trim();
                            } else {
                                console.error('Error simplifying text:', data);
                            }
                        })
                        .catch((error) => console.error('OpenAI API error:', error));
                });
            });

            // Handle show original button click
            showOriginalButton.addEventListener('click', () => {
                p.textContent = originalText;
            });
        });
    }
});
