document.addEventListener('DOMContentLoaded', async () => {
    const instructions = document.getElementById('instructions-container');
    const dismissContainer = document.getElementById('dismiss-container');
    const showBtn = document.getElementById('show-instructions-btn');
    const upgradeBanner = document.getElementById('upgrade-dismiss-banner');
    const dismissUpgradeBtn = document.getElementById('dismiss-upgrade-btn');

    // Original checkbox (keep for backward compatibility if user wants to toggle within instructions)
    const checkbox = document.getElementById('acknowledge-FF133-checkbox');

    const currentVersion = browser.runtime.getManifest().version;
    const lastAcknowledged = localStorage.getItem('lastAcknowledgedVersion');

    function hideInstructions() {
        instructions.classList.add('collapsed');
        dismissContainer.classList.remove('hidden');
        upgradeBanner.classList.add('hidden');
    }

    function showInstructions() {
        instructions.classList.remove('collapsed');
        dismissContainer.classList.add('hidden');
    }

    function acknowledgeCurrentVersion() {
        localStorage.setItem('lastAcknowledgedVersion', currentVersion);
        hideInstructions();
    }

    // Logic to determine initial state
    if (lastAcknowledged === currentVersion) {
        hideInstructions();
    } else {
        showInstructions();
        if (lastAcknowledged) {
            upgradeBanner.classList.remove('hidden');
        }
    }

    // Event Listeners
    showBtn.addEventListener('click', showInstructions);

    dismissUpgradeBtn.addEventListener('click', acknowledgeCurrentVersion);

    if (checkbox) {
        checkbox.checked = (lastAcknowledged === currentVersion);
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                acknowledgeCurrentVersion();
            } else {
                localStorage.removeItem('lastAcknowledgedVersion');
                showInstructions();
            }
        });
    }

    // Get the Firefox version and display it
    browser.runtime.getBrowserInfo().then((info) => {
        const versionElement = document.getElementById('firefox-version');
        versionElement.textContent = `You are using Firefox version: ${info.version}`;
    }).catch((error) => {
        console.error('Error getting Firefox version:', error);
    });
});