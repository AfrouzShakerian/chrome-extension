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
                paragraph.dataset.original = originalText; // Store original text
                paragraph.dataset.simplified = simplifiedText; // Store simplified text
                paragraph.innerText = simplifiedText; // Replace text with simplified content
                paragraph.style.backgroundColor = '#f0f8ff'; // Add background color to indicate simplification
                paragraph.style.borderRadius = '4px'; // Add softer edges
                paragraph.style.transition = 'background-color 0.3s ease-in-out'; // Smooth transition
            } else {
                console.error('Error simplifying text:', data);
            }
        })
        .catch(error => console.error('OpenAI API error:', error));
    });
}

// Add hover listeners to show original text on hover
function addHoverListeners(paragraph) {
    paragraph.addEventListener('mouseover', () => {
        if (paragraph.dataset.original) {
            paragraph.innerText = paragraph.dataset.original; // Show original text
            paragraph.style.backgroundColor = ''; // Remove background color
        }
    });

    paragraph.addEventListener('mouseout', () => {
        if (paragraph.dataset.simplified) {
            paragraph.innerText = paragraph.dataset.simplified; // Show simplified text
            paragraph.style.backgroundColor = '#f0f8ff'; // Restore background color
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

    // Hide buttons for now if they exist
    const buttonContainer = paragraph.nextElementSibling;
    if (buttonContainer && buttonContainer.classList.contains('button-container')) {
        buttonContainer.style.visibility = 'hidden';
    }
});
