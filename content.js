function getMainContent() {
    const paragraphs = Array.from(document.body.querySelectorAll('p'));
    let mainText = paragraphs.map(p => p.innerText.trim()).filter(text => text).join('\n\n');

    if (mainText) {
        console.log("Main content extracted: ", mainText);
        fetchSimplifiedText(mainText);
    } else {
        console.log("No main content found.");
    }
}

function fetchSimplifiedText(content) {
    chrome.storage.local.get('openai-api-key', function (result) {
        const apiKey = result['openai-api-key'];
        console.log('Retrieved API Key:', apiKey);

        if (apiKey) {
            const payload = {
                model: 'text-davinci-003',
                prompt: `Simplify this text: ${content}`,
                max_tokens: 100
            };
            console.log('Payload:', JSON.stringify(payload));

            fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo', // You can replace with your desired model
                    messages: [{
                        role: 'user',
                        content: `Simplify this text: ${content}`
                    }],
                    max_tokens: 100
                })
            })
                .then(response => response.json())
                .then(data => {
                    console.log('Simplified Text:', data?.choices?.[0]?.message?.content || 'No response choices');
                })
                .catch(error => console.error('Error during API call:', error));

        } else {
            console.error('API key not found.');
        }
    });
}


// Run the content extraction and simplification
getMainContent();

chrome.storage.local.get('openai-api-key', function (result) {
    const apiKey = result['openai-api-key'];
    if (apiKey) {
        fetch('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        })
            .then(response => response.json())
            .then(data => {
                console.log('Available Models:', data);
            })
            .catch(error => console.error('Error:', error));
    } else {
        console.error('API key is not stored!');
    }
});
