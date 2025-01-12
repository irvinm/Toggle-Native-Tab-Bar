let hideTabBar = JSON.parse(localStorage.getItem('hideTabBar')) || false;

function setPrefaceAndIcon() {
    // Set Preface for all open windows
    browser.windows.getAll().then((windows) => {
        let titlePreface = hideTabBar ? " " : "";
        windows.forEach((window) => {
            browser.windows.update(window.id, { titlePreface: titlePreface });
        });
    });

    // Set the icon
    let path = hideTabBar ? 'icon-hidden.png' : 'icon-visible.png';
    browser.browserAction.setIcon({ path: path });
}

browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        browser.tabs.create({ url: 'options.html' });
    } else if (details.reason === 'update') {
        const previousVersion = details.previousVersion;
        const newVersion = browser.runtime.getManifest().version;

        // Check if the previous version is 0.9.4 or older
        if (previousVersion <= '0.9.4') {
            // Set acknowledgeFF133Changes to false to force the user to acknowledge the changes
            localStorage.setItem('acknowledgeFF133Changes', 'false');
        }

        // Check if the acknowledgeFF133Changes flag is set to false
        const acknowledged = localStorage.getItem('acknowledgeFF133Changes');
        if (acknowledged === 'false') {
            // Open the options.html page when the addon is updated
            browser.tabs.create({ url: browser.runtime.getURL('options.html') });
        }

        // Log the previous and new versions
        console.log(`Addon updated from version ${previousVersion} to ${newVersion}`);

        // Get and log the Firefox version
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