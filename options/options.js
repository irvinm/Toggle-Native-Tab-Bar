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
    const storage = await browser.storage.local.get(['lastAcknowledgedVersion', 'showUpdatePage']);
    const lastAcknowledged = storage.lastAcknowledgedVersion;
    const showUpdatePage = storage.showUpdatePage !== undefined ? storage.showUpdatePage : true;

    if (addonVersionSpan) {
        addonVersionSpan.textContent = `v${currentVersion}`;
    }

    let isManuallyExpanded = false;

    function hideInstructions() {
        instructions.classList.add('collapsed');
        dismissContainer.classList.remove('hidden');
        upgradeBanner.classList.add('hidden');
        isManuallyExpanded = false;
    }

    function showInstructions(isManual = false) {
        instructions.classList.remove('collapsed');
        dismissContainer.classList.add('hidden');
        if (isManual) {
            isManuallyExpanded = true;
        }
    }

    async function updateBannerVisibility() {
        const storage = await browser.storage.local.get(['lastAcknowledgedVersion', 'showUpdatePage']);
        const lastAcknowledgedVersion = storage.lastAcknowledgedVersion;
        
        if (lastAcknowledgedVersion === currentVersion) {
            // Only auto-collapse if the user hasn't explicitly asked to see them
            if (!isManuallyExpanded) {
                hideInstructions();
            }
        } else {
            showInstructions();
            if (lastAcknowledgedVersion) {
                upgradeBanner.classList.remove('hidden');
            } else {
                upgradeBanner.classList.add('hidden');
            }
        }
    }

    async function acknowledgeCurrentVersion(shouldCollapse = false) {
        await browser.storage.local.set({ lastAcknowledgedVersion: currentVersion });
        // We don't force-check the checkbox here anymore, 
        // as the checkbox now represents the 'showUpdatePage' preference.
        if (shouldCollapse) {
            hideInstructions();
        }
    }

    // Logic to determine initial state
    if (lastAcknowledged === currentVersion) {
        hideInstructions();
    } else {
        // We are showing the instructions because of a version update.
        // Keep them open until the user explicitly dismisses them.
        showInstructions(true); 
        if (lastAcknowledged) {
            upgradeBanner.classList.remove('hidden');
        }
    }

    // Event Listeners
    showBtn.addEventListener('click', () => showInstructions(true));

    dismissUpgradeBtn.addEventListener('click', () => acknowledgeCurrentVersion(true));

    if (checkbox) {
        // Checkbox is "Don't show...", so it's the inverse of showUpdatePage
        checkbox.checked = !showUpdatePage;
        checkbox.addEventListener('change', async () => {
            const suppressUpdates = checkbox.checked;
            await browser.storage.local.set({ showUpdatePage: !suppressUpdates });
            
            if (suppressUpdates) {
                // If they checked "Don't show", also acknowledge current version to clean up UI
                await acknowledgeCurrentVersion(false);
            } else {
                // If they want to see updates again, we remove current acknowledgment 
                // so the banner shows up if they refresh
                await browser.storage.local.remove('lastAcknowledgedVersion');
                await updateBannerVisibility();
            }
        });
    }

    // Listen for storage changes from the background script or other pages
    browser.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && (changes.lastAcknowledgedVersion || changes.showUpdatePage || changes.hideTabBar)) {
            updateBannerVisibility();
            if (checkbox && changes.showUpdatePage) {
                checkbox.checked = !changes.showUpdatePage.newValue;
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