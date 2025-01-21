// Inject the external CSS for button styling
const style = document.createElement('link');
style.rel = 'stylesheet';
style.href = chrome.runtime.getURL('style.css');
document.head.appendChild(style);

console.log('Content script is running...');

// Variable to store the IntersectionObserver instance
let observer = null;

// Function to simplify paragraphs
function simplifyParagraph(paragraph) {
    if (paragraph.dataset.simplified) return; // Skip already processed paragraphs

    const originalText = paragraph.innerText.trim();

    chrome.storage.local.get('openaiApiKey', (result) => {
        const apiKey = result.openaiApiKey;
        if (!apiKey) {
            console.warn('API key is missing! Please set it in the popup.');
            return;
        }

        const prompt = `You are a helpful assistant who simplifies text for people with cognitive disabilities or reading challenges. Your task is to rewrite the following text using simple words, short sentences, and a clear structure. Avoid jargon, reduce unnecessary details, and ensure the meaning is preserved. Here is the text to simplify:${originalText}`;

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
                        content: prompt
                    }
                ],
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
                simplifiedParagraph.style.backgroundColor = '#f0f8ff'; // Highlight background
                simplifiedParagraph.style.display = 'block'; // Show simplified by default
                simplifiedParagraph.style.borderRadius = '4px'; // Rounded edges
                simplifiedParagraph.style.padding = '10px'; // Add padding
                container.appendChild(simplifiedParagraph);

                // Store references in the original paragraph
                paragraph.dataset.original = originalText;
                paragraph.dataset.simplified = 'true';
                paragraph.style.display = 'none'; // Hide original by default

                // Add buttons (but they remain hidden initially)
                const buttonContainer = document.createElement('div');
                buttonContainer.className = 'button-container';
                buttonContainer.style.visibility = 'hidden';
                buttonContainer.style.opacity = '0';

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

                // Simplify button functionality
                simplifyButton.addEventListener('click', () => {
                    const currentSimplifiedText = simplifiedParagraph.innerText;
                    const furtherSimplifyPrompt = `
                        You are a helpful assistant that simplifies text for people with cognitive disabilities.
                        Take the following text and make it even simpler by using very basic words, shorter sentences,
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
                            messages: [
                                {
                                    role: 'system',
                                    content: furtherSimplifyPrompt
                                }
                            ],
                            max_tokens: 200,
                            temperature: 0.4
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.choices && data.choices[0].message.content) {
                            simplifiedParagraph.innerText = data.choices[0].message.content.trim();

                            // Show the updated simplified text
                            paragraph.style.display = 'none'; // Hide original text
                            simplifiedParagraph.style.display = 'block'; // Show simplified text

                            // Reset the state of the Show Original button
                            originalButton.textContent = 'Show Original';
                            originalButton.dataset.state = 'simplified';
                        } else {
                            console.error('Error further simplifying text:', data);
                        }
                    })
                    .catch(error => console.error('OpenAI API error:', error));
                });

                // Show Original button functionality
                originalButton.addEventListener('click', () => {
                    const isShowingOriginal = originalButton.dataset.state === 'original';

                    if (isShowingOriginal) {
                        // Switch to simplified text
                        paragraph.style.display = 'none'; // Hide original text
                        simplifiedParagraph.style.display = 'block'; // Show simplified text
                        originalButton.textContent = 'Show Original'; // Update button text
                        originalButton.dataset.state = 'simplified'; // Update state
                    } else {
                        // Switch to original text
                        paragraph.style.display = 'block'; // Show original text
                        simplifiedParagraph.style.display = 'none'; // Hide simplified text
                        originalButton.textContent = 'Show Simplified'; // Update button text
                        originalButton.dataset.state = 'original'; // Update state
                    }
                });

                // Modify hover functionality to respect the button state
                container.addEventListener('mouseover', () => {
                    if (originalButton.dataset.state === 'simplified') {
                        paragraph.style.display = 'block'; // Show original text
                        simplifiedParagraph.style.display = 'none'; // Hide simplified text
                    }
                    buttonContainer.style.visibility = 'visible'; // Show buttons
                    buttonContainer.style.opacity = '1';
                });

                container.addEventListener('mouseout', () => {
                    if (originalButton.dataset.state === 'simplified') {
                        paragraph.style.display = 'none'; // Hide original text
                        simplifiedParagraph.style.display = 'block'; // Show simplified text
                    }
                    buttonContainer.style.visibility = 'hidden'; // Hide buttons
                    buttonContainer.style.opacity = '0';
                });
            } else {
                console.error('Error simplifying text:', data);
            }
        })
        .catch(error => console.error('OpenAI API error:', error));
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
