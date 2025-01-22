// Encrypt API key using user identity
async function encryptApiKey(apiKey, identity) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(identity),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    const derivedKey = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode(identity + '-unique-salt'),
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        derivedKey,
        encoder.encode(apiKey)
    );

    return {
        encryptedKey: btoa(String.fromCharCode(...new Uint8Array(encryptedData))),
        iv: btoa(String.fromCharCode(...iv)),
    };
}

// Decrypt API key using user identity
async function decryptApiKey(encryptedKey, identity) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(identity),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    const derivedKey = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode(identity + '-unique-salt'),
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );

    const ciphertext = Uint8Array.from(atob(encryptedKey.encryptedKey), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(encryptedKey.iv), c => c.charCodeAt(0));

    const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        derivedKey,
        ciphertext
    );

    return new TextDecoder().decode(decryptedData);
}

// Listener for messages from other scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'encryptApiKey') {
        const { apiKey } = message;
        chrome.identity.getProfileUserInfo(async (userInfo) => {
            console.log('User Info:', userInfo);

            // Fallback to a default identity if email or ID is unavailable
            const identity = userInfo.email || userInfo.id || 'default-fallback-key';
            if (identity === 'default-fallback-key') {
                console.warn('User identity not available. Using fallback key.');
            }

            try {
                const encryptedKey = await encryptApiKey(apiKey, identity);
                chrome.storage.local.set({ encryptedApiKey: encryptedKey }, () => {
                    sendResponse({ success: true });
                });
            } catch (error) {
                console.error('Encryption error:', error);
                sendResponse({ success: false, error: 'Failed to encrypt API key.' });
            }
        });
        return true; // Keep the message channel open for async response
    }

    if (message.action === 'getApiKey') {
        chrome.identity.getProfileUserInfo(async (userInfo) => {
            console.log('User Info:', userInfo);

            // Fallback to a default identity if email or ID is unavailable
            const identity = userInfo.email || userInfo.id || 'default-fallback-key';
            if (identity === 'default-fallback-key') {
                console.warn('User identity not available. Using fallback key.');
            }

            chrome.storage.local.get('encryptedApiKey', async (data) => {
                const encryptedApiKey = data.encryptedApiKey;
                if (!encryptedApiKey) {
                    sendResponse({ success: false, error: 'API key not found.' });
                    return;
                }

                try {
                    const apiKey = await decryptApiKey(encryptedApiKey, identity);
                    sendResponse({ success: true, apiKey });
                } catch (error) {
                    console.error('Decryption error:', error);
                    sendResponse({ success: false, error: 'Failed to decrypt API key.' });
                }
            });
        });
        return true; // Keep the message channel open for async response
    }

    if (message.action === 'deleteApiKey') {
        chrome.storage.local.remove('encryptedApiKey', () => {
            if (chrome.runtime.lastError) {
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
                sendResponse({ success: true });
            }
        });
        return true; // Keep the message channel open for async response
    }
});