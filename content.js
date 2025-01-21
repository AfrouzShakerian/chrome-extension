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

        const sentenceCount = originalText.split(/(?<!\w\.\w\.)(?<![A-Z][a-z]\.)(?<!\s[A-Z]\.)[.!?]\s+/).length;
        const prompt = sentenceCount > 3
            ? `You are a helpful assistant that simplifies text for people with cognitive disabilities.
               If the input text has more than three sentences, simplify it into shorter, easy-to-read bullet points.
               Otherwise, rewrite it as a simplified version while ensuring it is concise and does not exceed the original length.
               Simplify the following text:
               ${originalText}`
            : `You are a helpful assistant that simplifies text for people with cognitive disabilities.
               Rewrite the following text as a simplified version while ensuring it is concise and does not exceed the original length:
               ${originalText}`;

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

                buttonContainer.appendChild(simplifyButton);
                buttonContainer.appendChild(originalButton);
                container.appendChild(buttonContainer);

                // Add hover functionality to toggle text and show buttons
                container.addEventListener('mouseover', () => {
                    paragraph.style.display = 'block'; // Show original text
                    simplifiedParagraph.style.display = 'none'; // Hide simplified text
                    buttonContainer.style.visibility = 'visible'; // Show buttons
                    buttonContainer.style.opacity = '1';
                });

                container.addEventListener('mouseout', () => {
                    paragraph.style.display = 'none'; // Hide original text
                    simplifiedParagraph.style.display = 'block'; // Show simplified text
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
