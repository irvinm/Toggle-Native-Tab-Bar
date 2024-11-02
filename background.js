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
        const acknowledgedFF133 = localStorage.getItem('acknowledgeFF133Changes');
        if (!acknowledgedFF133) {
            // Open the options.html page when the addon is updated
            browser.tabs.create({ url: browser.runtime.getURL('options.html') });
        }

        // Log the previous and new versions
        const previousVersion = details.previousVersion;
        const newVersion = browser.runtime.getManifest().version;
        console.log(`Addon updated from version ${previousVersion} to ${newVersion}`);

        // Get and log the Firefox version
        browser.runtime.getBrowserInfo().then((info) => {
            console.log(`Firefox version: ${info.version}`);
        });
    }
});

browser.browserAction.onClicked.addListener((tab) => {
    // Flip the hideTabBar value and save it
    hideTabBar = !hideTabBar;
    localStorage.setItem('hideTabBar', JSON.stringify(hideTabBar));
    
    // Set the titlePreface for all open windows and the icon
    setPrefaceAndIcon();
});

// Listen for when a new window is created
browser.windows.onCreated.addListener((window) => {
    setPrefaceAndIcon();
});

// Initialize the addon by setting the titlePreface for all open windows
setPrefaceAndIcon();