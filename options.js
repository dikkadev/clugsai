document.addEventListener('DOMContentLoaded', function() {
    var apiKeyInput = document.getElementById('apiKey');
    var saveButton = document.getElementById('saveButton');
    var systemPromptTextarea = document.getElementById('systemPrompt');
    var resetButton = document.getElementById('resetButton');
    var storageKey = 'L2VnTsJG7BYcMOy&oj';

    const SYSTEM_MSG = `You are to act as a Search Engine AI. Answer like one. Always answer! Keep answers brief and pragmatic.`;

    // Load saved API key and system prompt
    chrome.storage.sync.get(['systemPrompt', storageKey], function(data) {
        apiKeyInput.value = data[storageKey] || '';
        systemPromptTextarea.value = data['systemPrompt'] || SYSTEM_MSG; // Set default value
    });

    // Save both API key and system prompt on button click
    saveButton.addEventListener('click', function() {
        var apiKey = apiKeyInput.value;
        var systemPrompt = systemPromptTextarea.value;

        // Save data
        chrome.storage.sync.set({
            [storageKey]: apiKey,
            'systemPrompt': systemPrompt
        }, function() {
            window.alert('Settings saved successfully!');
        });
    });

    // Reset button functionality
    resetButton.addEventListener('click', function() {
        systemPromptTextarea.value = SYSTEM_MSG; // Reset to default
    });
});
