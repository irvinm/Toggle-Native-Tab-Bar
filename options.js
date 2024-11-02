document.addEventListener('DOMContentLoaded', () => {
    const checkbox = document.getElementById('acknowledge-FF133-checkbox');

    // Initialize the checkbox state based on localStorage
    const acknowledged = localStorage.getItem('acknowledgeFF133Changes');
    if (acknowledged) {
        checkbox.checked = true;
    }

    // Add event listener to update localStorage when the checkbox state changes
    checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
            localStorage.setItem('acknowledgeFF133Changes', 'true');
        } else {
            localStorage.removeItem('acknowledgeFF133Changes');
        }
    });

    // Get the Firefox version and display it
    browser.runtime.getBrowserInfo().then((info) => {
        const versionElement = document.getElementById('firefox-version');
        versionElement.textContent = `You are using Firefox version: ${info.version}`;
    }).catch((error) => {
        console.error('Error getting Firefox version:', error);
    });
});