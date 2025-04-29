document.addEventListener('DOMContentLoaded', function() {
    var apiKeyInput = document.getElementById('apiKey');
    var saveButton = document.getElementById('saveButton');
    var systemPromptTextarea = document.getElementById('systemPrompt');
    var resetButton = document.getElementById('resetButton');
    var modelSelect = document.getElementById('modelSelect');
    var storageKey = 'L2VnTsJG7BYcMOy&oj';

    const SYSTEM_MSG = `You are to act as a Search Engine AI. Answer like one. Always answer! Keep answers brief and pragmatic.`;

    // Load saved API key, system prompt, and model, with fallback
    chrome.storage.sync.get(['systemPrompt', storageKey, 'model'], function(data) {
        apiKeyInput.value = data[storageKey] || '';
        systemPromptTextarea.value = data['systemPrompt'] || SYSTEM_MSG;
        var savedModel = data['model'];
        // Fallback to default if no model saved or an invalid legacy key
        //if !savedModel { //unexpected token '!' error
        //    savedModel = 'o4-mini';
        //}
        if (!savedModel) {
            savedModel = 'o4-mini';
        }
        modelSelect.value = savedModel;
    });

    // Save both API key and system prompt on button click
    saveButton.addEventListener('click', function() {
        var apiKey = apiKeyInput.value;
        var systemPrompt = systemPromptTextarea.value;
        var model = modelSelect.value;

        // Save data
        chrome.storage.sync.set({
            [storageKey]: apiKey,
            'systemPrompt': systemPrompt,
            'model': model
        }, function() {
            window.alert('Settings saved successfully!');
            //print all of local storage just to check
            for (var key in localStorage) {
                console.log(key + " => " + localStorage[key]);
            }
        });
    });

    // Reset button functionality
    resetButton.addEventListener('click', function() {
        systemPromptTextarea.value = SYSTEM_MSG; // Reset to default
    });
});
