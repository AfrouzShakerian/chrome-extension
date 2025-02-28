// Inject the external CSS for button styling
const style = document.createElement('link');
style.rel = 'stylesheet';
style.href = chrome.runtime.getURL('style.css');
document.head.appendChild(style);

console.log('Content script is running...');

// Variable to store the IntersectionObserver instance
let observer = null;

function processSimplification(originalText, callback) {
    chrome.storage.local.get(['useCustomPrompt'], (data) => {
        if (data.useCustomPrompt) {
            chrome.storage.sync.get('customPrompt', (promptData) => {
                if (promptData.customPrompt) {
                    callback(`${promptData.customPrompt}\n\n${originalText}`);
                } else {
                    console.warn("No custom prompt found! Using default.");
                    callback(getDefaultPrompt(originalText));
                }
            });
        } else {
            callback(getDefaultPrompt(originalText));
        }
    });
}

function getDefaultPrompt(originalText) {
    return `You are a helpful assistant who simplifies text for people with understanding problems.
    Your task is to simplify the following text using simple words, short sentences,
    and a clear structure, so it is easy to understand. Avoid jargon,
    reduce unnecessary details, and ensure the meaning is preserved.
    Here is the text to simplify: ${originalText}`;
}


// Function to simplify paragraphs
function simplifyParagraph(paragraph) {
    if (paragraph.dataset.simplified) return; // Skip already processed paragraphs

    const originalText = paragraph.innerText.trim();

    chrome.runtime.sendMessage({ action: 'getApiKey' }, (response) => {
        if (!response.success || !response.apiKey) {
            console.warn('API key is missing or decryption failed! Please set it in the popup.');
            return;
        }

        const apiKey = response.apiKey;

        processSimplification(originalText, (prompt) => {
            fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'system', content: prompt }],
                    max_tokens: 200,
                    temperature: 0.4
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.choices && data.choices[0].message.content) {
                    const simplifiedText = data.choices[0].message.content.trim();

                    // Wrap paragraph in a container
                    const parent = paragraph.parentNode;
                    const container = document.createElement('div');
                    container.className = 'paragraph-container';
                    parent.replaceChild(container, paragraph);
                    container.appendChild(paragraph);

                    // Create a new <p> for the simplified text
                    const simplifiedParagraph = document.createElement('p');
                    simplifiedParagraph.className = 'simplified-text';
                    simplifiedParagraph.innerText = simplifiedText;
                    container.appendChild(simplifiedParagraph);

                    // Store references in the original paragraph
                    paragraph.dataset.original = originalText;
                    paragraph.dataset.simplified = 'true';
                    paragraph.style.display = 'none'; // Hide original by default

                    // Add buttons (but they remain hidden initially)
                    const buttonContainer = document.createElement('div');
                    buttonContainer.className = 'button-container';

                    const simplifyButton = document.createElement('button');
                    simplifyButton.textContent = 'Simplify';
                    simplifyButton.className = 'simplify-btn';

                    const originalButton = document.createElement('button');
                    originalButton.textContent = 'Show Original';
                    originalButton.className = 'original-btn';
                    originalButton.dataset.state = 'simplified'; // Default state

                    buttonContainer.appendChild(simplifyButton);
                    buttonContainer.appendChild(originalButton);
                    container.appendChild(buttonContainer);

                    // 🔹 Handle Simplify Button Click
                    simplifyButton.addEventListener('click', () => {
                        if (originalButton.dataset.state === 'original') {
                            // 🔸 If currently showing the original text, just switch back to the last simplified version
                            paragraph.style.display = 'none'; // Hide original text
                            simplifiedParagraph.style.display = 'block'; // Show last simplified version
                            originalButton.textContent = 'Show Original';
                            originalButton.dataset.state = 'simplified';
                        } else {
                            // 🔸 If already showing the simplified version, further simplify it
                            const currentSimplifiedText = simplifiedParagraph.innerText;
                            const furtherSimplifyPrompt = `
                                You are a helpful assistant that simplifies text for people with cognitive disabilities.
                                Take the following text and make it even simpler by using very basic words, making shorter sentences, as if you are explaining to a 12-year-old,
                                and removing any unnecessary details while keeping the core meaning intact:
                                ${currentSimplifiedText}
                            `;

                            fetch('https://api.openai.com/v1/chat/completions', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${apiKey}`
                                },
                                body: JSON.stringify({
                                    model: 'gpt-3.5-turbo',
                                    messages: [{ role: 'system', content: furtherSimplifyPrompt }],
                                    max_tokens: 200,
                                    temperature: 0.4
                                })
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.choices && data.choices[0].message.content) {
                                    simplifiedParagraph.innerText = data.choices[0].message.content.trim();
                                } else {
                                    console.error('Error further simplifying text:', data);
                                }
                            })
                            .catch(error => console.error('OpenAI API error:', error));
                        }
                    });


                    // 🔹 Handle Show Original Button Click
                    originalButton.addEventListener('click', () => {
                        const isShowingOriginal = originalButton.dataset.state === 'original';

                        if (isShowingOriginal) {
                            // Switch to simplified text
                            paragraph.style.display = 'none';
                            simplifiedParagraph.style.display = 'block';
                            originalButton.textContent = 'Show Original';
                            originalButton.dataset.state = 'simplified';
                        } else {
                            // Switch to original text
                            paragraph.style.display = 'block';
                            simplifiedParagraph.style.display = 'none';
                            originalButton.textContent = 'Show Simplified';
                            originalButton.dataset.state = 'original';
                        }
                    });

                    // 🔹 Modify Hover Behavior for Buttons
                    container.addEventListener('mouseover', () => {
                        if (originalButton.dataset.state === 'simplified') {
                            paragraph.style.display = 'block';
                            simplifiedParagraph.style.display = 'none';
                        }
                        buttonContainer.style.visibility = 'visible';
                        buttonContainer.style.opacity = '1';
                    });

                    container.addEventListener('mouseout', () => {
                        if (originalButton.dataset.state === 'simplified') {
                            paragraph.style.display = 'none';
                            simplifiedParagraph.style.display = 'block';
                        }
                        buttonContainer.style.visibility = 'hidden';
                        buttonContainer.style.opacity = '0';
                    });

                } else {
                    console.error('Error simplifying text:', data);
                }
            })
            .catch(error => console.error('OpenAI API error:', error));
        });
    });
}


// Start simplifying paragraphs
function startSimplifying() {
    observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                simplifyParagraph(entry.target); // Simplify paragraph
            }
        });
    });

    const paragraphs = document.querySelectorAll('p');
    paragraphs.forEach((paragraph) => {
        observer.observe(paragraph);
    });
}

// Stop simplifying and reset paragraphs
function stopSimplifying() {
    if (observer) {
        observer.disconnect(); // Stop observing paragraphs
        observer = null;
    }

    // Reset paragraphs to their original state
    const containers = document.querySelectorAll('.paragraph-container'); // Find all processed containers
    containers.forEach((container) => {
        const originalParagraph = container.querySelector('[data-original]'); // Get original paragraph
        if (originalParagraph) {
            originalParagraph.style.display = 'block'; // Make sure original text is visible
            originalParagraph.removeAttribute('data-simplified'); // Remove the marker
            container.replaceWith(originalParagraph); // Replace container with original paragraph
        }
    });

    console.log('Simplification stopped. All paragraphs reset to their original state.');
}

// Listen for activation/deactivation messages
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'activate') {
        startSimplifying();
    } else if (message.action === 'deactivate') {
        stopSimplifying();
    }
});

// Check the activation state before running the script
chrome.storage.local.get('extensionActive', (data) => {
    if (data.extensionActive) {
        startSimplifying(); // Simplify if active
    }
});
