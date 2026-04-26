let hideTabBar = false;

async function setPrefaceAndIcon() {
    // Set Preface for all open windows
    const windows = await browser.windows.getAll();
    const titlePreface = hideTabBar ? " " : "";
    
    for (const window of windows) {
        await browser.windows.update(window.id, { titlePreface: titlePreface });
    }

    // Set the native SVG icon
    const iconPath = hideTabBar ? 'icons/icon-hidden.svg' : 'icons/icon-visible.svg';
    await browser.browserAction.setIcon({ path: iconPath });
}

async function initialize() {
    // Migrate from localStorage to browser.storage.local
    const storage = await browser.storage.local.get(['hideTabBar', 'lastAcknowledgedVersion', 'acknowledgeFF133Changes']);
    
    // Check if we need to migrate from localStorage (for existing users)
    if (localStorage.getItem('hideTabBar') !== null) {
        hideTabBar = JSON.parse(localStorage.getItem('hideTabBar'));
        await browser.storage.local.set({ hideTabBar });
        localStorage.removeItem('hideTabBar');
    } else {
        hideTabBar = storage.hideTabBar || false;
    }

    if (localStorage.getItem('lastAcknowledgedVersion') !== null) {
        await browser.storage.local.set({ lastAcknowledgedVersion: localStorage.getItem('lastAcknowledgedVersion') });
        localStorage.removeItem('lastAcknowledgedVersion');
    }

    await setPrefaceAndIcon();
}

browser.runtime.onInstalled.addListener(async (details) => {
    await initialize();
    const currentVersion = browser.runtime.getManifest().version;

    if (details.reason === 'install') {
        await browser.tabs.create({ url: 'options/options.html' });
    } else if (details.reason === 'update') {
        const previousVersion = details.previousVersion;
        
        // Re-read storage to ensure we have the most authoritative values
        const storage = await browser.storage.local.get(['lastAcknowledgedVersion', 'showUpdatePage', 'acknowledgeFF133Changes']);
        let lastAcknowledged = storage.lastAcknowledgedVersion;
        let showUpdatePage = storage.showUpdatePage !== undefined ? storage.showUpdatePage : true;

        // Force show instructions for v0.9.6 update due to major reorganization
        // This overrides the user's "skip" preference just for this version
        let isCriticalUpdate = (currentVersion === '0.9.6' && lastAcknowledged !== '0.9.6');

        // Migrate/Cleanup old flag
        if (storage.acknowledgeFF133Changes !== undefined || localStorage.getItem('acknowledgeFF133Changes') !== null) {
            const legacyVal = storage.acknowledgeFF133Changes || localStorage.getItem('acknowledgeFF133Changes');
            if (legacyVal === 'true' || legacyVal === true) {
                showUpdatePage = false;
            }
            await browser.storage.local.set({ showUpdatePage });
            await browser.storage.local.remove('acknowledgeFF133Changes');
            localStorage.removeItem('acknowledgeFF133Changes');
        }

        // Only open the tab if the user wants it, OR if it's a critical update
        if (lastAcknowledged !== currentVersion && (showUpdatePage || isCriticalUpdate)) {
            await browser.tabs.create({ url: browser.runtime.getURL('options/options.html') });
        }

        console.log(`Add-on updated from version ${previousVersion} to ${currentVersion}`);
        const info = await browser.runtime.getBrowserInfo();
        console.log(`Firefox version: ${info.version}`);
    }
});

// Add a listener for the browser action -- Triggered via the toolbar icon
browser.browserAction.onClicked.addListener((tab) => {
    toggleTabBar();
});

// Add a listener for the command -- Triggered via keyboard shortcut
browser.commands.onCommand.addListener((command) => {
    if (command === "toggle-tab-bar") {
        toggleTabBar();
    }
});

// Function to toggle the tab bar
async function toggleTabBar() {
    hideTabBar = !hideTabBar;
    await browser.storage.local.set({ hideTabBar });
    await setPrefaceAndIcon();
}

// Listen for when a new window is created
browser.windows.onCreated.addListener((window) => {
    setPrefaceAndIcon();
});

// Start initialization
initialize();