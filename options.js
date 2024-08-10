document.addEventListener('DOMContentLoaded', function() {
    var apiKeyInput = document.getElementById('apiKey');
    var saveButton = document.getElementById('saveButton');
    var storageKey = 'L2VnTsJG7BYcMOy&oj';

    // Load saved API key
    chrome.storage.sync.get(storageKey, function(data) {
        apiKeyInput.value = data[storageKey] || '';
    });

    // Save API key on button click
    saveButton.addEventListener('click', function() {
        var apiKey = apiKeyInput.value;
        var dataToSave = {};
        dataToSave[storageKey] = apiKey; // Set the key-value pair

        chrome.storage.sync.set(dataToSave, function() {
            window.alert('API key saved successfully!');
        });
    });
});
