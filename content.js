// Inject the external CSS for button styling
const style = document.createElement('link');
style.rel = 'stylesheet';
style.href = chrome.runtime.getURL('style.css');
document.head.appendChild(style);

console.log('Content script is running...');

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

                // Wrap paragraph contents in a container
                const parent = paragraph.parentNode;
                const container = document.createElement('div');
                container.className = 'paragraph-container';
                parent.replaceChild(container, paragraph);
                container.appendChild(paragraph);

                // Wrap the paragraph text in a span for text-content
                const textContent = document.createElement('span');
                textContent.className = 'text-content';
                textContent.innerText = simplifiedText;
                paragraph.innerHTML = '';
                paragraph.appendChild(textContent);

                paragraph.dataset.original = originalText; // Store original text
                paragraph.dataset.simplified = simplifiedText; // Store simplified text
                paragraph.style.backgroundColor = '#f0f8ff'; // Add background color
                paragraph.style.borderRadius = '4px'; // Add softer edges
                paragraph.style.transition = 'background-color 0.3s ease-in-out'; // Smooth transition
                paragraph.style.position = 'relative'; // Ensure relative positioning for button placement

                // Add the button container
                const buttonContainer = document.createElement('span');
                buttonContainer.className = 'button-container';
                buttonContainer.style.position = 'absolute';
                buttonContainer.style.top = '0';
                buttonContainer.style.right = '0';
                buttonContainer.style.visibility = 'hidden'; // Default to hidden
                buttonContainer.style.opacity = '0'; // Default to transparent

                const simplifyButton = document.createElement('button');
                simplifyButton.textContent = 'Simplify';
                simplifyButton.className = 'simplify-btn';

                const originalButton = document.createElement('button');
                originalButton.textContent = 'Show Original';
                originalButton.className = 'original-btn';

                buttonContainer.appendChild(simplifyButton);
                buttonContainer.appendChild(originalButton);
                paragraph.appendChild(buttonContainer);
            } else {
                console.error('Error simplifying text:', data);
            }
        })
        .catch(error => console.error('OpenAI API error:', error));
    });
}

// Add hover listeners to show original text and buttons on hover
function addHoverListeners(paragraph) {
    paragraph.addEventListener('mouseover', () => {
        if (paragraph.dataset.original) {
            // Show original text without affecting child elements
            const textNode = paragraph.querySelector('.text-content');
            if (textNode) {
                textNode.innerText = paragraph.dataset.original; // Show original text
            }

            paragraph.style.backgroundColor = ''; // Remove background color

            const buttonContainer = paragraph.querySelector('.button-container');
            if (buttonContainer) {
                buttonContainer.style.visibility = 'visible'; // Show buttons
                buttonContainer.style.opacity = '1'; // Make buttons fully visible
            }
        }
    });

    paragraph.addEventListener('mouseout', () => {
        if (paragraph.dataset.simplified) {
            // Show simplified text without affecting child elements
            const textNode = paragraph.querySelector('.text-content');
            if (textNode) {
                textNode.innerText = paragraph.dataset.simplified; // Show simplified text
            }

            paragraph.style.backgroundColor = '#f0f8ff'; // Restore background color

            const buttonContainer = paragraph.querySelector('.button-container');
            if (buttonContainer) {
                buttonContainer.style.visibility = 'hidden'; // Hide buttons
                buttonContainer.style.opacity = '0'; // Make buttons invisible
            }
        }
    });
}

// Use IntersectionObserver to detect visible paragraphs
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            simplifyParagraph(entry.target); // Simplify paragraph
            addHoverListeners(entry.target); // Add hover listeners
        }
    });
});

// Start observing all visible paragraphs
const paragraphs = document.querySelectorAll('p');
paragraphs.forEach((paragraph) => {
    observer.observe(paragraph);
});
