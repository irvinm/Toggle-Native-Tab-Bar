let hideTabBar = JSON.parse(localStorage.getItem('hideTabBar')) || false;

function setPrefaceAndIcon() {
    // Set Preface for all open windows
    browser.windows.getAll().then((windows) => {
        let titlePreface = hideTabBar ? " " : "";
        windows.forEach((window) => {
            browser.windows.update(window.id, { titlePreface: titlePreface });
        });
    });

    // Set the native SVG icon
    let iconPath = hideTabBar ? 'icons/icon-hidden.svg' : 'icons/icon-visible.svg';
    browser.browserAction.setIcon({ path: iconPath });
}

browser.runtime.onInstalled.addListener((details) => {
    const currentVersion = browser.runtime.getManifest().version;

    if (details.reason === 'install') {
        browser.tabs.create({ url: 'options/options.html' });
    } else if (details.reason === 'update') {
        const previousVersion = details.previousVersion;

        // If the current version is different from the last acknowledged version,
        // we might want to show the options page again.
        const lastAcknowledged = localStorage.getItem('lastAcknowledgedVersion');

        // Force show instructions for v0.9.6 update due to major reorganization and CSS changes
        if (currentVersion === '0.9.6' && lastAcknowledged !== '0.9.6') {
            localStorage.setItem('lastAcknowledgedVersion', '0.0.0');
        }

        // Migrate old flag if it exists
        if (localStorage.getItem('acknowledgeFF133Changes') === 'false') {
            localStorage.removeItem('acknowledgeFF133Changes');
            localStorage.setItem('lastAcknowledgedVersion', '0.0.0');
        }

        if (lastAcknowledged !== currentVersion) {
            browser.tabs.create({ url: browser.runtime.getURL('options/options.html') });
        }

        console.log(`Addon updated from version ${previousVersion} to ${currentVersion}`);
        browser.runtime.getBrowserInfo().then((info) => {
            console.log(`Firefox version: ${info.version}`);
        });
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
function toggleTabBar() {
    hideTabBar = !hideTabBar;
    localStorage.setItem('hideTabBar', JSON.stringify(hideTabBar));
    setPrefaceAndIcon();
}

// Listen for when a new window is created
browser.windows.onCreated.addListener((window) => {
    setPrefaceAndIcon();
});

// Initialize the addon by setting the titlePreface for all open windows
setPrefaceAndIcon();