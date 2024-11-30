// Saves options to chrome.storage
function save_options() {
    chrome.storage.local.set({
        uTracking: document.getElementById('uTracking').value,
        showOn: document.getElementById('showOn').checked
    }, () => {
        // Update status to let the user know the options were saved
        const status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(() => { status.textContent = ''; }, 1000);
    });
}

// Restores options from chrome.storage
function restore_options() {
    chrome.storage.local.get({
        uTracking: '0', // Default value
        showOn: false   // Default value
    }, (items) => {
        document.getElementById('uTracking').value = items.uTracking;
        document.getElementById('showOn').checked = items.showOn;
    });
}

// Event listeners for loading and saving options
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
