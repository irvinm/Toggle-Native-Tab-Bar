document.addEventListener('DOMContentLoaded', async () => {
    const instructions = document.getElementById('instructions-container');
    const dismissContainer = document.getElementById('dismiss-container');
    const showBtn = document.getElementById('show-instructions-btn');
    const upgradeBanner = document.getElementById('upgrade-dismiss-banner');
    const dismissUpgradeBtn = document.getElementById('dismiss-upgrade-btn');
    const addonVersionSpan = document.getElementById('addon-version');

    // Rename checkbox ID for version-agnosticism
    const checkbox = document.getElementById('acknowledge-version-checkbox');

    const currentVersion = browser.runtime.getManifest().version;
    
    // Use asynchronous browser.storage.local instead of localStorage
    const storage = await browser.storage.local.get('lastAcknowledgedVersion');
    const lastAcknowledged = storage.lastAcknowledgedVersion;

    if (addonVersionSpan) {
        addonVersionSpan.textContent = `v${currentVersion}`;
    }

    function hideInstructions() {
        instructions.classList.add('collapsed');
        dismissContainer.classList.remove('hidden');
        upgradeBanner.classList.add('hidden');
    }

    function showInstructions() {
        instructions.classList.remove('collapsed');
        dismissContainer.classList.add('hidden');
    }

    async function updateBannerVisibility() {
        const { lastAcknowledgedVersion } = await browser.storage.local.get('lastAcknowledgedVersion');
        if (lastAcknowledgedVersion === currentVersion) {
            hideInstructions();
        } else {
            showInstructions();
            if (lastAcknowledgedVersion) {
                upgradeBanner.classList.remove('hidden');
            } else {
                upgradeBanner.classList.add('hidden');
            }
        }
    }

    async function acknowledgeCurrentVersion() {
        await browser.storage.local.set({ lastAcknowledgedVersion: currentVersion });
        if (checkbox) {
            checkbox.checked = true;
        }
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
        checkbox.addEventListener('change', async () => {
            if (checkbox.checked) {
                await acknowledgeCurrentVersion();
            } else {
                await browser.storage.local.remove('lastAcknowledgedVersion');
                await updateBannerVisibility();
            }
        });
    }

    // Listen for storage changes from the background script or other pages
    browser.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && (changes.lastAcknowledgedVersion || changes.hideTabBar)) {
            updateBannerVisibility();
            if (checkbox && changes.lastAcknowledgedVersion) {
                checkbox.checked = (changes.lastAcknowledgedVersion.newValue === currentVersion);
            }
        }
    });

    // Get the Firefox version and display it
    browser.runtime.getBrowserInfo().then((info) => {
        const versionElement = document.getElementById('firefox-version');
        if (versionElement) {
            versionElement.textContent = `You are using Firefox version: ${info.version}`;
        }
    }).catch((error) => {
        console.error('Error getting Firefox version:', error);
    });
});