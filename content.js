// Inject the external CSS for button styling
const style = document.createElement('link');
style.rel = 'stylesheet';
style.href = chrome.runtime.getURL('style.css');
document.head.appendChild(style);

console.log('Content script is running...');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'injectButtons') {
        console.log('Injecting buttons...');

        document.querySelectorAll('p').forEach((p, index) => {
            // Filter out empty paragraphs or those with only non-text content
            const visibleText = p.innerText.trim();
            const hasOnlyImages = p.children.length > 0 && Array.from(p.children).every(child => child.tagName === 'IMG');

            if (!visibleText || hasOnlyImages) {
                console.log(`Skipping paragraph ${index + 1}: Empty or contains only images.`);
                return; // Skip this paragraph
            }

            const originalHTML = p.innerHTML; // Store the original paragraph HTML
            const originalText = p.innerText; // Store the plain text of the paragraph

            // Extract all links from the paragraph
            const links = Array.from(p.querySelectorAll('a')).map((a) => {
                return { text: a.textContent, href: a.href };
            });

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
            
                    fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`
                        },
                        body: JSON.stringify({
                            model: 'gpt-3.5-turbo',
                            messages: [
                                {
                                    role: 'system',
                                    content: `
                                        You are a helpful assistant that simplifies text for people with cognitive disabilities.
                                        - If the input text has more than one sentence or is long, simplify it using short bullet points.
                                        - If the input text is already a short sentence, simplify it into one clear, direct sentence.
                                        Use simple words, short sentences, and avoid jargon. The goal is to make the text clear, easy to understand, and concise.
                                        `
                                },
                                {
                                    role: 'user',
                                    content: `Simplify the following text:\n\n${originalText}`
                                }
                            ],
                            max_tokens: 200,
                            temperature: 0.4
                        })                        
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.choices && data.choices[0].message.content) {
                            // Replace paragraph text with simplified content
                            const simplifiedText = data.choices[0].message.content.trim();
                            p.innerText = simplifiedText.endsWith('.') || simplifiedText.endsWith('!') || simplifiedText.endsWith('?')
                                ? simplifiedText
                                : simplifiedText + ".";

            
                            // Create a container for the links
                            const linkContainer = document.createElement('span');
                            linkContainer.style.marginLeft = '10px';
            
                            // Append links with separators
                            links.forEach((link, index) => {
                                const linkElement = document.createElement('a');
                                linkElement.href = link.href;
                                linkElement.textContent = link.text;
                                linkElement.style.marginLeft = index > 0 ? '5px' : '0'; // Add spacing between links
                                linkElement.target = '_blank'; // Open links in a new tab
            
                                // Add separator if it's not the last link
                                if (index < links.length - 1) {
                                    const separator = document.createTextNode(' | ');
                                    linkContainer.appendChild(linkElement);
                                    linkContainer.appendChild(separator);
                                } else {
                                    linkContainer.appendChild(linkElement);
                                }
                            });
            
                            // Append the link container to the paragraph
                            p.appendChild(linkContainer);
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
